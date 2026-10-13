using FluentAssertions;
using Moq;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class JobServiceTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();

    private (Company company, User owner, JobCategory category) SeedCompanyAndOwner(HireSphere.Infrastructure.Persistence.HireSphereDbContext context, CompanyApprovalStatus approvalStatus = CompanyApprovalStatus.Approved)
    {
        var owner = new User
        {
            Id = Guid.NewGuid(),
            Email = "owner@techcorp.com",
            NormalizedEmail = "OWNER@TECHCORP.COM",
            FirstName = "Alice",
            LastName = "Founder",
            SecurityStamp = "stamp-1",
            AccountStatus = AccountStatus.Active
        };

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "TechCorp Solutions",
            Slug = "techcorp-solutions",
            Industry = "Technology",
            ContactEmail = "contact@techcorp.com",
            ApprovalStatus = approvalStatus
        };

        var membership = new CompanyMember
        {
            CompanyId = company.Id,
            UserId = owner.Id,
            CompanyRole = CompanyRole.Owner,
            MembershipStatus = CompanyMembershipStatus.Active
        };

        company.Members.Add(membership);

        var category = new JobCategory
        {
            Id = 1,
            Name = "Software Engineering",
            Slug = "software-engineering",
            DisplayOrder = 1
        };

        context.Users.Add(owner);
        context.Companies.Add(company);
        context.JobCategories.Add(category);
        context.SaveChanges();

        return (company, owner, category);
    }

    [Fact]
    public async Task CreateJobAsync_ValidDraft_CreatesJobWithVersionAndRequirements()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, owner, category) = SeedCompanyAndOwner(context);
        var service = new JobService(context, _auditServiceMock.Object);

        var request = new CreateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "Senior .NET Backend Architect",
            Summary: "Lead our distributed cloud platforms team",
            Description: "Detailed job description...",
            Responsibilities: "Design scalable microservices...",
            EmploymentType: EmploymentType.FullTime,
            WorkplaceType: WorkplaceType.Remote,
            Location: "London, UK",
            SalaryMin: 85000,
            SalaryMax: 110000,
            SalaryCurrency: "GBP",
            ExpiresAtUtc: DateTimeOffset.UtcNow.AddDays(30),
            Requirements: new List<CreateJobRequirementDto>
            {
                new("5+ years of C# / ASP.NET Core experience", RequirementCategory.Experience, RequirementType.Mandatory, 1),
                new("Expertise in distributed architecture", RequirementCategory.Skill, RequirementType.Mandatory, 2),
                new("Kubernetes or Docker certification", RequirementCategory.Certification, RequirementType.Preferred, 3)
            });

        // Act
        var result = await service.CreateJobAsync(company.Id, owner.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Senior .NET Backend Architect");
        result.Status.Should().Be(JobPostingStatus.Draft);
        result.ActiveVersionNumber.Should().Be(1);
        result.Requirements.Should().HaveCount(3);
        result.VersionCount.Should().Be(1);

        var savedJob = context.JobPostings.First(j => j.Id == result.Id);
        savedJob.Status.Should().Be(JobPostingStatus.Draft);
        savedJob.Requirements.Should().HaveCount(3);
        savedJob.Versions.Should().HaveCount(1);
    }

    [Fact]
    public async Task PublishJobAsync_ApprovedCompany_PublishesJob()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, owner, category) = SeedCompanyAndOwner(context, CompanyApprovalStatus.Approved);
        var service = new JobService(context, _auditServiceMock.Object);

        var request = new CreateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "Full Stack React Developer",
            Summary: "React and TypeScript engineer",
            Description: "Full stack description",
            Responsibilities: "Build web UIs",
            EmploymentType: EmploymentType.FullTime,
            WorkplaceType: WorkplaceType.Hybrid,
            Location: "Manchester, UK",
            SalaryMin: 50000,
            SalaryMax: 65000,
            SalaryCurrency: "GBP",
            ExpiresAtUtc: DateTimeOffset.UtcNow.AddDays(15),
            Requirements: new List<CreateJobRequirementDto>
            {
                new("React and TypeScript proficiency", RequirementCategory.Skill, RequirementType.Mandatory, 1)
            });

        var created = await service.CreateJobAsync(company.Id, owner.Id, request);

        // Act
        var published = await service.PublishJobAsync(company.Id, created.Id, owner.Id);

        // Assert
        published.Status.Should().Be(JobPostingStatus.Published);
        published.PublishedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task PublishJobAsync_SuspendedCompany_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, owner, category) = SeedCompanyAndOwner(context, CompanyApprovalStatus.Suspended);
        var service = new JobService(context, _auditServiceMock.Object);

        var request = new CreateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "Junior Dev",
            Summary: "Junior dev role",
            Description: "Details",
            Responsibilities: "Coding",
            EmploymentType: EmploymentType.FullTime,
            WorkplaceType: WorkplaceType.OnSite,
            Location: "Leeds, UK",
            SalaryMin: null,
            SalaryMax: null,
            SalaryCurrency: "GBP",
            ExpiresAtUtc: null,
            Requirements: new List<CreateJobRequirementDto>
            {
                new("Basic programming knowledge", RequirementCategory.Skill, RequirementType.Mandatory, 1)
            });

        var created = await service.CreateJobAsync(company.Id, owner.Id, request);

        // Act
        var act = async () => await service.PublishJobAsync(company.Id, created.Id, owner.Id);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*suspended*");
    }

    [Fact]
    public async Task UpdateJobAsync_PublishedJob_CreatesNewVersionSnapshot()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, owner, category) = SeedCompanyAndOwner(context);
        var service = new JobService(context, _auditServiceMock.Object);

        var createRequest = new CreateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "Original Title",
            Summary: "Original summary",
            Description: "Original description",
            Responsibilities: "Original responsibilities",
            EmploymentType: EmploymentType.FullTime,
            WorkplaceType: WorkplaceType.Remote,
            Location: "Remote",
            SalaryMin: 60000,
            SalaryMax: 70000,
            SalaryCurrency: "USD",
            ExpiresAtUtc: null,
            Requirements: new List<CreateJobRequirementDto>
            {
                new("Skill 1", RequirementCategory.Skill, RequirementType.Mandatory, 1)
            });

        var created = await service.CreateJobAsync(company.Id, owner.Id, createRequest);
        await service.PublishJobAsync(company.Id, created.Id, owner.Id);

        var updateRequest = new UpdateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "Updated Senior Title",
            Summary: "Updated summary",
            Description: "Updated description with new requirements",
            Responsibilities: "Updated responsibilities",
            EmploymentType: EmploymentType.FullTime,
            WorkplaceType: WorkplaceType.Remote,
            Location: "Remote",
            SalaryMin: 70000,
            SalaryMax: 85000,
            SalaryCurrency: "USD",
            ExpiresAtUtc: null,
            Requirements: new List<CreateJobRequirementDto>
            {
                new("Skill 1", RequirementCategory.Skill, RequirementType.Mandatory, 1),
                new("New Skill 2", RequirementCategory.Skill, RequirementType.Mandatory, 2)
            });

        // Act
        var updated = await service.UpdateJobAsync(company.Id, created.Id, owner.Id, updateRequest);

        // Assert
        updated.Title.Should().Be("Updated Senior Title");
        updated.ActiveVersionNumber.Should().Be(2);
        updated.VersionCount.Should().Be(2);

        var jobInDb = context.JobPostings.First(j => j.Id == created.Id);
        jobInDb.Versions.Should().HaveCount(2);
    }

    [Fact]
    public async Task StateTransitions_PauseReopenCloseArchive_TransitionsSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, owner, category) = SeedCompanyAndOwner(context);
        var service = new JobService(context, _auditServiceMock.Object);

        var createRequest = new CreateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "DevOps Engineer",
            Summary: "CI/CD & Cloud",
            Description: "Description",
            Responsibilities: "Manage pipelines",
            EmploymentType: EmploymentType.Contract,
            WorkplaceType: WorkplaceType.Remote,
            Location: "Remote",
            SalaryMin: null,
            SalaryMax: null,
            SalaryCurrency: "USD",
            ExpiresAtUtc: null,
            Requirements: new List<CreateJobRequirementDto>
            {
                new("Terraform & AWS", RequirementCategory.Skill, RequirementType.Mandatory, 1)
            });

        var created = await service.CreateJobAsync(company.Id, owner.Id, createRequest);
        await service.PublishJobAsync(company.Id, created.Id, owner.Id);

        // Act 1: Pause
        var paused = await service.PauseJobAsync(company.Id, created.Id, owner.Id);
        paused.Status.Should().Be(JobPostingStatus.Paused);

        // Act 2: Reopen
        var reopened = await service.ReopenJobAsync(company.Id, created.Id, owner.Id);
        reopened.Status.Should().Be(JobPostingStatus.Published);

        // Act 3: Close
        var closed = await service.CloseJobAsync(company.Id, created.Id, owner.Id);
        closed.Status.Should().Be(JobPostingStatus.Closed);

        // Act 4: Archive
        var archived = await service.ArchiveJobAsync(company.Id, created.Id, owner.Id);
        archived.Status.Should().Be(JobPostingStatus.Archived);
    }

    [Fact]
    public async Task CrossTenant_UserFromOtherCompany_CannotModifyJob()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (companyA, ownerA, category) = SeedCompanyAndOwner(context);

        var otherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "other@intruder.com",
            NormalizedEmail = "OTHER@INTRUDER.COM",
            FirstName = "Intruder",
            LastName = "User",
            SecurityStamp = "stamp-intruder",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(otherUser);
        context.SaveChanges();

        var service = new JobService(context, _auditServiceMock.Object);

        var createRequest = new CreateJobPostingRequest(
            JobCategoryId: category.Id,
            Title: "Protected Job",
            Summary: "Summary",
            Description: "Description",
            Responsibilities: "Responsibilities",
            EmploymentType: EmploymentType.FullTime,
            WorkplaceType: WorkplaceType.Remote,
            Location: "Remote",
            SalaryMin: null,
            SalaryMax: null,
            SalaryCurrency: "USD",
            ExpiresAtUtc: null,
            Requirements: new List<CreateJobRequirementDto> { new("Req", RequirementCategory.Skill, RequirementType.Mandatory, 1) });

        var created = await service.CreateJobAsync(companyA.Id, ownerA.Id, createRequest);

        // Act
        var act = async () => await service.PauseJobAsync(companyA.Id, created.Id, otherUser.Id);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*not an active member*");
    }
}
