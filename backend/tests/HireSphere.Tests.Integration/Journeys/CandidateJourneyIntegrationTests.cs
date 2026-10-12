using System.Net;
using System.Net.Http.Headers;
using System.Text;
using FluentAssertions;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Application.DTOs.Document;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.DTOs.Profile;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Tests.Integration.Infrastructure;
using Xunit;

namespace HireSphere.Tests.Integration.Journeys;

public class CandidateJourneyIntegrationTests : IClassFixture<HireSphereApiFactory>
{
    private readonly HireSphereApiFactory _factory;
    private readonly HttpClient _client;

    public CandidateJourneyIntegrationTests(HireSphereApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(HttpClient Client, User User, string Token)> CreateCandidateAsync()
    {
        var email = $"cand_{Guid.NewGuid():N}@journey.local";
        var password = "CandidatePass123!";
        var reg = new RegisterCandidateRequest(
            email, password, "Sarah", "Connor", "+1555123456", "Full-Stack Engineer", "Los Angeles, CA");

        var regResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", reg);
        regResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await regResp.ReadJsonAsync<AuthResponse>();

        var candidateClient = _factory.CreateClientWithToken(auth!.AccessToken);
        return (candidateClient, new User { Id = auth.User.Id, Email = email }, auth.AccessToken);
    }

    private async Task<(Company Company, JobPosting Job)> CreatePublishedJobAsync()
    {
        var category = await _factory.EnsureDefaultCategoryAsync("Software Engineering");

        return await _factory.ExecuteDbContextAsync(async db =>
        {
            var company = new Company
            {
                Id = Guid.NewGuid(),
                Name = $"TechCorp_{Guid.NewGuid():N}"[..18],
                Slug = $"techcorp-{Guid.NewGuid():N}"[..18],
                Industry = "Software",
                ApprovalStatus = CompanyApprovalStatus.Approved
            };
            db.Companies.Add(company);

            var job = new JobPosting
            {
                Id = Guid.NewGuid(),
                CompanyId = company.Id,
                Company = company,
                JobCategoryId = category.Id,
                Title = "Cloud Infrastructure Engineer",
                Slug = $"cloud-eng-{Guid.NewGuid():N}"[..18],
                Summary = "Join our platform team to build scalable services",
                Description = "Full stack cloud architecture role",
                Responsibilities = "Deploy and maintain cloud infrastructure",
                EmploymentType = EmploymentType.FullTime,
                WorkplaceType = WorkplaceType.Remote,
                Location = "Remote / US",
                Status = JobPostingStatus.Published,
                ActiveVersionNumber = 1,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            job.Versions.Add(new JobDescriptionVersion
            {
                Id = Guid.NewGuid(),
                JobPostingId = job.Id,
                VersionNumber = 1,
                SnapshotJson = "{}",
                CreatedAtUtc = DateTimeOffset.UtcNow
            });
            db.JobPostings.Add(job);
            await db.SaveChangesAsync();

            return (company, job);
        });
    }

    [Fact]
    public async Task CandidateProfile_CanBeUpdatedAndRetrieved()
    {
        // Arrange
        var (candidateClient, _, _) = await CreateCandidateAsync();

        var updateReq = new UpdateCandidateProfileRequest(
            FirstName: "Sarah",
            LastName: "Connor",
            Headline: "Principal Cloud Architect",
            Summary: "10+ years specializing in distributed cloud systems.",
            Location: "San Francisco, CA",
            YearsOfExperience: 10,
            LinkedInUrl: "https://linkedin.com/in/sarah-connor",
            GitHubUrl: "https://github.com/sarah-connor",
            PortfolioUrl: "https://sarahconnor.tech",
            PhoneNumber: "+15559876543");

        // Act - Update Profile
        var updateResp = await candidateClient.PutAsJsonAsync("/api/candidates/me/profile", updateReq);

        // Assert
        updateResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await updateResp.ReadJsonAsync<CandidateProfileDto>();
        updated.Should().NotBeNull();
        updated!.Headline.Should().Be("Principal Cloud Architect");
        updated.YearsOfExperience.Should().Be(10);
        updated.CompletionPercentage.Should().BeGreaterThan(50);

        // Act - Retrieve Profile
        var getResp = await candidateClient.GetAsync("/api/candidates/me/profile");
        getResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var retrieved = await getResp.ReadJsonAsync<CandidateProfileDto>();
        retrieved.Should().NotBeNull();
        retrieved!.Headline.Should().Be("Principal Cloud Architect");
    }

    [Fact]
    public async Task Candidate_UploadCv_ValidatesAndStoresDocument()
    {
        // Arrange
        var (candidateClient, _, _) = await CreateCandidateAsync();

        // Valid PDF mock bytes starting with %PDF
        var fakePdfContent = Encoding.UTF8.GetBytes("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\nstream\nC# .NET ASP.NET React Docker\nendstream\ntrailer<</Root 1 0 R>>%%EOF");
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(fakePdfContent);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "Sarah_Connor_Resume.pdf");

        // Act - Upload
        var uploadResp = await candidateClient.PostAsync("/api/candidate/documents", content);

        // Assert
        uploadResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = await uploadResp.ReadJsonAsync<CandidateDocumentDetailDto>();
        doc.Should().NotBeNull();
        doc!.OriginalFileName.Should().Be("Sarah_Connor_Resume.pdf");
        doc.FileExtension.Should().Be(".pdf");
        doc.IsDefault.Should().BeTrue();

        // Act - Retrieve list of documents
        var listResp = await candidateClient.GetAsync("/api/candidate/documents");
        listResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var docs = await listResp.ReadJsonAsync<List<CandidateDocumentSummaryDto>>();
        docs.Should().NotBeNull();
        docs!.Should().ContainSingle(d => d.OriginalFileName == "Sarah_Connor_Resume.pdf");
    }

    [Fact]
    public async Task Candidate_CanBrowseJobs_ViewJobDetail_AndApply()
    {
        // Arrange
        var (candidateClient, _, _) = await CreateCandidateAsync();
        var (_, job) = await CreatePublishedJobAsync();

        // 1. Search jobs publicly
        var searchResp = await _client.GetAsync("/api/jobs?search=Cloud");
        searchResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var pagedJobs = await searchResp.ReadJsonAsync<PagedResult<PublicJobPostingSummaryDto>>();
        pagedJobs.Should().NotBeNull();
        pagedJobs!.Items.Should().Contain(j => j.Id == job.Id);

        // 2. View job detail
        var detailResp = await _client.GetAsync($"/api/jobs/{job.Id}");
        detailResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var jobDetail = await detailResp.ReadJsonAsync<PublicJobPostingDetailDto>();
        jobDetail.Should().NotBeNull();
        jobDetail!.Title.Should().Be("Cloud Infrastructure Engineer");

        // 3. Submit application
        var applyReq = new SubmitApplicationRequest(
            CandidateDocumentId: null,
            CoverNote: "I have extensive AWS and Kubernetes architecture experience.");

        var applyResp = await candidateClient.PostAsJsonAsync($"/api/jobs/{job.Id}/apply", applyReq);
        applyResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var applied = await applyResp.ReadJsonAsync<CandidateApplicationDetailDto>();
        applied.Should().NotBeNull();
        applied!.JobPostingId.Should().Be(job.Id);
        applied.CurrentStage.Should().Be(ApplicationStage.Submitted);

        // 4. Duplicate application prevention
        var dupResp = await candidateClient.PostAsJsonAsync($"/api/jobs/{job.Id}/apply", applyReq);
        dupResp.StatusCode.Should().Be(HttpStatusCode.Conflict);

        // 5. Candidate views their applications
        var myAppsResp = await candidateClient.GetAsync("/api/candidate/applications");
        myAppsResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var myApps = await myAppsResp.ReadJsonAsync<List<CandidateApplicationSummaryDto>>();
        myApps.Should().NotBeNull();
        myApps!.Should().ContainSingle(a => a.JobPostingId == job.Id);

        // 6. Candidate withdraws application
        var withdrawResp = await candidateClient.PostAsync($"/api/candidate/applications/{applied.Id}/withdraw", null);
        withdrawResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var withdrawn = await withdrawResp.ReadJsonAsync<CandidateApplicationDetailDto>();
        withdrawn.Should().NotBeNull();
        withdrawn!.CurrentStage.Should().Be(ApplicationStage.Withdrawn);
    }
}
