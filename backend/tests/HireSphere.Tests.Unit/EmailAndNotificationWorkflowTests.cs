using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Infrastructure.Services;

namespace HireSphere.Tests.Unit;

public class EmailAndNotificationWorkflowTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();
    private readonly Mock<ILogger<DevLoggingEmailService>> _emailLoggerMock = new();

    private (Company company, User recruiter, JobPosting job, User candidateUser, CandidateProfile candidateProfile) SeedRecruitmentFixture(HireSphere.Infrastructure.Persistence.HireSphereDbContext context)
    {
        var recruiterUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "recruiter@globex.com",
            NormalizedEmail = "RECRUITER@GLOBEX.COM",
            FirstName = "Rachel",
            LastName = "Recruiter",
            SecurityStamp = "stamp-r",
            AccountStatus = AccountStatus.Active
        };

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Globex Corp",
            Slug = "globex-corp",
            Industry = "Engineering",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };

        var member = new CompanyMember
        {
            CompanyId = company.Id,
            UserId = recruiterUser.Id,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active
        };
        company.Members.Add(member);

        var category = new JobCategory
        {
            Id = 1,
            Name = "Engineering",
            Slug = "engineering",
            DisplayOrder = 1
        };

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobCategoryId = 1,
            Title = "Staff Cloud Architect",
            Slug = "staff-cloud-architect",
            Summary = "Cloud infrastructure architect",
            Description = "Full job description",
            Responsibilities = "Design cloud systems",
            Location = "London, UK",
            Status = JobPostingStatus.Published,
            ActiveVersionNumber = 1,
            PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
        };

        var version = new JobDescriptionVersion
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            VersionNumber = 1,
            SnapshotJson = "{\"Title\":\"Staff Cloud Architect\"}"
        };
        job.Versions.Add(version);

        var candidateUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "alex.candidate@example.com",
            NormalizedEmail = "ALEX.CANDIDATE@EXAMPLE.COM",
            FirstName = "Alex",
            LastName = "Candidate",
            SecurityStamp = "stamp-c",
            AccountStatus = AccountStatus.Active
        };

        var candidateProfile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = candidateUser.Id,
            User = candidateUser,
            Headline = "Senior Infrastructure Specialist",
            Location = "London, UK",
            YearsOfExperience = 8
        };

        context.Users.AddRange(recruiterUser, candidateUser);
        context.Companies.Add(company);
        context.JobCategories.Add(category);
        context.JobPostings.Add(job);
        context.CandidateProfiles.Add(candidateProfile);
        context.SaveChanges();

        return (company, recruiterUser, job, candidateUser, candidateProfile);
    }

    [Fact]
    public async Task ApplicationSubmission_DispatchesInAppNotificationAndEmail()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiterUser, job, candidateUser, _) = SeedRecruitmentFixture(context);

        var notificationService = new NotificationService(context);
        var emailServiceMock = new Mock<IEmailService>();

        var appService = new ApplicationService(
            context,
            _auditServiceMock.Object,
            notificationService,
            emailServiceMock.Object);

        var request = new SubmitApplicationRequest(CoverNote: "Excited to apply.");

        // Act
        var result = await appService.SubmitApplicationAsync(job.Id, candidateUser.Id, request);

        // Assert
        result.Should().NotBeNull();

        // 1. In-app notification for candidate
        var candidateNotifications = await notificationService.GetUserNotificationsAsync(candidateUser.Id);
        candidateNotifications.Should().ContainSingle();
        candidateNotifications[0].Title.Should().Contain("Application Submitted");
        candidateNotifications[0].NotificationType.Should().Be("ApplicationSubmitted");

        // 2. In-app notification for recruiter
        var recruiterNotifications = await notificationService.GetUserNotificationsAsync(recruiterUser.Id);
        recruiterNotifications.Should().ContainSingle();
        recruiterNotifications[0].NotificationType.Should().Be("CandidateApplied");
        recruiterNotifications[0].Title.Should().Contain("New Applicant");

        // 3. Email sent to candidate
        emailServiceMock.Verify(m => m.SendApplicationSubmittedEmailAsync(
            candidateUser.Email,
            It.IsAny<string>(),
            company.Name,
            job.Title,
            It.IsAny<Guid>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ApplicationStageChange_DispatchesInAppNotificationAndEmailToCandidate()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiterUser, job, candidateUser, _) = SeedRecruitmentFixture(context);

        var notificationService = new NotificationService(context);
        var emailServiceMock = new Mock<IEmailService>();

        var appService = new ApplicationService(
            context,
            _auditServiceMock.Object,
            notificationService,
            emailServiceMock.Object);

        var app = await appService.SubmitApplicationAsync(job.Id, candidateUser.Id, new SubmitApplicationRequest());

        // Act
        var updateRequest = new UpdateApplicationStageRequest(
            NewStage: ApplicationStage.Shortlisted,
            ReasonNote: "Impressive background in distributed systems.");

        await appService.UpdateApplicationStageAsync(company.Id, app.Id, recruiterUser.Id, updateRequest);

        // Assert
        var candidateNotifications = await notificationService.GetUserNotificationsAsync(candidateUser.Id);
        candidateNotifications.Should().Contain(n => n.NotificationType == "ApplicationStageChanged");

        emailServiceMock.Verify(m => m.SendApplicationStatusUpdatedEmailAsync(
            candidateUser.Email,
            It.IsAny<string>(),
            company.Name,
            job.Title,
            ApplicationStage.Shortlisted.ToString(),
            updateRequest.ReasonNote,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DevLoggingEmailService_WithoutSmtp_LogsToDatabaseDeliveryAttempts()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var config = new ConfigurationBuilder().Build(); // No SMTP configured

        var emailService = new DevLoggingEmailService(
            context,
            config,
            _emailLoggerMock.Object);

        // Act
        await emailService.SendApplicationSubmittedEmailAsync(
            "test@candidate.com",
            "John Doe",
            "Acme Tech",
            "Cloud Engineer",
            Guid.NewGuid());

        // Assert
        context.EmailDeliveryAttempts.Should().HaveCount(1);
        var attempt = context.EmailDeliveryAttempts.First();
        attempt.RecipientEmail.Should().Be("test@candidate.com");
        attempt.Subject.Should().Contain("Application Received");
        attempt.DeliveryStatus.Should().Be(EmailDeliveryStatus.Sent);
        attempt.TemplateName.Should().Be("ApplicationSubmitted");
        attempt.ErrorMessage.Should().BeNull();
    }
}
