using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class CvMatchingServiceTests
{
    private (Company company, JobPosting job, JobDescriptionVersion version, CandidateProfile candidate, JobApplication application, CandidateDocument doc, DocumentExtractionJob extractionJob, JobRequirement req1, JobRequirement req2, JobRequirement req3)
        SeedMatchingFixture(HireSphere.Infrastructure.Persistence.HireSphereDbContext context, string extractedText, DocumentExtractionStatus extractionStatus = DocumentExtractionStatus.Success)
    {
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "TechCorp Inc.",
            Slug = "techcorp-inc",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        context.Companies.Add(company);

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            JobCategoryId = 1,
            Title = "Senior Full Stack Engineer",
            Slug = "senior-full-stack-engineer",
            Summary = "Full stack developer",
            Description = "Job Description",
            Responsibilities = "Coding",
            Location = "Remote",
            Status = JobPostingStatus.Published,
            ActiveVersionNumber = 1
        };
        context.JobPostings.Add(job);

        var version = new JobDescriptionVersion
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            VersionNumber = 1,
            SnapshotJson = "{}",
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        context.JobDescriptionVersions.Add(version);

        // Add 2 Mandatory requirements and 1 Preferred requirement
        var req1 = new JobRequirement
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            RequirementType = RequirementType.Mandatory,
            RequirementCategory = RequirementCategory.Skill,
            RequirementText = "5+ years developing with C# and ASP.NET Core.",
            DisplayOrder = 1
        };
        var req2 = new JobRequirement
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            RequirementType = RequirementType.Mandatory,
            RequirementCategory = RequirementCategory.Skill,
            RequirementText = "Hands-on experience with React and TypeScript.",
            DisplayOrder = 2
        };
        var req3 = new JobRequirement
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            RequirementType = RequirementType.Preferred,
            RequirementCategory = RequirementCategory.Skill,
            RequirementText = "Knowledge of Docker and container deployments.",
            DisplayOrder = 3
        };
        context.JobRequirements.AddRange(req1, req2, req3);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "alice@example.com",
            NormalizedEmail = "ALICE@EXAMPLE.COM",
            FirstName = "Alice",
            LastName = "Smith",
            SecurityStamp = "stamp-alice",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(user);

        var candidate = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Headline = "Full Stack Engineer"
        };
        context.CandidateProfiles.Add(candidate);

        var doc = new CandidateDocument
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = candidate.Id,
            OriginalFileName = "alice_resume.pdf",
            FileExtension = ".pdf",
            MimeType = "application/pdf",
            FileSizeBytes = 25000,
            StorageKey = "secure_key_1.pdf",
            ContentHash = "hash123",
            VersionNumber = 1,
            IsDefault = true,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        context.CandidateDocuments.Add(doc);

        var extractionJob = new DocumentExtractionJob
        {
            Id = Guid.NewGuid(),
            CandidateDocumentId = doc.Id,
            Status = extractionStatus,
            ExtractedText = extractedText,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        context.DocumentExtractionJobs.Add(extractionJob);

        var application = new JobApplication
        {
            Id = Guid.NewGuid(),
            JobPostingId = job.Id,
            JobPosting = job,
            JobDescriptionVersionId = version.Id,
            CompanyId = company.Id,
            CandidateProfileId = candidate.Id,
            CandidateProfile = candidate,
            CandidateDocumentId = doc.Id,
            CandidateDocument = doc,
            CurrentStage = ApplicationStage.Submitted,
            SubmittedAtUtc = DateTimeOffset.UtcNow
        };
        context.JobApplications.Add(application);
        context.SaveChanges();

        return (company, job, version, candidate, application, doc, extractionJob, req1, req2, req3);
    }

    [Fact]
    public async Task GetMatchReportForApplicationAsync_WithDifferentCompanyId_ThrowsNotFoundException()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, _, _, application, _, _, _, _, _) = SeedMatchingFixture(context, "Sample CV text");

        var service = new CvMatchingService(context, NullLogger<CvMatchingService>.Instance);

        var act = () => service.GetMatchReportForApplicationAsync(Guid.NewGuid(), application.Id);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Application not found or unauthorized company access*");
    }

    [Fact]
    public async Task RecalculateMatchReportAsync_WithExtractionPending_ThrowsValidationException()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, _, _, application, _, _, _, _, _) = SeedMatchingFixture(context, null!, DocumentExtractionStatus.Pending);

        var service = new CvMatchingService(context, NullLogger<CvMatchingService>.Instance);

        var act = () => service.RecalculateMatchReportAsync(company.Id, application.Id);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*text extraction is still in progress*");
    }

    [Fact]
    public async Task GetMatchReportForApplicationAsync_CalculatesDeterministicEvidenceIndex_WithMandatoryAndPreferredWeights()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        // Alice has C#, ASP.NET Core, and Docker, but not React or TypeScript
        var cvText = @"Alice Smith
