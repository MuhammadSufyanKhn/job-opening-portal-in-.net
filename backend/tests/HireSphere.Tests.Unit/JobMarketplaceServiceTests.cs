using FluentAssertions;
using Xunit;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class JobMarketplaceServiceTests
{
    private (Company approvedCompany, Company pendingCompany, JobCategory category) SeedMarketplaceData(HireSphere.Infrastructure.Persistence.HireSphereDbContext context)
    {
        var category = new JobCategory
        {
            Id = 1,
            Name = "Software Engineering",
            Slug = "software-engineering",
            DisplayOrder = 1
        };

        var approvedCompany = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Approved Tech Ltd",
            Slug = "approved-tech-ltd",
            Industry = "Software",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };

        var pendingCompany = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Pending Startups Inc",
            Slug = "pending-startups-inc",
            Industry = "Tech",
            ApprovalStatus = CompanyApprovalStatus.PendingApproval
        };

        context.JobCategories.Add(category);
        context.Companies.AddRange(approvedCompany, pendingCompany);
        context.SaveChanges();

        return (approvedCompany, pendingCompany, category);
    }

    [Fact]
    public async Task SearchPublishedJobsAsync_OnlyReturnsPublishedFromApprovedCompanies()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (approvedCompany, pendingCompany, category) = SeedMarketplaceData(context);

        // Job 1: Published & Approved (Should appear)
        var job1 = new JobPosting
        {
            CompanyId = approvedCompany.Id,
            JobCategoryId = category.Id,
            Title = "Senior C# Backend Engineer",
            Slug = "senior-csharp-engineer",
            Summary = "Build microservices",
            Description = "Full description",
            Responsibilities = "Code",
            Location = "London, UK",
            Status = JobPostingStatus.Published,
            PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
            SalaryMin = 80000,
            SalaryMax = 95000
        };

        // Job 2: Draft & Approved (Should NOT appear)
        var job2 = new JobPosting
        {
            CompanyId = approvedCompany.Id,
            JobCategoryId = category.Id,
            Title = "Draft Python Engineer",
            Slug = "draft-python-engineer",
            Summary = "Draft summary",
            Description = "Draft desc",
            Responsibilities = "Draft",
            Location = "London, UK",
            Status = JobPostingStatus.Draft
        };

        // Job 3: Published but Pending Approval Company (Should NOT appear)
        var job3 = new JobPosting
        {
            CompanyId = pendingCompany.Id,
            JobCategoryId = category.Id,
            Title = "Published but Pending Company Engineer",
            Slug = "pending-company-job",
            Summary = "Summary",
            Description = "Desc",
            Responsibilities = "Code",
            Location = "Remote",
            Status = JobPostingStatus.Published,
            PublishedAtUtc = DateTimeOffset.UtcNow
        };

        // Job 4: Published but Expired (Should NOT appear)
        var job4 = new JobPosting
        {
            CompanyId = approvedCompany.Id,
            JobCategoryId = category.Id,
            Title = "Expired Vacancy",
            Slug = "expired-vacancy",
            Summary = "Expired",
            Description = "Desc",
            Responsibilities = "Code",
            Location = "London, UK",
            Status = JobPostingStatus.Published,
            PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
        };

        context.JobPostings.AddRange(job1, job2, job3, job4);
        context.SaveChanges();

        var service = new JobMarketplaceService(context);

        // Act
        var result = await service.SearchPublishedJobsAsync(new JobMarketplaceFilterRequest());

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items[0].Title.Should().Be("Senior C# Backend Engineer");
        result.Items[0].CompanyName.Should().Be("Approved Tech Ltd");
    }

    [Fact]
    public async Task SearchPublishedJobsAsync_FilterByKeywordAndLocation_ReturnsMatchingJob()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (approvedCompany, _, category) = SeedMarketplaceData(context);

        var job1 = new JobPosting
        {
            CompanyId = approvedCompany.Id,
            JobCategoryId = category.Id,
            Title = "Frontend React Developer",
            Slug = "frontend-react-dev",
            Summary = "TypeScript and Next.js",
            Description = "Build interactive UIs",
            Responsibilities = "Web apps",
            Location = "Bristol, UK",
            Status = JobPostingStatus.Published,
            PublishedAtUtc = DateTimeOffset.UtcNow
        };

        var job2 = new JobPosting
        {
            CompanyId = approvedCompany.Id,
            JobCategoryId = category.Id,
            Title = "Data Engineer",
            Slug = "data-engineer",
            Summary = "Spark and SQL",
            Description = "Big data pipeline",
            Responsibilities = "ETL",
            Location = "Manchester, UK",
            Status = JobPostingStatus.Published,
            PublishedAtUtc = DateTimeOffset.UtcNow
        };

        context.JobPostings.AddRange(job1, job2);
        context.SaveChanges();

        var service = new JobMarketplaceService(context);

        // Act 1: Search React
        var reactResult = await service.SearchPublishedJobsAsync(new JobMarketplaceFilterRequest(Search: "React"));
        reactResult.Items.Should().HaveCount(1);
        reactResult.Items[0].Title.Should().Be("Frontend React Developer");

        // Act 2: Filter by Location Bristol
        var locationResult = await service.SearchPublishedJobsAsync(new JobMarketplaceFilterRequest(Location: "Bristol"));
        locationResult.Items.Should().HaveCount(1);
        locationResult.Items[0].Title.Should().Be("Frontend React Developer");
    }

    [Fact]
    public async Task GetPublicJobDetailAsync_DraftJob_ThrowsNotFoundException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (approvedCompany, _, category) = SeedMarketplaceData(context);

        var draftJob = new JobPosting
        {
            CompanyId = approvedCompany.Id,
            JobCategoryId = category.Id,
            Title = "Internal Unreleased Vacancy",
            Slug = "internal-job",
            Summary = "Summary",
            Description = "Desc",
            Responsibilities = "Code",
            Location = "London",
            Status = JobPostingStatus.Draft
        };

        context.JobPostings.Add(draftJob);
        context.SaveChanges();

        var service = new JobMarketplaceService(context);

        // Act
        var act = async () => await service.GetPublicJobDetailAsync(draftJob.Id);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
