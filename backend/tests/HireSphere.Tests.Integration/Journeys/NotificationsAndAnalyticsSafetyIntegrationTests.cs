using System.Net;
using FluentAssertions;
using HireSphere.Application.DTOs.Analytics;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.DTOs.Notification;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Tests.Integration.Infrastructure;
using Xunit;

namespace HireSphere.Tests.Integration.Journeys;

public class NotificationsAndAnalyticsSafetyIntegrationTests : IClassFixture<HireSphereApiFactory>
{
    private readonly HireSphereApiFactory _factory;
    private readonly HttpClient _client;

    public NotificationsAndAnalyticsSafetyIntegrationTests(HireSphereApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task EmptyCompanyAnalytics_ReturnsZeroesWithoutException()
    {
        // Arrange - Register fresh company with no jobs and no applications
        var ownerEmail = $"empty_analytics_{Guid.NewGuid():N}@tenant.local";
        var regComp = new RegisterCompanyRequest(
            CompanyName: $"Fresh Analytics Corp {Guid.NewGuid():N}"[..22],
            Industry: "Consulting",
            ContactEmail: $"contact_{Guid.NewGuid():N}@tenant.local",
            BusinessRegistrationNumber: "CONS-001",
            WebsiteUrl: "https://consulting.example.com",
            Description: "Consulting practice",
            OwnerFirstName: "Helen",
            OwnerLastName: "Partner",
            OwnerEmail: ownerEmail,
            OwnerPassword: "Password123!");

        var compResp = await _client.PostAsJsonAsync("/api/auth/register-company", regComp);
        var compAuth = await compResp.ReadJsonAsync<AuthResponse>();
        var companyId = compAuth!.User.Companies.First().CompanyId;
        var client = _factory.CreateClientWithToken(compAuth.AccessToken);

        // Approve company
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

        // Act - Fetch overview analytics with 0 data
        var analyticsResp = await client.GetAsync($"/api/companies/{companyId}/analytics");

        // Assert - Should return 200 OK with zero metrics without division by zero
        analyticsResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var data = await analyticsResp.ReadJsonAsync<CompanyRecruitmentOverviewDto>();
        data.Should().NotBeNull();
        data!.TotalJobs.Should().Be(0);
        data.TotalApplications.Should().Be(0);
        data.PublishedJobs.Should().Be(0);

        // Act - Export CSV with empty datasets
        var csvResp = await client.GetAsync($"/api/companies/{companyId}/analytics/export-csv");
        csvResp.StatusCode.Should().Be(HttpStatusCode.OK);
        csvResp.Content.Headers.ContentType?.MediaType.Should().Be("text/csv");
    }

    [Fact]
    public async Task NotificationLifecycle_GeneratesReadsAndClearsNotifications()
    {
        // 1. Candidate registers
        var candEmail = $"notif_user_{Guid.NewGuid():N}@candidate.local";
        var candReg = new RegisterCandidateRequest(candEmail, "Password123!", "Nina", "Notifications", null, null, null);
        var candRegResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", candReg);
        var candAuth = await candRegResp.ReadJsonAsync<AuthResponse>();
        var candidateClient = _factory.CreateClientWithToken(candAuth!.AccessToken);

        // 2. Pre-seed a notification for the candidate
        await _factory.ExecuteDbContextAsync(async db =>
        {
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = candAuth.User.Id,
                NotificationType = "ApplicationStageChanged",
                Title = "Application Updated",
                Message = "Your application has moved to the Interviewing stage.",
                ActionUrl = "/candidate/applications",
                IsRead = false,
                CreatedAtUtc = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync();
        });

        // 3. Candidate checks unread count
        var countResp = await candidateClient.GetAsync("/api/notifications/unread-count");
        countResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var countDto = await countResp.ReadJsonAsync<UnreadNotificationCountDto>();
        countDto.Should().NotBeNull();
        countDto!.UnreadCount.Should().BeGreaterThanOrEqualTo(1);

        // 4. Candidate retrieves notifications
        var listResp = await candidateClient.GetAsync("/api/notifications");
        listResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var notifications = await listResp.ReadJsonAsync<List<NotificationDto>>();
        notifications.Should().NotBeNull();
        notifications!.Should().Contain(n => n.NotificationType == "ApplicationStageChanged");

        var targetNotif = notifications.First(n => n.NotificationType == "ApplicationStageChanged");

        // 5. Candidate marks notification as read
        var markReadResp = await candidateClient.PostAsync($"/api/notifications/{targetNotif.Id}/read", null);
        markReadResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 6. Verify mark all read endpoint
        var markAllResp = await candidateClient.PostAsync("/api/notifications/read-all", null);
        markAllResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 7. Verify unread count is now 0
        var finalCountResp = await candidateClient.GetAsync("/api/notifications/unread-count");
        finalCountResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var finalCountDto = await finalCountResp.ReadJsonAsync<UnreadNotificationCountDto>();
        finalCountDto.Should().NotBeNull();
        finalCountDto!.UnreadCount.Should().Be(0);
    }
}
