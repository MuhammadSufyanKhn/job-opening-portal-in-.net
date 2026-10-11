using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.DTOs.Job;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IApplicationService
{
    Task<CandidateApplicationDetailDto> SubmitApplicationAsync(Guid jobId, Guid userId, SubmitApplicationRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<CandidateApplicationSummaryDto>> GetCandidateApplicationsAsync(Guid userId, CancellationToken ct = default);
    Task<CandidateApplicationDetailDto> GetCandidateApplicationByIdAsync(Guid applicationId, Guid userId, CancellationToken ct = default);
    Task<CandidateApplicationDetailDto> WithdrawApplicationAsync(Guid applicationId, Guid userId, CancellationToken ct = default);

    Task<PagedResult<CompanyApplicationSummaryDto>> GetCompanyApplicationsAsync(
        Guid companyId,
        Guid userId,
        Guid? jobPostingId = null,
        ApplicationStage? stage = null,
        string? search = null,
        string? sortBy = null,
        bool sortDescending = true,
        int page = 1,
        int pageSize = 15,
        CancellationToken ct = default);

    Task<CompanyApplicationDetailDto> GetCompanyApplicationByIdAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default);
    Task<CompanyApplicationDetailDto> UpdateApplicationStageAsync(Guid companyId, Guid applicationId, Guid userId, UpdateApplicationStageRequest request, CancellationToken ct = default);

    Task<PipelineBoardDto> GetPipelineBoardAsync(Guid companyId, Guid userId, Guid? jobPostingId = null, CancellationToken ct = default);
    Task<CompanyWorkspaceDashboardDto> GetCompanyWorkspaceDashboardAsync(Guid companyId, Guid userId, CancellationToken ct = default);

    Task<CandidateNoteDto> AddCandidateNoteAsync(Guid companyId, Guid applicationId, Guid userId, CreateCandidateNoteRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<CandidateNoteDto>> GetApplicationNotesAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default);
    Task DeleteCandidateNoteAsync(Guid companyId, Guid applicationId, Guid noteId, Guid userId, CancellationToken ct = default);

    Task<InterviewScheduleDto> ScheduleInterviewAsync(Guid companyId, Guid applicationId, Guid userId, ScheduleInterviewRequest request, CancellationToken ct = default);
    Task<InterviewScheduleDto> UpdateInterviewAsync(Guid companyId, Guid applicationId, Guid interviewId, Guid userId, UpdateInterviewRequest request, CancellationToken ct = default);
    Task<InterviewScheduleDto> CancelInterviewAsync(Guid companyId, Guid applicationId, Guid interviewId, Guid userId, string? reason = null, CancellationToken ct = default);
    Task<IReadOnlyList<InterviewScheduleDto>> GetApplicationInterviewsAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<InterviewScheduleDto>> GetCompanyInterviewsAsync(Guid companyId, Guid userId, bool upcomingOnly = true, CancellationToken ct = default);
}


