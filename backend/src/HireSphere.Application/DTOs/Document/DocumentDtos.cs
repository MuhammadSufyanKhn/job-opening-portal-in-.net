using HireSphere.Domain.Enums;

namespace HireSphere.Application.DTOs.Document;

public record CandidateDocumentSummaryDto(
    Guid Id,
    Guid CandidateProfileId,
    string OriginalFileName,
    string FileExtension,
    string MimeType,
    long FileSizeBytes,
    bool IsDefault,
    int VersionNumber,
    Guid? RootDocumentId,
    string? ContentHash,
    DateTimeOffset CreatedAtUtc,
    DocumentExtractionStatus ExtractionStatus,
    int ExtractedSkillsCount);

public record CandidateDocumentDetailDto(
    Guid Id,
    Guid CandidateProfileId,
    string OriginalFileName,
    string FileExtension,
    string MimeType,
    long FileSizeBytes,
    bool IsDefault,
    int VersionNumber,
    Guid? RootDocumentId,
    string? ContentHash,
    DateTimeOffset CreatedAtUtc,
    DocumentExtractionStatus ExtractionStatus,
    string? ExtractedTextSnippet,
    List<string> ExtractedSkills,
    List<string> ExtractedCertifications,
    List<string> ExtractedEducation,
    int? EstimatedYearsOfExperience,
    int VersionsCount,
    string? ExtractionErrorMessage);

public record CvRequirementEvaluationDto(
    Guid Id,
    Guid JobRequirementId,
    string RequirementText,
    RequirementCategory RequirementCategory,
    RequirementType RequirementType,
    RequirementMatchStatus Status,
    decimal ConfidenceLevel,
    string? ExtractedExcerpt,
    string? ReviewerNote,
    RequirementMatchStatus? ReviewerOverriddenStatus);

public record CvMatchReportDto(
    Guid Id,
    Guid JobApplicationId,
    string JobTitle,
    string CandidateName,
    decimal OverallEvidenceIndex,
    string EngineVersion,
    string CalculationSummary,
    DateTimeOffset CalculatedAtUtc,
    List<CvRequirementEvaluationDto> Evaluations,
    CvMatchSummaryDto Summary);

public record CvMatchSummaryDto(
    int TotalRequirements,
    int SupportedCount,
    int PartiallySupportedCount,
    int NotFoundCount,
    int NeedsReviewCount,
    int MandatoryTotalCount,
    int MandatoryFulfilledCount);
