using HireSphere.Domain.Enums;

namespace HireSphere.Application.DTOs.Candidate;

public record CandidateDashboardDto(
    Guid CandidateProfileId,
    string FullName,
    int ProfileCompletionPercentage,
    IReadOnlyList<string> MissingProfileFields,
    // CV summary
    bool HasPrimaryCv,
    Guid? PrimaryCvId,
    string? PrimaryCvFileName,
    DateTimeOffset? PrimaryCvUploadedAtUtc,
    DocumentExtractionStatus? PrimaryCvExtractionStatus,
    int ExtractedSkillsCount,
    // Applications overview
    int TotalApplications,
    int ActiveApplications,
    int CompletedApplications,
    Dictionary<string, int> ApplicationsByStage,
    IReadOnlyList<CandidateDashboardApplicationDto> RecentApplications,
    // Assessments overview
    int PendingAssessmentsCount,
    DateTimeOffset? NextAssessmentDeadlineUtc,
    IReadOnlyList<CandidateDashboardAssessmentDto> PendingAssessments,
    // Saved jobs
    int TotalSavedJobs,
    IReadOnlyList<SavedJobSummaryDto> SavedJobs);

public record CandidateDashboardApplicationDto(
    Guid ApplicationId,
    Guid JobPostingId,
    string JobTitle,
    string CompanyName,
    string? CompanyLogoUrl,
    ApplicationStage CurrentStage,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? StageUpdatedAtUtc);

public record CandidateDashboardAssessmentDto(
    Guid AssignmentId,
    Guid JobApplicationId,
    string ScenarioTitle,
    string Category,
    string CompanyName,
    string JobTitle,
    DateTimeOffset DeadlineUtc,
    AssessmentAssignmentStatus Status,
    bool IsExpired);

public record SavedJobSummaryDto(
    Guid SavedJobId,
    Guid JobId,
    string Title,
    string CompanyName,
    string? CompanyLogoUrl,
    string Location,
    EmploymentType EmploymentType,
    WorkplaceType WorkplaceType,
    decimal? SalaryMin,
    decimal? SalaryMax,
    string SalaryCurrency,
    DateTimeOffset SavedAtUtc,
    DateTimeOffset? ExpiresAtUtc,
    bool IsActive);

public record ExtractedCvSuggestionsDto(
    Guid DocumentId,
    string FileName,
    DocumentExtractionStatus ExtractionStatus,
    List<string> ExtractedSkills,
    List<string> ExtractedEducation,
    List<string> ExtractedCertifications,
    int? EstimatedYearsOfExperience,
    string? ErrorMessage);
