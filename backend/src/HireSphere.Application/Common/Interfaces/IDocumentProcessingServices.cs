namespace HireSphere.Application.Common.Interfaces;

public interface ICvStorageService
{
    Task<string> SaveFileAsync(Stream content, string extension, CancellationToken cancellationToken = default);
    Task<Stream?> GetFileStreamAsync(string storageKey, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string storageKey, CancellationToken cancellationToken = default);
    Task<bool> FileExistsAsync(string storageKey, CancellationToken cancellationToken = default);
}

public interface IMalwareScanner
{
    Task<MalwareScanResult> ScanStreamAsync(Stream content, string fileName, CancellationToken cancellationToken = default);
}

public record MalwareScanResult(bool IsClean, string? ThreatFound = null, string? ScannerEngine = "StaticHeuristicScanner");

public interface IDocumentParsingService
{
    Task<DocumentParsingResult> ParseDocumentAsync(Stream fileStream, string fileExtension, CancellationToken cancellationToken = default);
    bool ValidateFileSignature(Stream fileStream, string fileExtension);
}

public record DocumentParsingResult(
    bool IsSuccess,
    string? ExtractedText,
    ExtractedCvData? StructuredData,
    bool IsScannedPdf,
    string? ErrorMessage);

public record ExtractedCvData(
    List<string> ExtractedSkills,
    List<string> ExtractedCertifications,
    List<string> ExtractedEducation,
    int? EstimatedYearsOfExperience,
    List<string> KeySectionSnippets);
