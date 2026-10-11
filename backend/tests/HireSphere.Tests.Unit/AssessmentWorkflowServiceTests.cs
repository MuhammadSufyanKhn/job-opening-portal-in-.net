using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class AssessmentWorkflowServiceTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();
    private readonly Mock<IEmailService> _emailServiceMock = new();

    private (Company company, User recruiter, JobPosting job, User candidateUser, CandidateProfile candidateProfile, JobApplication application, AssessmentAssignment assignment) SeedWorkflowFixture(HireSphere.Infrastructure.Persistence.HireSphereDbContext context)
    {
        var recruiter = new User
        {
            Id = Guid.NewGuid(),
            Email = "recruiter@acme.com",
            NormalizedEmail = "RECRUITER@ACME.COM",
            FirstName = "Alice",
            LastName = "Recruiter",
            SecurityStamp = "stamp-r",
            AccountStatus = AccountStatus.Active
        };

        var candidateUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "candidate@example.com",
            NormalizedEmail = "CANDIDATE@EXAMPLE.COM",
            FirstName = "Bob",
            LastName = "Candidate",
            SecurityStamp = "stamp-c",
            AccountStatus = AccountStatus.Active
        };

        var candidateProfile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = candidateUser.Id,
            User = candidateUser,
            Location = "London, UK",
            YearsOfExperience = 5
        };

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme Corp",
            Slug = "acme-corp",
            Industry = "Technology",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };

        var member = new CompanyMember
        {
            CompanyId = company.Id,
            UserId = recruiter.Id,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active
        };

        var scenario = new SimulationScenario
        {
            Id = Guid.NewGuid(),
            Title = "Backend Incident Troubleshooting",
            Category = "Software Engineering",
            Description = "Debug API degradation in production.",
            EstimatedDurationMinutes = 45,
            IsActive = true
        };

        var version = new ScenarioVersion
        {
            Id = Guid.NewGuid(),
            SimulationScenarioId = scenario.Id,
            SimulationScenario = scenario,
            VersionNumber = 1,
            DefinitionJson = "{}",
            RubricJson = "{}"
        };

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Company = company,
            Title = "Senior .NET Engineer",
            Description = "Build scalable recruitment software",
            EmploymentType = EmploymentType.FullTime,
            WorkplaceType = WorkplaceType.Remote,
            Status = JobPostingStatus.Published,
            PublishedAtUtc = DateTimeOffset.UtcNow
        };

        var config = new JobAssessmentConfiguration
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Company = company,
            JobPostingId = job.Id,
            JobPosting = job,
            ScenarioVersionId = version.Id,
            ScenarioVersion = version,
            IsRequired = true,
            MaxAllowedAttempts = 1,
            DeadlineDaysAfterAssignment = 7,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        var app = new JobApplication
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            JobPosting = job,
            CandidateProfileId = candidateProfile.Id,
            CandidateProfile = candidateProfile,
            CurrentStage = ApplicationStage.Submitted,
            SubmittedAtUtc = DateTimeOffset.UtcNow
        };

        var assignment = new AssessmentAssignment
        {
            Id = Guid.NewGuid(),
            JobApplicationId = app.Id,
            JobApplication = app,
            CandidateProfileId = candidateProfile.Id,
            CandidateProfile = candidateProfile,
            CompanyId = company.Id,
            Company = company,
            JobAssessmentConfigurationId = config.Id,
            JobAssessmentConfiguration = config,
            AssignedAtUtc = DateTimeOffset.UtcNow,
            DeadlineUtc = DateTimeOffset.UtcNow.AddDays(7),
            Status = AssessmentAssignmentStatus.Assigned,
            ResentCount = 0
        };

        context.Users.AddRange(recruiter, candidateUser);
        context.Companies.Add(company);
        context.CompanyMembers.Add(member);
        context.CandidateProfiles.Add(candidateProfile);
        context.SimulationScenarios.Add(scenario);
        context.ScenarioVersions.Add(version);
        context.JobPostings.Add(job);
        context.JobAssessmentConfigurations.Add(config);
        context.JobApplications.Add(app);
        context.AssessmentAssignments.Add(assignment);

        context.SaveChanges();

        return (company, recruiter, job, candidateUser, candidateProfile, app, assignment);
    }

    [Fact]
    public async Task GetCandidateInvitationsAsync_ReturnsOnlyCandidatesInvitations()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, _, _, candidateUser, _, _, assignment) = SeedWorkflowFixture(context);

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        var results = await service.GetCandidateInvitationsAsync(candidateUser.Id);

        results.Should().HaveCount(1);
        results[0].AssignmentId.Should().Be(assignment.Id);
        results[0].ScenarioTitle.Should().Be("Backend Incident Troubleshooting");
        results[0].IsRequired.Should().BeTrue();
    }

    [Fact]
    public async Task GetCandidateInvitationByIdAsync_ThrowsForbidden_WhenNotCandidateAssignment()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, _, _, _, _, _, assignment) = SeedWorkflowFixture(context);

        var otherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "intruder@example.com",
            NormalizedEmail = "INTRUDER@EXAMPLE.COM",
            FirstName = "Eve",
            LastName = "Intruder",
            SecurityStamp = "stamp-e",
            AccountStatus = AccountStatus.Active
        };
        var otherProfile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = otherUser.Id,
            User = otherUser
        };
        context.Users.Add(otherUser);
        context.CandidateProfiles.Add(otherProfile);
        await context.SaveChangesAsync();

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            service.GetCandidateInvitationByIdAsync(otherUser.Id, assignment.Id));
    }

    [Fact]
    public async Task GetCompanyAssessmentTrackingAsync_ReturnsCompanyAssignments_WithFiltering()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, _, _, _, _, assignment) = SeedWorkflowFixture(context);

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        var list = await service.GetCompanyAssessmentTrackingAsync(company.Id, recruiter.Id);
        list.Should().HaveCount(1);
        list[0].CandidateName.Should().Be("Bob Candidate");
        list[0].Status.Should().Be("Assigned");

        var filteredEmpty = await service.GetCompanyAssessmentTrackingAsync(company.Id, recruiter.Id, statusFilter: "Completed");
        filteredEmpty.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCompanyAssessmentTrackingAsync_ThrowsForbidden_WhenUserNotCompanyMember()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, _, _, _, _, _) = SeedWorkflowFixture(context);
        var outsideUserId = Guid.NewGuid();

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            service.GetCompanyAssessmentTrackingAsync(company.Id, outsideUserId));
    }

    [Fact]
    public async Task ResendAssessmentInvitationAsync_IncrementsCount_AndDispatchesNotifications()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, _, candidateUser, _, _, assignment) = SeedWorkflowFixture(context);

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        var success = await service.ResendAssessmentInvitationAsync(company.Id, recruiter.Id, assignment.Id);
        success.Should().BeTrue();

        var updated = await context.AssessmentAssignments.FindAsync(assignment.Id);
        updated!.ResentCount.Should().Be(1);
        updated.LastResentAtUtc.Should().NotBeNull();

        _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
            candidateUser.Id,
            "AssessmentInvitationResent",
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<CancellationToken>()), Times.Once);

        _emailServiceMock.Verify(e => e.SendAssessmentInvitationEmailAsync(
            candidateUser.Email,
            It.IsAny<string>(),
            company.Name,
            It.IsAny<string>(),
            It.IsAny<string>(),
            true,
            It.IsAny<DateTimeOffset>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ResendAssessmentInvitationAsync_ThrowsConflict_WhenAlreadyCompleted()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, _, _, _, _, assignment) = SeedWorkflowFixture(context);

        assignment.Status = AssessmentAssignmentStatus.Completed;
        assignment.CompletedAtUtc = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync();

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        await Assert.ThrowsAsync<ConflictException>(() =>
            service.ResendAssessmentInvitationAsync(company.Id, recruiter.Id, assignment.Id));
    }

    [Fact]
    public async Task CancelAssessmentInvitationAsync_CancelsAssignment_AndAbortsActiveSessions()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, _, _, _, _, assignment) = SeedWorkflowFixture(context);

        var session = new SimulationSession
        {
            Id = Guid.NewGuid(),
            AssessmentAssignmentId = assignment.Id,
            CandidateProfileId = assignment.CandidateProfileId,
            ScenarioVersionId = assignment.JobAssessmentConfiguration.ScenarioVersionId,
            StartedAtUtc = DateTimeOffset.UtcNow,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(45),
            Status = SimulationSessionStatus.Active,
            CurrentStateVectorJson = "{}"
        };
        context.SimulationSessions.Add(session);
        await context.SaveChangesAsync();

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        var success = await service.CancelAssessmentInvitationAsync(company.Id, recruiter.Id, assignment.Id, "Position filled");
        success.Should().BeTrue();

        var updated = await context.AssessmentAssignments.FindAsync(assignment.Id);
        updated!.Status.Should().Be(AssessmentAssignmentStatus.Cancelled);
        updated.CancelledAtUtc.Should().NotBeNull();
        updated.CancellationReason.Should().Be("Position filled");

        var updatedSession = await context.SimulationSessions.FindAsync(session.Id);
        updatedSession!.Status.Should().Be(SimulationSessionStatus.Aborted);
    }

    [Fact]
    public async Task CancelAssessmentInvitationAsync_ThrowsConflict_WhenAlreadyCompleted()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, _, _, _, _, assignment) = SeedWorkflowFixture(context);

        assignment.Status = AssessmentAssignmentStatus.Completed;
        await context.SaveChangesAsync();

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        await Assert.ThrowsAsync<ConflictException>(() =>
            service.CancelAssessmentInvitationAsync(company.Id, recruiter.Id, assignment.Id, "Reason"));
    }

    [Fact]
    public async Task ProcessDeadlinesAndRemindersAsync_ExpiresOverdueActiveAssignments_WithoutExpiringCompleted()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, _, _, _, _, _, activeAssignment) = SeedWorkflowFixture(context);

        // Make active assignment overdue
        activeAssignment.DeadlineUtc = DateTimeOffset.UtcNow.AddDays(-2);

        // Create completed assignment with overdue deadline
        var completedAssignment = new AssessmentAssignment
        {
            Id = Guid.NewGuid(),
            JobApplicationId = activeAssignment.JobApplicationId,
            CandidateProfileId = activeAssignment.CandidateProfileId,
            CompanyId = activeAssignment.CompanyId,
            JobAssessmentConfigurationId = activeAssignment.JobAssessmentConfigurationId,
            AssignedAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
            DeadlineUtc = DateTimeOffset.UtcNow.AddDays(-1),
            Status = AssessmentAssignmentStatus.Completed,
            CompletedAtUtc = DateTimeOffset.UtcNow.AddDays(-2)
        };
        context.AssessmentAssignments.Add(completedAssignment);
        await context.SaveChangesAsync();

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        var result = await service.ProcessDeadlinesAndRemindersAsync();

        result.ExpiredCount.Should().Be(1);

        var updatedActive = await context.AssessmentAssignments.FindAsync(activeAssignment.Id);
        updatedActive!.Status.Should().Be(AssessmentAssignmentStatus.Expired);

        var updatedCompleted = await context.AssessmentAssignments.FindAsync(completedAssignment.Id);
        updatedCompleted!.Status.Should().Be(AssessmentAssignmentStatus.Completed);
    }

    [Fact]
    public async Task ProcessDeadlinesAndRemindersAsync_Sends48HourReminders_AndDeduplicates()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, _, _, _, _, _, assignment) = SeedWorkflowFixture(context);

        // Set deadline to 24 hours from now (within 48 hour window)
        assignment.DeadlineUtc = DateTimeOffset.UtcNow.AddHours(24);
        assignment.ReminderSentAtUtc = null;
        await context.SaveChangesAsync();

        var service = new AssessmentWorkflowService(
            context,
            _auditServiceMock.Object,
            _notificationServiceMock.Object,
            _emailServiceMock.Object,
            NullLogger<AssessmentWorkflowService>.Instance);

        var result1 = await service.ProcessDeadlinesAndRemindersAsync();
        result1.RemindersSentCount.Should().Be(1);

        var updated = await context.AssessmentAssignments.FindAsync(assignment.Id);
        updated!.ReminderSentAtUtc.Should().NotBeNull();

        // Second pass should not duplicate reminder
        var result2 = await service.ProcessDeadlinesAndRemindersAsync();
        result2.RemindersSentCount.Should().Be(0);
    }
}
