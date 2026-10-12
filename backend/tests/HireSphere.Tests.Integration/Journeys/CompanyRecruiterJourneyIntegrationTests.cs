using System.Net;
using FluentAssertions;
using HireSphere.Application.DTOs.Analytics;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Application.DTOs.Job;
using HireSphere.Domain.Enums;
using HireSphere.Tests.Integration.Infrastructure;
using Xunit;

namespace HireSphere.Tests.Integration.Journeys;

public class CompanyRecruiterJourneyIntegrationTests : IClassFixture<HireSphereApiFactory>
{
    private readonly HireSphereApiFactory _factory;
    private readonly HttpClient _client;

    public CompanyRecruiterJourneyIntegrationTests(HireSphereApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CompanyJourney_FromSetupToReviewingApplicants_WorksEndToEnd()
    {
        // 1. Setup platform super-admin
        var (_, adminToken) = await _factory.SeedSuperAdminAsync();
        var adminClient = _factory.CreateClientWithToken(adminToken);

        // 2. Register employer & company
        var ownerEmail = $"owner_{Guid.NewGuid():N}@enterprise.local";
        var regCompanyReq = new RegisterCompanyRequest(
            CompanyName: $"Enterprise Solutions {Guid.NewGuid():N}"[..25],
            Industry: "Cloud Computing",
            ContactEmail: $"contact_{Guid.NewGuid():N}@enterprise.local",
            BusinessRegistrationNumber: "CORP-987654",
            WebsiteUrl: "https://enterprise.example.com",
            Description: "Enterprise grade infrastructure provider",
            OwnerFirstName: "Mark",
            OwnerLastName: "Recruiter",
            OwnerEmail: ownerEmail,
            OwnerPassword: "EmployerPassword123!");

        var regResp = await _client.PostAsJsonAsync("/api/auth/register-company", regCompanyReq);
        regResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var authResponse = await regResp.ReadJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        var companyId = authResponse!.User.Companies.First().CompanyId;
        var recruiterClient = _factory.CreateClientWithToken(authResponse.AccessToken);

        // 3. SuperAdmin approves company
        var approveResp = await adminClient.PostAsync($"/api/admin/companies/{companyId}/approve", null);
        approveResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 4. Ensure Category exists
        var category = await _factory.EnsureDefaultCategoryAsync("Site Reliability");

        // 5. Recruiter creates job posting (Draft)
        var createJobReq = new CreateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "Lead Site Reliability Engineer",
            Summary: "Lead our 24/7 reliability and incident management engineering",
            Description: "We are seeking a seasoned SRE to lead reliability engineering.",
            Responsibilities: "Design automated alerting, manage kubernetes infrastructure",
            EmploymentType: EmploymentType.FullTime,
            WorkplaceType: WorkplaceType.Hybrid,
            Location: "Austin, TX",
            SalaryMin: 140000,
            SalaryMax: 180000,
            SalaryCurrency: "USD",
            ExpiresAtUtc: DateTimeOffset.UtcNow.AddDays(30),
            Requirements: new List<CreateJobRequirementDto>
            {
                new("5+ years of Kubernetes", RequirementCategory.Skill, RequirementType.Mandatory, 1),
                new("Experience with Incident Management", RequirementCategory.Skill, RequirementType.Mandatory, 2)
            });

        var createJobResp = await recruiterClient.PostAsJsonAsync($"/api/companies/{companyId}/jobs", createJobReq);
        createJobResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdJob = await createJobResp.ReadJsonAsync<JobPostingDetailDto>();
        createdJob.Should().NotBeNull();
        createdJob!.Status.Should().Be(JobPostingStatus.Draft);

        // 6. Recruiter publishes job
        var publishResp = await recruiterClient.PostAsync($"/api/companies/{companyId}/jobs/{createdJob.Id}/publish", null);
        publishResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var publishedJob = await publishResp.ReadJsonAsync<JobPostingDetailDto>();
        publishedJob.Should().NotBeNull();
        publishedJob!.Status.Should().Be(JobPostingStatus.Published);

        // 7. Candidate applies to the published job
        var candEmail = $"sre_applicant_{Guid.NewGuid():N}@applicant.local";
        var candReg = new RegisterCandidateRequest(candEmail, "Pass123456!", "Alex", "Mercer", null, null, null);
        var candRegResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", candReg);
        candRegResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var candAuth = await candRegResp.ReadJsonAsync<AuthResponse>();
        var candClient = _factory.CreateClientWithToken(candAuth!.AccessToken);

        var applyResp = await candClient.PostAsJsonAsync($"/api/jobs/{createdJob.Id}/apply", new SubmitApplicationRequest(null, "Experienced SRE candidate."));
        applyResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var application = await applyResp.ReadJsonAsync<CandidateApplicationDetailDto>();
        application.Should().NotBeNull();

        // 8. Recruiter sees application in company applicant list
        var appsResp = await recruiterClient.GetAsync($"/api/companies/{companyId}/applications");
        appsResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var appList = await appsResp.ReadJsonAsync<PagedResult<CompanyApplicationSummaryDto>>();
        appList.Should().NotBeNull();
        appList!.Items.Should().Contain(a => a.Id == application!.Id);

        // 9. Recruiter inspects applicant detail
        var appDetailResp = await recruiterClient.GetAsync($"/api/companies/{companyId}/applications/{application!.Id}");
        appDetailResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var appDetail = await appDetailResp.ReadJsonAsync<CompanyApplicationDetailDto>();
        appDetail.Should().NotBeNull();
        appDetail!.CandidateName.Should().Be("Alex Mercer");

        // 10. Recruiter advances recruitment stage:
        // Test that invalid transition (e.g., jumping directly from Submitted to Offered) is rejected with 409 Conflict
        var invalidStageReq = new UpdateApplicationStageRequest(ApplicationStage.Offered, "Premature offer");
        var invalidStageResp = await recruiterClient.PostAsJsonAsync($"/api/companies/{companyId}/applications/{application.Id}/stage", invalidStageReq);
        invalidStageResp.StatusCode.Should().Be(HttpStatusCode.Conflict);

        // Test valid transition: Submitted -> UnderReview
        var stageReq = new UpdateApplicationStageRequest(ApplicationStage.UnderReview, "Advancing application for initial review.");
        var stageResp = await recruiterClient.PostAsJsonAsync($"/api/companies/{companyId}/applications/{application.Id}/stage", stageReq);
        stageResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedStage = await stageResp.ReadJsonAsync<CompanyApplicationDetailDto>();
        updatedStage.Should().NotBeNull();
        updatedStage!.CurrentStage.Should().Be(ApplicationStage.UnderReview);

        // 11. Recruiter adds private note
        var noteReq = new CreateCandidateNoteRequest("Candidate demonstrated excellent debugging during initial screening.");
        var noteResp = await recruiterClient.PostAsJsonAsync($"/api/companies/{companyId}/applications/{application.Id}/notes", noteReq);
        noteResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var note = await noteResp.ReadJsonAsync<CandidateNoteDto>();
        note.Should().NotBeNull();
        note!.NoteText.Should().Contain("excellent debugging");

        // 12. Recruiter schedules interview
        var interviewReq = new ScheduleInterviewRequest(
            InterviewType: InterviewType.Technical,
            ScheduledStartUtc: DateTimeOffset.UtcNow.AddDays(2),
            ScheduledEndUtc: DateTimeOffset.UtcNow.AddDays(2).AddHours(1),
            MeetingLocation: "https://meet.hiresphere.local/interview-sre");

        var interviewResp = await recruiterClient.PostAsJsonAsync($"/api/companies/{companyId}/applications/{application.Id}/interviews", interviewReq);
        interviewResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var interview = await interviewResp.ReadJsonAsync<InterviewScheduleDto>();
        interview.Should().NotBeNull();
        interview!.InterviewType.Should().Be(InterviewType.Technical);

        // 13. Verify recruitment analytics reflect the records accurately
        var analyticsResp = await recruiterClient.GetAsync($"/api/companies/{companyId}/analytics");
        analyticsResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var analytics = await analyticsResp.ReadJsonAsync<CompanyRecruitmentOverviewDto>();
        analytics.Should().NotBeNull();
        analytics!.TotalJobs.Should().BeGreaterThanOrEqualTo(1);
        analytics.TotalApplications.Should().BeGreaterThanOrEqualTo(1);
    }
}
