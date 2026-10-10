using System.Text.Json;
using FluentAssertions;
using Xunit;
using HireSphere.Application.Services;
using HireSphere.Application.WorkSim;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class WorkSimScoringServiceTests
{
    private (HireSphere.Infrastructure.Persistence.HireSphereDbContext context, User candidateUser, CandidateProfile candidateProfile, Company company, User companyUser, SimulationSession session) CreateCompletedSessionFixture()
    {
        var context = TestDbContextFactory.CreateInMemoryDbContext();

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme SaaS",
            Slug = "acme-saas",
            Industry = "Technology",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        context.Companies.Add(company);

        var companyUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "recruiter@acme.com",
            NormalizedEmail = "RECRUITER@ACME.COM",
            FirstName = "Rob",
            LastName = "Recruiter",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(companyUser);

        var companyMember = new CompanyMember
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            UserId = companyUser.Id,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active
        };
        context.CompanyMembers.Add(companyMember);

        var candidateUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "candidate@hiresphere.dev",
            NormalizedEmail = "CANDIDATE@HIRESPHERE.DEV",
            FirstName = "Charlie",
            LastName = "Coder",
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
            Title = "Senior Infrastructure Engineer",
            Slug = "senior-infra-engineer",
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
            DefinitionJson = string.Empty,
            RubricJson = string.Empty
        };
        context.ScenarioVersions.Add(scenarioVersion);

        var jobConfig = new JobAssessmentConfiguration
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobPostingId = job.Id,
            ScenarioVersionId = scenarioVersion.Id,
            IsRequired = true,
            MaxAllowedAttempts = 1,
            DeadlineDaysAfterAssignment = 7
        };
        context.JobAssessmentConfigurations.Add(jobConfig);

        var application = new JobApplication
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            JobPosting = job,
            CandidateProfileId = candidateProfile.Id,
            CandidateProfile = candidateProfile,
            CurrentStage = ApplicationStage.Submitted
        };
        context.JobApplications.Add(application);

        var assignment = new AssessmentAssignment
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobApplicationId = application.Id,
            JobApplication = application,
            JobAssessmentConfigurationId = jobConfig.Id,
            CandidateProfileId = candidateProfile.Id,
            DeadlineUtc = DateTimeOffset.UtcNow.AddDays(7),
            Status = AssessmentAssignmentStatus.Completed,
            AssignedAtUtc = DateTimeOffset.UtcNow,
            CompletedAtUtc = DateTimeOffset.UtcNow
        };
        context.AssessmentAssignments.Add(assignment);

        var session = new SimulationSession
        {
            Id = Guid.NewGuid(),
            AssessmentAssignmentId = assignment.Id,
            AssessmentAssignment = assignment,
            CandidateProfileId = candidateProfile.Id,
            CandidateProfile = candidateProfile,
            ScenarioVersionId = scenarioVersion.Id,
            ScenarioVersion = scenarioVersion,
            CurrentStateVectorJson = "{\"CurrentTaskKey\":\"task_4_verify\",\"StateVariables\":{\"service_status\":\"Healthy (Incident Resolved)\",\"investigation_step\":\"Completed\"},\"IsCompleted\":true}",
            Status = SimulationSessionStatus.Submitted,
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-20),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(15),
            SubmittedAtUtc = DateTimeOffset.UtcNow,
            TotalActionsTaken = 4
        };
        context.SimulationSessions.Add(session);

        context.SaveChanges();

        return (context, candidateUser, candidateProfile, company, companyUser, session);
    }

    [Fact]
    public async Task EvaluateSessionAsync_OptimalCandidatePath_ScoresFullPointsAcrossAllCriteria()
    {
        var (context, candidateUser, _, _, _, session) = CreateCompletedSessionFixture();

        // Seed optimal actions taken by candidate
        context.SimulationActionLogs.AddRange(
            new SimulationActionLog
            {
                SimulationSessionId = session.Id,
                SequenceNumber = 1,
                ActionType = "INSPECT",
                ActionPayloadJson = JsonSerializer.Serialize(new { ActionKey = "action_triage_inspect_logs_and_diff" }),
                CandidateRationale = "Inspected pod logs and commit diff to identify failure mechanisms before modifying infra.",
                ElapsedMillisecondsFromStart = 60000,
                TimestampUtc = DateTimeOffset.UtcNow.AddMinutes(-18)
            },
            new SimulationActionLog
            {
                SimulationSessionId = session.Id,
                SequenceNumber = 2,
                ActionType = "PRIORITIZE",
                ActionPayloadJson = JsonSerializer.Serialize(new { ActionKey = "action_diagnose_connection_pool_starvation" }),
                CandidateRationale = "Identified Npgsql connection pool exhaustion caused by reduced max pool size and retry loop in PR #482.",
                ElapsedMillisecondsFromStart = 180000,
                TimestampUtc = DateTimeOffset.UtcNow.AddMinutes(-15)
            },
            new SimulationActionLog
            {
                SimulationSessionId = session.Id,
                SequenceNumber = 3,
                ActionType = "REMEDIATE",
                ActionPayloadJson = JsonSerializer.Serialize(new { ActionKey = "action_remediate_rollback_release" }),
                CandidateRationale = "Rolling back release v2.14.0 to v2.13.9 to restore pool capacity and eliminate blocking transactions immediately.",
                ElapsedMillisecondsFromStart = 300000,
                TimestampUtc = DateTimeOffset.UtcNow.AddMinutes(-10)
            },
            new SimulationActionLog
            {
                SimulationSessionId = session.Id,
                SequenceNumber = 4,
                ActionType = "VERIFY",
                ActionPayloadJson = JsonSerializer.Serialize(new { ActionKey = "action_verify_telemetry_and_schedule_postmortem" }),
                CandidateRationale = "Confirmed latency and error rates stabilized below SLO. Scheduled post-mortem for database pool resilience.",
                ElapsedMillisecondsFromStart = 450000,
                TimestampUtc = DateTimeOffset.UtcNow.AddMinutes(-5)
            }
        );
        context.SaveChanges();

        var scoringService = new WorkSimScoringService(context);

        var result = await scoringService.EvaluateSessionAsync(session.Id);

        result.Should().NotBeNull();
        result.TotalScore.Should().Be(100.0m);
        result.CriterionScores.Should().HaveCount(4);

        var triageScore = result.CriterionScores.First(c => c.CriterionName.Contains("Triage"));
        triageScore.Score.Should().Be(25.0m);
        triageScore.MaxScore.Should().Be(25.0m);

        var diagnosisScore = result.CriterionScores.First(c => c.CriterionName.Contains("Diagnosis"));
        diagnosisScore.Score.Should().Be(25.0m);
        diagnosisScore.MaxScore.Should().Be(25.0m);

        var remediationScore = result.CriterionScores.First(c => c.CriterionName.Contains("Remediation"));
        remediationScore.Score.Should().Be(30.0m);
        remediationScore.MaxScore.Should().Be(30.0m);

        var verificationScore = result.CriterionScores.First(c => c.CriterionName.Contains("Verification"));
        verificationScore.Score.Should().Be(20.0m);
        verificationScore.MaxScore.Should().Be(20.0m);

        result.CandidateFeedback.Should().Contain("Triage Prioritization");
        result.CandidateFeedback.Should().Contain("Technical Diagnosis");
    }

    [Fact]
    public async Task EvaluateSessionAsync_SubOptimalCandidatePath_CalculatesPenaltiesCorrectly()
    {
        var (context, _, _, _, _, session) = CreateCompletedSessionFixture();

        // Seed sub-optimal candidate path (blind restart, wrong diagnosis, disabling checkout)
        context.SimulationActionLogs.AddRange(
            new SimulationActionLog
            {
                SimulationSessionId = session.Id,
                SequenceNumber = 1,
                ActionType = "EXECUTE",
                ActionPayloadJson = JsonSerializer.Serialize(new { ActionKey = "action_triage_blind_restart" }),
                CandidateRationale = null,
                ElapsedMillisecondsFromStart = 30000,
                TimestampUtc = DateTimeOffset.UtcNow.AddMinutes(-18)
            },
            new SimulationActionLog
            {
                SimulationSessionId = session.Id,
                SequenceNumber = 2,
                ActionType = "PRIORITIZE",
                ActionPayloadJson = JsonSerializer.Serialize(new { ActionKey = "action_diagnose_cpu_exhaustion" }),
                CandidateRationale = null,
                ElapsedMillisecondsFromStart = 60000,
                TimestampUtc = DateTimeOffset.UtcNow.AddMinutes(-15)
            },
            new SimulationActionLog
            {
                SimulationSessionId = session.Id,
                SequenceNumber = 3,
                ActionType = "REMEDIATE",
                ActionPayloadJson = JsonSerializer.Serialize(new { ActionKey = "action_remediate_disable_checkout" }),
                CandidateRationale = null,
                ElapsedMillisecondsFromStart = 120000,
                TimestampUtc = DateTimeOffset.UtcNow.AddMinutes(-10)
            },
            new SimulationActionLog
            {
                SimulationSessionId = session.Id,
                SequenceNumber = 4,
                ActionType = "VERIFY",
                ActionPayloadJson = JsonSerializer.Serialize(new { ActionKey = "action_verify_abrupt_close" }),
                CandidateRationale = null,
                ElapsedMillisecondsFromStart = 150000,
                TimestampUtc = DateTimeOffset.UtcNow.AddMinutes(-5)
            }
        );
        context.SaveChanges();

        var scoringService = new WorkSimScoringService(context);

        var result = await scoringService.EvaluateSessionAsync(session.Id);

        result.Should().NotBeNull();
        result.TotalScore.Should().Be(0.0m); // Clamped at 0 (all penalties applied)
    }

    [Fact]
    public async Task GetSessionResultAsync_EnforcesTenantAndCandidateBoundaries()
    {
        var (context, candidateUser, _, company, companyUser, session) = CreateCompletedSessionFixture();

        var scoringService = new WorkSimScoringService(context);
        await scoringService.EvaluateSessionAsync(session.Id);

        // 1. Candidate owner can access their results
        var candidateResult = await scoringService.GetSessionResultAsync(session.Id, candidateUser.Id);
        candidateResult.Should().NotBeNull();

        // 2. Company recruiter can access the applicant's result
        var companyResult = await scoringService.GetSessionResultAsync(session.Id, companyUser.Id);
        companyResult.Should().NotBeNull();

        // 3. Unrelated user is denied access
        var strangerUserId = Guid.NewGuid();
        var actStranger = async () => await scoringService.GetSessionResultAsync(session.Id, strangerUserId);
        await actStranger.Should().ThrowAsync<ForbiddenAccessException>();
    }
}
