using System.Net;
using FluentAssertions;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.DTOs.WorkSim;
using HireSphere.Application.Services;
using HireSphere.Application.WorkSim;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Tests.Integration.Infrastructure;
using Xunit;

namespace HireSphere.Tests.Integration.Journeys;

public class WorkSimEndToEndIntegrationTests : IClassFixture<HireSphereApiFactory>
{
    private readonly HireSphereApiFactory _factory;
    private readonly HttpClient _client;

    public WorkSimEndToEndIntegrationTests(HireSphereApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task WorkSim_CompleteLifecycle_FromAssignmentToScoringAndFeedback()
    {
        // 1. Setup Company & Recruiter
        var ownerEmail = $"sim_owner_{Guid.NewGuid():N}@worksim.local";
        var regComp = new RegisterCompanyRequest(
            CompanyName: $"WorkSim Corp {Guid.NewGuid():N}"[..22],
            Industry: "Technology",
            ContactEmail: $"contact_{Guid.NewGuid():N}@worksim.local",
            BusinessRegistrationNumber: "SIM-12345",
            WebsiteUrl: "https://worksim.example.com",
            Description: "Simulation testing enterprise",
            OwnerFirstName: "Sam",
            OwnerLastName: "Director",
            OwnerEmail: ownerEmail,
            OwnerPassword: "Password123!");

        var compResp = await _client.PostAsJsonAsync("/api/auth/register-company", regComp);
        compResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var compAuth = await compResp.ReadJsonAsync<AuthResponse>();
        var companyId = compAuth!.User.Companies.First().CompanyId;
        var recruiterClient = _factory.CreateClientWithToken(compAuth.AccessToken);

        // Approve company directly in DB
        await _factory.ExecuteDbContextAsync(async db =>
        {
            var comp = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                db.Companies, c => c.Id == companyId);
            if (comp != null)
            {
                comp.ApprovalStatus = CompanyApprovalStatus.Approved;
                await db.SaveChangesAsync();
            }
        });

        // 2. Create Job Posting
        var category = await _factory.EnsureDefaultCategoryAsync("DevOps & SRE");
        var createJobReq = new CreateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "Incident Response Engineer",
            Summary: "Critical production incident management",
            Description: "Handle live outages and maintain platform resilience",
            Responsibilities: "Resolve critical tier-1 incidents",
            EmploymentType: EmploymentType.FullTime,
            WorkplaceType: WorkplaceType.Remote,
            Location: "Remote",
            SalaryMin: 120000,
            SalaryMax: 160000,
            SalaryCurrency: "USD",
            ExpiresAtUtc: DateTimeOffset.UtcNow.AddDays(30),
            Requirements: new List<CreateJobRequirementDto>
            {
                new("Incident triage experience", RequirementCategory.Skill, RequirementType.Mandatory, 1)
            });

        var createJobResp = await recruiterClient.PostAsJsonAsync($"/api/companies/{companyId}/jobs", createJobReq);
        createJobResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var job = await createJobResp.ReadJsonAsync<JobPostingDetailDto>();

        // Publish job
        var publishResp = await recruiterClient.PostAsync($"/api/companies/{companyId}/jobs/{job!.Id}/publish", null);
        publishResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 3. Recruiter assigns DefaultIncidentScenario to the Job Posting
        var assignSimReq = new AssignJobSimulationRequest
        {
            ScenarioVersionId = DefaultIncidentScenario.VersionId,
            IsRequired = true,
            MaxAllowedAttempts = 1,
            DeadlineDaysAfterAssignment = 7
        };

        var assignSimResp = await recruiterClient.PostAsJsonAsync(
            $"/api/companies/{companyId}/jobs/{job.Id}/assessments", assignSimReq);
        assignSimResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 4. Candidate registers and applies to the job
        var candEmail = $"incident_responder_{Guid.NewGuid():N}@candidate.local";
        var candReg = new RegisterCandidateRequest(candEmail, "Password123!", "Riley", "Incident", null, null, null);
        var candRegResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", candReg);
        candRegResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var candAuth = await candRegResp.ReadJsonAsync<AuthResponse>();
        var candidateClient = _factory.CreateClientWithToken(candAuth!.AccessToken);

