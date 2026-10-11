using HireSphere.Domain.Enums;

namespace HireSphere.Domain.Entities;

public class SimulationScenario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EstimatedDurationMinutes { get; set; }
    public Guid? OwnerCompanyId { get; set; }
    public Company? OwnerCompany { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }

    public ICollection<ScenarioVersion> Versions { get; set; } = new List<ScenarioVersion>();
}

public class ScenarioVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SimulationScenarioId { get; set; }
    public SimulationScenario SimulationScenario { get; set; } = null!;
    public int VersionNumber { get; set; }
    public string DefinitionJson { get; set; } = string.Empty;
    public string RubricJson { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<JobAssessmentConfiguration> JobConfigurations { get; set; } = new List<JobAssessmentConfiguration>();
    public ICollection<SimulationSession> Sessions { get; set; } = new List<SimulationSession>();
}

public class JobAssessmentConfiguration
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid JobPostingId { get; set; }
    public JobPosting JobPosting { get; set; } = null!;
    public Guid ScenarioVersionId { get; set; }
    public ScenarioVersion ScenarioVersion { get; set; } = null!;
    public bool IsRequired { get; set; } = true;
    public int MaxAllowedAttempts { get; set; } = 1;
    public int DeadlineDaysAfterAssignment { get; set; } = 7;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<AssessmentAssignment> Assignments { get; set; } = new List<AssessmentAssignment>();
}

public class AssessmentAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid JobApplicationId { get; set; }
    public JobApplication JobApplication { get; set; } = null!;
    public Guid JobAssessmentConfigurationId { get; set; }
    public JobAssessmentConfiguration JobAssessmentConfiguration { get; set; } = null!;
    public Guid CandidateProfileId { get; set; }
    public CandidateProfile CandidateProfile { get; set; } = null!;
    public DateTimeOffset DeadlineUtc { get; set; }
    public AssessmentAssignmentStatus Status { get; set; } = AssessmentAssignmentStatus.Assigned;
    public DateTimeOffset AssignedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAtUtc { get; set; }

    // Invitation and progress tracking
    public DateTimeOffset? ReminderSentAtUtc { get; set; }
    public DateTimeOffset? CancelledAtUtc { get; set; }
    public string? CancellationReason { get; set; }
    public int ResentCount { get; set; }
    public DateTimeOffset? LastResentAtUtc { get; set; }

    public ICollection<SimulationSession> Sessions { get; set; } = new List<SimulationSession>();
}

public class SimulationSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AssessmentAssignmentId { get; set; }
    public AssessmentAssignment AssessmentAssignment { get; set; } = null!;
    public Guid CandidateProfileId { get; set; }
    public CandidateProfile CandidateProfile { get; set; } = null!;
    public Guid ScenarioVersionId { get; set; }
    public ScenarioVersion ScenarioVersion { get; set; } = null!;
    public string CurrentStateVectorJson { get; set; } = "{}";
    public SimulationSessionStatus Status { get; set; } = SimulationSessionStatus.Active;
    public DateTimeOffset StartedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? SubmittedAtUtc { get; set; }
    public int TotalActionsTaken { get; set; }
    public byte[]? RowVersion { get; set; }

    public ICollection<SimulationActionLog> ActionLogs { get; set; } = new List<SimulationActionLog>();
    public AssessmentResult? AssessmentResult { get; set; }
}

public class SimulationActionLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SimulationSessionId { get; set; }
    public SimulationSession SimulationSession { get; set; } = null!;
    public int SequenceNumber { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string ActionPayloadJson { get; set; } = "{}";
    public string? CandidateRationale { get; set; }
    public long ElapsedMillisecondsFromStart { get; set; }
    public DateTimeOffset TimestampUtc { get; set; } = DateTimeOffset.UtcNow;
}

public class AssessmentResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SimulationSessionId { get; set; }
    public SimulationSession SimulationSession { get; set; } = null!;
    public Guid ScenarioVersionId { get; set; }
    public ScenarioVersion ScenarioVersion { get; set; } = null!;
    public decimal TotalScore { get; set; }
    public string EvaluationSummary { get; set; } = string.Empty;
    public string CandidateFeedback { get; set; } = string.Empty;
    public DateTimeOffset EvaluatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CriterionScore> CriterionScores { get; set; } = new List<CriterionScore>();
}

public class CriterionScore
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AssessmentResultId { get; set; }
    public AssessmentResult AssessmentResult { get; set; } = null!;
    public string CriterionName { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; }
    public string SupportingEvidenceJson { get; set; } = "{}";
    public string? Feedback { get; set; }
}
