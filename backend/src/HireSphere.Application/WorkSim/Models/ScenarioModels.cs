using System.Text.Json.Serialization;

namespace HireSphere.Application.WorkSim.Models;

public class ScenarioDefinition
{
    public string ScenarioKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Intermediate";
    public int EstimatedDurationMinutes { get; set; } = 30;
    public string InitialContext { get; set; } = string.Empty;
    public Dictionary<string, string> InitialState { get; set; } = new();
    public List<SimulationEvidenceItem> EvidenceItems { get; set; } = new();
    public List<SimulationTaskDefinition> Tasks { get; set; } = new();
    public string InitialTaskKey { get; set; } = string.Empty;
}

public class SimulationTaskDefinition
{
    public string TaskKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public int SequenceOrder { get; set; }
    public List<string> UnlockedEvidenceKeys { get; set; } = new();
    public List<SimulationActionDefinition> AvailableActions { get; set; } = new();
    public bool IsTerminalTask { get; set; }
}

public class SimulationEvidenceItem
{
    public string EvidenceKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // e.g., "Telemetry", "Server Logs", "Git Diff", "Runbook"
    public string Content { get; set; } = string.Empty;
    public bool InitiallyVisible { get; set; } = true;
}

public class SimulationActionDefinition
{
    public string ActionKey { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty; // "INSPECT", "PRIORITIZE", "REMEDIATE", "VERIFY", "ESCALATE"
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool RequiresRationale { get; set; }
    public string? TargetTaskKey { get; set; }
    public Dictionary<string, string>? StateUpdates { get; set; }
    public List<string>? EvidenceKeysToUnlock { get; set; }
    public string? FeedbackMessage { get; set; }
}

public class SimulationRubricDefinition
{
    public string RubricVersion { get; set; } = "1.0";
    public List<RubricCriterionDefinition> Criteria { get; set; } = new();
}

public class RubricCriterionDefinition
{
    public string CriterionKey { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MaxPoints { get; set; }
    public List<RubricRuleDefinition> Rules { get; set; } = new();
}

public class RubricRuleDefinition
{
    public string RuleId { get; set; } = string.Empty;
    public string ConditionType { get; set; } = string.Empty; // ActionTaken, ActionNotTaken, ActionBeforeAction, StateEquals, HasRationale
    public string TargetKey { get; set; } = string.Empty;
    public string? ExpectedValue { get; set; }
    public decimal PointsDelta { get; set; }
    public string Feedback { get; set; } = string.Empty;
}

public class SessionStateVector
{
    public string CurrentTaskKey { get; set; } = string.Empty;
    public Dictionary<string, string> StateVariables { get; set; } = new();
    public HashSet<string> UnlockedEvidenceKeys { get; set; } = new();
    public List<string> CompletedTaskKeys { get; set; } = new();
    public bool IsCompleted { get; set; }
}
