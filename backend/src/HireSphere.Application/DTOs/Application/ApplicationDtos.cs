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
    IReadOnlyList<ApplicationStatusHistoryDto> StatusTimeline,
    HireSphere.Application.DTOs.WorkSim.AssessmentAssignmentDto? Assessment = null);

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
    string? CandidateDocumentFileName = null,
    HireSphere.Application.DTOs.WorkSim.AssessmentAssignmentDto? Assessment = null,
    IReadOnlyList<CandidateNoteDto>? Notes = null,
    IReadOnlyList<InterviewScheduleDto>? Interviews = null);

// --- Candidate Notes ---
public record CandidateNoteDto(
    Guid Id,
    Guid CompanyId,
    Guid JobApplicationId,
    Guid AuthorUserId,
    string AuthorName,
    string NoteText,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);

public record CreateCandidateNoteRequest(
    string NoteText);

// --- Interview Coordination ---
public record InterviewScheduleDto(
    Guid Id,
    Guid CompanyId,
    Guid JobApplicationId,
    string CandidateName,
    string JobTitle,
    InterviewType InterviewType,
    DateTimeOffset ScheduledStartUtc,
    DateTimeOffset ScheduledEndUtc,
    string? MeetingLocation,
    InterviewStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);

public record ScheduleInterviewRequest(
    InterviewType InterviewType,
    DateTimeOffset ScheduledStartUtc,
    DateTimeOffset ScheduledEndUtc,
    string? MeetingLocation);

public record UpdateInterviewRequest(
    InterviewType InterviewType,
    DateTimeOffset ScheduledStartUtc,
    DateTimeOffset ScheduledEndUtc,
    string? MeetingLocation,
    InterviewStatus Status);

public record CancelInterviewRequest(
    string? Reason = null);

// --- Pipeline Board (Kanban) ---

public record PipelineBoardCardDto(
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
    DateTimeOffset? StageUpdatedAtUtc,
    decimal? MatchEvidenceIndex,
    decimal? WorkSimScore);

public record PipelineBoardStageColumnDto(
    ApplicationStage Stage,
    string StageName,
    int Count,
    IReadOnlyList<PipelineBoardCardDto> Applications);

public record PipelineBoardDto(
    Guid CompanyId,
    Guid? JobPostingId,
    int TotalApplications,
    IReadOnlyList<PipelineBoardStageColumnDto> Stages);

// --- Company Recruitment Workspace Dashboard ---
public record WorkspaceJobSummaryDto(
    Guid Id,
    string Title,
    string Slug,
    JobPostingStatus Status,
    int ApplicationCount,
    DateTimeOffset CreatedAtUtc);

public record RecruitmentTaskItemDto(
    string Id,
    string Type,
    string Title,
    string Description,
    string ActionUrl,
    string Severity);

public record CompanyWorkspaceDashboardDto(
    Guid CompanyId,
    string CompanyName,
    int ActiveJobsCount,
    int PendingReviewCount,
    int ShortlistedCount,
    int UpcomingInterviewsCount,
    int PendingAssessmentsCount,
    IReadOnlyList<WorkspaceJobSummaryDto> ActiveJobListings,
    IReadOnlyList<InterviewScheduleDto> UpcomingInterviews,
    IReadOnlyList<CompanyApplicationSummaryDto> RecentApplications,
    IReadOnlyList<RecruitmentTaskItemDto> ActionItems);


