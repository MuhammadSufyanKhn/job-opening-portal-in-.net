using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.WorkSim;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IAssessmentWorkflowService
{
    Task<IReadOnlyList<AssessmentAssignmentDto>> GetCandidateInvitationsAsync(Guid userId, CancellationToken ct = default);
    Task<AssessmentAssignmentDto> GetCandidateInvitationByIdAsync(Guid userId, Guid assignmentId, CancellationToken ct = default);
    Task<IReadOnlyList<CompanyAssessmentTrackingItemDto>> GetCompanyAssessmentTrackingAsync(
        Guid companyId,
        Guid userId,
        string? statusFilter = null,
        Guid? jobPostingId = null,
        CancellationToken ct = default);
    Task<bool> ResendAssessmentInvitationAsync(Guid companyId, Guid userId, Guid assignmentId, CancellationToken ct = default);
    Task<bool> CancelAssessmentInvitationAsync(Guid companyId, Guid userId, Guid assignmentId, string? reason, CancellationToken ct = default);
    Task<AssessmentDeadlineProcessResultDto> ProcessDeadlinesAndRemindersAsync(CancellationToken ct = default);
}

public class AssessmentWorkflowService : IAssessmentWorkflowService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AssessmentWorkflowService> _logger;

    public AssessmentWorkflowService(
        IApplicationDbContext context,
        IAuditService auditService,
        INotificationService notificationService,
        IEmailService emailService,
        ILogger<AssessmentWorkflowService> logger)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<AssessmentAssignmentDto>> GetCandidateInvitationsAsync(Guid userId, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            return Array.Empty<AssessmentAssignmentDto>();

        var assignments = await _context.AssessmentAssignments
            .Include(a => a.JobApplication)
                .ThenInclude(app => app.JobPosting)
                    .ThenInclude(j => j.Company)
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.Sessions)
                .ThenInclude(s => s.AssessmentResult)
            .Where(a => a.CandidateProfileId == candidateProfile.Id)
            .OrderByDescending(a => a.AssignedAtUtc)
            .ToListAsync(ct);

        return assignments.Select(MapToCandidateAssignmentDto).ToList();
    }

    public async Task<AssessmentAssignmentDto> GetCandidateInvitationByIdAsync(Guid userId, Guid assignmentId, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            throw new ForbiddenAccessException("You must have a candidate profile to view invitations.");

        var assignment = await _context.AssessmentAssignments
            .Include(a => a.JobApplication)
                .ThenInclude(app => app.JobPosting)
                    .ThenInclude(j => j.Company)
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.Sessions)
                .ThenInclude(s => s.AssessmentResult)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, ct);

        if (assignment == null)
            throw new NotFoundException("AssessmentAssignment", assignmentId);

        if (assignment.CandidateProfileId != candidateProfile.Id)
            throw new ForbiddenAccessException("You are not authorized to view this assessment invitation.");

        return MapToCandidateAssignmentDto(assignment);
    }

    public async Task<IReadOnlyList<CompanyAssessmentTrackingItemDto>> GetCompanyAssessmentTrackingAsync(
        Guid companyId,
        Guid userId,
        string? statusFilter = null,
        Guid? jobPostingId = null,
        CancellationToken ct = default)
    {
        var companyMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.UserId == userId && cm.CompanyId == companyId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (companyMember == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        var query = _context.AssessmentAssignments
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.JobApplication)
                .ThenInclude(app => app.JobPosting)
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.Sessions)
                .ThenInclude(s => s.AssessmentResult)
            .Where(a => a.CompanyId == companyId);

        if (jobPostingId.HasValue)
        {
            query = query.Where(a => a.JobApplication.JobPostingId == jobPostingId.Value);
        }

        if (!string.IsNullOrWhiteSpace(statusFilter) && Enum.TryParse<AssessmentAssignmentStatus>(statusFilter, true, out var parsedStatus))
        {
            query = query.Where(a => a.Status == parsedStatus);
        }

        var assignments = await query
            .OrderByDescending(a => a.AssignedAtUtc)
            .ToListAsync(ct);

        return assignments.Select(a =>
        {
            var completedSession = a.Sessions.OrderByDescending(s => s.StartedAtUtc).FirstOrDefault(s => s.AssessmentResult != null);
            var scenario = a.JobAssessmentConfiguration.ScenarioVersion.SimulationScenario;

            return new CompanyAssessmentTrackingItemDto
            {
                AssignmentId = a.Id,
                JobApplicationId = a.JobApplicationId,
                CandidateProfileId = a.CandidateProfileId,
                CandidateName = a.CandidateProfile.User.FullName,
                CandidateEmail = a.CandidateProfile.User.Email,
                JobPostingId = a.JobApplication.JobPostingId,
                JobTitle = a.JobApplication.JobPosting.Title,
                ScenarioTitle = scenario.Title,
                ScenarioCategory = scenario.Category,
                IsRequired = a.JobAssessmentConfiguration.IsRequired,
                Status = a.Status.ToString(),
                AssignedAtUtc = a.AssignedAtUtc,
                DeadlineUtc = a.DeadlineUtc,
                CompletedAtUtc = a.CompletedAtUtc,
                ReminderSentAtUtc = a.ReminderSentAtUtc,
                CancelledAtUtc = a.CancelledAtUtc,
                CancellationReason = a.CancellationReason,
                ResentCount = a.ResentCount,
                LastResentAtUtc = a.LastResentAtUtc,
                TotalScore = completedSession?.AssessmentResult?.TotalScore,
                ResultId = completedSession?.AssessmentResult?.Id
            };
        }).ToList();
    }

    public async Task<bool> ResendAssessmentInvitationAsync(Guid companyId, Guid userId, Guid assignmentId, CancellationToken ct = default)
    {
        var companyMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.UserId == userId && cm.CompanyId == companyId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (companyMember == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        var assignment = await _context.AssessmentAssignments
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.JobApplication)
                .ThenInclude(app => app.JobPosting)
                    .ThenInclude(j => j.Company)
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, ct);

        if (assignment == null)
            throw new NotFoundException("AssessmentAssignment", assignmentId);

        if (assignment.CompanyId != companyId)
            throw new ForbiddenAccessException("Assessment invitation does not belong to your company.");

        if (assignment.Status == AssessmentAssignmentStatus.Completed)
            throw new ConflictException("Cannot resend an assessment invitation that has already been completed.");

        // If previously cancelled or expired, reactivate and extend deadline if already expired
        if (assignment.Status == AssessmentAssignmentStatus.Cancelled || assignment.Status == AssessmentAssignmentStatus.Expired)
        {
            assignment.Status = AssessmentAssignmentStatus.Assigned;
            if (assignment.DeadlineUtc <= DateTimeOffset.UtcNow)
            {
                assignment.DeadlineUtc = DateTimeOffset.UtcNow.AddDays(assignment.JobAssessmentConfiguration.DeadlineDaysAfterAssignment);
            }
            assignment.CancelledAtUtc = null;
            assignment.CancellationReason = null;
        }

        assignment.ResentCount += 1;
        assignment.LastResentAtUtc = DateTimeOffset.UtcNow;
        assignment.ReminderSentAtUtc = null; // Reset reminder eligibility for newly extended window

        await _context.SaveChangesAsync(ct);

        var candidateUser = assignment.CandidateProfile.User;
        var job = assignment.JobApplication.JobPosting;
        var scenario = assignment.JobAssessmentConfiguration.ScenarioVersion.SimulationScenario;

        // In-app notification
        await _notificationService.CreateNotificationAsync(
            userId: candidateUser.Id,
            notificationType: "AssessmentInvitationResent",
            title: "Assessment Invitation Re-sent",
            message: $"Your invitation for the '{scenario.Title}' assessment ({job.Title}) has been refreshed. Deadline: {assignment.DeadlineUtc:MMM dd, yyyy}.",
            actionUrl: $"/candidate/simulations",
            ct: ct);

        // Safe email dispatch
        await _emailService.SendAssessmentInvitationEmailAsync(
            recipientEmail: candidateUser.Email,
            candidateName: candidateUser.FullName,
            companyName: job.Company.Name,
            jobTitle: job.Title,
            assessmentTitle: scenario.Title,
            isRequired: assignment.JobAssessmentConfiguration.IsRequired,
            deadlineUtc: assignment.DeadlineUtc,
            invitationLink: $"/candidate/simulations",
            cancellationToken: ct);

        // Audit log
        await _auditService.LogAsync(
            action: "AssessmentInvitationResent",
            targetResource: "AssessmentAssignment",
            targetResourceId: assignment.Id.ToString(),
            companyId: companyId,
            metadata: new { ResentCount = assignment.ResentCount, DeadlineUtc = assignment.DeadlineUtc },
            cancellationToken: ct);

        return true;
    }

    public async Task<bool> CancelAssessmentInvitationAsync(Guid companyId, Guid userId, Guid assignmentId, string? reason, CancellationToken ct = default)
    {
        var companyMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.UserId == userId && cm.CompanyId == companyId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (companyMember == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        var assignment = await _context.AssessmentAssignments
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.JobApplication)
                .ThenInclude(app => app.JobPosting)
                    .ThenInclude(j => j.Company)
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.Sessions)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, ct);

        if (assignment == null)
            throw new NotFoundException("AssessmentAssignment", assignmentId);

        if (assignment.CompanyId != companyId)
            throw new ForbiddenAccessException("Assessment invitation does not belong to your company.");

        if (assignment.Status == AssessmentAssignmentStatus.Completed)
            throw new ConflictException("Completed assessments cannot be cancelled.");

        if (assignment.Status == AssessmentAssignmentStatus.Cancelled)
            return true; // Already cancelled, idempotent

        assignment.Status = AssessmentAssignmentStatus.Cancelled;
        assignment.CancelledAtUtc = DateTimeOffset.UtcNow;
        assignment.CancellationReason = string.IsNullOrWhiteSpace(reason) ? "Cancelled by employer." : reason.Trim();

        // Abort any active sessions
        foreach (var session in assignment.Sessions.Where(s => s.Status == SimulationSessionStatus.Active))
        {
            session.Status = SimulationSessionStatus.Aborted;
        }

        await _context.SaveChangesAsync(ct);

        var candidateUser = assignment.CandidateProfile.User;
        var job = assignment.JobApplication.JobPosting;
        var scenario = assignment.JobAssessmentConfiguration.ScenarioVersion.SimulationScenario;

        // In-app notification
        await _notificationService.CreateNotificationAsync(
            userId: candidateUser.Id,
            notificationType: "AssessmentInvitationCancelled",
            title: "Assessment Invitation Cancelled",
            message: $"The assessment '{scenario.Title}' for {job.Title} at {job.Company.Name} has been cancelled.",
            actionUrl: "/candidate/applications",
            ct: ct);

        // Audit log
        await _auditService.LogAsync(
            action: "AssessmentInvitationCancelled",
            targetResource: "AssessmentAssignment",
            targetResourceId: assignment.Id.ToString(),
            companyId: companyId,
            metadata: new { Reason = assignment.CancellationReason },
            cancellationToken: ct);

        return true;
    }

    public async Task<AssessmentDeadlineProcessResultDto> ProcessDeadlinesAndRemindersAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        int expiredCount = 0;
        int remindersSentCount = 0;

        // 1. Mark expired active assignments (never expire Completed ones!)
        var expiredCandidates = await _context.AssessmentAssignments
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.JobApplication)
                .ThenInclude(app => app.JobPosting)
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.Sessions)
            .Where(a => (a.Status == AssessmentAssignmentStatus.Assigned || a.Status == AssessmentAssignmentStatus.InProgress)
                     && a.DeadlineUtc < now)
            .ToListAsync(ct);

        foreach (var assignment in expiredCandidates)
        {
            assignment.Status = AssessmentAssignmentStatus.Expired;
            expiredCount++;

            // Abort any active session
            foreach (var session in assignment.Sessions.Where(s => s.Status == SimulationSessionStatus.Active))
            {
                session.Status = SimulationSessionStatus.TimedOut;
            }

            var candidateUser = assignment.CandidateProfile?.User;
            var job = assignment.JobApplication?.JobPosting;
            var scenario = assignment.JobAssessmentConfiguration?.ScenarioVersion?.SimulationScenario;

            if (candidateUser != null && job != null && scenario != null)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: candidateUser.Id,
                    notificationType: "AssessmentExpired",
                    title: "Assessment Deadline Passed",
                    message: $"The deadline for your assessment '{scenario.Title}' ({job.Title}) has passed.",
                    actionUrl: "/candidate/simulations",
                    ct: ct);
            }
        }

        // 2. Identify assignments approaching deadline (within 48 hours, reminder not sent yet)
        var reminderThreshold = now.AddHours(48);
        var reminderCandidates = await _context.AssessmentAssignments
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(a => a.JobApplication)
                .ThenInclude(app => app.JobPosting)
                    .ThenInclude(j => j.Company)
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Where(a => (a.Status == AssessmentAssignmentStatus.Assigned || a.Status == AssessmentAssignmentStatus.InProgress)
                     && a.DeadlineUtc <= reminderThreshold
                     && a.DeadlineUtc > now
                     && a.ReminderSentAtUtc == null)
            .ToListAsync(ct);

        foreach (var assignment in reminderCandidates)
        {
            assignment.ReminderSentAtUtc = now;
            remindersSentCount++;

            var candidateUser = assignment.CandidateProfile?.User;
            var job = assignment.JobApplication?.JobPosting;
            var scenario = assignment.JobAssessmentConfiguration?.ScenarioVersion?.SimulationScenario;

            if (candidateUser != null && job != null && scenario != null)
            {
                // In-app notification
                await _notificationService.CreateNotificationAsync(
                    userId: candidateUser.Id,
                    notificationType: "AssessmentDeadlineReminder",
                    title: "Upcoming Assessment Deadline",
                    message: $"Reminder: Your assessment '{scenario.Title}' for {job.Title} is due on {assignment.DeadlineUtc:MMM dd, yyyy HH:mm} UTC.",
                    actionUrl: "/candidate/simulations",
                    ct: ct);

                // Safe email dispatch
                await _emailService.SendAssessmentReminderEmailAsync(
                    recipientEmail: candidateUser.Email,
                    candidateName: candidateUser.FullName,
                    companyName: job.Company.Name,
                    jobTitle: job.Title,
                    assessmentTitle: scenario.Title,
                    deadlineUtc: assignment.DeadlineUtc,
                    invitationLink: "/candidate/simulations",
                    cancellationToken: ct);
            }
        }

        if (expiredCount > 0 || remindersSentCount > 0)
        {
            await _context.SaveChangesAsync(ct);
            _logger.LogInformation(
                "[AssessmentWorkflow] Processed deadlines: {ExpiredCount} assignments marked Expired, {RemindersCount} reminders sent.",
                expiredCount, remindersSentCount);
        }

        return new AssessmentDeadlineProcessResultDto(expiredCount, remindersSentCount, now);
    }

    private static AssessmentAssignmentDto MapToCandidateAssignmentDto(AssessmentAssignment a)
    {
        var activeSession = a.Sessions.FirstOrDefault(s => s.Status == SimulationSessionStatus.Active);
        var completedSession = a.Sessions.OrderByDescending(s => s.StartedAtUtc).FirstOrDefault(s => s.AssessmentResult != null);
        var scenario = a.JobAssessmentConfiguration.ScenarioVersion.SimulationScenario;

        return new AssessmentAssignmentDto
        {
            AssignmentId = a.Id,
            JobApplicationId = a.JobApplicationId,
            JobTitle = a.JobApplication.JobPosting.Title,
            CompanyName = a.JobApplication.JobPosting.Company.Name,
            ScenarioId = scenario.Id,
            ScenarioTitle = scenario.Title,
            ScenarioCategory = scenario.Category,
            ScenarioDescription = scenario.Description,
            EstimatedDurationMinutes = scenario.EstimatedDurationMinutes,
            IsRequired = a.JobAssessmentConfiguration.IsRequired,
            MaxAllowedAttempts = a.JobAssessmentConfiguration.MaxAllowedAttempts,
            AssignedAtUtc = a.AssignedAtUtc,
            DeadlineUtc = a.DeadlineUtc,
            Status = a.Status.ToString(),
            ReminderSentAtUtc = a.ReminderSentAtUtc,
            CancelledAtUtc = a.CancelledAtUtc,
            CancellationReason = a.CancellationReason,
            ResentCount = a.ResentCount,
            LastResentAtUtc = a.LastResentAtUtc,
            ActiveSessionId = activeSession?.Id ?? completedSession?.Id,
            ResultId = completedSession?.AssessmentResult?.Id,
            TotalScore = completedSession?.AssessmentResult?.TotalScore,
            CompletedAtUtc = a.CompletedAtUtc
        };
    }
}
