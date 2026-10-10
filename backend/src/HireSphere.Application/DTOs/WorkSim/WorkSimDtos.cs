namespace HireSphere.Application.DTOs.WorkSim;

public class SimulationScenarioDto
{
    public Guid Id { get; set; }
    public Guid? OwnerCompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EstimatedDurationMinutes { get; set; }
    public int LatestVersionNumber { get; set; }
    public Guid LatestVersionId { get; set; }
    public bool IsActive { get; set; }
    public bool IsCompanyOwned { get; set; }
}

public class AssessmentAssignmentDto
{
    public Guid AssignmentId { get; set; }
    public Guid JobApplicationId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public Guid ScenarioId { get; set; }
    public string ScenarioTitle { get; set; } = string.Empty;
    public string ScenarioCategory { get; set; } = string.Empty;
    public int EstimatedDurationMinutes { get; set; }
    public bool IsRequired { get; set; }
    public int MaxAllowedAttempts { get; set; }
    public DateTimeOffset DeadlineUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? ActiveSessionId { get; set; }
    public Guid? ResultId { get; set; }
    public decimal? TotalScore { get; set; }
    public DateTimeOffset? CompletedAtUtc { get; set; }
}

public class CandidateSimulationRuntimeStateDto
{
    public Guid SessionId { get; set; }
    public Guid AssignmentId { get; set; }
    public string ScenarioTitle { get; set; } = string.Empty;
    public string ScenarioCategory { get; set; } = string.Empty;
    public string InitialContext { get; set; } = string.Empty;
    public string CurrentTaskKey { get; set; } = string.Empty;
    public string CurrentTaskTitle { get; set; } = string.Empty;
    public string CurrentTaskInstructions { get; set; } = string.Empty;
    public int TaskIndex { get; set; }
    public int TotalTasks { get; set; }
    public Dictionary<string, string> StateVariables { get; set; } = new();
    public List<SimulationEvidenceItemDto> UnlockedEvidence { get; set; } = new();
    public List<AvailableActionDto> AvailableActions { get; set; } = new();
    public List<SimulationActionHistoryItemDto> ActionHistory { get; set; } = new();
    public int TotalActionsTaken { get; set; }
    public DateTimeOffset StartedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public bool IsCompleted { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? ResultId { get; set; }
}

public class SimulationEvidenceItemDto
{
    public string EvidenceKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class AvailableActionDto
{
    public string ActionKey { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool RequiresRationale { get; set; }
}

public class SimulationActionHistoryItemDto
{
    public int SequenceNumber { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string ActionKey { get; set; } = string.Empty;
    public string ActionTitle { get; set; } = string.Empty;
    public string? CandidateRationale { get; set; }
    public long ElapsedMilliseconds { get; set; }
    public DateTimeOffset TimestampUtc { get; set; }
    public string? FeedbackMessage { get; set; }
}

public class SubmitSimulationActionRequest
{
    public string ActionKey { get; set; } = string.Empty;
    public string? CandidateRationale { get; set; }
}

public class AssessmentResultDto
{
    public Guid ResultId { get; set; }
    public Guid SessionId { get; set; }
    public Guid CandidateProfileId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string ScenarioTitle { get; set; } = string.Empty;
    public string ScenarioCategory { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public string EvaluationSummary { get; set; } = string.Empty;
    public string CandidateFeedback { get; set; } = string.Empty;
    public DateTimeOffset EvaluatedAtUtc { get; set; }
    public List<CriterionScoreDto> CriterionScores { get; set; } = new();
}

public class CriterionScoreDto
{
    public string CriterionName { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public List<string> SupportingEvidence { get; set; } = new();
}

public class AssignJobSimulationRequest
{
    public Guid ScenarioVersionId { get; set; }
    public bool IsRequired { get; set; } = true;
    public int MaxAllowedAttempts { get; set; } = 1;
    public int DeadlineDaysAfterAssignment { get; set; } = 7;
}

public class JobAssessmentConfigurationDto
{
    public Guid Id { get; set; }
    public Guid JobPostingId { get; set; }
    public Guid ScenarioVersionId { get; set; }
    public string ScenarioTitle { get; set; } = string.Empty;
    public string ScenarioCategory { get; set; } = string.Empty;
    public int VersionNumber { get; set; }
    public bool IsRequired { get; set; }
    public int MaxAllowedAttempts { get; set; }
    public int DeadlineDaysAfterAssignment { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}
