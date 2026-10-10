using HireSphere.Domain.Enums;

namespace HireSphere.Application.DTOs.Application;

public record SubmitApplicationRequest(
    Guid? CandidateDocumentId = null,
    string? CoverNote = null);

public record UpdateApplicationStageRequest(
    ApplicationStage NewStage,
    string? ReasonNote = null);

public record ApplicationStatusHistoryDto(
    Guid Id,
    ApplicationStage PreviousStage,
    ApplicationStage NewStage,
    string ChangedByName,
    string? ReasonNote,
    DateTimeOffset CreatedAtUtc);

public record CandidateApplicationSummaryDto(
    Guid Id,
    Guid JobPostingId,
    string JobTitle,
    string JobSlug,
    Guid CompanyId,
    string CompanyName,
    ApplicationStage CurrentStage,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? StageUpdatedAtUtc);

public record CandidateApplicationDetailDto(
    Guid Id,
    Guid JobPostingId,
    string JobTitle,
    string JobSlug,
    string JobLocation,
    WorkplaceType WorkplaceType,
    EmploymentType EmploymentType,
    Guid CompanyId,
    string CompanyName,
    ApplicationStage CurrentStage,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? StageUpdatedAtUtc,
    string? CandidateCoverNote,
    IReadOnlyList<ApplicationStatusHistoryDto> StatusTimeline);

public record CompanyApplicationSummaryDto(
    Guid Id,
    Guid JobPostingId,
    string JobTitle,
    Guid CandidateProfileId,
    string CandidateName,
    string CandidateEmail,
    string? CandidateHeadline,
    string? CandidateLocation,
    int? YearsOfExperience,
    ApplicationStage CurrentStage,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? StageUpdatedAtUtc);

public record CompanyApplicationDetailDto(
    Guid Id,
    Guid JobPostingId,
    string JobTitle,
    Guid CandidateProfileId,
    string CandidateName,
    string CandidateEmail,
    string? CandidateHeadline,
    string? CandidateSummary,
    string? CandidateLocation,
    int? YearsOfExperience,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? PortfolioUrl,
    ApplicationStage CurrentStage,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? StageUpdatedAtUtc,
    string? CandidateCoverNote,
    IReadOnlyList<ApplicationStatusHistoryDto> StatusTimeline,
    Guid? CandidateDocumentId = null,
    string? CandidateDocumentFileName = null);