public class ApplicationService : IApplicationService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly INotificationService? _notificationService;
    private readonly IEmailService? _emailService;

    public ApplicationService(
        IApplicationDbContext context,
        IAuditService auditService,
        INotificationService? notificationService = null,
        IEmailService? emailService = null)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
        _emailService = emailService;
    }

    public async Task<CandidateApplicationDetailDto> SubmitApplicationAsync(Guid jobId, Guid userId, SubmitApplicationRequest request, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .Include(cp => cp.User)
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            throw new ForbiddenAccessException("You must have a candidate profile to apply for vacancies.");

        var job = await _context.JobPostings
            .Include(j => j.Company)
            .Include(j => j.Versions)
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        if (job.Status != JobPostingStatus.Published)
            throw new ConflictException("Applications can only be submitted to actively published vacancies.");

        if (job.ExpiresAtUtc.HasValue && job.ExpiresAtUtc.Value <= DateTimeOffset.UtcNow)
            throw new ConflictException("The application deadline for this vacancy has expired.");

        if (job.Company.ApprovalStatus != CompanyApprovalStatus.Approved)
            throw new ForbiddenAccessException("This company is not currently approved to accept applications.");

        // Check for duplicate application
        bool alreadyApplied = await _context.JobApplications
            .AnyAsync(a => a.JobPostingId == jobId && a.CandidateProfileId == candidateProfile.Id, ct);

        if (alreadyApplied)
            throw new ConflictException("You have already submitted an application for this vacancy.");

        // Resolve active version
        var activeVersion = job.Versions.FirstOrDefault(v => v.VersionNumber == job.ActiveVersionNumber)
            ?? job.Versions.OrderByDescending(v => v.VersionNumber).FirstOrDefault();

        if (activeVersion == null)
            throw new ConflictException("Job description version is missing for this vacancy.");

        // Resolve candidate document
        Guid? resolvedDocumentId = null;
        if (request.CandidateDocumentId.HasValue)
        {
            var validDoc = await _context.CandidateDocuments
                .FirstOrDefaultAsync(d => d.Id == request.CandidateDocumentId.Value && d.CandidateProfileId == candidateProfile.Id && !d.IsDeleted, ct)
                ?? throw new ValidationException("Selected CV document was not found or does not belong to your profile.");

            resolvedDocumentId = validDoc.Id;
        }
        else
        {
            var defaultDoc = await _context.CandidateDocuments
                .FirstOrDefaultAsync(d => d.CandidateProfileId == candidateProfile.Id && d.IsDefault && !d.IsDeleted, ct);
            resolvedDocumentId = defaultDoc?.Id;
        }

        var application = new JobApplication
        {
            CompanyId = job.CompanyId,
            JobPostingId = job.Id,
            JobDescriptionVersionId = activeVersion.Id,
            CandidateProfileId = candidateProfile.Id,
            CandidateDocumentId = resolvedDocumentId,
            CurrentStage = ApplicationStage.Submitted,
            SubmittedAtUtc = DateTimeOffset.UtcNow,
            StageUpdatedAtUtc = DateTimeOffset.UtcNow,
            CandidateCoverNote = request.CoverNote?.Trim()
        };

        var initialHistory = new ApplicationStatusHistory
        {
            JobApplicationId = application.Id,
            PreviousStage = ApplicationStage.Submitted,
            NewStage = ApplicationStage.Submitted,
            ChangedByUserId = userId,
            ReasonNote = "Application submitted by candidate.",
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        application.StatusHistories.Add(initialHistory);

        _context.JobApplications.Add(application);
        await _context.SaveChangesAsync(ct);

        // Auto-assign WorkSim simulation if job has an assessment configured
        var assessmentConfig = await _context.JobAssessmentConfigurations
            .Include(c => c.ScenarioVersion)
                .ThenInclude(v => v.SimulationScenario)
            .FirstOrDefaultAsync(c => c.JobPostingId == job.Id, ct);

        HireSphere.Application.DTOs.WorkSim.AssessmentAssignmentDto? assessmentDto = null;
        if (assessmentConfig != null)
        {
            var assignment = new AssessmentAssignment
            {
                CompanyId = job.CompanyId,
                JobApplicationId = application.Id,
                JobAssessmentConfigurationId = assessmentConfig.Id,
                CandidateProfileId = candidateProfile.Id,
                DeadlineUtc = DateTimeOffset.UtcNow.AddDays(assessmentConfig.DeadlineDaysAfterAssignment),
                Status = AssessmentAssignmentStatus.Assigned,
                AssignedAtUtc = DateTimeOffset.UtcNow
            };
            _context.AssessmentAssignments.Add(assignment);
            await _context.SaveChangesAsync(ct);

            var scenario = assessmentConfig.ScenarioVersion.SimulationScenario;

            if (_notificationService != null)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: userId,
                    notificationType: "AssessmentInvitationCreated",
                    title: "Assessment Required: " + scenario.Title,
                    message: $"You have been invited to complete the '{scenario.Title}' assessment for {job.Title} at {job.Company.Name}. Deadline: {assignment.DeadlineUtc:MMM dd, yyyy}.",
                    actionUrl: "/candidate/simulations",
                    ct: ct);
            }

            if (_emailService != null)
            {
                await _emailService.SendAssessmentInvitationEmailAsync(
                    recipientEmail: candidateProfile.User.Email,
                    candidateName: candidateProfile.User.FullName,
                    companyName: job.Company.Name,
                    jobTitle: job.Title,
                    assessmentTitle: scenario.Title,
                    isRequired: assessmentConfig.IsRequired,
                    deadlineUtc: assignment.DeadlineUtc,
                    invitationLink: "/candidate/simulations",
                    cancellationToken: ct);
            }

            assessmentDto = new HireSphere.Application.DTOs.WorkSim.AssessmentAssignmentDto
            {
                AssignmentId = assignment.Id,
                JobApplicationId = application.Id,
                JobTitle = job.Title,
                CompanyName = job.Company.Name,
                ScenarioId = scenario.Id,
                ScenarioTitle = scenario.Title,
                ScenarioCategory = scenario.Category,
                ScenarioDescription = scenario.Description,
                EstimatedDurationMinutes = scenario.EstimatedDurationMinutes,
                IsRequired = assessmentConfig.IsRequired,
                MaxAllowedAttempts = assessmentConfig.MaxAllowedAttempts,
                AssignedAtUtc = assignment.AssignedAtUtc,
                DeadlineUtc = assignment.DeadlineUtc,
                Status = assignment.Status.ToString()
            };
        }

        if (_notificationService != null)
        {
            await _notificationService.CreateNotificationAsync(
                userId: userId,
                notificationType: "ApplicationSubmitted",
                title: $"Application Submitted: {job.Title}",
                message: $"Your application for '{job.Title}' at {job.Company.Name} has been received.",
                actionUrl: "/candidate/applications",
                ct: ct);

            var companyMemberIds = await _context.CompanyMembers
                .AsNoTracking()
                .Where(m => m.CompanyId == job.CompanyId && m.MembershipStatus == CompanyMembershipStatus.Active)
                .Select(m => m.UserId)
                .ToListAsync(ct);

            foreach (var memberId in companyMemberIds)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: memberId,
                    notificationType: "CandidateApplied",
                    title: $"New Applicant: {job.Title}",
                    message: $"{candidateProfile.User.FullName} submitted an application for '{job.Title}'.",
                    actionUrl: "/company/applications",
                    ct: ct);
            }
        }

        if (_emailService != null)
        {
            await _emailService.SendApplicationSubmittedEmailAsync(
                recipientEmail: candidateProfile.User.Email,
                candidateName: candidateProfile.User.FullName,
                companyName: job.Company.Name,
                jobTitle: job.Title,
                applicationId: application.Id,
                cancellationToken: ct);
        }

        await _auditService.LogAsync(
            action: "ApplicationSubmitted",
            targetResource: "JobApplication",
            targetResourceId: application.Id.ToString(),
            companyId: job.CompanyId,
            metadata: new { JobId = job.Id, JobTitle = job.Title },
            cancellationToken: ct);

        return new CandidateApplicationDetailDto(
            application.Id,
            job.Id,
            job.Title,
            job.Slug,
            job.Location,
            job.WorkplaceType,
            job.EmploymentType,
            job.CompanyId,
            job.Company.Name,
            application.CurrentStage,
            application.SubmittedAtUtc,
            application.StageUpdatedAtUtc,
            application.CandidateCoverNote,
            new List<ApplicationStatusHistoryDto>
            {
                new(initialHistory.Id, initialHistory.PreviousStage, initialHistory.NewStage, candidateProfile.User.FullName, initialHistory.ReasonNote, initialHistory.CreatedAtUtc)
            },
            assessmentDto);
    }

    public async Task<IReadOnlyList<CandidateApplicationSummaryDto>> GetCandidateApplicationsAsync(Guid userId, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            return Array.Empty<CandidateApplicationSummaryDto>();

        return await _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.Company)
            .Where(a => a.CandidateProfileId == candidateProfile.Id)
            .OrderByDescending(a => a.SubmittedAtUtc)
            .Select(a => new CandidateApplicationSummaryDto(
                a.Id,
                a.JobPostingId,
                a.JobPosting.Title,
                a.JobPosting.Slug,
                a.CompanyId,
                a.Company.Name,
                a.CurrentStage,
                a.SubmittedAtUtc,
                a.StageUpdatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<CandidateApplicationDetailDto> GetCandidateApplicationByIdAsync(Guid applicationId, Guid userId, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .Include(cp => cp.User)
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            throw new NotFoundException("CandidateProfile", userId);

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.Company)
            .Include(a => a.StatusHistories)
                .ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CandidateProfileId == candidateProfile.Id, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        var timeline = application.StatusHistories
            .OrderBy(h => h.CreatedAtUtc)
            .Select(h => new ApplicationStatusHistoryDto(
                h.Id,
                h.PreviousStage,
                h.NewStage,
                h.ChangedByUser?.FullName ?? "System",
                h.ReasonNote,
                h.CreatedAtUtc))
            .ToList();

        var assignment = await _context.AssessmentAssignments
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.Sessions)
                .ThenInclude(s => s.AssessmentResult)
            .FirstOrDefaultAsync(a => a.JobApplicationId == application.Id, ct);

        HireSphere.Application.DTOs.WorkSim.AssessmentAssignmentDto? assessmentDto = null;
        if (assignment != null)
        {
            var activeSession = assignment.Sessions.FirstOrDefault(s => s.Status == SimulationSessionStatus.Active);
            var completedSession = assignment.Sessions.OrderByDescending(s => s.StartedAtUtc).FirstOrDefault(s => s.AssessmentResult != null);
            var scenario = assignment.JobAssessmentConfiguration.ScenarioVersion.SimulationScenario;

            assessmentDto = new HireSphere.Application.DTOs.WorkSim.AssessmentAssignmentDto
            {
                AssignmentId = assignment.Id,
                JobApplicationId = assignment.JobApplicationId,
                JobTitle = application.JobPosting.Title,
                CompanyName = application.Company.Name,
                ScenarioId = scenario.Id,
                ScenarioTitle = scenario.Title,
                ScenarioCategory = scenario.Category,
                ScenarioDescription = scenario.Description,
                EstimatedDurationMinutes = scenario.EstimatedDurationMinutes,
                IsRequired = assignment.JobAssessmentConfiguration.IsRequired,
                MaxAllowedAttempts = assignment.JobAssessmentConfiguration.MaxAllowedAttempts,
                AssignedAtUtc = assignment.AssignedAtUtc,
                DeadlineUtc = assignment.DeadlineUtc,
                Status = assignment.Status.ToString(),
                ReminderSentAtUtc = assignment.ReminderSentAtUtc,
                CancelledAtUtc = assignment.CancelledAtUtc,
                CancellationReason = assignment.CancellationReason,
                ResentCount = assignment.ResentCount,
                LastResentAtUtc = assignment.LastResentAtUtc,
                ActiveSessionId = activeSession?.Id ?? completedSession?.Id,
                ResultId = completedSession?.AssessmentResult?.Id,
                TotalScore = completedSession?.AssessmentResult?.TotalScore,
                CompletedAtUtc = assignment.CompletedAtUtc
            };
        }

        return new CandidateApplicationDetailDto(
            application.Id,
            application.JobPostingId,
            application.JobPosting.Title,
            application.JobPosting.Slug,
            application.JobPosting.Location,
            application.JobPosting.WorkplaceType,
            application.JobPosting.EmploymentType,
            application.CompanyId,
            application.Company.Name,
            application.CurrentStage,
            application.SubmittedAtUtc,
            application.StageUpdatedAtUtc,
            application.CandidateCoverNote,
            timeline,
            assessmentDto);
    }

    public async Task<CandidateApplicationDetailDto> WithdrawApplicationAsync(Guid applicationId, Guid userId, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .Include(cp => cp.User)
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            throw new NotFoundException("CandidateProfile", userId);

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.Company)
            .Include(a => a.StatusHistories)
                .ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CandidateProfileId == candidateProfile.Id, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        if (application.CurrentStage == ApplicationStage.Withdrawn)
            throw new ConflictException("Application has already been withdrawn.");

        if (application.CurrentStage == ApplicationStage.Hired || application.CurrentStage == ApplicationStage.Rejected)
            throw new ConflictException($"Cannot withdraw an application that has reached terminal stage '{application.CurrentStage}'.");

        var previousStage = application.CurrentStage;
        application.CurrentStage = ApplicationStage.Withdrawn;
        application.StageUpdatedAtUtc = DateTimeOffset.UtcNow;

        var history = new ApplicationStatusHistory
        {
            JobApplicationId = application.Id,
            PreviousStage = previousStage,
            NewStage = ApplicationStage.Withdrawn,
            ChangedByUserId = userId,
            ReasonNote = "Candidate withdrew application voluntarily.",
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.ApplicationStatusHistories.Add(history);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "ApplicationWithdrawn",
            targetResource: "JobApplication",
            targetResourceId: application.Id.ToString(),
            companyId: application.CompanyId,
            cancellationToken: ct);

        var timeline = application.StatusHistories
            .OrderBy(h => h.CreatedAtUtc)
            .Select(h => new ApplicationStatusHistoryDto(
                h.Id,
                h.PreviousStage,
                h.NewStage,
                h.ChangedByUser?.FullName ?? "System",
                h.ReasonNote,
                h.CreatedAtUtc))
            .ToList();

        return new CandidateApplicationDetailDto(
            application.Id,
            application.JobPostingId,
            application.JobPosting.Title,
            application.JobPosting.Slug,
            application.JobPosting.Location,
            application.JobPosting.WorkplaceType,
            application.JobPosting.EmploymentType,
            application.CompanyId,
            application.Company.Name,
            application.CurrentStage,
            application.SubmittedAtUtc,
            application.StageUpdatedAtUtc,
            application.CandidateCoverNote,
            timeline);
    }

    public async Task<PagedResult<CompanyApplicationSummaryDto>> GetCompanyApplicationsAsync(
        Guid companyId,
        Guid userId,
        Guid? jobPostingId = null,
        ApplicationStage? stage = null,
        string? search = null,
        string? sortBy = null,
        bool sortDescending = true,
        int page = 1,
        int pageSize = 15,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        await ValidateCompanyMembership(companyId, userId, canManageStage: false, ct);

        var query = _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Where(a => a.CompanyId == companyId);

        if (jobPostingId.HasValue)
        {
            query = query.Where(a => a.JobPostingId == jobPostingId.Value);
        }

        if (stage.HasValue)
        {
            query = query.Where(a => a.CurrentStage == stage.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(a =>
                a.CandidateProfile.User.FirstName.Contains(s) ||
                a.CandidateProfile.User.LastName.Contains(s) ||
                a.CandidateProfile.User.Email.Contains(s) ||
                (a.CandidateProfile.Headline != null && a.CandidateProfile.Headline.Contains(s)));
        }

        int totalCount = await query.CountAsync(ct);

        query = (sortBy?.ToLowerInvariant()) switch
        {
            "name" => sortDescending
                ? query.OrderByDescending(a => a.CandidateProfile.User.LastName).ThenByDescending(a => a.CandidateProfile.User.FirstName)
                : query.OrderBy(a => a.CandidateProfile.User.LastName).ThenBy(a => a.CandidateProfile.User.FirstName),
            "stage" => sortDescending
                ? query.OrderByDescending(a => a.CurrentStage)
                : query.OrderBy(a => a.CurrentStage),
            _ => sortDescending
                ? query.OrderByDescending(a => a.SubmittedAtUtc)
                : query.OrderBy(a => a.SubmittedAtUtc)
        };


        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new CompanyApplicationSummaryDto(
                a.Id,
                a.JobPostingId,
                a.JobPosting.Title,
                a.CandidateProfileId,
                a.CandidateProfile.User.FullName,
                a.CandidateProfile.User.Email,
                a.CandidateProfile.Headline,
                a.CandidateProfile.Location,
                a.CandidateProfile.YearsOfExperience,
                a.CurrentStage,
                a.SubmittedAtUtc,
                a.StageUpdatedAtUtc))
            .ToListAsync(ct);

        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<CompanyApplicationSummaryDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<CompanyApplicationDetailDto> GetCompanyApplicationByIdAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: false, ct);

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
                .ThenInclude(jp => jp.Company)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.CandidateDocument)
            .Include(a => a.StatusHistories)
                .ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        var timeline = application.StatusHistories
            .OrderBy(h => h.CreatedAtUtc)
            .Select(h => new ApplicationStatusHistoryDto(
                h.Id,
                h.PreviousStage,
                h.NewStage,
                h.ChangedByUser?.FullName ?? "System",
                h.ReasonNote,
                h.CreatedAtUtc))
            .ToList();

        var assignment = await _context.AssessmentAssignments
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.Sessions)
                .ThenInclude(s => s.AssessmentResult)
            .FirstOrDefaultAsync(a => a.JobApplicationId == application.Id, ct);

        HireSphere.Application.DTOs.WorkSim.AssessmentAssignmentDto? assessmentDto = null;
        if (assignment != null)
        {
            var activeSession = assignment.Sessions.FirstOrDefault(s => s.Status == SimulationSessionStatus.Active);
            var completedSession = assignment.Sessions.OrderByDescending(s => s.StartedAtUtc).FirstOrDefault(s => s.AssessmentResult != null);
            var scenario = assignment.JobAssessmentConfiguration.ScenarioVersion.SimulationScenario;

            assessmentDto = new HireSphere.Application.DTOs.WorkSim.AssessmentAssignmentDto
            {
                AssignmentId = assignment.Id,
                JobApplicationId = assignment.JobApplicationId,
                JobTitle = application.JobPosting.Title,
                CompanyName = application.JobPosting.Company?.Name ?? "",
                ScenarioId = scenario.Id,
                ScenarioTitle = scenario.Title,
                ScenarioCategory = scenario.Category,
                ScenarioDescription = scenario.Description,
                EstimatedDurationMinutes = scenario.EstimatedDurationMinutes,
                IsRequired = assignment.JobAssessmentConfiguration.IsRequired,
                MaxAllowedAttempts = assignment.JobAssessmentConfiguration.MaxAllowedAttempts,
                AssignedAtUtc = assignment.AssignedAtUtc,
                DeadlineUtc = assignment.DeadlineUtc,
                Status = assignment.Status.ToString(),
                ReminderSentAtUtc = assignment.ReminderSentAtUtc,
                CancelledAtUtc = assignment.CancelledAtUtc,
                CancellationReason = assignment.CancellationReason,
                ResentCount = assignment.ResentCount,
                LastResentAtUtc = assignment.LastResentAtUtc,
                ActiveSessionId = activeSession?.Id ?? completedSession?.Id,
                ResultId = completedSession?.AssessmentResult?.Id,
                TotalScore = completedSession?.AssessmentResult?.TotalScore,
                CompletedAtUtc = assignment.CompletedAtUtc
            };
        }

        var notes = await _context.CandidateNotes
            .Include(n => n.AuthorUser)
            .Where(n => n.JobApplicationId == application.Id && n.CompanyId == companyId && !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => new CandidateNoteDto(
                n.Id,
                n.CompanyId,
                n.JobApplicationId,
                n.AuthorUserId,
                n.AuthorUser.FullName,
                n.NoteText,
                n.CreatedAtUtc,
                n.UpdatedAtUtc))
            .ToListAsync(ct);

        var interviews = await _context.InterviewSchedules
            .Where(i => i.JobApplicationId == application.Id && i.CompanyId == companyId)
            .OrderBy(i => i.ScheduledStartUtc)
            .Select(i => new InterviewScheduleDto(
                i.Id,
                i.CompanyId,
                i.JobApplicationId,
                application.CandidateProfile.User.FullName,
                application.JobPosting.Title,
                i.InterviewType,
                i.ScheduledStartUtc,
                i.ScheduledEndUtc,
                i.MeetingLocation,
                i.Status,
                i.CreatedAtUtc,
                i.UpdatedAtUtc))
            .ToListAsync(ct);

        var profile = application.CandidateProfile;

        return new CompanyApplicationDetailDto(
            application.Id,
            application.JobPostingId,
            application.JobPosting.Title,
            profile.Id,
            profile.User.FullName,
            profile.User.Email,
            profile.Headline,
            profile.Summary,
            profile.Location,
            profile.YearsOfExperience,
            profile.LinkedInUrl,
            profile.GitHubUrl,
            profile.PortfolioUrl,
            application.CurrentStage,
            application.SubmittedAtUtc,
            application.StageUpdatedAtUtc,
            application.CandidateCoverNote,
            timeline,
            application.CandidateDocumentId,
            application.CandidateDocument?.OriginalFileName,
            assessmentDto,
            notes,
            interviews);
    }

    public async Task<CompanyApplicationDetailDto> UpdateApplicationStageAsync(Guid companyId, Guid applicationId, Guid userId, UpdateApplicationStageRequest request, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: true, ct);

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
                .ThenInclude(jp => jp.Company)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.StatusHistories)
                .ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        if (application.CurrentStage == ApplicationStage.Withdrawn)
            throw new ConflictException("Cannot change status of an application that was withdrawn by the candidate.");

        if (application.CurrentStage == ApplicationStage.Hired)
            throw new ConflictException("Cannot change status of a candidate who is already marked as hired.");

        if (application.CurrentStage == request.NewStage)
            throw new ConflictException($"Application is already in stage '{request.NewStage}'.");

        ValidateStageTransition(application.CurrentStage, request.NewStage);

        var previousStage = application.CurrentStage;
        application.CurrentStage = request.NewStage;
        application.StageUpdatedAtUtc = DateTimeOffset.UtcNow;

        var history = new ApplicationStatusHistory
        {
            JobApplicationId = application.Id,
            PreviousStage = previousStage,
            NewStage = request.NewStage,
            ChangedByUserId = userId,
            ReasonNote = request.ReasonNote?.Trim(),
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.ApplicationStatusHistories.Add(history);
        await _context.SaveChangesAsync(ct);

        if (_notificationService != null)
        {
            var stageTitle = request.NewStage switch
            {
                ApplicationStage.UnderReview => "Application Under Review",
                ApplicationStage.Shortlisted => $"Shortlisted: {application.JobPosting.Title}",
                ApplicationStage.InterviewScheduled => $"Interview Scheduled: {application.JobPosting.Title}",
                ApplicationStage.Offered => $"Offer Extended: {application.JobPosting.Title}",
                ApplicationStage.Hired => "Congratulations: You're Hired!",
                ApplicationStage.Rejected => $"Application Update: {application.JobPosting.Title}",
                _ => $"Application Status: {request.NewStage}"
            };

            var notePart = !string.IsNullOrWhiteSpace(request.ReasonNote) ? $" Note: {request.ReasonNote}" : "";
            var stageMessage = $"Your application for '{application.JobPosting.Title}' has moved to '{request.NewStage}'.{notePart}";

            await _notificationService.CreateNotificationAsync(
                userId: application.CandidateProfile.UserId,
                notificationType: "ApplicationStageChanged",
                title: stageTitle,
                message: stageMessage,
                actionUrl: "/candidate/applications",
                ct: ct);
        }

        if (_emailService != null)
        {
            await _emailService.SendApplicationStatusUpdatedEmailAsync(
                recipientEmail: application.CandidateProfile.User.Email,
                candidateName: application.CandidateProfile.User.FullName,
                companyName: application.JobPosting.Company?.Name ?? "the employer",
                jobTitle: application.JobPosting.Title,
                newStage: request.NewStage.ToString(),
                note: request.ReasonNote,
                cancellationToken: ct);
        }

        await _auditService.LogAsync(
            action: "ApplicationStageChanged",
            targetResource: "JobApplication",
            targetResourceId: application.Id.ToString(),
            companyId: companyId,
            metadata: new { Previous = previousStage.ToString(), New = request.NewStage.ToString() },
            cancellationToken: ct);

        return await GetCompanyApplicationByIdAsync(companyId, applicationId, userId, ct);
    }

    public async Task<PipelineBoardDto> GetPipelineBoardAsync(Guid companyId, Guid userId, Guid? jobPostingId = null, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: false, ct);

        var query = _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.CvMatchReport)
            .Include(a => a.AssessmentAssignments)
                .ThenInclude(aa => aa.Sessions)
                    .ThenInclude(s => s.AssessmentResult)
            .Where(a => a.CompanyId == companyId);

        if (jobPostingId.HasValue)
        {
            query = query.Where(a => a.JobPostingId == jobPostingId.Value);
        }

        var applications = await query
            .OrderByDescending(a => a.SubmittedAtUtc)
            .ToListAsync(ct);

        var standardStages = new[]
        {
            ApplicationStage.Submitted,
            ApplicationStage.UnderReview,
            ApplicationStage.Shortlisted,
            ApplicationStage.AssessmentPending,
            ApplicationStage.AssessmentCompleted,
            ApplicationStage.InterviewScheduled,
            ApplicationStage.Offered,
            ApplicationStage.Hired,
            ApplicationStage.Rejected
        };

        var stageColumns = new List<PipelineBoardStageColumnDto>();
        foreach (var stage in standardStages)
        {
            var stageApps = applications
                .Where(a => a.CurrentStage == stage)
                .Select(a =>
                {
                    var workSimScore = a.AssessmentAssignments
                        .SelectMany(aa => aa.Sessions)
                        .OrderByDescending(s => s.StartedAtUtc)
                        .Select(s => s.AssessmentResult?.TotalScore)
                        .FirstOrDefault(score => score.HasValue);

                    return new PipelineBoardCardDto(
                        a.Id,
                        a.JobPostingId,
                        a.JobPosting.Title,
                        a.CandidateProfileId,
                        a.CandidateProfile.User.FullName,
                        a.CandidateProfile.User.Email,
                        a.CandidateProfile.Headline,
                        a.CandidateProfile.Location,
                        a.CandidateProfile.YearsOfExperience,
                        a.CurrentStage,
                        a.SubmittedAtUtc,
                        a.StageUpdatedAtUtc,
                        a.CvMatchReport?.OverallEvidenceIndex,
                        workSimScore);
                })
                .ToList();

            string stageName = stage switch
            {
                ApplicationStage.Submitted => "Submitted",
                ApplicationStage.UnderReview => "Under Review",
                ApplicationStage.Shortlisted => "Shortlisted",
                ApplicationStage.AssessmentPending => "Assessment Pending",
                ApplicationStage.AssessmentCompleted => "Assessment Done",
                ApplicationStage.InterviewScheduled => "Interview Scheduled",
                ApplicationStage.Offered => "Offer Extended",
                ApplicationStage.Hired => "Hired",
                ApplicationStage.Rejected => "Rejected",
                _ => stage.ToString()
            };

            stageColumns.Add(new PipelineBoardStageColumnDto(stage, stageName, stageApps.Count, stageApps));
        }

        return new PipelineBoardDto(companyId, jobPostingId, applications.Count, stageColumns);
    }

    public async Task<CompanyWorkspaceDashboardDto> GetCompanyWorkspaceDashboardAsync(Guid companyId, Guid userId, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: false, ct);

        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId, ct)
            ?? throw new NotFoundException("Company", companyId);

        var now = DateTimeOffset.UtcNow;

        // Active job vacancies
        var activeJobs = await _context.JobPostings
            .Where(j => j.CompanyId == companyId && !j.IsDeleted && j.Status == JobPostingStatus.Published)
            .Select(j => new WorkspaceJobSummaryDto(
                j.Id,
                j.Title,
                j.Slug,
                j.Status,
                j.Applications.Count,
                j.CreatedAtUtc))
            .OrderByDescending(j => j.CreatedAtUtc)
            .Take(10)
            .ToListAsync(ct);

        int activeJobsCount = await _context.JobPostings
            .CountAsync(j => j.CompanyId == companyId && !j.IsDeleted && j.Status == JobPostingStatus.Published, ct);

        // Application metrics
        int pendingReviewCount = await _context.JobApplications
            .CountAsync(a => a.CompanyId == companyId && (a.CurrentStage == ApplicationStage.Submitted || a.CurrentStage == ApplicationStage.UnderReview), ct);

        int shortlistedCount = await _context.JobApplications
            .CountAsync(a => a.CompanyId == companyId && a.CurrentStage == ApplicationStage.Shortlisted, ct);

        // Upcoming interviews
        var upcomingInterviews = await _context.InterviewSchedules
            .Include(i => i.JobApplication)
                .ThenInclude(a => a.JobPosting)
            .Include(i => i.JobApplication)
                .ThenInclude(a => a.CandidateProfile)
                    .ThenInclude(cp => cp.User)
            .Where(i => i.CompanyId == companyId && i.Status == InterviewStatus.Scheduled && i.ScheduledEndUtc >= now)
            .OrderBy(i => i.ScheduledStartUtc)
            .Take(6)
            .Select(i => new InterviewScheduleDto(
                i.Id,
                i.CompanyId,
                i.JobApplicationId,
                i.JobApplication.CandidateProfile.User.FullName,
                i.JobApplication.JobPosting.Title,
                i.InterviewType,
                i.ScheduledStartUtc,
                i.ScheduledEndUtc,
                i.MeetingLocation,
                i.Status,
                i.CreatedAtUtc,
                i.UpdatedAtUtc))
            .ToListAsync(ct);

        int upcomingInterviewsCount = await _context.InterviewSchedules
            .CountAsync(i => i.CompanyId == companyId && i.Status == InterviewStatus.Scheduled && i.ScheduledEndUtc >= now, ct);

        // Pending WorkSim assessments
        int pendingAssessmentsCount = await _context.AssessmentAssignments
            .CountAsync(aa => aa.JobApplication.CompanyId == companyId && (aa.Status == AssessmentAssignmentStatus.Assigned || aa.Status == AssessmentAssignmentStatus.InProgress), ct);

        // Recent applications
        var recentApplications = await _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Where(a => a.CompanyId == companyId)
            .OrderByDescending(a => a.SubmittedAtUtc)
            .Take(6)
            .Select(a => new CompanyApplicationSummaryDto(
                a.Id,
                a.JobPostingId,
                a.JobPosting.Title,
                a.CandidateProfileId,
                a.CandidateProfile.User.FullName,
                a.CandidateProfile.User.Email,
                a.CandidateProfile.Headline,
                a.CandidateProfile.Location,
                a.CandidateProfile.YearsOfExperience,
                a.CurrentStage,
                a.SubmittedAtUtc,
                a.StageUpdatedAtUtc))
            .ToListAsync(ct);

        // Action items / Recruitment Tasks
        var actionItems = new List<RecruitmentTaskItemDto>();

        if (pendingReviewCount > 0)
        {
            actionItems.Add(new RecruitmentTaskItemDto(
                Id: "pending-reviews",
                Type: "Review",
                Title: $"{pendingReviewCount} Applications Awaiting Review",
                Description: "Review newly submitted candidate profiles and move qualified applicants forward.",
                ActionUrl: "/company/applications?stage=0",
                Severity: "info"));
        }

        var todayInterviewsCount = upcomingInterviews.Count(i => i.ScheduledStartUtc.Date == now.Date);
        if (todayInterviewsCount > 0)
        {
            actionItems.Add(new RecruitmentTaskItemDto(
                Id: "interviews-today",
                Type: "Interview",
                Title: $"{todayInterviewsCount} Interviews Scheduled for Today",
                Description: "Ensure meeting links or rooms are prepared and candidate profiles are reviewed.",
                ActionUrl: "/company/applications?stage=5",
                Severity: "warning"));
        }

        if (pendingAssessmentsCount > 0)
        {
            actionItems.Add(new RecruitmentTaskItemDto(
                Id: "assessments-pending",
                Type: "Assessment",
                Title: $"{pendingAssessmentsCount} WorkSim™ Evaluations in Progress",
                Description: "Candidates are currently participating in interactive skill simulations.",
                ActionUrl: "/company/applications?stage=3",
                Severity: "info"));
        }

        if (activeJobsCount == 0)
        {
            actionItems.Add(new RecruitmentTaskItemDto(
                Id: "no-active-jobs",
                Type: "Jobs",
                Title: "No Active Vacancies Published",
                Description: "Create and publish a vacancy to begin receiving applications.",
                ActionUrl: "/company/jobs",
                Severity: "warning"));
        }

        return new CompanyWorkspaceDashboardDto(
            companyId,
            company.Name,
            activeJobsCount,
            pendingReviewCount,
            shortlistedCount,
            upcomingInterviewsCount,
            pendingAssessmentsCount,
            activeJobs,
            upcomingInterviews,
            recentApplications,
            actionItems);
    }

    public async Task<CandidateNoteDto> AddCandidateNoteAsync(Guid companyId, Guid applicationId, Guid userId, CreateCandidateNoteRequest request, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: false, ct);

        var application = await _context.JobApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

        var note = new CandidateNote
        {
            CompanyId = companyId,
            JobApplicationId = applicationId,
            AuthorUserId = userId,
            NoteText = request.NoteText.Trim(),
            CreatedAtUtc = DateTimeOffset.UtcNow,
            IsDeleted = false
        };

        _context.CandidateNotes.Add(note);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CandidateNoteAdded",
            targetResource: "CandidateNote",
            targetResourceId: note.Id.ToString(),
            companyId: companyId,
            cancellationToken: ct);

        return new CandidateNoteDto(
            note.Id,
            note.CompanyId,
            note.JobApplicationId,
            note.AuthorUserId,
            user?.FullName ?? "Recruiter",
            note.NoteText,
            note.CreatedAtUtc,
            note.UpdatedAtUtc);
    }

    public async Task<IReadOnlyList<CandidateNoteDto>> GetApplicationNotesAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: false, ct);

        var application = await _context.JobApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        return await _context.CandidateNotes
            .Include(n => n.AuthorUser)
            .Where(n => n.JobApplicationId == applicationId && n.CompanyId == companyId && !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => new CandidateNoteDto(
                n.Id,
                n.CompanyId,
                n.JobApplicationId,
                n.AuthorUserId,
                n.AuthorUser.FullName,
                n.NoteText,
                n.CreatedAtUtc,
                n.UpdatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task DeleteCandidateNoteAsync(Guid companyId, Guid applicationId, Guid noteId, Guid userId, CancellationToken ct = default)
    {
        var company = await _context.Companies
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);

        if (company == null)
            throw new NotFoundException("Company", companyId);

        var membership = company.Members.FirstOrDefault(m => m.UserId == userId && m.MembershipStatus == CompanyMembershipStatus.Active);
        if (membership == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        var note = await _context.CandidateNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.JobApplicationId == applicationId && n.CompanyId == companyId && !n.IsDeleted, ct);

        if (note == null)
            throw new NotFoundException("CandidateNote", noteId);

        if (note.AuthorUserId != userId && membership.CompanyRole != CompanyRole.Owner)
        {
            throw new ForbiddenAccessException("You can only delete your own notes, unless you are the company owner.");
        }

        note.IsDeleted = true;
        note.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CandidateNoteDeleted",
            targetResource: "CandidateNote",
            targetResourceId: noteId.ToString(),
            companyId: companyId,
            cancellationToken: ct);
    }

    public async Task<InterviewScheduleDto> ScheduleInterviewAsync(Guid companyId, Guid applicationId, Guid userId, ScheduleInterviewRequest request, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: true, ct);

        if (request.ScheduledEndUtc <= request.ScheduledStartUtc)
            throw new ValidationException("Interview end time must be after start time.");

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
                .ThenInclude(jp => jp.Company)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        if (application.CurrentStage == ApplicationStage.Withdrawn || application.CurrentStage == ApplicationStage.Hired)
            throw new ConflictException($"Cannot schedule interview for application in terminal stage '{application.CurrentStage}'.");

        var interview = new InterviewSchedule
        {
            CompanyId = companyId,
            JobApplicationId = applicationId,
            InterviewType = request.InterviewType,
            ScheduledStartUtc = request.ScheduledStartUtc,
            ScheduledEndUtc = request.ScheduledEndUtc,
            MeetingLocation = request.MeetingLocation?.Trim(),
            Status = InterviewStatus.Scheduled,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.InterviewSchedules.Add(interview);

        if (application.CurrentStage != ApplicationStage.InterviewScheduled)
        {
            var prevStage = application.CurrentStage;
            application.CurrentStage = ApplicationStage.InterviewScheduled;
            application.StageUpdatedAtUtc = DateTimeOffset.UtcNow;

            var history = new ApplicationStatusHistory
            {
                JobApplicationId = application.Id,
                PreviousStage = prevStage,
                NewStage = ApplicationStage.InterviewScheduled,
                ChangedByUserId = userId,
                ReasonNote = $"Interview ({request.InterviewType}) scheduled for {request.ScheduledStartUtc:yyyy-MM-dd HH:mm UTC}.",
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            _context.ApplicationStatusHistories.Add(history);
        }

        await _context.SaveChangesAsync(ct);

        if (_notificationService != null)
        {
            var formattedTime = request.ScheduledStartUtc.ToString("dd MMM yyyy, HH:mm UTC");
            var locStr = !string.IsNullOrWhiteSpace(request.MeetingLocation) ? $" Location/Link: {request.MeetingLocation}" : "";
            await _notificationService.CreateNotificationAsync(
                userId: application.CandidateProfile.UserId,
                notificationType: "InterviewScheduled",
                title: $"Interview Scheduled: {application.JobPosting.Title}",
                message: $"Your interview ({request.InterviewType}) has been scheduled for {formattedTime}.{locStr}",
                actionUrl: "/candidate/applications",
                ct: ct);
        }

        if (_emailService != null)
        {
            await _emailService.SendApplicationStatusUpdatedEmailAsync(
                recipientEmail: application.CandidateProfile.User.Email,
                candidateName: application.CandidateProfile.User.FullName,
                companyName: application.JobPosting.Company?.Name ?? "the employer",
                jobTitle: application.JobPosting.Title,
                newStage: "Interview Scheduled",
                note: $"Interview ({request.InterviewType}) set for {request.ScheduledStartUtc:dd MMM yyyy HH:mm UTC}. Location: {request.MeetingLocation ?? "Online"}",
                cancellationToken: ct);
        }

        await _auditService.LogAsync(
            action: "InterviewScheduled",
            targetResource: "InterviewSchedule",
            targetResourceId: interview.Id.ToString(),
            companyId: companyId,
            cancellationToken: ct);

        return new InterviewScheduleDto(
            interview.Id,
            interview.CompanyId,
            interview.JobApplicationId,
            application.CandidateProfile.User.FullName,
            application.JobPosting.Title,
            interview.InterviewType,
            interview.ScheduledStartUtc,
            interview.ScheduledEndUtc,
            interview.MeetingLocation,
            interview.Status,
            interview.CreatedAtUtc,
            interview.UpdatedAtUtc);
    }

    public async Task<InterviewScheduleDto> UpdateInterviewAsync(Guid companyId, Guid applicationId, Guid interviewId, Guid userId, UpdateInterviewRequest request, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: true, ct);

        if (request.ScheduledEndUtc <= request.ScheduledStartUtc)
            throw new ValidationException("Interview end time must be after start time.");

        var interview = await _context.InterviewSchedules
            .Include(i => i.JobApplication)
                .ThenInclude(a => a.JobPosting)
            .Include(i => i.JobApplication)
                .ThenInclude(a => a.CandidateProfile)
                    .ThenInclude(cp => cp.User)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.JobApplicationId == applicationId && i.CompanyId == companyId, ct);

        if (interview == null)
            throw new NotFoundException("InterviewSchedule", interviewId);

        var prevStatus = interview.Status;
        var prevStart = interview.ScheduledStartUtc;

        interview.InterviewType = request.InterviewType;
        interview.ScheduledStartUtc = request.ScheduledStartUtc;
        interview.ScheduledEndUtc = request.ScheduledEndUtc;
        interview.MeetingLocation = request.MeetingLocation?.Trim();
        interview.Status = request.Status;
        interview.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        if (_notificationService != null && (prevStart != request.ScheduledStartUtc || prevStatus != request.Status))
        {
            var app = interview.JobApplication;
            var formattedTime = request.ScheduledStartUtc.ToString("dd MMM yyyy, HH:mm UTC");
            await _notificationService.CreateNotificationAsync(
                userId: app.CandidateProfile.UserId,
                notificationType: "InterviewUpdated",
                title: $"Interview Updated: {app.JobPosting.Title}",
                message: $"Your interview status has been updated to '{request.Status}', scheduled for {formattedTime}.",
                actionUrl: "/candidate/applications",
                ct: ct);
        }

        await _auditService.LogAsync(
            action: "InterviewUpdated",
            targetResource: "InterviewSchedule",
            targetResourceId: interview.Id.ToString(),
            companyId: companyId,
            cancellationToken: ct);

        return new InterviewScheduleDto(
            interview.Id,
            interview.CompanyId,
            interview.JobApplicationId,
            interview.JobApplication.CandidateProfile.User.FullName,
            interview.JobApplication.JobPosting.Title,
            interview.InterviewType,
            interview.ScheduledStartUtc,
            interview.ScheduledEndUtc,
            interview.MeetingLocation,
            interview.Status,
            interview.CreatedAtUtc,
            interview.UpdatedAtUtc);
    }

    public async Task<InterviewScheduleDto> CancelInterviewAsync(Guid companyId, Guid applicationId, Guid interviewId, Guid userId, string? reason = null, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: true, ct);

        var interview = await _context.InterviewSchedules
            .Include(i => i.JobApplication)
                .ThenInclude(a => a.JobPosting)
            .Include(i => i.JobApplication)
                .ThenInclude(a => a.CandidateProfile)
                    .ThenInclude(cp => cp.User)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.JobApplicationId == applicationId && i.CompanyId == companyId, ct);

        if (interview == null)
            throw new NotFoundException("InterviewSchedule", interviewId);

        interview.Status = InterviewStatus.Canceled;
        interview.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        if (_notificationService != null)
        {
            var app = interview.JobApplication;
            var reasonPart = !string.IsNullOrWhiteSpace(reason) ? $" Reason: {reason.Trim()}" : "";
            await _notificationService.CreateNotificationAsync(
                userId: app.CandidateProfile.UserId,
                notificationType: "InterviewCancelled",
                title: $"Interview Cancelled: {app.JobPosting.Title}",
                message: $"Your scheduled interview for {app.JobPosting.Title} on {interview.ScheduledStartUtc:dd MMM yyyy, HH:mm UTC} has been cancelled.{reasonPart}",
                actionUrl: "/candidate/applications",
                ct: ct);
        }

        await _auditService.LogAsync(
            action: "InterviewCancelled",
            targetResource: "InterviewSchedule",
            targetResourceId: interview.Id.ToString(),
            companyId: companyId,
            cancellationToken: ct);

        return new InterviewScheduleDto(
            interview.Id,
            interview.CompanyId,
            interview.JobApplicationId,
            interview.JobApplication.CandidateProfile.User.FullName,
            interview.JobApplication.JobPosting.Title,
            interview.InterviewType,
            interview.ScheduledStartUtc,
            interview.ScheduledEndUtc,
            interview.MeetingLocation,
            interview.Status,
            interview.CreatedAtUtc,
            interview.UpdatedAtUtc);
    }

    public async Task<IReadOnlyList<InterviewScheduleDto>> GetApplicationInterviewsAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: false, ct);

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        return await _context.InterviewSchedules
            .Where(i => i.JobApplicationId == applicationId && i.CompanyId == companyId)
            .OrderBy(i => i.ScheduledStartUtc)
            .Select(i => new InterviewScheduleDto(
                i.Id,
                i.CompanyId,
                i.JobApplicationId,
                application.CandidateProfile.User.FullName,
                application.JobPosting.Title,
                i.InterviewType,
                i.ScheduledStartUtc,
                i.ScheduledEndUtc,
                i.MeetingLocation,
                i.Status,
                i.CreatedAtUtc,
                i.UpdatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<InterviewScheduleDto>> GetCompanyInterviewsAsync(Guid companyId, Guid userId, bool upcomingOnly = true, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: false, ct);

        var query = _context.InterviewSchedules
            .Include(i => i.JobApplication)
                .ThenInclude(a => a.JobPosting)
            .Include(i => i.JobApplication)
                .ThenInclude(a => a.CandidateProfile)
                    .ThenInclude(cp => cp.User)
            .Where(i => i.CompanyId == companyId);

        if (upcomingOnly)
        {
            var now = DateTimeOffset.UtcNow;
            query = query.Where(i => i.ScheduledEndUtc >= now && i.Status == InterviewStatus.Scheduled);
        }

        return await query
            .OrderBy(i => i.ScheduledStartUtc)
            .Select(i => new InterviewScheduleDto(
                i.Id,
                i.CompanyId,
                i.JobApplicationId,
                i.JobApplication.CandidateProfile.User.FullName,
                i.JobApplication.JobPosting.Title,
                i.InterviewType,
                i.ScheduledStartUtc,
                i.ScheduledEndUtc,
                i.MeetingLocation,
                i.Status,
                i.CreatedAtUtc,
                i.UpdatedAtUtc))
            .ToListAsync(ct);
    }

    private static void ValidateStageTransition(ApplicationStage current, ApplicationStage next)
    {
        if (next == ApplicationStage.Rejected)
            return;

        if (next == ApplicationStage.Withdrawn)
            throw new ValidationException("Only candidates can withdraw their own application.");

        bool valid = current switch
        {
            ApplicationStage.Submitted => next is ApplicationStage.UnderReview or ApplicationStage.Shortlisted,
            ApplicationStage.UnderReview => next is ApplicationStage.Shortlisted or ApplicationStage.AssessmentPending or ApplicationStage.InterviewScheduled,
            ApplicationStage.Shortlisted => next is ApplicationStage.UnderReview or ApplicationStage.AssessmentPending or ApplicationStage.InterviewScheduled or ApplicationStage.Offered,
            ApplicationStage.AssessmentPending => next is ApplicationStage.AssessmentCompleted or ApplicationStage.Shortlisted or ApplicationStage.InterviewScheduled,
            ApplicationStage.AssessmentCompleted => next is ApplicationStage.Shortlisted or ApplicationStage.InterviewScheduled or ApplicationStage.Offered,
            ApplicationStage.InterviewScheduled => next is ApplicationStage.UnderReview or ApplicationStage.Shortlisted or ApplicationStage.Offered or ApplicationStage.AssessmentPending,
            ApplicationStage.Offered => next is ApplicationStage.Hired or ApplicationStage.Shortlisted or ApplicationStage.InterviewScheduled,
            ApplicationStage.Rejected => next is ApplicationStage.UnderReview,
            _ => false
        };

        if (!valid)
        {
            throw new ConflictException($"Invalid recruitment workflow transition from '{current}' to '{next}'.");
        }
    }

    private async Task ValidateCompanyMembership(Guid companyId, Guid userId, bool canManageStage, CancellationToken ct)
    {
        var company = await _context.Companies
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);

        if (company == null)
            throw new NotFoundException("Company", companyId);

        var membership = company.Members.FirstOrDefault(m => m.UserId == userId && m.MembershipStatus == CompanyMembershipStatus.Active);
        if (membership == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        if (canManageStage && membership.CompanyRole != CompanyRole.Owner && membership.CompanyRole != CompanyRole.Recruiter)
        {
            throw new ForbiddenAccessException("Only company Owners and Recruiters can update application stages.");
        }
    }
}

