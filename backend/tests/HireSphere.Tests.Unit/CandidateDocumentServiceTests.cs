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

public class CandidateDocumentServiceTests
{
    private readonly Mock<ICvStorageService> _storageServiceMock = new();
    private readonly Mock<IDocumentParsingService> _parsingServiceMock = new();
    private readonly Mock<IMalwareScanner> _malwareScannerMock = new();

    public CandidateDocumentServiceTests()
    {
        _malwareScannerMock
            .Setup(m => m.ScanStreamAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MalwareScanResult(true, null, "StaticHeuristicScanner"));

        _storageServiceMock
            .Setup(s => s.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("random_secure_storage_key_123.pdf");

        _parsingServiceMock
            .Setup(p => p.ValidateFileSignature(It.IsAny<Stream>(), It.Is<string>(e => e.Contains("pdf"))))
            .Returns(true);

        _parsingServiceMock
            .Setup(p => p.ParseDocumentAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DocumentParsingResult(
                true,
                "Candidate text content with C# and React.",
                new ExtractedCvData(["C#", "React"], [], [], 3, ["C# and React."]),
                false,
                null));
    }

    private (CandidateProfile candidate, User user) SeedCandidate(HireSphere.Infrastructure.Persistence.HireSphereDbContext context)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "candidate@hiresphere.io",
            NormalizedEmail = "CANDIDATE@HIRESPHERE.IO",
            FirstName = "John",
            LastName = "Doe",
            SecurityStamp = "stamp",
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
        context.SaveChanges();

        return (candidate, user);
    }

    [Fact]
    public async Task UploadCvAsync_WithValidPdf_SavesDocumentAndCreatesExtractionJob()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (candidate, _) = SeedCandidate(context);

        var service = new CandidateDocumentService(
            context,
            _storageServiceMock.Object,
            _parsingServiceMock.Object,
            _malwareScannerMock.Object,
            NullLogger<CandidateDocumentService>.Instance);

        byte[] validPdf = [0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02, 0x03];
        using var stream = new MemoryStream(validPdf);

        var result = await service.UploadCvAsync(candidate.Id, stream, "resume.pdf", "application/pdf");

