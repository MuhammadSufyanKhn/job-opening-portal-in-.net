namespace HireSphere.Domain.Enums;

public enum AssessmentAssignmentStatus
{
    Assigned = 0,
    InProgress = 1,
    Completed = 2,
    Expired = 3,
    Cancelled = 4
}

public enum EmailDeliveryStatus
{
    Pending = 0,
    Sent = 1,
    Failed = 2
}

public enum SimulationSessionStatus
{
    Active = 0,
    Submitted = 1,
    TimedOut = 2,
    Aborted = 3
}

public enum ScenarioDifficulty
{
    Beginner = 0,
    Intermediate = 1,
    Advanced = 2
}
