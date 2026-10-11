using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.WorkSim;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;
using HireSphere.Application.WorkSim;

namespace HireSphere.Application.Services;

public interface IWorkSimManagementService
{
    Task<IReadOnlyList<SimulationScenarioDto>> GetAvailableScenariosAsync(Guid? companyId = null, CancellationToken ct = default);
    Task<IReadOnlyList<SimulationScenarioDto>> GetCompanyAvailableScenariosAsync(Guid companyId, Guid userId, CancellationToken ct = default);
    Task<JobAssessmentConfigurationDto> AssignScenarioToJobAsync(Guid companyId, Guid jobId, Guid userId, AssignJobSimulationRequest request, CancellationToken ct = default);
    Task<JobAssessmentConfigurationDto?> GetJobAssessmentConfigurationAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default);
    Task<bool> RemoveJobAssessmentConfigurationAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<AssessmentAssignmentDto>> GetCandidateAssignmentsAsync(Guid userId, CancellationToken ct = default);
    Task<AssessmentAssignmentDto?> AutoAssignToApplicationAsync(Guid applicationId, CancellationToken ct = default);
}

public class WorkSimManagementService : IWorkSimManagementService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public WorkSimManagementService(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<IReadOnlyList<SimulationScenarioDto>> GetCompanyAvailableScenariosAsync(Guid companyId, Guid userId, CancellationToken ct = default)
    {
        var isMember = await _context.CompanyMembers
            .AnyAsync(cm => cm.CompanyId == companyId && cm.UserId == userId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (!isMember)
        {
            throw new ForbiddenAccessException("You are not an active member of this company.");
        }

        return await GetAvailableScenariosAsync(companyId, ct);
    }

    public async Task<IReadOnlyList<SimulationScenarioDto>> GetAvailableScenariosAsync(Guid? companyId = null, CancellationToken ct = default)
    {
        var scenarios = await _context.SimulationScenarios
            .Include(s => s.Versions)
            .Where(s => s.IsActive && (s.OwnerCompanyId == null || (companyId.HasValue && s.OwnerCompanyId == companyId.Value)))
            .OrderBy(s => s.Category)
            .ThenBy(s => s.Title)
            .ToListAsync(ct);

        if (!scenarios.Any())
        {
            // Fallback virtual representation of default scenario if database has not been seeded yet
            return new List<SimulationScenarioDto>
            {
                new()
                {
                    Id = DefaultIncidentScenario.ScenarioId,
                    OwnerCompanyId = null,
                    Title = "Software Engineering Incident Response: Payment Gateway Latency Spike & 504 Timeouts",
                    Category = "Software Engineering",
                    Description = "Investigate a critical production incident in HireSphere Core Payment Service. Inspect APM telemetry, error logs, and PR git diffs to diagnose connection pool exhaustion, select an operational remediation strategy (rollback vs config override), and verify system recovery.",
                    EstimatedDurationMinutes = 25,
                    LatestVersionNumber = 1,
                    LatestVersionId = DefaultIncidentScenario.VersionId,
                    IsActive = true,
                    IsCompanyOwned = false
                }
            };
        }

        return scenarios.Select(s =>
        {
            var latestVersion = s.Versions.OrderByDescending(v => v.VersionNumber).FirstOrDefault();
            return new SimulationScenarioDto
            {
                Id = s.Id,
                OwnerCompanyId = s.OwnerCompanyId,
                Title = s.Title,
                Category = s.Category,
                Description = s.Description,
                EstimatedDurationMinutes = s.EstimatedDurationMinutes,
                LatestVersionNumber = latestVersion?.VersionNumber ?? 1,
                LatestVersionId = latestVersion?.Id ?? DefaultIncidentScenario.VersionId,
                IsActive = s.IsActive,
                IsCompanyOwned = s.OwnerCompanyId != null
            };
        }).ToList();
    }

    public async Task<JobAssessmentConfigurationDto> AssignScenarioToJobAsync(Guid companyId, Guid jobId, Guid userId, AssignJobSimulationRequest request, CancellationToken ct = default)
    {
        var companyMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.UserId == userId && cm.CompanyId == companyId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (companyMember == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        var job = await _context.JobPostings
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        // Check if scenario version exists; if not yet seeded, check if it's default version and ensure entities exist
        var scenarioVersion = await _context.ScenarioVersions
            .Include(v => v.SimulationScenario)
            .FirstOrDefaultAsync(v => v.Id == request.ScenarioVersionId, ct);

        if (scenarioVersion == null)
        {
            if (request.ScenarioVersionId == DefaultIncidentScenario.VersionId)
            {
                var scenario = await _context.SimulationScenarios
                    .FirstOrDefaultAsync(s => s.Id == DefaultIncidentScenario.ScenarioId, ct);

                if (scenario == null)
                {
                    scenario = new SimulationScenario
                    {
                        Id = DefaultIncidentScenario.ScenarioId,
                        Title = "Software Engineering Incident Response: Payment Gateway Latency Spike & 504 Timeouts",
                        Category = "Software Engineering",
                        Description = "Investigate a critical production incident in HireSphere Core Payment Service.",
                        EstimatedDurationMinutes = 25,
                        IsActive = true,
                        CreatedAtUtc = DateTimeOffset.UtcNow
                    };
                    _context.SimulationScenarios.Add(scenario);
                }

                scenarioVersion = new ScenarioVersion
                {
                    Id = DefaultIncidentScenario.VersionId,
                    SimulationScenarioId = scenario.Id,
                    SimulationScenario = scenario,
                    VersionNumber = 1,
                    DefinitionJson = string.Empty, // Will fallback to DefaultIncidentScenario.CreateScenarioDefinition()
                    RubricJson = string.Empty,
                    CreatedAtUtc = DateTimeOffset.UtcNow
                };
                _context.ScenarioVersions.Add(scenarioVersion);
                await _context.SaveChangesAsync(ct);
            }
            else
            {
                throw new NotFoundException("ScenarioVersion", request.ScenarioVersionId);
            }
        }

        var existingConfig = await _context.JobAssessmentConfigurations
            .FirstOrDefaultAsync(c => c.JobPostingId == jobId, ct);

        if (existingConfig != null)
        {
            existingConfig.ScenarioVersionId = request.ScenarioVersionId;
            existingConfig.IsRequired = request.IsRequired;
            existingConfig.MaxAllowedAttempts = request.MaxAllowedAttempts;
            existingConfig.DeadlineDaysAfterAssignment = request.DeadlineDaysAfterAssignment;
        }
        else
        {
            existingConfig = new JobAssessmentConfiguration
            {
                CompanyId = companyId,
                JobPostingId = jobId,
                ScenarioVersionId = request.ScenarioVersionId,
                IsRequired = request.IsRequired,
                MaxAllowedAttempts = request.MaxAllowedAttempts,
                DeadlineDaysAfterAssignment = request.DeadlineDaysAfterAssignment,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            _context.JobAssessmentConfigurations.Add(existingConfig);
        }

        await _context.SaveChangesAsync(ct);

        // Auto-assign to any existing applications for this job that do not yet have an assignment
        var unassignedApplications = await _context.JobApplications
            .Where(a => a.JobPostingId == jobId && !_context.AssessmentAssignments.Any(aa => aa.JobApplicationId == a.Id))
            .ToListAsync(ct);

        foreach (var app in unassignedApplications)
        {
            var assignment = new AssessmentAssignment
            {
                CompanyId = companyId,
                JobApplicationId = app.Id,
                JobAssessmentConfigurationId = existingConfig.Id,
                CandidateProfileId = app.CandidateProfileId,
                DeadlineUtc = DateTimeOffset.UtcNow.AddDays(existingConfig.DeadlineDaysAfterAssignment),
                Status = AssessmentAssignmentStatus.Assigned,
                AssignedAtUtc = DateTimeOffset.UtcNow
            };
            _context.AssessmentAssignments.Add(assignment);
        }

        if (unassignedApplications.Any())
        {
            await _context.SaveChangesAsync(ct);
        }

        await _auditService.LogAsync(
            action: "JobSimulationAssigned",
            targetResource: "JobAssessmentConfiguration",
            targetResourceId: existingConfig.Id.ToString(),
            companyId: companyId,
            metadata: new { JobId = jobId, ScenarioVersionId = request.ScenarioVersionId, IsRequired = request.IsRequired },
            cancellationToken: ct);

        return new JobAssessmentConfigurationDto
        {
            Id = existingConfig.Id,
            JobPostingId = existingConfig.JobPostingId,
            ScenarioVersionId = existingConfig.ScenarioVersionId,
            ScenarioTitle = scenarioVersion.SimulationScenario.Title,
            ScenarioCategory = scenarioVersion.SimulationScenario.Category,
            VersionNumber = scenarioVersion.VersionNumber,
            IsRequired = existingConfig.IsRequired,
            MaxAllowedAttempts = existingConfig.MaxAllowedAttempts,
            DeadlineDaysAfterAssignment = existingConfig.DeadlineDaysAfterAssignment,
            CreatedAtUtc = existingConfig.CreatedAtUtc
        };
    }

    public async Task<JobAssessmentConfigurationDto?> GetJobAssessmentConfigurationAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default)
    {
        var companyMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.UserId == userId && cm.CompanyId == companyId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (companyMember == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        var config = await _context.JobAssessmentConfigurations
            .Include(c => c.ScenarioVersion)
                .ThenInclude(v => v.SimulationScenario)
            .FirstOrDefaultAsync(c => c.JobPostingId == jobId && c.CompanyId == companyId, ct);

        if (config == null)
            return null;

        return new JobAssessmentConfigurationDto
        {
            Id = config.Id,
            JobPostingId = config.JobPostingId,
            ScenarioVersionId = config.ScenarioVersionId,
            ScenarioTitle = config.ScenarioVersion.SimulationScenario.Title,
            ScenarioCategory = config.ScenarioVersion.SimulationScenario.Category,
            VersionNumber = config.ScenarioVersion.VersionNumber,
            IsRequired = config.IsRequired,
            MaxAllowedAttempts = config.MaxAllowedAttempts,
            DeadlineDaysAfterAssignment = config.DeadlineDaysAfterAssignment,
            CreatedAtUtc = config.CreatedAtUtc
        };
    }

    public async Task<bool> RemoveJobAssessmentConfigurationAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default)
    {
        var companyMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.UserId == userId && cm.CompanyId == companyId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (companyMember == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        var config = await _context.JobAssessmentConfigurations
            .FirstOrDefaultAsync(c => c.JobPostingId == jobId && c.CompanyId == companyId, ct);

        if (config == null)
            return false;

        _context.JobAssessmentConfigurations.Remove(config);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobSimulationRemoved",
            targetResource: "JobAssessmentConfiguration",
            targetResourceId: config.Id.ToString(),
            companyId: companyId,
            metadata: new { JobId = jobId },
            cancellationToken: ct);

        return true;
    }

    public async Task<IReadOnlyList<AssessmentAssignmentDto>> GetCandidateAssignmentsAsync(Guid userId, CancellationToken ct = default)
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

        return assignments.Select(a =>
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
        }).ToList();
    }

    public async Task<AssessmentAssignmentDto?> AutoAssignToApplicationAsync(Guid applicationId, CancellationToken ct = default)
    {
        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
                .ThenInclude(j => j.Company)
            .FirstOrDefaultAsync(a => a.Id == applicationId, ct);

        if (application == null)
            return null;

        var config = await _context.JobAssessmentConfigurations
            .Include(c => c.ScenarioVersion)
                .ThenInclude(v => v.SimulationScenario)
            .FirstOrDefaultAsync(c => c.JobPostingId == application.JobPostingId, ct);

        if (config == null)
            return null;

        var existingAssignment = await _context.AssessmentAssignments
            .FirstOrDefaultAsync(a => a.JobApplicationId == applicationId, ct);

        if (existingAssignment != null)
            return null;

        var assignment = new AssessmentAssignment
        {
            CompanyId = application.JobPosting.CompanyId,
            JobApplicationId = application.Id,
            JobAssessmentConfigurationId = config.Id,
            CandidateProfileId = application.CandidateProfileId,
            DeadlineUtc = DateTimeOffset.UtcNow.AddDays(config.DeadlineDaysAfterAssignment),
            Status = AssessmentAssignmentStatus.Assigned,
            AssignedAtUtc = DateTimeOffset.UtcNow
        };

        _context.AssessmentAssignments.Add(assignment);
        await _context.SaveChangesAsync(ct);

        return new AssessmentAssignmentDto
        {
            AssignmentId = assignment.Id,
            JobApplicationId = application.Id,
            JobTitle = application.JobPosting.Title,
            CompanyName = application.JobPosting.Company.Name,
            ScenarioId = config.ScenarioVersion.SimulationScenario.Id,
            ScenarioTitle = config.ScenarioVersion.SimulationScenario.Title,
            ScenarioCategory = config.ScenarioVersion.SimulationScenario.Category,
            EstimatedDurationMinutes = config.ScenarioVersion.SimulationScenario.EstimatedDurationMinutes,
            IsRequired = config.IsRequired,
            MaxAllowedAttempts = config.MaxAllowedAttempts,
            DeadlineUtc = assignment.DeadlineUtc,
            Status = assignment.Status.ToString()
        };
    }
}
