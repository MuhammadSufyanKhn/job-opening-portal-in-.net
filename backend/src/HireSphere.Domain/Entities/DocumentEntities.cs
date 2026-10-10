using HireSphere.Domain.Enums;

namespace HireSphere.Domain.Entities;

public class DocumentExtractionJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CandidateDocumentId { get; set; }
    public CandidateDocument CandidateDocument { get; set; } = null!;
    public DocumentExtractionStatus Status { get; set; } = DocumentExtractionStatus.Pending;
    public string? ExtractedText { get; set; }
    public string? StructuredDataJson { get; set; }
    public string ParserVersion { get; set; } = "1.0";
    public string? ErrorMessage { get; set; }
    public int AttemptCount { get; set; }
    public DateTimeOffset? StartedAtUtc { get; set; }
    public DateTimeOffset? CompletedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CvMatchReport> MatchReports { get; set; } = new List<CvMatchReport>();
}

public class CvMatchReport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobApplicationId { get; set; }
    public JobApplication JobApplication { get; set; } = null!;
    public Guid JobDescriptionVersionId { get; set; }
    public JobDescriptionVersion JobDescriptionVersion { get; set; } = null!;
    public Guid DocumentExtractionJobId { get; set; }
    public DocumentExtractionJob DocumentExtractionJob { get; set; } = null!;
    public decimal OverallEvidenceIndex { get; set; }
    public string EngineVersion { get; set; } = "1.0-deterministic";
    public string CalculationSummary { get; set; } = string.Empty;
    public DateTimeOffset CalculatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CvRequirementEvaluation> Evaluations { get; set; } = new List<CvRequirementEvaluation>();
}

public class CvRequirementEvaluation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CvMatchReportId { get; set; }
    public CvMatchReport CvMatchReport { get; set; } = null!;
    public Guid JobRequirementId { get; set; }
    public JobRequirement JobRequirement { get; set; } = null!;
    public RequirementMatchStatus Status { get; set; }
    public decimal ConfidenceLevel { get; set; }
    public string? ExtractedExcerpt { get; set; }
    public string? ReviewerNote { get; set; }
    public RequirementMatchStatus? ReviewerOverriddenStatus { get; set; }
    public DateTimeOffset EvaluatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
