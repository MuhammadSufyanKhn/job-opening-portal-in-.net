using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class SecurityHardeningTests
{
    [Fact]
    public async Task GetDocumentFileForCompanyAsync_WhenUserIsNotCompanyMember_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var companyId = Guid.NewGuid();
        var outsiderUserId = Guid.NewGuid();

        var (candidate, app, doc) = SeedApplicationWithDocument(context, companyId);

        var storageMock = new FakeCvStorageService();
        var parsingMock = new FakeDocumentParsingService();
        var malwareMock = new FakeMalwareScanner();
        var service = new CandidateDocumentService(
            context,
            storageMock,
            parsingMock,
            malwareMock,
            NullLogger<CandidateDocumentService>.Instance);

        // Act
        var act = () => service.GetDocumentFileForCompanyAsync(companyId, app.Id, outsiderUserId);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*not an active member of this company*");
    }

    [Fact]
    public async Task GetDocumentFileForCompanyAsync_WhenUserIsActiveCompanyMember_ReturnsFileStream()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var companyId = Guid.NewGuid();
        var memberUserId = Guid.NewGuid();

        // Add active company membership
        context.CompanyMembers.Add(new CompanyMember
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            UserId = memberUserId,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active,
            JoinedAtUtc = DateTimeOffset.UtcNow
        });

        var (candidate, app, doc) = SeedApplicationWithDocument(context, companyId);

        var storageMock = new FakeCvStorageService();
        var parsingMock = new FakeDocumentParsingService();
        var malwareMock = new FakeMalwareScanner();
        var service = new CandidateDocumentService(
            context,
            storageMock,
            parsingMock,
            malwareMock,
            NullLogger<CandidateDocumentService>.Instance);

        // Act
        var result = await service.GetDocumentFileForCompanyAsync(companyId, app.Id, memberUserId);

        // Assert
        result.Stream.Should().NotBeNull();
        result.FileName.Should().Be("sample_resume.pdf");
        result.ContentType.Should().Be("application/pdf");
    }

    [Fact]
    public async Task GetMatchReportForApplicationAsync_WhenUserIsNotCompanyMember_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var companyId = Guid.NewGuid();
        var outsiderUserId = Guid.NewGuid();

        var (candidate, app, doc) = SeedApplicationWithDocument(context, companyId);

        var service = new CvMatchingService(context, NullLogger<CvMatchingService>.Instance);

        // Act
        var act = () => service.GetMatchReportForApplicationAsync(companyId, app.Id, outsiderUserId);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*not an active member of this company*");
    }

    [Fact]
    public async Task GetMatchReportForApplicationAsync_WhenUserIsActiveCompanyMember_Succeeds()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var companyId = Guid.NewGuid();
        var memberUserId = Guid.NewGuid();

        context.CompanyMembers.Add(new CompanyMember
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            UserId = memberUserId,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active,
            JoinedAtUtc = DateTimeOffset.UtcNow
        });

        var (candidate, app, doc) = SeedApplicationWithDocument(context, companyId);

        // Pre-create match report
        var report = new CvMatchReport
        {
            Id = Guid.NewGuid(),
            JobApplicationId = app.Id,
            EngineVersion = "1.0-deterministic",
            OverallEvidenceIndex = 85.5m,
            CalculationSummary = "Strong qualifications.",
            CalculatedAtUtc = DateTimeOffset.UtcNow
        };
        context.CvMatchReports.Add(report);
        await context.SaveChangesAsync();

        var service = new CvMatchingService(context, NullLogger<CvMatchingService>.Instance);

        // Act
        var result = await service.GetMatchReportForApplicationAsync(companyId, app.Id, memberUserId);

        // Assert
        result.Should().NotBeNull();
        result.OverallEvidenceIndex.Should().Be(85.5m);
    }

    [Fact]
    public async Task GetCompanyAvailableScenariosAsync_WhenUserIsNotCompanyMember_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var companyId = Guid.NewGuid();
        var outsiderUserId = Guid.NewGuid();

        var auditService = new FakeAuditService();
        var service = new WorkSimManagementService(context, auditService);

        // Act
        var act = () => service.GetCompanyAvailableScenariosAsync(companyId, outsiderUserId);

        // Assert
        await act.Should().ThrowAsync<ForbiddenAccessException>()
            .WithMessage("*not an active member of this company*");
    }

    [Fact]
    public async Task GetCompanyAvailableScenariosAsync_WhenUserIsActiveCompanyMember_ReturnsScenarios()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var companyId = Guid.NewGuid();
        var memberUserId = Guid.NewGuid();

        context.CompanyMembers.Add(new CompanyMember
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            UserId = memberUserId,
            CompanyRole = CompanyRole.Owner,
            MembershipStatus = CompanyMembershipStatus.Active,
            JoinedAtUtc = DateTimeOffset.UtcNow
        });

        var scenario = new SimulationScenario
        {
            Id = Guid.NewGuid(),
            OwnerCompanyId = companyId,
            Title = "Custom Incident Scenario",
            Category = "DevOps",
            Description = "Custom company test",
            EstimatedDurationMinutes = 30,
            IsActive = true
        };
        context.SimulationScenarios.Add(scenario);
        await context.SaveChangesAsync();

        var auditService = new FakeAuditService();
        var service = new WorkSimManagementService(context, auditService);

        // Act
        var results = await service.GetCompanyAvailableScenariosAsync(companyId, memberUserId);

        // Assert
        results.Should().NotBeEmpty();
        results.Should().Contain(s => s.Title == "Custom Incident Scenario");
    }

    [Fact]
    public async Task SuspendUserAsync_RotatesSecurityStampAndRevokesActiveRefreshTokens()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var adminUserId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        var initialStamp = "initial-security-stamp";

        var targetUser = new User
        {
            Id = targetUserId,
            Email = "target@example.com",
            NormalizedEmail = "TARGET@EXAMPLE.COM",
            FirstName = "Target",
            LastName = "User",
            SecurityStamp = initialStamp,
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(targetUser);

        // Add 2 active refresh tokens and 1 already revoked
        context.RefreshTokens.AddRange(
            new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = targetUserId,
                TokenHash = "hash1",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7)
            },
            new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = targetUserId,
                TokenHash = "hash2",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7)
            },
            new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = targetUserId,
                TokenHash = "hash3",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7),
                RevokedAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
            }
        );
        await context.SaveChangesAsync();

        var auditService = new FakeAuditService();
        var userService = new AdminUserService(context, auditService);

        // Act
        await userService.SuspendUserAsync(targetUserId, adminUserId, "Security breach investigation");

        // Assert
        targetUser.AccountStatus.Should().Be(AccountStatus.Disabled);
        targetUser.SecurityStamp.Should().NotBe(initialStamp);

        // All refresh tokens must now be revoked
        var unrevokedCount = context.RefreshTokens.Count(rt => rt.UserId == targetUserId && rt.RevokedAtUtc == null);
        unrevokedCount.Should().Be(0);
    }

    [Fact]
    public async Task GetCompanyApplicationsAsync_WithUnboundedPageSize_ClampsTo100()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var companyId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();

        var company = new Company
        {
            Id = companyId,
            Name = "Acme Corp",
            Slug = "acme-corp",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        company.Members.Add(new CompanyMember
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            UserId = recruiterId,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active,
            JoinedAtUtc = DateTimeOffset.UtcNow
        });
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var auditService = new FakeAuditService();
        var appService = new ApplicationService(context, auditService);

        // Act - request absurdly huge page size (e.g. 5000) and page = 0
        var result = await appService.GetCompanyApplicationsAsync(
            companyId: companyId,
            userId: recruiterId,
            page: 0,
            pageSize: 5000);

        // Assert - pageSize clamped to 100 and page normalized to 1
        result.PageSize.Should().Be(100);
        result.Page.Should().Be(1);
    }

    [Fact]
    public async Task GetCompanyJobsAsync_WithUnboundedPageSize_ClampsTo100()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var companyId = Guid.NewGuid();
        var recruiterId = Guid.NewGuid();

        var company = new Company
        {
            Id = companyId,
            Name = "Acme Corp",
            Slug = "acme-corp",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        company.Members.Add(new CompanyMember
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            UserId = recruiterId,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active,
            JoinedAtUtc = DateTimeOffset.UtcNow
        });
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var auditService = new FakeAuditService();
        var jobService = new JobService(context, auditService);

        // Act - request negative page and 9999 pageSize
        var result = await jobService.GetCompanyJobsAsync(
            companyId: companyId,
            userId: recruiterId,
            page: -5,
            pageSize: 9999);

        // Assert - clamped
        result.PageSize.Should().Be(100);
        result.Page.Should().Be(1);
    }

    private static (CandidateProfile candidate, JobApplication app, CandidateDocument doc) SeedApplicationWithDocument(
        HireSphere.Infrastructure.Persistence.HireSphereDbContext context,
        Guid companyId)
    {
        var company = context.Companies.Find(companyId);
        if (company == null)
        {
            company = new Company
            {
                Id = companyId,
                Name = "Test Corp",
                Slug = "test-corp",
                ApprovalStatus = CompanyApprovalStatus.Approved
            };
            context.Companies.Add(company);
        }

        var job = new JobPosting
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            JobCategoryId = 1,
            Title = "Backend Engineer",
            Slug = "backend-engineer",
            Summary = "Job summary",
            Description = "Job description",
            Responsibilities = "Code",
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

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "candidate@example.com",
            NormalizedEmail = "CANDIDATE@EXAMPLE.COM",
            FirstName = "John",
            LastName = "Doe",
            SecurityStamp = "candidate-stamp",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(user);

        var candidate = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Headline = "Software Developer"
        };
        context.CandidateProfiles.Add(candidate);

        var doc = new CandidateDocument
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = candidate.Id,
            OriginalFileName = "sample_resume.pdf",
            FileExtension = ".pdf",
            MimeType = "application/pdf",
            FileSizeBytes = 1024,
            StorageKey = "test_key.pdf",
            IsDefault = true
        };
        context.CandidateDocuments.Add(doc);

        var app = new JobApplication
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            JobPostingId = job.Id,
            JobPosting = job,
            JobDescriptionVersionId = version.Id,
            CandidateProfileId = candidate.Id,
            CandidateProfile = candidate,
            CandidateDocumentId = doc.Id,
            CandidateDocument = doc,
            CurrentStage = ApplicationStage.Submitted,
            SubmittedAtUtc = DateTimeOffset.UtcNow
        };
        context.JobApplications.Add(app);

        context.SaveChanges();
        return (candidate, app, doc);
    }

    private class FakeCvStorageService : ICvStorageService
    {
        public Task<string> SaveFileAsync(Stream content, string extension, CancellationToken cancellationToken = default)
            => Task.FromResult("fake_key.pdf");

        public Task<Stream?> GetFileStreamAsync(string storageKey, CancellationToken cancellationToken = default)
            => Task.FromResult<Stream?>(new MemoryStream(new byte[] { 0x25, 0x50, 0x44, 0x46 })); // %PDF

        public Task<bool> DeleteFileAsync(string storageKey, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> FileExistsAsync(string storageKey, CancellationToken cancellationToken = default)
            => Task.FromResult(true);
    }

    private class FakeDocumentParsingService : IDocumentParsingService
    {
        public Task<DocumentParsingResult> ParseDocumentAsync(Stream content, string fileExtension, CancellationToken cancellationToken = default)
            => Task.FromResult(new DocumentParsingResult(true, "Parsed CV text", null, false, null));

        public bool ValidateFileSignature(Stream content, string fileExtension) => true;
    }

    private class FakeMalwareScanner : IMalwareScanner
    {
        public Task<MalwareScanResult> ScanStreamAsync(Stream content, string fileName, CancellationToken cancellationToken = default)
            => Task.FromResult(new MalwareScanResult(true, null, "FakeScanner"));
    }

    private class FakeAuditService : IAuditService
    {
        public Task LogAsync(string action, string targetResource, string targetResourceId, Guid? companyId = null, object? metadata = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
