using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using HireSphere.Infrastructure.Services;

namespace HireSphere.Tests.Unit;

public class DocumentParsingAndValidationTests
{
    private readonly DocumentParsingService _service = new(NullLogger<DocumentParsingService>.Instance);

    [Fact]
    public void ValidateFileSignature_WithPdfMagicBytes_ReturnsTrue()
    {
        // %PDF
        byte[] pdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37];
        using var stream = new MemoryStream(pdfBytes);

        var result = _service.ValidateFileSignature(stream, ".pdf");

        result.Should().BeTrue();
    }

    [Fact]
    public void ValidateFileSignature_WithInvalidBytes_ReturnsFalse()
    {
        byte[] invalidBytes = [0x41, 0x42, 0x43, 0x44];
        using var stream = new MemoryStream(invalidBytes);

        var result = _service.ValidateFileSignature(stream, ".pdf");

        result.Should().BeFalse();
    }

    [Fact]
    public void ValidateFileSignature_WithDocxMagicBytes_ReturnsTrue()
    {
        // PK\x03\x04
        byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00];
        using var stream = new MemoryStream(docxBytes);

        var result = _service.ValidateFileSignature(stream, "docx");

        result.Should().BeTrue();
    }

    [Fact]
    public void ValidateFileSignature_WithShortStream_ReturnsFalse()
    {
        byte[] shortBytes = [0x25, 0x50];
        using var stream = new MemoryStream(shortBytes);

        var result = _service.ValidateFileSignature(stream, ".pdf");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task ParseDocumentAsync_WithUnsupportedExtension_ReturnsFailure()
    {
        byte[] dummy = [0x01, 0x02, 0x03, 0x04];
        using var stream = new MemoryStream(dummy);

        var result = await _service.ParseDocumentAsync(stream, ".exe");

        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Unsupported file extension");
    }

    [Fact]
    public void ExtractStructuredCvData_WithSkillsAndEducation_ExtractsEvidenceAndEntities()
    {
        var rawText = @"Senior Software Engineer with 6 years of experience in backend development.
Proficient in C#, .NET, ASP.NET Core, React, and PostgreSQL.
Possess AWS Certified Solutions Architect credential.
Graduated with a Bachelor in Computer Science.";

        var structured = _service.ExtractStructuredCvData(rawText);

        structured.ExtractedSkills.Should().Contain(["C#", ".NET", "ASP.NET Core", "React", "PostgreSQL"]);
        structured.ExtractedCertifications.Should().Contain("AWS Certified Solutions Architect");
        structured.ExtractedEducation.Should().Contain("Bachelor");
        structured.ExtractedEducation.Should().Contain("Computer Science");
        structured.EstimatedYearsOfExperience.Should().Be(6);
        structured.KeySectionSnippets.Should().NotBeEmpty();
    }

    [Fact]
    public void ExtractStructuredCvData_WithEmptyText_ReturnsCleanEmptyState()
    {
        var structured = _service.ExtractStructuredCvData("");

        structured.ExtractedSkills.Should().BeEmpty();
        structured.ExtractedCertifications.Should().BeEmpty();
        structured.ExtractedEducation.Should().BeEmpty();
        structured.EstimatedYearsOfExperience.Should().BeNull();
        structured.KeySectionSnippets.Should().BeEmpty();
    }
}
