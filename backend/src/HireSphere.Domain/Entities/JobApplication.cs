using HireSphere.Domain.Enums;

namespace HireSphere.Domain.Entities;

public class CandidateDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CandidateProfileId { get; set; }
    public CandidateProfile CandidateProfile { get; set; } = null!;
    public string OriginalFileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public bool IsDefault { get; set; }
    public int VersionNumber { get; set; } = 1;
    public Guid? RootDocumentId { get; set; }
    public CandidateDocument? RootDocument { get; set; }
    public ICollection<CandidateDocument> Versions { get; set; } = new List<CandidateDocument>();
    public string? ContentHash { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }

    public ICollection<DocumentExtractionJob> ExtractionJobs { get; set; } = new List<DocumentExtractionJob>();
}

public class JobApplication
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid JobPostingId { get; set; }
    public JobPosting JobPosting { get; set; } = null!;
    public Guid JobDescriptionVersionId { get; set; }
    public JobDescriptionVersion JobDescriptionVersion { get; set; } = null!;
    public Guid CandidateProfileId { get; set; }
    public CandidateProfile CandidateProfile { get; set; } = null!;
    public Guid? CandidateDocumentId { get; set; }
    public CandidateDocument? CandidateDocument { get; set; }
    public ApplicationStage CurrentStage { get; set; } = ApplicationStage.Submitted;
    public DateTimeOffset SubmittedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? StageUpdatedAtUtc { get; set; }
    public string? CandidateCoverNote { get; set; }

    public ICollection<ApplicationStatusHistory> StatusHistories { get; set; } = new List<ApplicationStatusHistory>();
    public ICollection<CandidateNote> CandidateNotes { get; set; } = new List<CandidateNote>();
    public CvMatchReport? CvMatchReport { get; set; }
    public ICollection<AssessmentAssignment> AssessmentAssignments { get; set; } = new List<AssessmentAssignment>();
}

public class ApplicationStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobApplicationId { get; set; }
    public JobApplication JobApplication { get; set; } = null!;
    public ApplicationStage PreviousStage { get; set; }
    public ApplicationStage NewStage { get; set; }
    public Guid ChangedByUserId { get; set; }
    public User ChangedByUser { get; set; } = null!;
    public string? ReasonNote { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

public class CandidateNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid JobApplicationId { get; set; }
    public JobApplication JobApplication { get; set; } = null!;
    public Guid AuthorUserId { get; set; }
    public User AuthorUser { get; set; } = null!;
    public string NoteText { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
}
