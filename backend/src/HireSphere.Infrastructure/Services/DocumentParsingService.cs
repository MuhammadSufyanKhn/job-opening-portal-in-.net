using System.Text;
using System.Text.RegularExpressions;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.Extensions.Logging;
using UglyToad.PdfPig;
using HireSphere.Application.Common.Interfaces;

namespace HireSphere.Infrastructure.Services;

public class DocumentParsingService : IDocumentParsingService
{
    private readonly ILogger<DocumentParsingService> _logger;

    private static readonly byte[] PdfMagicBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF
    private static readonly byte[] ZipMagicBytes = [0x50, 0x4B, 0x03, 0x04]; // PK\x03\x04 (ZIP / OpenXML)

    // Known Technical Skills Vocabulary
    private static readonly HashSet<string> KnownSkills = new(StringComparer.OrdinalIgnoreCase)
    {
        "C#", ".NET", ".NET Core", "ASP.NET", "ASP.NET Core", "Entity Framework", "EF Core",
        "React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Next.js", "Vue", "Angular",
        "Node.js", "Express", "Python", "Java", "Spring Boot", "Go", "Golang", "Rust",
        "SQL", "SQL Server", "PostgreSQL", "MySQL", "MongoDB", "Redis",
        "Docker", "Kubernetes", "Azure", "AWS", "GCP", "CI/CD", "GitHub Actions",
        "Git", "REST API", "GraphQL", "gRPC", "Microservices", "Event-Driven",
        "xUnit", "NUnit", "TDD", "Clean Architecture", "Domain-Driven Design", "DDD",
        "Linux", "PowerShell", "Bash", "Agile", "Scrum", "Jira"
    };

    // Known Certifications
    private static readonly string[] KnownCertifications =
    [
        "AWS Certified Solutions Architect",
        "AWS Certified Developer",
        "Microsoft Certified: Azure Developer",
        "Microsoft Certified: Azure Solutions Architect",
        "Certified Kubernetes Administrator",
        "Certified Kubernetes Application Developer",
        "CKA", "CKAD", "PMP", "CISSP", "Certified Scrum Master", "CSM", "PSM I"
    ];

    // Education degree terms
    private static readonly string[] EducationKeywords =
    [
        "Bachelor", "Master", "B.Sc", "M.Sc", "B.S.", "M.S.", "Ph.D", "Doctorate",
        "Computer Science", "Software Engineering", "Information Technology", "Computer Engineering"
    ];

    public DocumentParsingService(ILogger<DocumentParsingService> logger)
    {
        _logger = logger;
    }

    public bool ValidateFileSignature(Stream fileStream, string fileExtension)
    {
        var ext = fileExtension.Trim().TrimStart('.').ToLowerInvariant();
        if (fileStream.Length < 4) return false;

        fileStream.Position = 0;
        var header = new byte[4];
        var bytesRead = fileStream.Read(header, 0, 4);
        fileStream.Position = 0;

        if (bytesRead < 4) return false;

        if (ext == "pdf")
        {
            return header.SequenceEqual(PdfMagicBytes);
        }

        if (ext == "docx")
        {
            return header.SequenceEqual(ZipMagicBytes);
        }

        return false;
    }

    public async Task<DocumentParsingResult> ParseDocumentAsync(Stream fileStream, string fileExtension, CancellationToken cancellationToken = default)
    {
        var ext = fileExtension.Trim().TrimStart('.').ToLowerInvariant();

        try
        {
            fileStream.Position = 0;

            if (ext == "pdf")
            {
                return await ExtractTextFromPdfAsync(fileStream, cancellationToken);
            }

            if (ext == "docx")
            {
                return await ExtractTextFromDocxAsync(fileStream, cancellationToken);
            }

            return new DocumentParsingResult(false, null, null, false, $"Unsupported file extension: .{ext}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract text from document with extension .{Extension}", ext);
            return new DocumentParsingResult(false, null, null, false, $"Extraction error: {ex.Message}");
        }
    }