        result.Should().NotBeNull();
        result.OriginalFileName.Should().Be("resume.pdf");
        result.VersionNumber.Should().Be(1);
        result.IsDefault.Should().BeTrue();
        result.ExtractionStatus.Should().Be(DocumentExtractionStatus.Success);
        result.ExtractedSkills.Should().Contain(["C#", "React"]);
    }

    [Fact]
    public async Task UploadCvAsync_WithUnsupportedExtension_ThrowsValidationException()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (candidate, _) = SeedCandidate(context);

        var service = new CandidateDocumentService(
            context,
            _storageServiceMock.Object,
            _parsingServiceMock.Object,
            _malwareScannerMock.Object,
            NullLogger<CandidateDocumentService>.Instance);

        byte[] bytes = [0x01, 0x02, 0x03, 0x04];
        using var stream = new MemoryStream(bytes);

        var act = () => service.UploadCvAsync(candidate.Id, stream, "malicious.exe", "application/x-msdownload");

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Unsupported file format*");
    }

    [Fact]
    public async Task UploadCvAsync_WithInvalidFileSignature_ThrowsValidationException()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (candidate, _) = SeedCandidate(context);

        var parsingMock = new Mock<IDocumentParsingService>();
        parsingMock.Setup(p => p.ValidateFileSignature(It.IsAny<Stream>(), It.IsAny<string>()))
            .Returns(false); // Invalid magic bytes

        var service = new CandidateDocumentService(
            context,
            _storageServiceMock.Object,
            parsingMock.Object,
            _malwareScannerMock.Object,
            NullLogger<CandidateDocumentService>.Instance);

        byte[] bytes = [0x41, 0x42, 0x43, 0x44];
        using var stream = new MemoryStream(bytes);

        var act = () => service.UploadCvAsync(candidate.Id, stream, "fake.pdf", "application/pdf");

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*File signature mismatch*");
    }

    [Fact]
    public async Task UploadNewVersionAsync_ChainsToRootDocumentAndIncrementsVersionNumber()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (candidate, _) = SeedCandidate(context);

        var service = new CandidateDocumentService(
            context,
            _storageServiceMock.Object,
            _parsingServiceMock.Object,
            _malwareScannerMock.Object,
            NullLogger<CandidateDocumentService>.Instance);

        byte[] validPdf = [0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02, 0x03];
        using var stream1 = new MemoryStream(validPdf);
        var doc1 = await service.UploadCvAsync(candidate.Id, stream1, "resume_v1.pdf", "application/pdf");

        using var stream2 = new MemoryStream(validPdf);
        var doc2 = await service.UploadNewVersionAsync(candidate.Id, doc1.Id, stream2, "resume_v2.pdf", "application/pdf");

        doc2.Should().NotBeNull();
        doc2.VersionNumber.Should().Be(2);
        doc2.RootDocumentId.Should().Be(doc1.Id);
        doc2.OriginalFileName.Should().Be("resume_v2.pdf");
    }

    [Fact]
    public async Task SetDefaultCvAsync_SwitchesDefaultCvForCandidate()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (candidate, _) = SeedCandidate(context);

        var service = new CandidateDocumentService(
            context,
            _storageServiceMock.Object,
            _parsingServiceMock.Object,
            _malwareScannerMock.Object,
            NullLogger<CandidateDocumentService>.Instance);

        byte[] validPdf = [0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02, 0x03];
        using var stream1 = new MemoryStream(validPdf);
        var doc1 = await service.UploadCvAsync(candidate.Id, stream1, "resume_1.pdf", "application/pdf");

        using var stream2 = new MemoryStream(validPdf);
        var doc2 = await service.UploadCvAsync(candidate.Id, stream2, "resume_2.pdf", "application/pdf");

        // Initially doc1 is default
        doc1.IsDefault.Should().BeTrue();
        doc2.IsDefault.Should().BeFalse();

        // Switch default to doc2
        var switched = await service.SetDefaultCvAsync(candidate.Id, doc2.Id);
        switched.Should().BeTrue();

        var list = await service.GetCandidateDocumentsAsync(candidate.Id);
        list.First(d => d.Id == doc1.Id).IsDefault.Should().BeFalse();
        list.First(d => d.Id == doc2.Id).IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task GetDocumentFileForCandidateAsync_UnauthorizedCandidate_ThrowsNotFoundException()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (candidate1, _) = SeedCandidate(context);
        var (candidate2, _) = SeedCandidate(context);

        var service = new CandidateDocumentService(
            context,
            _storageServiceMock.Object,
            _parsingServiceMock.Object,
            _malwareScannerMock.Object,
            NullLogger<CandidateDocumentService>.Instance);

        byte[] validPdf = [0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02, 0x03];
        using var stream = new MemoryStream(validPdf);
        var doc1 = await service.UploadCvAsync(candidate1.Id, stream, "resume_1.pdf", "application/pdf");

        // Candidate 2 attempts to download Candidate 1's document
        var act = () => service.GetDocumentFileForCandidateAsync(candidate2.Id, doc1.Id);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Document not found*");
    }

    [Fact]
    public async Task DeleteDocumentAsync_WhenAttachedToActiveApplication_ThrowsValidationException()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (candidate, _) = SeedCandidate(context);

        var service = new CandidateDocumentService(
            context,
            _storageServiceMock.Object,
            _parsingServiceMock.Object,
            _malwareScannerMock.Object,
            NullLogger<CandidateDocumentService>.Instance);

        byte[] validPdf = [0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02, 0x03];
        using var stream = new MemoryStream(validPdf);
        var doc = await service.UploadCvAsync(candidate.Id, stream, "resume.pdf", "application/pdf");

        // Simulate application attached to this document
        var app = new JobApplication
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            JobPostingId = Guid.NewGuid(),
            JobDescriptionVersionId = Guid.NewGuid(),
            CandidateProfileId = candidate.Id,
            CandidateDocumentId = doc.Id,
            CurrentStage = ApplicationStage.Submitted,
            SubmittedAtUtc = DateTimeOffset.UtcNow
        };
        context.JobApplications.Add(app);
        await context.SaveChangesAsync();

        var act = () => service.DeleteDocumentAsync(candidate.Id, doc.Id);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*active job application*");
    }
}
