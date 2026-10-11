using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using HireSphere.Domain.Exceptions;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Document;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;

namespace HireSphere.Application.Services;

public interface ICandidateDocumentService
{
    Task<CandidateDocumentDetailDto> UploadCvAsync(Guid candidateProfileId, Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<CandidateDocumentDetailDto> UploadNewVersionAsync(Guid candidateProfileId, Guid rootDocumentId, Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<List<CandidateDocumentSummaryDto>> GetCandidateDocumentsAsync(Guid candidateProfileId, CancellationToken cancellationToken = default);
    Task<CandidateDocumentDetailDto> GetDocumentDetailAsync(Guid candidateProfileId, Guid documentId, CancellationToken cancellationToken = default);
    Task<bool> SetDefaultCvAsync(Guid candidateProfileId, Guid documentId, CancellationToken cancellationToken = default);
    Task<bool> DeleteDocumentAsync(Guid candidateProfileId, Guid documentId, CancellationToken cancellationToken = default);
    Task<(Stream Stream, string FileName, string ContentType)> GetDocumentFileForCandidateAsync(Guid candidateProfileId, Guid documentId, CancellationToken cancellationToken = default);
    Task<(Stream Stream, string FileName, string ContentType)> GetDocumentFileForCompanyAsync(Guid companyId, Guid applicationId, Guid? currentUserId = null, CancellationToken cancellationToken = default);
}

public class CandidateDocumentService : ICandidateDocumentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICvStorageService _storageService;
    private readonly IDocumentParsingService _parsingService;
    private readonly IMalwareScanner _malwareScanner;
    private readonly ILogger<CandidateDocumentService> _logger;

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB limit
    private static readonly string[] AllowedExtensions = [".pdf", ".docx"];

    public CandidateDocumentService(
        IApplicationDbContext context,
        ICvStorageService storageService,
        IDocumentParsingService parsingService,
        IMalwareScanner malwareScanner,
        ILogger<CandidateDocumentService> logger)
    {
        _context = context;
        _storageService = storageService;
        _parsingService = parsingService;
        _malwareScanner = malwareScanner;
        _logger = logger;
    }

    public async Task<CandidateDocumentDetailDto> UploadCvAsync(
        Guid candidateProfileId,
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var candidate = await _context.CandidateProfiles
            .FirstOrDefaultAsync(c => c.Id == candidateProfileId, cancellationToken)
            ?? throw new NotFoundException("Candidate profile not found.");

        ValidateFile(stream, fileName, contentType);

        // Scan stream via malware abstraction
        var scanResult = await _malwareScanner.ScanStreamAsync(stream, fileName, cancellationToken);
        if (!scanResult.IsClean)
        {
            throw new ValidationException($"Malware scanner detected threat in document: {scanResult.ThreatFound}");
        }

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var contentHash = ComputeSha256Hash(stream);

        // Check if candidate has existing documents
        var hasExisting = await _context.CandidateDocuments
            .AnyAsync(d => d.CandidateProfileId == candidateProfileId && !d.IsDeleted, cancellationToken);

        // Save file to private storage
        var storageKey = await _storageService.SaveFileAsync(stream, ext, cancellationToken);

        var document = new CandidateDocument
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = candidateProfileId,
            OriginalFileName = Path.GetFileName(fileName),
            StorageKey = storageKey,
            FileExtension = ext,
            MimeType = contentType,
            FileSizeBytes = stream.Length,
            IsDefault = !hasExisting, // First document becomes default
            VersionNumber = 1,
            RootDocumentId = null,
            ContentHash = contentHash,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            IsDeleted = false
        };

        _context.CandidateDocuments.Add(document);

        // Create extraction job
        var extractionJob = new DocumentExtractionJob
        {
            Id = Guid.NewGuid(),
            CandidateDocumentId = document.Id,
            Status = DocumentExtractionStatus.Processing,
            ParserVersion = "1.0",
            AttemptCount = 1,
            StartedAtUtc = DateTimeOffset.UtcNow,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.DocumentExtractionJobs.Add(extractionJob);
        await _context.SaveChangesAsync(cancellationToken);

        // Execute text extraction
        await ProcessExtractionAsync(document, extractionJob, stream, ext, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToDetailDtoAsync(document, extractionJob, cancellationToken);
    }

    public async Task<CandidateDocumentDetailDto> UploadNewVersionAsync(
        Guid candidateProfileId,
        Guid rootDocumentId,
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var rootDoc = await _context.CandidateDocuments
            .FirstOrDefaultAsync(d => d.Id == rootDocumentId && d.CandidateProfileId == candidateProfileId && !d.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Target root CV document not found.");

        ValidateFile(stream, fileName, contentType);

        var scanResult = await _malwareScanner.ScanStreamAsync(stream, fileName, cancellationToken);
        if (!scanResult.IsClean)
        {
            throw new ValidationException($"Malware scanner detected threat in document: {scanResult.ThreatFound}");
        }

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var contentHash = ComputeSha256Hash(stream);

        // Determine next version number in chain
        var currentMaxVersion = await _context.CandidateDocuments
            .Where(d => (d.Id == rootDocumentId || d.RootDocumentId == rootDocumentId) && !d.IsDeleted)
            .MaxAsync(d => (int?)d.VersionNumber, cancellationToken) ?? 1;

        var nextVersion = currentMaxVersion + 1;

        var storageKey = await _storageService.SaveFileAsync(stream, ext, cancellationToken);

        var newVersionDoc = new CandidateDocument
        {
            Id = Guid.NewGuid(),
            CandidateProfileId = candidateProfileId,
            OriginalFileName = Path.GetFileName(fileName),
            StorageKey = storageKey,
            FileExtension = ext,
            MimeType = contentType,
            FileSizeBytes = stream.Length,
            IsDefault = rootDoc.IsDefault,
            VersionNumber = nextVersion,
            RootDocumentId = rootDocumentId,
            ContentHash = contentHash,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            IsDeleted = false
        };

        // If old root was default, make this new version default instead
        if (rootDoc.IsDefault)
        {
            rootDoc.IsDefault = false;
        }

        _context.CandidateDocuments.Add(newVersionDoc);

        var extractionJob = new DocumentExtractionJob
        {
            Id = Guid.NewGuid(),
            CandidateDocumentId = newVersionDoc.Id,
            Status = DocumentExtractionStatus.Processing,
            ParserVersion = "1.0",
            AttemptCount = 1,
            StartedAtUtc = DateTimeOffset.UtcNow,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.DocumentExtractionJobs.Add(extractionJob);
        await _context.SaveChangesAsync(cancellationToken);

        await ProcessExtractionAsync(newVersionDoc, extractionJob, stream, ext, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToDetailDtoAsync(newVersionDoc, extractionJob, cancellationToken);
    }

    public async Task<List<CandidateDocumentSummaryDto>> GetCandidateDocumentsAsync(Guid candidateProfileId, CancellationToken cancellationToken = default)
    {
        var docs = await _context.CandidateDocuments
            .AsNoTracking()
            .Where(d => d.CandidateProfileId == candidateProfileId && !d.IsDeleted)
            .Include(d => d.ExtractionJobs)
            .OrderByDescending(d => d.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return docs.Select(d =>
        {
            var latestJob = d.ExtractionJobs.OrderByDescending(j => j.CreatedAtUtc).FirstOrDefault();
            int skillsCount = 0;
            if (latestJob?.StructuredDataJson != null)
            {
                try
                {
                    var data = JsonSerializer.Deserialize<ExtractedCvData>(latestJob.StructuredDataJson);
                    skillsCount = data?.ExtractedSkills.Count ?? 0;
                }
                catch { }
            }

            return new CandidateDocumentSummaryDto(
                d.Id,
                d.CandidateProfileId,
                d.OriginalFileName,
                d.FileExtension,
                d.MimeType,
                d.FileSizeBytes,
                d.IsDefault,
                d.VersionNumber,
                d.RootDocumentId,
                d.ContentHash,
                d.CreatedAtUtc,
                latestJob?.Status ?? DocumentExtractionStatus.Pending,
                skillsCount);
        }).ToList();
    }

    public async Task<CandidateDocumentDetailDto> GetDocumentDetailAsync(Guid candidateProfileId, Guid documentId, CancellationToken cancellationToken = default)
    {
        var doc = await _context.CandidateDocuments
            .AsNoTracking()
            .Include(d => d.ExtractionJobs)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.CandidateProfileId == candidateProfileId && !d.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Document not found or access denied.");

        var latestJob = doc.ExtractionJobs.OrderByDescending(j => j.CreatedAtUtc).FirstOrDefault();
        return await MapToDetailDtoAsync(doc, latestJob, cancellationToken);
    }

    public async Task<bool> SetDefaultCvAsync(Guid candidateProfileId, Guid documentId, CancellationToken cancellationToken = default)
    {
        var targetDoc = await _context.CandidateDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.CandidateProfileId == candidateProfileId && !d.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Target document not found.");

        var allCandidateDocs = await _context.CandidateDocuments
            .Where(d => d.CandidateProfileId == candidateProfileId && !d.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var doc in allCandidateDocs)
        {
            doc.IsDefault = (doc.Id == documentId);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteDocumentAsync(Guid candidateProfileId, Guid documentId, CancellationToken cancellationToken = default)
    {
        var doc = await _context.CandidateDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.CandidateProfileId == candidateProfileId && !d.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Document not found.");

        // Check if referenced by active applications
        var isReferencedInApplications = await _context.JobApplications
            .AnyAsync(a => a.CandidateDocumentId == documentId && a.CurrentStage != ApplicationStage.Withdrawn, cancellationToken);

        if (isReferencedInApplications)
        {
            throw new ValidationException("Cannot delete this CV because it is linked to an active job application.");
        }

        doc.IsDeleted = true;
        doc.DeletedAtUtc = DateTimeOffset.UtcNow;

        if (doc.IsDefault)
        {
            doc.IsDefault = false;
            // Promote next available document to default if one exists
            var nextAvailable = await _context.CandidateDocuments
                .Where(d => d.CandidateProfileId == candidateProfileId && d.Id != documentId && !d.IsDeleted)
                .OrderByDescending(d => d.CreatedAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (nextAvailable != null)
            {
                nextAvailable.IsDefault = true;
            }
        }

        // If not referenced in any applications, we can safely delete physical file too
        if (!isReferencedInApplications)
        {
            await _storageService.DeleteFileAsync(doc.StorageKey, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<(Stream Stream, string FileName, string ContentType)> GetDocumentFileForCandidateAsync(
        Guid candidateProfileId,
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var doc = await _context.CandidateDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId && d.CandidateProfileId == candidateProfileId && !d.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Document not found or unauthorized.");

        var stream = await _storageService.GetFileStreamAsync(doc.StorageKey, cancellationToken)
            ?? throw new NotFoundException("File content missing from private storage.");

        return (stream, doc.OriginalFileName, doc.MimeType);
    }

    public async Task<(Stream Stream, string FileName, string ContentType)> GetDocumentFileForCompanyAsync(
        Guid companyId,
        Guid applicationId,
        Guid? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        // Enforce company membership check when caller identity is provided
        if (currentUserId.HasValue)
        {
            var isMember = await _context.CompanyMembers
                .AnyAsync(cm => cm.CompanyId == companyId && cm.UserId == currentUserId.Value && cm.MembershipStatus == CompanyMembershipStatus.Active, cancellationToken);

            if (!isMember)
            {
                throw new ForbiddenAccessException("You are not an active member of this company.");
            }
        }

        var application = await _context.JobApplications
            .AsNoTracking()
            .Include(a => a.CandidateDocument)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, cancellationToken)
            ?? throw new NotFoundException("Application not found or unauthorized company access.");

        if (application.CandidateDocument == null || application.CandidateDocumentId == null)
        {
            throw new NotFoundException("No CV document attached to this application.");
        }

        var doc = application.CandidateDocument;
        var stream = await _storageService.GetFileStreamAsync(doc.StorageKey, cancellationToken)
            ?? throw new NotFoundException("File content missing from private storage.");

        return (stream, doc.OriginalFileName, doc.MimeType);
    }

    private async Task ProcessExtractionAsync(
        CandidateDocument doc,
        DocumentExtractionJob extractionJob,
        Stream stream,
        string ext,
        CancellationToken cancellationToken)
    {
        try
        {
            var parseResult = await _parsingService.ParseDocumentAsync(stream, ext, cancellationToken);

            if (parseResult.IsSuccess)
            {
                extractionJob.Status = DocumentExtractionStatus.Success;
                extractionJob.ExtractedText = parseResult.ExtractedText;
                extractionJob.StructuredDataJson = parseResult.StructuredData != null
                    ? JsonSerializer.Serialize(parseResult.StructuredData)
                    : null;
                extractionJob.CompletedAtUtc = DateTimeOffset.UtcNow;
            }
            else if (parseResult.IsScannedPdf)
            {
                extractionJob.Status = DocumentExtractionStatus.ScannedPdfDetected;
                extractionJob.ErrorMessage = parseResult.ErrorMessage;
                extractionJob.CompletedAtUtc = DateTimeOffset.UtcNow;
            }
            else
            {
                extractionJob.Status = DocumentExtractionStatus.Failed;
                extractionJob.ErrorMessage = parseResult.ErrorMessage;
                extractionJob.CompletedAtUtc = DateTimeOffset.UtcNow;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected exception during extraction for document {DocumentId}", doc.Id);
            extractionJob.Status = DocumentExtractionStatus.Failed;
            extractionJob.ErrorMessage = ex.Message;
            extractionJob.CompletedAtUtc = DateTimeOffset.UtcNow;
        }
    }

    private async Task<CandidateDocumentDetailDto> MapToDetailDtoAsync(
        CandidateDocument doc,
        DocumentExtractionJob? job,
        CancellationToken cancellationToken)
    {
        var rootId = doc.RootDocumentId ?? doc.Id;
        var versionsCount = await _context.CandidateDocuments
            .CountAsync(d => (d.Id == rootId || d.RootDocumentId == rootId) && !d.IsDeleted, cancellationToken);

        ExtractedCvData? structured = null;
        if (job?.StructuredDataJson != null)
        {
            try
            {
                structured = JsonSerializer.Deserialize<ExtractedCvData>(job.StructuredDataJson);
            }
            catch { }
        }

        var snippet = job?.ExtractedText != null && job.ExtractedText.Length > 400
            ? job.ExtractedText[..400] + "..."
            : job?.ExtractedText;

        return new CandidateDocumentDetailDto(
            doc.Id,
            doc.CandidateProfileId,
            doc.OriginalFileName,
            doc.FileExtension,
            doc.MimeType,
            doc.FileSizeBytes,
            doc.IsDefault,
            doc.VersionNumber,
            doc.RootDocumentId,
            doc.ContentHash,
            doc.CreatedAtUtc,
            job?.Status ?? DocumentExtractionStatus.Pending,
            snippet,
            structured?.ExtractedSkills ?? [],
            structured?.ExtractedCertifications ?? [],
            structured?.ExtractedEducation ?? [],
            structured?.EstimatedYearsOfExperience,
            Math.Max(1, versionsCount),
            job?.ErrorMessage);
    }

    private void ValidateFile(Stream stream, string fileName, string contentType)
    {
        if (stream == null || stream.Length == 0)
        {
            throw new ValidationException("Uploaded file is empty.");
        }

        if (stream.Length > MaxFileSizeBytes)
        {
            throw new ValidationException($"File size exceeds the 10 MB maximum allowed limit ({stream.Length / (1024 * 1024)} MB).");
        }

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
        {
            throw new ValidationException($"Unsupported file format '{ext}'. Only .pdf and .docx documents are accepted.");
        }

        // Validate actual magic bytes
        if (!_parsingService.ValidateFileSignature(stream, ext))
        {
            throw new ValidationException($"File signature mismatch. The file content does not match the '{ext}' format.");
        }
    }

    private static string ComputeSha256Hash(Stream stream)
    {
        stream.Position = 0;
        using var sha = SHA256.Create();
        var hashBytes = sha.ComputeHash(stream);
        stream.Position = 0;
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
