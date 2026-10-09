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

public class ApplicationServiceTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();

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
    public async Task SubmitApplicationAsync_ValidApplication_CreatesApplicationAndStatusHistory()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, job, candidateUser, _) = SeedRecruitmentFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var request = new SubmitApplicationRequest(
            CandidateDocumentId: null,
            CoverNote: "I have 8+ years designing scalable AWS infrastructure.");

        // Act
        var result = await service.SubmitApplicationAsync(job.Id, candidateUser.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.JobTitle.Should().Be("Staff Cloud Architect");
        result.CompanyName.Should().Be("Globex Corp");
        result.CurrentStage.Should().Be(ApplicationStage.Submitted);
        result.CandidateCoverNote.Should().Be("I have 8+ years designing scalable AWS infrastructure.");
        result.StatusTimeline.Should().HaveCount(1);
        result.StatusTimeline[0].NewStage.Should().Be(ApplicationStage.Submitted);

        var appInDb = context.JobApplications.First(a => a.Id == result.Id);
        appInDb.CurrentStage.Should().Be(ApplicationStage.Submitted);
        appInDb.StatusHistories.Should().HaveCount(1);
    }

    [Fact]
    public async Task SubmitApplicationAsync_DuplicateSubmission_ThrowsConflictException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, _, job, candidateUser, _) = SeedRecruitmentFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var request = new SubmitApplicationRequest(CoverNote: "First submission");
        await service.SubmitApplicationAsync(job.Id, candidateUser.Id, request);

        // Act
        var act = async () => await service.SubmitApplicationAsync(job.Id, candidateUser.Id, request);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already submitted an application*");
    }

    [Fact]
    public async Task SubmitApplicationAsync_ClosedOrDraftJob_ThrowsConflictException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, _, job, candidateUser, _) = SeedRecruitmentFixture(context);
        job.Status = JobPostingStatus.Closed;
        context.SaveChanges();

        var service = new ApplicationService(context, _auditServiceMock.Object);

        // Act
        var act = async () => await service.SubmitApplicationAsync(job.Id, candidateUser.Id, new SubmitApplicationRequest());

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*actively published vacancies*");
    }

    [Fact]
    public async Task WithdrawApplicationAsync_CandidateWithdraws_TransitionsToWithdrawn()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (_, _, job, candidateUser, _) = SeedRecruitmentFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var app = await service.SubmitApplicationAsync(job.Id, candidateUser.Id, new SubmitApplicationRequest(CoverNote: "First note"));

        // Act
        var withdrawn = await service.WithdrawApplicationAsync(app.Id, candidateUser.Id);

        // Assert
        withdrawn.CurrentStage.Should().Be(ApplicationStage.Withdrawn);
        withdrawn.StatusTimeline.Should().HaveCount(2);
        withdrawn.StatusTimeline.Last().NewStage.Should().Be(ApplicationStage.Withdrawn);
    }

    [Fact]
    public async Task UpdateApplicationStageAsync_RecruiterPromotesCandidate_UpdatesStageAndTimeline()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiterUser, job, candidateUser, _) = SeedRecruitmentFixture(context);
        var service = new ApplicationService(context, _auditServiceMock.Object);

        var app = await service.SubmitApplicationAsync(job.Id, candidateUser.Id, new SubmitApplicationRequest(CoverNote: "Note"));

        // Act: Recruiter shortlists candidate
        var updateRequest = new UpdateApplicationStageRequest(
            NewStage: ApplicationStage.Shortlisted,
            ReasonNote: "Strong candidate matching all mandatory requirements.");

        var updated = await service.UpdateApplicationStageAsync(company.Id, app.Id, recruiterUser.Id, updateRequest);

        // Assert
        updated.CurrentStage.Should().Be(ApplicationStage.Shortlisted);
        updated.StatusTimeline.Should().HaveCount(2);
        updated.StatusTimeline.Last().NewStage.Should().Be(ApplicationStage.Shortlisted);
        updated.StatusTimeline.Last().ReasonNote.Should().Be("Strong candidate matching all mandatory requirements.");
    }

    [Fact]
    public async Task GetCompanyApplicationsAsync_NonMember_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, _, _, _) = SeedRecruitmentFixture(context);

        var intruder = new User
        {
            Id = Guid.NewGuid(),
            Email = "intruder@other.com",
            NormalizedEmail = "INTRUDER@OTHER.COM",
            FirstName = "Intruder",
            LastName = "User",
            SecurityStamp = "stamp-int",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(intruder);
        context.SaveChanges();

        var service = new ApplicationService(context, _auditServiceMock.Object);

        // Act
        var act = async () => await service.GetCompanyApplicationsAsync(company.Id, intruder.Id);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*not an active member*");
    }
}
