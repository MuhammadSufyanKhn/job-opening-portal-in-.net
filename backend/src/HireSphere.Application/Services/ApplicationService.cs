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

    Task<PagedResult<CompanyApplicationSummaryDto>> GetCompanyApplicationsAsync(Guid companyId, Guid userId, Guid? jobPostingId = null, ApplicationStage? stage = null, int page = 1, int pageSize = 15, CancellationToken ct = default);
    Task<CompanyApplicationDetailDto> GetCompanyApplicationByIdAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default);
    Task<CompanyApplicationDetailDto> UpdateApplicationStageAsync(Guid companyId, Guid applicationId, Guid userId, UpdateApplicationStageRequest request, CancellationToken ct = default);
}

public class ApplicationService : IApplicationService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public ApplicationService(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
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
            .FirstOrDefaultAsync(c => c.JobPostingId == job.Id, ct);

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
            });
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

    public async Task<PagedResult<CompanyApplicationSummaryDto>> GetCompanyApplicationsAsync(Guid companyId, Guid userId, Guid? jobPostingId = null, ApplicationStage? stage = null, int page = 1, int pageSize = 15, CancellationToken ct = default)
    {
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

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.SubmittedAtUtc)
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
            application.CandidateDocument?.OriginalFileName);
    }

    public async Task<CompanyApplicationDetailDto> UpdateApplicationStageAsync(Guid companyId, Guid applicationId, Guid userId, UpdateApplicationStageRequest request, CancellationToken ct = default)
    {
        await ValidateCompanyMembership(companyId, userId, canManageStage: true, ct);

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.StatusHistories)
                .ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        if (application.CurrentStage == ApplicationStage.Withdrawn)
            throw new ConflictException("Cannot change status of an application that was withdrawn by the candidate.");

        if (application.CurrentStage == request.NewStage)
            throw new ConflictException($"Application is already in stage '{request.NewStage}'.");

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

        await _auditService.LogAsync(
            action: "ApplicationStageChanged",
            targetResource: "JobApplication",
            targetResourceId: application.Id.ToString(),
            companyId: companyId,
            metadata: new { Previous = previousStage.ToString(), New = request.NewStage.ToString() },
            cancellationToken: ct);

        return await GetCompanyApplicationByIdAsync(companyId, applicationId, userId, ct);
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
