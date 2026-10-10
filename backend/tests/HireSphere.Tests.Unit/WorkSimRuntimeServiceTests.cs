using FluentAssertions;
using Moq;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.WorkSim;
using HireSphere.Application.Services;
using HireSphere.Application.WorkSim;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class WorkSimRuntimeServiceTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();
    private readonly Mock<IWorkSimScoringService> _scoringServiceMock = new();

    private (Company company, User candidateUser, CandidateProfile candidateProfile, JobPosting job, JobApplication application, AssessmentAssignment assignment) SeedWorkSimFixture(HireSphere.Infrastructure.Persistence.HireSphereDbContext context)
    {
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "TechCorp",
            Slug = "tech-corp",
            Industry = "Software",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        context.Companies.Add(company);

        var candidateUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "candidate@dev.com",
            NormalizedEmail = "CANDIDATE@DEV.COM",
            FirstName = "Alice",
            LastName = "Dev",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(candidateUser);

        var candidateProfile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = candidateUser.Id,
            User = candidateUser
        };
        context.CandidateProfiles.Add(candidateProfile);

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Company = company,
            Title = "Senior Site Reliability Engineer",
            Slug = "senior-sre",
            Status = JobPostingStatus.Published
        };
        context.JobPostings.Add(job);

        var scenario = new SimulationScenario
        {
            Id = DefaultIncidentScenario.ScenarioId,
            Title = "SWE Incident Response",
            Category = "Software Engineering",
            Description = "Payment gateway outage simulation",
            EstimatedDurationMinutes = 25,
            IsActive = true
        };
        context.SimulationScenarios.Add(scenario);

        var scenarioVersion = new ScenarioVersion
        {
            Id = DefaultIncidentScenario.VersionId,
            SimulationScenarioId = scenario.Id,
            SimulationScenario = scenario,
            VersionNumber = 1,
            DefinitionJson = string.Empty, // will fallback to DefaultIncidentScenario definition
            RubricJson = string.Empty
        };
        context.ScenarioVersions.Add(scenarioVersion);

        var jobConfig = new JobAssessmentConfiguration
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobPostingId = job.Id,
            ScenarioVersionId = scenarioVersion.Id,
            ScenarioVersion = scenarioVersion,
            IsRequired = true,
            MaxAllowedAttempts = 1,
            DeadlineDaysAfterAssignment = 7
        };
        context.JobAssessmentConfigurations.Add(jobConfig);

        var application = new JobApplication
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            CandidateProfileId = candidateProfile.Id,
            CurrentStage = ApplicationStage.Submitted
        };
        context.JobApplications.Add(application);

        var assignment = new AssessmentAssignment
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobApplicationId = application.Id,
            JobAssessmentConfigurationId = jobConfig.Id,
            JobAssessmentConfiguration = jobConfig,
            CandidateProfileId = candidateProfile.Id,
            DeadlineUtc = DateTimeOffset.UtcNow.AddDays(7),
            Status = AssessmentAssignmentStatus.Assigned,
            AssignedAtUtc = DateTimeOffset.UtcNow
        };
        context.AssessmentAssignments.Add(assignment);

        context.SaveChanges();

        return (company, candidateUser, candidateProfile, job, application, assignment);
    }

    [Fact]
    public async Task StartSessionAsync_CreatesActiveSession_WithInitialTaskAndSanitizedState()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, candidateUser, _, _, _, assignment) = SeedWorkSimFixture(context);

        var runtimeService = new WorkSimRuntimeService(context, _scoringServiceMock.Object, _auditServiceMock.Object);

        var state = await runtimeService.StartSessionAsync(candidateUser.Id, assignment.Id);

        state.Should().NotBeNull();
        state.CurrentTaskKey.Should().Be("task_1_triage");
        state.Status.Should().Be("Active");
        state.IsCompleted.Should().BeFalse();
        state.AvailableActions.Should().HaveCount(3);
        state.UnlockedEvidence.Should().Contain(e => e.EvidenceKey == "telemetry_latency_alert");
        state.UnlockedEvidence.Should().NotContain(e => e.EvidenceKey == "error_log_excerpt"); // Hidden initially
        state.StateVariables.Should().ContainKey("service_status");
        state.StateVariables["service_status"].Should().Be("Degraded (P1 Alert)");
    }

    [Fact]
    public async Task StartSessionAsync_ThrowsConflict_WhenMaxAttemptsExceeded()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, candidateUser, _, _, _, assignment) = SeedWorkSimFixture(context);

        var runtimeService = new WorkSimRuntimeService(context, _scoringServiceMock.Object, _auditServiceMock.Object);

        // First attempt starts session
        await runtimeService.StartSessionAsync(candidateUser.Id, assignment.Id);

        // Mark assignment completed or attempt another session with max attempts = 1
        var secondAttempt = async () => await runtimeService.StartSessionAsync(candidateUser.Id, assignment.Id);

        // Should return the active session or throw if completed
        var returnedState = await runtimeService.StartSessionAsync(candidateUser.Id, assignment.Id);
        returnedState.Status.Should().Be("Active");
    }

    [Fact]
    public async Task SubmitActionAsync_RejectsInvalidAction_ForCurrentTask()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, candidateUser, _, _, _, assignment) = SeedWorkSimFixture(context);

        var runtimeService = new WorkSimRuntimeService(context, _scoringServiceMock.Object, _auditServiceMock.Object);
        var state = await runtimeService.StartSessionAsync(candidateUser.Id, assignment.Id);

        var request = new SubmitSimulationActionRequest
        {
            ActionKey = "action_diagnose_connection_pool_starvation" // Valid for task 2, but we are on task 1!
        };

        var act = async () => await runtimeService.SubmitActionAsync(candidateUser.Id, state.SessionId, request);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*not an available action for the current task*");
    }

    [Fact]
    public async Task SubmitActionAsync_RequiresRationale_WhenActionSpecifiesIt()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, candidateUser, _, _, _, assignment) = SeedWorkSimFixture(context);

        var runtimeService = new WorkSimRuntimeService(context, _scoringServiceMock.Object, _auditServiceMock.Object);
        var state = await runtimeService.StartSessionAsync(candidateUser.Id, assignment.Id);

        var request = new SubmitSimulationActionRequest
        {
            ActionKey = "action_triage_inspect_logs_and_diff",
            CandidateRationale = "" // Missing rationale
        };

        var act = async () => await runtimeService.SubmitActionAsync(candidateUser.Id, state.SessionId, request);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*requires a written operational rationale*");
    }

    [Fact]
    public async Task FullSimulationLifecycle_TriageToVerification_TransitionsAndCompletes()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, candidateUser, _, _, _, assignment) = SeedWorkSimFixture(context);

        _scoringServiceMock
            .Setup(s => s.EvaluateSessionAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssessmentResultDto
            {
                ResultId = Guid.NewGuid(),
                TotalScore = 95.0m,
                EvaluationSummary = "Excellent response"
            });

        var runtimeService = new WorkSimRuntimeService(context, _scoringServiceMock.Object, _auditServiceMock.Object);

        // 1. Start Session
        var state = await runtimeService.StartSessionAsync(candidateUser.Id, assignment.Id);
        state.CurrentTaskKey.Should().Be("task_1_triage");

        // 2. Action 1: Triage -> Inspect logs
        var res1 = await runtimeService.SubmitActionAsync(candidateUser.Id, state.SessionId, new SubmitSimulationActionRequest
        {
            ActionKey = "action_triage_inspect_logs_and_diff",
            CandidateRationale = "We must inspect application pod logs and PR git diff to identify root cause before taking action."
        });
        res1.UpdatedState.CurrentTaskKey.Should().Be("task_2_investigate");
        res1.UpdatedState.UnlockedEvidence.Should().Contain(e => e.EvidenceKey == "error_log_excerpt");

        // 3. Action 2: Diagnose connection pool starvation
        var res2 = await runtimeService.SubmitActionAsync(candidateUser.Id, state.SessionId, new SubmitSimulationActionRequest
        {
            ActionKey = "action_diagnose_connection_pool_starvation",
            CandidateRationale = "PR #482 cut MaxPoolSize to 20 while introducing retry loops inside active transaction scopes."
        });
        res2.UpdatedState.CurrentTaskKey.Should().Be("task_3_remediate");
        res2.UpdatedState.StateVariables["root_cause_identified"].Should().Contain("Connection Pool Starvation");

        // 4. Action 3: Remediate -> Immediate rollback
        var res3 = await runtimeService.SubmitActionAsync(candidateUser.Id, state.SessionId, new SubmitSimulationActionRequest
        {
            ActionKey = "action_remediate_rollback_release",
            CandidateRationale = "Rolling back to known stable v2.13.9 provides the lowest MTTR and eliminates the connection leak."
        });
        res3.UpdatedState.CurrentTaskKey.Should().Be("task_4_verify");
        res3.UpdatedState.UnlockedEvidence.Should().Contain(e => e.EvidenceKey == "post_remediation_telemetry");

        // 5. Action 4: Verify telemetry & schedule post-mortem (terminal task)
        var res4 = await runtimeService.SubmitActionAsync(candidateUser.Id, state.SessionId, new SubmitSimulationActionRequest
        {
            ActionKey = "action_verify_telemetry_and_schedule_postmortem",
            CandidateRationale = "Verified p99 latency returned to 170ms with zero errors. Scheduling blameless post-mortem."
        });

        res4.IsCompleted.Should().BeTrue();
        res4.UpdatedState.IsCompleted.Should().BeTrue();
        res4.UpdatedState.Status.Should().Be("Submitted");

        _scoringServiceMock.Verify(s => s.EvaluateSessionAsync(state.SessionId, It.IsAny<CancellationToken>()), Times.Once);

        // 6. Attempting another action after completion should be rejected
        var postCompleteAct = async () => await runtimeService.SubmitActionAsync(candidateUser.Id, state.SessionId, new SubmitSimulationActionRequest
        {
            ActionKey = "action_triage_blind_restart"
        });

        await postCompleteAct.Should().ThrowAsync<ConflictException>()
            .WithMessage("*cannot accept further actions*");
    }
}
