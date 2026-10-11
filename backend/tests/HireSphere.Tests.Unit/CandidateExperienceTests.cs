using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using HireSphere.Application.DTOs.Candidate;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.DTOs.Profile;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class CandidateExperienceTests
{
    [Fact]
    public void CalculateProfileCompletion_EmptyProfile_ReturnsZeroPercentAndMissingList()
    {
        // Act
        var (percentage, missing) = CandidateProfileService.CalculateProfileCompletion(
            firstName: null,
            lastName: null,
            headline: null,
            summary: null,
            location: null,
            yearsOfExperience: null,
            linkedInUrl: null,
            gitHubUrl: null,
            portfolioUrl: null,
            hasPrimaryCv: false);

        // Assert
        percentage.Should().Be(0);
        missing.Should().HaveCount(7);
        missing.Should().Contain("Complete your full name");
        missing.Should().Contain("Add a professional headline");
        missing.Should().Contain("Upload your verified primary CV");
    }

    [Fact]
    public void CalculateProfileCompletion_CompleteProfileWithCv_Returns100Percent()
    {
        // Act
        var (percentage, missing) = CandidateProfileService.CalculateProfileCompletion(
            firstName: "Alex",
            lastName: "Rivera",
            headline: "Senior Distributed Systems Engineer",
            summary: "Over 8 years building highly resilient microservice platforms.",
            location: "Zurich, Switzerland",
            yearsOfExperience: 8,
            linkedInUrl: "https://linkedin.com/in/alexrivera",
            gitHubUrl: "https://github.com/alexrivera",
            portfolioUrl: null,
            hasPrimaryCv: true);

        // Assert
        percentage.Should().Be(100);
        missing.Should().BeEmpty();
    }

    [Fact]
    public async Task CandidateDashboardService_GetDashboardAsync_AggregatesCorrectMetrics()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "dashboard.candidate@example.com",
            NormalizedEmail = "DASHBOARD.CANDIDATE@EXAMPLE.COM",
            FirstName = "Dana",
            LastName = "Vance",
            SecurityStamp = "sec-stamp-dash",
            AccountStatus = AccountStatus.Active
        };
        var profile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Headline = "Lead QA Engineer",
            Summary = "Specialized in performance benchmarking and test automation.",
            Location = "Austin, TX",
            YearsOfExperience = 6
        };

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Skyline Cloud Labs",
            Slug = "skyline-cloud-labs",
            Description = "Enterprise cloud infrastructure",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Company = company,
            JobCategoryId = 1,
            Title = "Senior QA Automation Engineer",
            Slug = "senior-qa-automation-engineer",
            Summary = "Drive end-to-end reliability for our platform.",
            Description = "Detailed description.",
            Status = JobPostingStatus.Published
        };

        var application = new JobApplication
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = profile.Id,
            JobPostingId = job.Id,
            JobPosting = job,
            CompanyId = company.Id,
            Company = company,
            CurrentStage = ApplicationStage.UnderReview,
            SubmittedAtUtc = DateTimeOffset.UtcNow
        };

        var cv = new CandidateDocument
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = profile.Id,
            OriginalFileName = "Dana_Vance_Resume.pdf",
            StorageKey = "docs/dana_cv.pdf",
            FileExtension = ".pdf",
            MimeType = "application/pdf",
            IsDefault = true,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        context.Users.Add(user);
        context.CandidateProfiles.Add(profile);
        context.Companies.Add(company);
        context.JobPostings.Add(job);
        context.JobApplications.Add(application);
        context.CandidateDocuments.Add(cv);
        await context.SaveChangesAsync();

        var savedJobsService = new CandidateSavedJobsService(context, NullLogger<CandidateSavedJobsService>.Instance);
        var dashboardService = new CandidateDashboardService(context, savedJobsService, NullLogger<CandidateDashboardService>.Instance);

        // Act
        var dashboard = await dashboardService.GetDashboardAsync(user.Id);

        // Assert
        dashboard.Should().NotBeNull();
        dashboard.FullName.Should().Be("Dana Vance");
        dashboard.HasPrimaryCv.Should().BeTrue();
        dashboard.PrimaryCvFileName.Should().Be("Dana_Vance_Resume.pdf");
        dashboard.TotalApplications.Should().Be(1);
        dashboard.ActiveApplications.Should().Be(1);
        dashboard.CompletedApplications.Should().Be(0);
        dashboard.RecentApplications.Should().HaveCount(1);
        dashboard.RecentApplications[0].JobTitle.Should().Be("Senior QA Automation Engineer");
    }

    [Fact]
    public async Task CandidateSavedJobsService_SaveJob_DuplicateDoesNotCreateSecondRecord()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "saver@example.com",
            NormalizedEmail = "SAVER@EXAMPLE.COM",
            FirstName = "Sam",
            LastName = "Green",
            SecurityStamp = "sec-stamp-save",
            AccountStatus = AccountStatus.Active
        };
        var profile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user
        };
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Quantum Devs",
            Slug = "quantum-devs",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Company = company,
            JobCategoryId = 1,
            Title = "Backend C# Engineer",
            Slug = "backend-csharp-engineer",
            Summary = "Develop cloud microservices.",
            Description = "Full description here.",
            Status = JobPostingStatus.Published
        };

        context.Users.Add(user);
        context.CandidateProfiles.Add(profile);
        context.Companies.Add(company);
        context.JobPostings.Add(job);
        await context.SaveChangesAsync();

        var service = new CandidateSavedJobsService(context, NullLogger<CandidateSavedJobsService>.Instance);

        // Act - Save once
        var firstSave = await service.SaveJobAsync(user.Id, job.Id);
        // Act - Save duplicate
        var secondSave = await service.SaveJobAsync(user.Id, job.Id);

        // Assert
        firstSave.Should().NotBeNull();
        secondSave.Should().NotBeNull();
        firstSave.SavedJobId.Should().Be(secondSave.SavedJobId);

        var list = await service.GetSavedJobsAsync(user.Id);
        list.Should().HaveCount(1);

        // Act - Unsave
        var unsaved = await service.UnsaveJobAsync(user.Id, job.Id);
        unsaved.Should().BeTrue();

        var listAfterUnsave = await service.GetSavedJobsAsync(user.Id);
        listAfterUnsave.Should().BeEmpty();
    }

    [Fact]
    public async Task CandidateSavedJobsService_SaveJob_RejectsUnpublishedJob()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "saver2@example.com",
            NormalizedEmail = "SAVER2@EXAMPLE.COM",
            FirstName = "Jordan",
            LastName = "Lee",
            SecurityStamp = "sec-stamp-save-2",
            AccountStatus = AccountStatus.Active
        };
        var profile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user
        };
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Draft Corp",
            Slug = "draft-corp",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        var draftJob = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Company = company,
            JobCategoryId = 1,
            Title = "Unpublished Draft Role",
            Slug = "unpublished-draft-role",
            Summary = "Summary",
            Description = "Description",
            Status = JobPostingStatus.Draft // Not published
        };

        context.Users.Add(user);
        context.CandidateProfiles.Add(profile);
        context.Companies.Add(company);
        context.JobPostings.Add(draftJob);
        await context.SaveChangesAsync();

        var service = new CandidateSavedJobsService(context, NullLogger<CandidateSavedJobsService>.Instance);

        // Act & Assert
        var act = async () => await service.SaveJobAsync(user.Id, draftJob.Id);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task JobMarketplaceService_SearchPublishedJobs_FindsJobsByRequiredSkill()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "DataFlow Inc",
            Slug = "dataflow-inc",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
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
            Company = company,
            JobCategoryId = category.Id,
            JobCategory = category,
            Title = "Full Stack Engineer",
            Slug = "full-stack-engineer",
            Summary = "Build scalable web applications",
            Description = "Description",
            Status = JobPostingStatus.Published
        };

        var skillRequirement = new JobRequirement
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            RequirementCategory = RequirementCategory.Skill,
            RequirementType = RequirementType.Mandatory,
            RequirementText = "Kubernetes orchestration and Docker containers"
        };

        context.Companies.Add(company);
        context.JobCategories.Add(category);
        context.JobPostings.Add(job);
        context.JobRequirements.Add(skillRequirement);
        await context.SaveChangesAsync();

        var marketplaceService = new JobMarketplaceService(context);

        // Act - Search by skill keyword "Kubernetes"
        var result = await marketplaceService.SearchPublishedJobsAsync(new JobMarketplaceFilterRequest
        {
            Search = "Kubernetes"
        });

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items[0].Title.Should().Be("Full Stack Engineer");
        result.Items[0].TopSkills.Should().Contain("Kubernetes orchestration and Docker containers");
    }
}
