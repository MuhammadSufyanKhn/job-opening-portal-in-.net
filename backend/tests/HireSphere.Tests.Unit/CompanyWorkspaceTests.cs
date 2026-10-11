using FluentAssertions;
using Moq;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class CompanyWorkspaceTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();
    private readonly Mock<IEmailService> _emailServiceMock = new();

    private (Company company, User owner, User recruiter, User hiringManager, JobPosting job, JobApplication application, CandidateProfile candidateProfile)
        SeedWorkspaceFixture(HireSphere.Infrastructure.Persistence.HireSphereDbContext context)
    {
        var owner = new User
        {
            Id = Guid.NewGuid(),
            Email = "owner@initech.com",
            NormalizedEmail = "OWNER@INITECH.COM",
            FirstName = "Bill",
            LastName = "Lumbergh",
            SecurityStamp = "stamp-o",
            AccountStatus = AccountStatus.Active
        };

        var recruiter = new User
        {
            Id = Guid.NewGuid(),
            Email = "recruiter@initech.com",
            NormalizedEmail = "RECRUITER@INITECH.COM",
            FirstName = "Peter",
            LastName = "Gibbons",
            SecurityStamp = "stamp-r",
            AccountStatus = AccountStatus.Active
        };

        var hiringManager = new User
        {
            Id = Guid.NewGuid(),
            Email = "hm@initech.com",
            NormalizedEmail = "HM@INITECH.COM",
            FirstName = "Dom",
            LastName = "Portwood",
            SecurityStamp = "stamp-hm",
            AccountStatus = AccountStatus.Active
        };

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Initech Corp",
            Slug = "initech-corp",
            Industry = "Software",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };

        company.Members.Add(new CompanyMember
        {
            CompanyId = company.Id,
            UserId = owner.Id,
            CompanyRole = CompanyRole.Owner,
            MembershipStatus = CompanyMembershipStatus.Active
        });

        company.Members.Add(new CompanyMember
        {
            CompanyId = company.Id,
            UserId = recruiter.Id,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active
        });

        company.Members.Add(new CompanyMember
        {
            CompanyId = company.Id,
            UserId = hiringManager.Id,
            CompanyRole = CompanyRole.HiringManager,
            MembershipStatus = CompanyMembershipStatus.Active
        });

        var category = new JobCategory { Id = 1, Name = "Engineering", Slug = "engineering", DisplayOrder = 1 };

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobCategoryId = 1,
            Title = "Senior Full Stack Engineer",
            Slug = "senior-full-stack-engineer",
            Summary = "Full stack engineer role",
            Description = "Full stack developer with .NET and React",
            Responsibilities = "Deliver high-quality software",
            Location = "Austin, TX",
            Status = JobPostingStatus.Published,
            ActiveVersionNumber = 1,
            PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-2)
        };

        var version = new JobDescriptionVersion
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            VersionNumber = 1,
            SnapshotJson = "{\"Title\":\"Senior Full Stack Engineer\"}"
        };
        job.Versions.Add(version);

        var candidateUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "samir.nagheenanajar@example.com",
            NormalizedEmail = "SAMIR.NAGHEENANAJAR@EXAMPLE.COM",
            FirstName = "Samir",
            LastName = "Nagheenanajar",
            SecurityStamp = "stamp-c",
            AccountStatus = AccountStatus.Active
        };

        var candidateProfile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = candidateUser.Id,
            User = candidateUser,
            Headline = "Distributed Systems Expert",
            Location = "Austin, TX",
            YearsOfExperience = 6
        };

        var application = new JobApplication
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobPostingId = job.Id,
            JobDescriptionVersionId = version.Id,
            CandidateProfileId = candidateProfile.Id,
            CurrentStage = ApplicationStage.Submitted,
            SubmittedAtUtc = DateTimeOffset.UtcNow.AddHours(-12),
            StageUpdatedAtUtc = DateTimeOffset.UtcNow.AddHours(-12)
        };

        context.Users.AddRange(owner, recruiter, hiringManager, candidateUser);
        context.Companies.Add(company);
        context.JobCategories.Add(category);
        context.JobPostings.Add(job);
        context.CandidateProfiles.Add(candidateProfile);
        context.JobApplications.Add(application);
        context.SaveChanges();

        return (company, owner, recruiter, hiringManager, job, application, candidateProfile);
    }

    [Fact]
    public async Task GetCompanyApplicationsAsync_WithSearch_FiltersCandidateName()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, job, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        // Act
        var result = await service.GetCompanyApplicationsAsync(
            company.Id,
            recruiter.Id,
            search: "Samir");

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items[0].CandidateName.Should().Contain("Samir");
    }

    [Fact]
    public async Task GetCompanyApplicationsAsync_SearchNoMatch_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, _, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        // Act
        var result = await service.GetCompanyApplicationsAsync(
            company.Id,
            recruiter.Id,
            search: "NonExistentCandidate");

        // Assert
        result.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCompanyApplicationsAsync_UnauthorizedUser_ThrowsForbidden()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, _, _, _, _, _) = SeedWorkspaceFixture(context);
        var outsider = new User
        {
            Id = Guid.NewGuid(),
            Email = "outsider@other.com",
            NormalizedEmail = "OUTSIDER@OTHER.COM",
            FirstName = "Bob",
            LastName = "Slydell",
            SecurityStamp = "stamp-out",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(outsider);
        context.SaveChanges();

        var service = new ApplicationService(context, _auditServiceMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            service.GetCompanyApplicationsAsync(company.Id, outsider.Id));
    }

    [Fact]
    public async Task UpdateApplicationStageAsync_ValidTransition_UpdatesStageAndTimeline()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object, _notificationServiceMock.Object, _emailServiceMock.Object);

        var request = new UpdateApplicationStageRequest(ApplicationStage.UnderReview, "Reviewing CV and credentials");

        // Act
        var result = await service.UpdateApplicationStageAsync(company.Id, application.Id, recruiter.Id, request);

        // Assert
        result.CurrentStage.Should().Be(ApplicationStage.UnderReview);
        result.StatusTimeline.Should().HaveCount(1);
        result.StatusTimeline[0].NewStage.Should().Be(ApplicationStage.UnderReview);
        result.StatusTimeline[0].ReasonNote.Should().Be("Reviewing CV and credentials");

        _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
            It.IsAny<Guid>(),
            "ApplicationStageChanged",
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateApplicationStageAsync_InvalidTransition_ThrowsConflict()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        // Transitioning directly from Submitted to Offered is invalid
        var request = new UpdateApplicationStageRequest(ApplicationStage.Offered, "Skip straight to offer");

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() =>
            service.UpdateApplicationStageAsync(company.Id, application.Id, recruiter.Id, request));
    }

    [Fact]
    public async Task UpdateApplicationStageAsync_CandidateWithdrawalNotAllowedByCompany_ThrowsValidationException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var request = new UpdateApplicationStageRequest(ApplicationStage.Withdrawn, "Recruiter cannot withdraw");

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.UpdateApplicationStageAsync(company.Id, application.Id, recruiter.Id, request));
    }

    [Fact]
    public async Task AddCandidateNoteAsync_AuthorizedMember_CreatesPrivateNote()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, _, hiringManager, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var request = new CreateCandidateNoteRequest("Candidate demonstrated strong architectural understanding.");

        // Act
        var note = await service.AddCandidateNoteAsync(company.Id, application.Id, hiringManager.Id, request);

        // Assert
        note.Should().NotBeNull();
        note.NoteText.Should().Be(request.NoteText);
        note.AuthorName.Should().Be("Dom Portwood");

        var notes = await service.GetApplicationNotesAsync(company.Id, application.Id, hiringManager.Id);
        notes.Should().HaveCount(1);
        notes[0].NoteText.Should().Be(request.NoteText);
    }

    [Fact]
    public async Task DeleteCandidateNoteAsync_Author_SoftDeletesNote()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var created = await service.AddCandidateNoteAsync(company.Id, application.Id, recruiter.Id, new CreateCandidateNoteRequest("Note to delete"));

        // Act
        await service.DeleteCandidateNoteAsync(company.Id, application.Id, created.Id, recruiter.Id);

        // Assert
        var notes = await service.GetApplicationNotesAsync(company.Id, application.Id, recruiter.Id);
        notes.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteCandidateNoteAsync_NonAuthorNonOwner_ThrowsForbidden()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, hiringManager, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var created = await service.AddCandidateNoteAsync(company.Id, application.Id, recruiter.Id, new CreateCandidateNoteRequest("Recruiter's note"));

        // HiringManager tries to delete recruiter's note
        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            service.DeleteCandidateNoteAsync(company.Id, application.Id, created.Id, hiringManager.Id));
    }

    [Fact]
    public async Task ScheduleInterviewAsync_ValidInput_CreatesScheduleAndUpdatesStage()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object, _notificationServiceMock.Object, _emailServiceMock.Object);

        var start = DateTimeOffset.UtcNow.AddDays(2);
        var end = start.AddHours(1);
        var request = new ScheduleInterviewRequest(InterviewType.Technical, start, end, "Google Meet: https://meet.google.com/abc-xyz");

        // Act
        var interview = await service.ScheduleInterviewAsync(company.Id, application.Id, recruiter.Id, request);

        // Assert
        interview.Should().NotBeNull();
        interview.InterviewType.Should().Be(InterviewType.Technical);
        interview.Status.Should().Be(InterviewStatus.Scheduled);
        interview.MeetingLocation.Should().Be(request.MeetingLocation);

        var updatedApp = await service.GetCompanyApplicationByIdAsync(company.Id, application.Id, recruiter.Id);
        updatedApp.CurrentStage.Should().Be(ApplicationStage.InterviewScheduled);
        updatedApp.Interviews.Should().HaveCount(1);

        _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
            It.IsAny<Guid>(),
            "InterviewScheduled",
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ScheduleInterviewAsync_InvalidDates_ThrowsValidationException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var start = DateTimeOffset.UtcNow.AddDays(2);
        var end = start.AddMinutes(-30); // End before start
        var request = new ScheduleInterviewRequest(InterviewType.Screening, start, end, "Room 3B");

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.ScheduleInterviewAsync(company.Id, application.Id, recruiter.Id, request));
    }

    [Fact]
    public async Task CancelInterviewAsync_ValidInterview_MarksCanceledAndNotifies()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object, _notificationServiceMock.Object);

        var start = DateTimeOffset.UtcNow.AddDays(1);
        var interview = await service.ScheduleInterviewAsync(company.Id, application.Id, recruiter.Id,
            new ScheduleInterviewRequest(InterviewType.Cultural, start, start.AddHours(1), "Room 101"));

        // Act
        var cancelled = await service.CancelInterviewAsync(company.Id, application.Id, interview.Id, recruiter.Id, "Candidate requested reschedule");

        // Assert
        cancelled.Status.Should().Be(InterviewStatus.Canceled);

        _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
            It.IsAny<Guid>(),
            "InterviewCancelled",
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetPipelineBoardAsync_ReturnsStandardColumnsWithApplications()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, _, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        // Act
        var board = await service.GetPipelineBoardAsync(company.Id, recruiter.Id);

        // Assert
        board.Should().NotBeNull();
        board.TotalApplications.Should().Be(1);
        board.Stages.Should().HaveCount(9);

        var submittedCol = board.Stages.First(s => s.Stage == ApplicationStage.Submitted);
        submittedCol.Count.Should().Be(1);
        submittedCol.Applications.Should().HaveCount(1);
        submittedCol.Applications[0].CandidateName.Should().Be("Samir Nagheenanajar");
    }

    [Fact]
    public async Task GetCompanyWorkspaceDashboardAsync_ComputesAccurateMetrics()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, recruiter, _, job, application, _) = SeedWorkspaceFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        // Act
        var dashboard = await service.GetCompanyWorkspaceDashboardAsync(company.Id, recruiter.Id);

        // Assert
        dashboard.Should().NotBeNull();
        dashboard.CompanyName.Should().Be("Initech Corp");
        dashboard.ActiveJobsCount.Should().Be(1);
        dashboard.PendingReviewCount.Should().Be(1);
        dashboard.ShortlistedCount.Should().Be(0);
        dashboard.UpcomingInterviewsCount.Should().Be(0);
        dashboard.ActiveJobListings.Should().HaveCount(1);
        dashboard.RecentApplications.Should().HaveCount(1);
        dashboard.ActionItems.Should().NotBeEmpty();
    }
}