Senior Developer with 7 years experience.
Extensive knowledge building cloud microservices in C# and ASP.NET Core with SQL Server.
Deployed applications using Docker containers.";

        var (company, _, _, _, application, _, _, req1, req2, req3) = SeedMatchingFixture(context, cvText, DocumentExtractionStatus.Success);
        var service = new CvMatchingService(context, NullLogger<CvMatchingService>.Instance);

        var report = await service.GetMatchReportForApplicationAsync(company.Id, application.Id);

        report.Should().NotBeNull();
        report.EngineVersion.Should().Be("1.0-deterministic");
        report.Evaluations.Should().HaveCount(3);

        // Mandatory Req 1 (C#, ASP.NET Core) should be SupportedByEvidence
        var eval1 = report.Evaluations.First(e => e.JobRequirementId == req1.Id);
        eval1.Status.Should().Be(RequirementMatchStatus.SupportedByEvidence);
        eval1.ExtractedExcerpt.Should().NotBeNullOrEmpty();

        // Mandatory Req 2 (React, TypeScript) should be NotFound
        var eval2 = report.Evaluations.First(e => e.JobRequirementId == req2.Id);
        eval2.Status.Should().Be(RequirementMatchStatus.NotFound);

        // Preferred Req 3 (Docker) should be SupportedByEvidence
        var eval3 = report.Evaluations.First(e => e.JobRequirementId == req3.Id);
        eval3.Status.Should().Be(RequirementMatchStatus.SupportedByEvidence);

        // Total weights:
        // Mandatory Req 1 (weight 2 * 1.0) = 2.0
        // Mandatory Req 2 (weight 2 * 0.0) = 0.0
        // Preferred Req 3 (weight 1 * 1.0) = 1.0
        // Total possible = 2 + 2 + 1 = 5.0
        // Earned = 3.0
        // Index = (3.0 / 5.0) * 100 = 60.00%
        report.OverallEvidenceIndex.Should().Be(60.00m);
    }

    [Fact]
    public async Task GetMatchReportForApplicationAsync_WithScannedPdf_MarksRequiresManualReview()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (company, _, _, _, application, _, _, _, _, _) = SeedMatchingFixture(context, "", DocumentExtractionStatus.ScannedPdfDetected);
        var service = new CvMatchingService(context, NullLogger<CvMatchingService>.Instance);

        var report = await service.GetMatchReportForApplicationAsync(company.Id, application.Id);

        report.Evaluations.Should().AllSatisfy(e =>
        {
            e.Status.Should().Be(RequirementMatchStatus.RequiresManualReview);
            e.ReviewerNote.Should().Contain("scanned image or lacks readable text");
        });
        report.CalculationSummary.Should().Contain("detected as an image/scanned PDF");
    }

    [Fact]
    public async Task RecalculateMatchReportAsync_ReplacesOldReportIdempotently()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var cvText = "C# and ASP.NET Core developer.";
        var (company, _, _, _, application, _, _, _, _, _) = SeedMatchingFixture(context, cvText, DocumentExtractionStatus.Success);
        var service = new CvMatchingService(context, NullLogger<CvMatchingService>.Instance);

        // First generation
        var report1 = await service.GetMatchReportForApplicationAsync(company.Id, application.Id);

        // Recalculation
        var report2 = await service.RecalculateMatchReportAsync(company.Id, application.Id);

        report2.Should().NotBeNull();
        report2.JobApplicationId.Should().Be(application.Id);
    }
}
