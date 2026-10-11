using System.Text;
using FluentAssertions;
using Xunit;
using HireSphere.Application.DTOs.Analytics;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class AnalyticsServiceTests
{
    private (Company company, User recruiter, JobPosting job1, JobPosting job2, User candidate1, User candidate2) SeedAnalyticsFixture(HireSphere.Infrastructure.Persistence.HireSphereDbContext context)
    {
        var recruiter = new User
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
        company.Members.Add(member);

        var category = new JobCategory
        {
            Id = 1,
            Name = "Engineering",
            Slug = "engineering",
            DisplayOrder = 1
        };

        var job1 = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobCategoryId = 1,
            Title = "Cloud Architect",
            Slug = "cloud-architect",
            Summary = "Architect cloud solutions",
            Description = "Full description",
            Responsibilities = "Lead migration",
            Location = "Remote",
            Status = JobPostingStatus.Published,
            ActiveVersionNumber = 1,
            PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-10)
        };
        job1.Versions.Add(new JobDescriptionVersion { Id = Guid.NewGuid(), JobPostingId = job1.Id, VersionNumber = 1, SnapshotJson = "{}" });

        var job2 = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobCategoryId = 1,
            Title = "Security Engineer",
            Slug = "security-engineer",
            Summary = "Secure infrastructure",
            Description = "Full description",
            Responsibilities = "Monitor threats",
            Location = "London",
            Status = JobPostingStatus.Draft,
            ActiveVersionNumber = 1
        };
        job2.Versions.Add(new JobDescriptionVersion { Id = Guid.NewGuid(), JobPostingId = job2.Id, VersionNumber = 1, SnapshotJson = "{}" });

        var candidateUser1 = new User
        {
            Id = Guid.NewGuid(),
            Email = "cand1@example.com",
            NormalizedEmail = "CAND1@EXAMPLE.COM",
            FirstName = "Alice",
            LastName = "Anderson",
            SecurityStamp = "stamp-c1",
            AccountStatus = AccountStatus.Active
        };
        var profile1 = new CandidateProfile { Id = Guid.NewGuid(), UserId = candidateUser1.Id, User = candidateUser1, Headline = "Cloud Architect", Location = "Remote" };

        var candidateUser2 = new User
        {
            Id = Guid.NewGuid(),
            Email = "cand2@example.com",
            NormalizedEmail = "CAND2@EXAMPLE.COM",
            FirstName = "Bob",
            LastName = "Brown",
            SecurityStamp = "stamp-c2",
            AccountStatus = AccountStatus.Active
        };
        var profile2 = new CandidateProfile { Id = Guid.NewGuid(), UserId = candidateUser2.Id, User = candidateUser2, Headline = "SecOps Lead", Location = "London" };

        // Job 1 Application: Alice hired
        var app1 = new JobApplication
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobPostingId = job1.Id,
            CandidateProfileId = profile1.Id,
            JobDescriptionVersionId = job1.Versions.First().Id,
            CurrentStage = ApplicationStage.Hired,
            SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-8)
        };
        app1.StatusHistories.Add(new ApplicationStatusHistory { JobApplicationId = app1.Id, PreviousStage = ApplicationStage.Submitted, NewStage = ApplicationStage.UnderReview, ChangedByUserId = recruiter.Id });
        app1.StatusHistories.Add(new ApplicationStatusHistory { JobApplicationId = app1.Id, PreviousStage = ApplicationStage.UnderReview, NewStage = ApplicationStage.Shortlisted, ChangedByUserId = recruiter.Id });
        app1.StatusHistories.Add(new ApplicationStatusHistory { JobApplicationId = app1.Id, PreviousStage = ApplicationStage.Shortlisted, NewStage = ApplicationStage.InterviewScheduled, ChangedByUserId = recruiter.Id });
        app1.StatusHistories.Add(new ApplicationStatusHistory { JobApplicationId = app1.Id, PreviousStage = ApplicationStage.InterviewScheduled, NewStage = ApplicationStage.Offered, ChangedByUserId = recruiter.Id });
        app1.StatusHistories.Add(new ApplicationStatusHistory { JobApplicationId = app1.Id, PreviousStage = ApplicationStage.Offered, NewStage = ApplicationStage.Hired, ChangedByUserId = recruiter.Id });

        // Job 1 Application: Bob rejected at review
        var app2 = new JobApplication
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobPostingId = job1.Id,
            CandidateProfileId = profile2.Id,
            JobDescriptionVersionId = job1.Versions.First().Id,
            CurrentStage = ApplicationStage.Rejected,
            SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-5)
        };
        app2.StatusHistories.Add(new ApplicationStatusHistory { JobApplicationId = app2.Id, PreviousStage = ApplicationStage.Submitted, NewStage = ApplicationStage.UnderReview, ChangedByUserId = recruiter.Id });
        app2.StatusHistories.Add(new ApplicationStatusHistory { JobApplicationId = app2.Id, PreviousStage = ApplicationStage.UnderReview, NewStage = ApplicationStage.Rejected, ChangedByUserId = recruiter.Id });

        // WorkSim assignment for Alice
        var scenario = new SimulationScenario { Id = Guid.NewGuid(), Title = "Cloud Incident", Category = "DevOps" };
        var scenarioVersion = new ScenarioVersion { Id = Guid.NewGuid(), SimulationScenarioId = scenario.Id, VersionNumber = 1, DefinitionJson = "{}", RubricJson = "{}" };
        var jobConfig = new JobAssessmentConfiguration { Id = Guid.NewGuid(), JobPostingId = job1.Id, ScenarioVersionId = scenarioVersion.Id };

        var assignment = new AssessmentAssignment
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobApplicationId = app1.Id,
            JobAssessmentConfigurationId = jobConfig.Id,
            CandidateProfileId = profile1.Id,
            Status = AssessmentAssignmentStatus.Completed,
            AssignedAtUtc = DateTimeOffset.UtcNow.AddDays(-7),
            CompletedAtUtc = DateTimeOffset.UtcNow.AddDays(-7).AddMinutes(45),
            DeadlineUtc = DateTimeOffset.UtcNow.AddDays(1)
        };

        var session = new SimulationSession
        {
            Id = Guid.NewGuid(),
            AssessmentAssignmentId = assignment.Id,
            CandidateProfileId = profile1.Id,
            ScenarioVersionId = scenarioVersion.Id,
            Status = SimulationSessionStatus.Submitted
        };

        var result = new AssessmentResult
        {
            Id = Guid.NewGuid(),
            SimulationSessionId = session.Id,
            ScenarioVersionId = scenarioVersion.Id,
            TotalScore = 88.5m,
            EvaluationSummary = "Excellent troubleshooting."
        };
        result.CriterionScores.Add(new CriterionScore { AssessmentResultId = result.Id, CriterionName = "Root Cause Analysis", Score = 90m, MaxScore = 100m });
        result.CriterionScores.Add(new CriterionScore { AssessmentResultId = result.Id, CriterionName = "Communication", Score = 87m, MaxScore = 100m });

        session.AssessmentResult = result;
        assignment.Sessions.Add(session);

        context.Users.AddRange(recruiter, candidateUser1, candidateUser2);
        context.Companies.Add(company);
        context.JobCategories.Add(category);
        context.JobPostings.AddRange(job1, job2);
        context.CandidateProfiles.AddRange(profile1, profile2);
        context.JobApplications.AddRange(app1, app2);
        context.SimulationScenarios.Add(scenario);
        context.ScenarioVersions.Add(scenarioVersion);
        context.JobAssessmentConfigurations.Add(jobConfig);
        context.AssessmentAssignments.Add(assignment);
        context.SaveChanges();

        return (company, recruiter, job1, job2, candidateUser1, candidateUser2);
    }

    [Fact]
    public async Task GetCompanyAnalyticsAsync_AuthorizedRecruiter_ReturnsAccurateMetrics()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, job1, _, _, _) = SeedAnalyticsFixture(context);
        var service = new AnalyticsService(context);

        // Act
        var overview = await service.GetCompanyAnalyticsAsync(company.Id, recruiter.Id, new DateRangeFilter { Preset = "30d" });

        // Assert
        overview.Should().NotBeNull();
        overview.CompanyId.Should().Be(company.Id);
        overview.TotalJobs.Should().Be(2);
        overview.PublishedJobs.Should().Be(1);
        overview.DraftJobs.Should().Be(1);
        overview.TotalApplications.Should().Be(2);
        overview.ApplicationsInPeriod.Should().Be(2);
        overview.HiredCount.Should().Be(1);
        overview.RejectedCount.Should().Be(1);
        overview.OverallHireRatePercentage.Should().Be(50.0);

        // Funnel checks
        overview.Funnel.Should().NotBeNull();
        overview.Funnel.TotalApplications.Should().Be(2);
        overview.Funnel.Stages.Should().Contain(s => s.StageName == "Applied" && s.Count == 2);
        overview.Funnel.Stages.Should().Contain(s => s.StageName == "Hired" && s.Count == 1);
        overview.Funnel.TerminalOutcomes.Should().Contain(t => t.OutcomeName == "Rejected" && t.Count == 1);

        // WorkSim checks
        overview.WorkSimMetrics.TotalAssigned.Should().Be(1);
        overview.WorkSimMetrics.CompletedCount.Should().Be(1);
        overview.WorkSimMetrics.CompletionRatePercentage.Should().Be(100.0);
        overview.WorkSimMetrics.AverageScore.Should().Be(88.5m);
        overview.WorkSimMetrics.ScoreBuckets.Should().Contain(b => b.BucketLabel.Contains("Advanced") && b.Count == 1);
        overview.WorkSimMetrics.CriteriaPerformance.Should().HaveCount(2);

        // Job Performance breakdown
        overview.JobPerformance.Should().HaveCount(2);
        var job1Perf = overview.JobPerformance.First(j => j.JobId == job1.Id);
        job1Perf.TotalApplications.Should().Be(2);
        job1Perf.HiredCount.Should().Be(1);
        job1Perf.WorkSimCompletedCount.Should().Be(1);
    }

    [Fact]
    public async Task GetCompanyAnalyticsAsync_UnauthorizedUser_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, _, _, _, _) = SeedAnalyticsFixture(context);
        var service = new AnalyticsService(context);
        var strangerId = Guid.NewGuid();

        // Act
        var act = async () => await service.GetCompanyAnalyticsAsync(company.Id, strangerId);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*not an active member*");
    }

    [Fact]
    public async Task GetCompanyAnalyticsAsync_CustomRangeWithInvalidDates_ThrowsValidationException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, _, _, _, _) = SeedAnalyticsFixture(context);
        var service = new AnalyticsService(context);

        var filter = new DateRangeFilter
        {
            Preset = "custom",
            StartDateUtc = DateTimeOffset.UtcNow,
            EndDateUtc = DateTimeOffset.UtcNow.AddDays(-5) // End before start
        };

        // Act
        var act = async () => await service.GetCompanyAnalyticsAsync(company.Id, recruiter.Id, filter);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*cannot be later than*");
    }

    [Fact]
    public async Task GetJobAnalyticsAsync_ReturnsJobSpecificFunnelAndWorkSimData()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, job1, _, _, _) = SeedAnalyticsFixture(context);
        var service = new AnalyticsService(context);

        // Act
        var jobAnalytics = await service.GetJobAnalyticsAsync(company.Id, job1.Id, recruiter.Id);

        // Assert
        jobAnalytics.Should().NotBeNull();
        jobAnalytics.JobId.Should().Be(job1.Id);
        jobAnalytics.JobTitle.Should().Be("Cloud Architect");
        jobAnalytics.TotalApplications.Should().Be(2);
        jobAnalytics.HiredCount.Should().Be(1);
        jobAnalytics.RejectedCount.Should().Be(1);
        jobAnalytics.Funnel.Stages.Should().NotBeEmpty();
        jobAnalytics.WorkSimMetrics.TotalAssigned.Should().Be(1);
        jobAnalytics.WorkSimMetrics.CompletedCount.Should().Be(1);
    }

    [Fact]
    public async Task ExportCompanyAnalyticsCsvAsync_ProtectsAgainstFormulaInjection()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, recruiter, job1, _, _, _) = SeedAnalyticsFixture(context);

        // Set dangerous title starting with '='
        job1.Title = "=cmd|'/C calc'!A0";
        context.SaveChanges();

        var service = new AnalyticsService(context);

        // Act
        var (csvBytes, fileName) = await service.ExportCompanyAnalyticsCsvAsync(company.Id, recruiter.Id);

        // Assert
        csvBytes.Should().NotBeNull().And.NotBeEmpty();
        fileName.Should().Contain("hiresphere_recruitment_report_");

        var csvText = Encoding.UTF8.GetString(csvBytes);
        csvText.Should().Contain("'=cmd|'/C calc'!A0", "Leading formula symbol must be escaped with apostrophe");
    }

    [Fact]
    public async Task GetPlatformAnalyticsAsync_ReturnsPlatformAggregatedMetrics()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        SeedAnalyticsFixture(context);
        var service = new AnalyticsService(context);

        // Act
        var platform = await service.GetPlatformAnalyticsAsync(new DateRangeFilter { Preset = "all" });

        // Assert
        platform.Should().NotBeNull();
        platform.TotalCompanies.Should().Be(1);
        platform.ApprovedCompanies.Should().Be(1);
        platform.TotalJobs.Should().Be(2);
        platform.PublishedJobs.Should().Be(1);
        platform.TotalApplications.Should().Be(2);
        platform.TotalWorkSimAssignments.Should().Be(1);
        platform.TotalWorkSimCompletions.Should().Be(1);
        platform.PlatformWorkSimCompletionRate.Should().Be(100.0);
        platform.ActiveCompanies.Should().ContainSingle();
        platform.ActiveCompanies[0].CompanyName.Should().Be("Globex Corp");
    }

    [Fact]
    public async Task FunnelCalculations_EmptyApplications_HandlesZeroDivisionSafely()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var emptyCompany = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Empty Corp",
            Slug = "empty-corp",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        var recruiter = new User
        {
            Id = Guid.NewGuid(),
            Email = "recruiter@empty.com",
            NormalizedEmail = "RECRUITER@EMPTY.COM",
            FirstName = "Solo",
            LastName = "Recruiter",
            SecurityStamp = "stamp-s",
            AccountStatus = AccountStatus.Active
        };
        emptyCompany.Members.Add(new CompanyMember
        {
            CompanyId = emptyCompany.Id,
            UserId = recruiter.Id,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active
        });

        context.Users.Add(recruiter);
        context.Companies.Add(emptyCompany);
        context.SaveChanges();

        var service = new AnalyticsService(context);

        // Act
        var overview = await service.GetCompanyAnalyticsAsync(emptyCompany.Id, recruiter.Id);

        // Assert
        overview.TotalApplications.Should().Be(0);
        overview.OverallHireRatePercentage.Should().Be(0.0);
        overview.Funnel.Stages.Should().AllSatisfy(s =>
        {
            s.Count.Should().Be(0);
            s.PercentageOfTotal.Should().Be(0.0);
            s.ConversionRateFromPrevious.Should().Be(0.0);
        });
        overview.WorkSimMetrics.CompletionRatePercentage.Should().Be(0.0);
    }
}
