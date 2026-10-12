using System.Net;
using FluentAssertions;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Domain.Enums;
using HireSphere.Tests.Integration.Infrastructure;
using Xunit;

namespace HireSphere.Tests.Integration.Journeys;

public class TenantIsolationAndAuthorizationIntegrationTests : IClassFixture<HireSphereApiFactory>
{
    private readonly HireSphereApiFactory _factory;
    private readonly HttpClient _client;

    public TenantIsolationAndAuthorizationIntegrationTests(HireSphereApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(HttpClient Client, Guid CompanyId, string Token)> CreateCompanyWithRecruiterAsync(string prefix)
    {
        var ownerEmail = $"{prefix}_{Guid.NewGuid():N}@tenant.local";
        var regComp = new RegisterCompanyRequest(
            CompanyName: $"{prefix} Enterprise {Guid.NewGuid():N}"[..22],
            Industry: "Cloud",
            ContactEmail: $"contact_{prefix}_{Guid.NewGuid():N}@tenant.local",
            BusinessRegistrationNumber: $"REG-{prefix}",
            WebsiteUrl: $"https://{prefix}.example.com",
            Description: $"{prefix} company",
            OwnerFirstName: prefix,
            OwnerLastName: "Manager",
            OwnerEmail: ownerEmail,
            OwnerPassword: "Password123!");

        var compResp = await _client.PostAsJsonAsync("/api/auth/register-company", regComp);
        compResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await compResp.ReadJsonAsync<AuthResponse>();
        var companyId = auth!.User.Companies.First().CompanyId;

        // Auto approve in test DB
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

        var client = _factory.CreateClientWithToken(auth.AccessToken);
        return (client, companyId, auth.AccessToken);
    }

    [Fact]
    public async Task RecruiterA_CannotAccessCompanyB_Jobs_Applications_Or_Analytics()
    {
        // Arrange
        var (clientA, companyAId, _) = await CreateCompanyWithRecruiterAsync("TenantA");
        var (_, companyBId, _) = await CreateCompanyWithRecruiterAsync("TenantB");

        // Act 1: Recruiter A attempts to read Company B's jobs
        var crossJobsResp = await clientA.GetAsync($"/api/companies/{companyBId}/jobs");

        // Assert 1: Forbidden
        crossJobsResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Act 2: Recruiter A attempts to read Company B's applications
        var crossAppsResp = await clientA.GetAsync($"/api/companies/{companyBId}/applications");

        // Assert 2: Forbidden
        crossAppsResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Act 3: Recruiter A attempts to read Company B's private analytics
        var crossAnalyticsResp = await clientA.GetAsync($"/api/companies/{companyBId}/analytics");

        // Assert 3: Forbidden
        crossAnalyticsResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task OrdinaryRecruiter_CannotAccessSuperAdminEndpoints()
    {
        // Arrange
        var (recruiterClient, _, _) = await CreateCompanyWithRecruiterAsync("NormalRecruiter");

        // Act & Assert: Admin endpoints must return 403 Forbidden
        var pendingCompaniesResp = await recruiterClient.GetAsync("/api/admin/companies/pending");
        pendingCompaniesResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var auditLogsResp = await recruiterClient.GetAsync("/api/admin/audit");
        auditLogsResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var adminUsersResp = await recruiterClient.GetAsync("/api/admin/users");
        adminUsersResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Candidate_CannotAccessSuperAdminEndpoints_Or_CompanyEndpoints()
    {
        // Arrange
        var candEmail = $"cand_barrier_{Guid.NewGuid():N}@test.local";
        var candReg = new RegisterCandidateRequest(candEmail, "Password123!", "Jane", "Barrier", null, null, null);
        var candRegResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", candReg);
        var candAuth = await candRegResp.ReadJsonAsync<AuthResponse>();
        var candClient = _factory.CreateClientWithToken(candAuth!.AccessToken);

        var (_, companyId, _) = await CreateCompanyWithRecruiterAsync("TargetTenant");

        // Act & Assert 1: Admin endpoint -> 403
        var adminResp = await candClient.GetAsync("/api/admin/users");
        adminResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Act & Assert 2: Company jobs management -> 403
        var companyJobsResp = await candClient.GetAsync($"/api/companies/{companyId}/jobs");
        companyJobsResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Act & Assert 3: Company applications list -> 403
        var companyAppsResp = await candClient.GetAsync($"/api/companies/{companyId}/applications");
        companyAppsResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
