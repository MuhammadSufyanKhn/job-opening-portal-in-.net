using System.Net;
using FluentAssertions;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Application.DTOs.Company;
using HireSphere.Application.DTOs.Job;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Tests.Integration.Infrastructure;
using Xunit;

namespace HireSphere.Tests.Integration.Journeys;

public class SuperAdminJourneyIntegrationTests : IClassFixture<HireSphereApiFactory>
{
    private readonly HireSphereApiFactory _factory;
    private readonly HttpClient _client;

    public SuperAdminJourneyIntegrationTests(HireSphereApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SuperAdmin_CanReviewCompanies_ModerateUsersAndJobs_AndViewAuditHistory()
    {
        // 1. Seed super admin
        var adminEmail = $"superadmin_{Guid.NewGuid():N}@platform.local";
        var (_, adminToken) = await _factory.SeedSuperAdminAsync(adminEmail);
        var adminClient = _factory.CreateClientWithToken(adminToken);

        // 2. Register candidate and company to generate entities
        var candidateEmail = $"target_user_{Guid.NewGuid():N}@user.local";
        var candReg = new RegisterCandidateRequest(candidateEmail, "CandidatePass123!", "Target", "User", null, null, null);
        var candRegResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", candReg);
        candRegResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var candAuth = await candRegResp.ReadJsonAsync<AuthResponse>();
        var targetUserId = candAuth!.User.Id;

        // Register company
        var ownerEmail = $"company_owner_{Guid.NewGuid():N}@pending.local";
        var regComp = new RegisterCompanyRequest(
            CompanyName: $"Audit Company {Guid.NewGuid():N}"[..22],
            Industry: "FinTech",
            ContactEmail: $"contact_{Guid.NewGuid():N}@fintech.local",
            BusinessRegistrationNumber: "FIN-778899",
            WebsiteUrl: "https://fintech-test.example.com",
            Description: "FinTech services",
            OwnerFirstName: "Frank",
            OwnerLastName: "Fintech",
            OwnerEmail: ownerEmail,
            OwnerPassword: "Password123!");
        var compResp = await _client.PostAsJsonAsync("/api/auth/register-company", regComp);
        compResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var compAuth = await compResp.ReadJsonAsync<AuthResponse>();
        var companyId = compAuth!.User.Companies.First().CompanyId;

        // 3. SuperAdmin views pending companies
        var pendingResp = await adminClient.GetAsync("/api/admin/companies/pending");
        pendingResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var pendingList = await pendingResp.ReadJsonAsync<List<CompanyReviewDto>>();
        pendingList.Should().NotBeNull();
        pendingList!.Should().Contain(c => c.Id == companyId);

        // 4. SuperAdmin rejects company with reason
        var rejectReq = new RejectCompanyRequest("Incomplete regulatory registration documents.");
        var rejectResp = await adminClient.PostAsJsonAsync($"/api/admin/companies/{companyId}/reject", rejectReq);
        rejectResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 5. SuperAdmin approves company afterwards (or changes mind)
        var approveResp = await adminClient.PostAsync($"/api/admin/companies/{companyId}/approve", null);
        approveResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 6. SuperAdmin lists users and suspends candidate
        var usersResp = await adminClient.GetAsync("/api/admin/users");
        usersResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var usersList = await usersResp.ReadJsonAsync<PagedResult<AdminUserSummaryDto>>();
        usersList.Should().NotBeNull();
        usersList!.Items.Should().Contain(u => u.Id == targetUserId);

        // Suspend user
        var suspendReq = new SuspendUserRequest { Reason = "Terms of service violation report" };
        var suspendResp = await adminClient.PostAsJsonAsync($"/api/admin/users/{targetUserId}/suspend", suspendReq);
        suspendResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify suspended user is rejected on login
        var loginResp = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(candidateEmail, "CandidatePass123!"));
        loginResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // 7. SuperAdmin moderates a job
        var category = await _factory.EnsureDefaultCategoryAsync("FinTech Ops");
        var jobId = await _factory.ExecuteDbContextAsync(async db =>
        {
            var job = new JobPosting
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                JobCategoryId = category.Id,
                Title = "High Frequency Trading Engineer",
                Slug = $"hft-{Guid.NewGuid():N}"[..18],
                Summary = "C++ HFT systems",
                Description = "Ultra-low latency C++ trading platform",
                Responsibilities = "Kernel bypass networking",
                Location = "Chicago, IL",
                Status = JobPostingStatus.Published,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            db.JobPostings.Add(job);
            await db.SaveChangesAsync();
            return job.Id;
        });

        var suspendJobReq = new SuspendJobRequest { Reason = "Job contains flagged external links." };
        var suspendJobResp = await adminClient.PostAsJsonAsync($"/api/admin/jobs/{jobId}/suspend", suspendJobReq);
        suspendJobResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 8. SuperAdmin checks audit logs
        var auditResp = await adminClient.GetAsync("/api/admin/audit");
        auditResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var auditLogs = await auditResp.ReadJsonAsync<PagedResult<AdminAuditItemDto>>();
        auditLogs.Should().NotBeNull();
        auditLogs!.Items.Should().NotBeEmpty();

        // 9. Active Candidate attempts to access audit logs -> 403 Forbidden
        var activeCandReg = new RegisterCandidateRequest($"active_cand_{Guid.NewGuid():N}@cand.local", "CandidatePass123!", "Active", "Candidate", null, null, null);
        var activeCandResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", activeCandReg);
        var activeCandAuth = await activeCandResp.ReadJsonAsync<AuthResponse>();

        var candidateClient = _factory.CreateClientWithToken(activeCandAuth!.AccessToken);
        var unauthorizedAuditResp = await candidateClient.GetAsync("/api/admin/audit");
        unauthorizedAuditResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