        var applyResp = await candidateClient.PostAsJsonAsync(
            $"/api/jobs/{job.Id}/apply", new SubmitApplicationRequest(null, "Experienced in production triage."));
        applyResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var application = await applyResp.ReadJsonAsync<CandidateApplicationDetailDto>();
        application.Should().NotBeNull();

        // 5. Candidate retrieves assigned simulations
        var simListResp = await candidateClient.GetAsync("/api/candidate/simulations");
        simListResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var assignments = await simListResp.ReadJsonAsync<List<AssessmentAssignmentDto>>();
        assignments.Should().NotBeNull();
        assignments!.Should().ContainSingle();
        var assignment = assignments.First();
        assignment.ScenarioTitle.Should().Contain("Incident");

        // 6. Candidate starts the simulation session
        var startResp = await candidateClient.PostAsync(
            $"/api/candidate/simulations/assignments/{assignment.AssignmentId}/start", null);
        startResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var sessionState = await startResp.ReadJsonAsync<CandidateSimulationRuntimeStateDto>();
        sessionState.Should().NotBeNull();
        sessionState!.SessionId.Should().NotBeEmpty();
        sessionState.AvailableActions.Should().NotBeEmpty();

        // 7. Verify action with required rationale fails if rationale is omitted
        var actionRequiringRationale = sessionState.AvailableActions.FirstOrDefault(a => a.RequiresRationale);
        if (actionRequiringRationale != null)
        {
            var invalidActionReq = new SubmitSimulationActionRequest
            {
                ActionKey = actionRequiringRationale.ActionKey,
                CandidateRationale = "" // Empty rationale
            };

            var failResp = await candidateClient.PostAsJsonAsync(
                $"/api/candidate/simulations/sessions/{sessionState.SessionId}/actions", invalidActionReq);
            failResp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        // 8. Submit valid actions through the simulation progression
        var currentSession = sessionState;
        int actionCount = 0;
        while (!currentSession.IsCompleted && actionCount < 10)
        {
            var nextAction = currentSession.AvailableActions.FirstOrDefault();
            if (nextAction == null) break;

            var actionReq = new SubmitSimulationActionRequest
            {
                ActionKey = nextAction.ActionKey,
                CandidateRationale = "Identified spike in upstream payment service latency, isolating traffic."
            };

            var actionResp = await candidateClient.PostAsJsonAsync(
                $"/api/candidate/simulations/sessions/{sessionState.SessionId}/actions", actionReq);
            actionResp.StatusCode.Should().Be(HttpStatusCode.OK);
            var actionResult = await actionResp.ReadJsonAsync<SubmitSimulationActionResult>();
            actionResult.Should().NotBeNull();

            // Refresh session state
            var stateResp = await candidateClient.GetAsync(
                $"/api/candidate/simulations/sessions/{sessionState.SessionId}");
            stateResp.StatusCode.Should().Be(HttpStatusCode.OK);
            currentSession = await stateResp.ReadJsonAsync<CandidateSimulationRuntimeStateDto>();
            currentSession.Should().NotBeNull();
            actionCount++;
        }

        // 9. Candidate inspects assessment results
        var candResultResp = await candidateClient.GetAsync(
            $"/api/candidate/simulations/sessions/{sessionState.SessionId}/results");
        candResultResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var candResult = await candResultResp.ReadJsonAsync<AssessmentResultDto>();
        candResult.Should().NotBeNull();
        candResult!.TotalScore.Should().BeGreaterThanOrEqualTo(0);
        candResult.CandidateFeedback.Should().NotBeNullOrWhiteSpace();

        // 10. Recruiter inspects assessment results for this application
        var recruiterResultResp = await recruiterClient.GetAsync(
            $"/api/companies/{companyId}/applications/{application.Id}/assessment-result");
        recruiterResultResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var recruiterResult = await recruiterResultResp.ReadJsonAsync<AssessmentResultDto>();
        recruiterResult.Should().NotBeNull();
        recruiterResult!.TotalScore.Should().Be(candResult.TotalScore);
        recruiterResult.CriterionScores.Should().NotBeEmpty();
    }
}