    private Task<DocumentParsingResult> ExtractTextFromPdfAsync(Stream stream, CancellationToken cancellationToken)
    {
        var sb = new StringBuilder();
        int pageCount = 0;

        try
        {
            using var pdf = PdfDocument.Open(stream);
            pageCount = pdf.NumberOfPages;

            foreach (var page in pdf.GetPages())
            {
                if (cancellationToken.IsCancellationRequested) break;

                var text = page.Text;
                if (!string.IsNullOrWhiteSpace(text))
                {
                    sb.AppendLine(text.Trim());
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading PDF document with PdfPig");
            return Task.FromResult(new DocumentParsingResult(false, null, null, false, $"Corrupted or encrypted PDF: {ex.Message}"));
        }

        var fullText = sb.ToString().Trim();

        // Check if scanned / image-only PDF
        if (pageCount > 0 && fullText.Length < 30)
        {
            _logger.LogWarning("PDF contains {Pages} pages but yielded only {Length} text chars. Scanned PDF detected.", pageCount, fullText.Length);
            return Task.FromResult(new DocumentParsingResult(
                IsSuccess: false,
                ExtractedText: fullText,
                StructuredData: null,
                IsScannedPdf: true,
                ErrorMessage: "Document appears to be a scanned image-only PDF. Machine-readable text was not detected."));
        }

        var structuredData = ExtractStructuredCvData(fullText);
        return Task.FromResult(new DocumentParsingResult(true, fullText, structuredData, false, null));
    }

    private Task<DocumentParsingResult> ExtractTextFromDocxAsync(Stream stream, CancellationToken cancellationToken)
    {
        var sb = new StringBuilder();

        try
        {
            using var doc = WordprocessingDocument.Open(stream, false);
            var body = doc.MainDocumentPart?.Document?.Body;
            if (body == null)
            {
                return Task.FromResult(new DocumentParsingResult(false, null, null, false, "Word document body is empty or missing."));
            }

            foreach (var element in body.Elements())
            {
                if (cancellationToken.IsCancellationRequested) break;

                if (element is Paragraph p)
                {
                    var text = p.InnerText?.Trim();
                    if (!string.IsNullOrEmpty(text))
                    {
                        sb.AppendLine(text);
                    }
                }
                else if (element is Table table)
                {
                    foreach (var row in table.Elements<TableRow>())
                    {
                        var cellsText = row.Elements<TableCell>()
                            .Select(c => c.InnerText?.Trim())
                            .Where(t => !string.IsNullOrEmpty(t));
                        sb.AppendLine(string.Join(" | ", cellsText));
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing Word document via OpenXml");
            return Task.FromResult(new DocumentParsingResult(false, null, null, false, $"Malformed DOCX package: {ex.Message}"));
        }

        var fullText = sb.ToString().Trim();
        if (string.IsNullOrWhiteSpace(fullText))
        {
            return Task.FromResult(new DocumentParsingResult(false, null, null, false, "DOCX document contains no readable text."));
        }

        var structuredData = ExtractStructuredCvData(fullText);
        return Task.FromResult(new DocumentParsingResult(true, fullText, structuredData, false, null));
    }

    public ExtractedCvData ExtractStructuredCvData(string rawText)
    {
        var skillsFound = new List<string>();
        var certsFound = new List<string>();
        var eduFound = new List<string>();
        int? yearsOfExp = null;

        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new ExtractedCvData(skillsFound, certsFound, eduFound, null, []);
        }

        // 1. Identify skills using word-boundary matching
        foreach (var skill in KnownSkills)
        {
            var pattern = $@"(?<![\w#+]){Regex.Escape(skill)}(?![\w#+])";
            if (Regex.IsMatch(rawText, pattern, RegexOptions.IgnoreCase))
            {
                skillsFound.Add(skill);
            }
        }

        // 2. Identify Certifications
        foreach (var cert in KnownCertifications)
        {
            if (rawText.Contains(cert, StringComparison.OrdinalIgnoreCase))
            {
                certsFound.Add(cert);
            }
        }

        // 3. Identify Education
        foreach (var edu in EducationKeywords)
        {
            if (Regex.IsMatch(rawText, $@"\b{Regex.Escape(edu)}\b", RegexOptions.IgnoreCase))
            {
                eduFound.Add(edu);
            }
        }

        // 4. Experience heuristic: extract "X years of experience"
        var expMatch = Regex.Match(rawText, @"(\d{1,2})\+?\s*(?:years|yrs)\s*(?:of)?\s*(?:experience|exp)", RegexOptions.IgnoreCase);
        if (expMatch.Success && int.TryParse(expMatch.Groups[1].Value, out var years))
        {
            yearsOfExp = years;
        }

        // 5. Relevant snippet excerpts (first 5 significant paragraphs)
        var paragraphs = rawText
            .Split(new[] { "\r\n\r\n", "\n\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Trim())
            .Where(p => p.Length >= 40)
            .Take(5)
            .ToList();

        return new ExtractedCvData(skillsFound, certsFound, eduFound, yearsOfExp, paragraphs);
    }
}
