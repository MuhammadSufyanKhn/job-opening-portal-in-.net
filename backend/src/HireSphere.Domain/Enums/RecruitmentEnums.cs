namespace HireSphere.Domain.Enums;

public enum JobPostingStatus
{
    Draft = 0,
    Published = 1,
    Paused = 2,
    Closed = 3,
    Archived = 4,
    Suspended = 5
}

public enum EmploymentType
{
    FullTime = 0,
    PartTime = 1,
    Contract = 2,
    Internship = 3
}

public enum WorkplaceType
{
    OnSite = 0,
    Hybrid = 1,
    Remote = 2
}

public enum RequirementCategory
{
    Skill = 0,
    Experience = 1,
    Education = 2,
    Certification = 3
}

public enum RequirementType
{
    Mandatory = 0,
    Preferred = 1
}

public enum ApplicationStage
{
    Submitted = 0,
    UnderReview = 1,
    Shortlisted = 2,
    AssessmentPending = 3,
    AssessmentCompleted = 4,
    InterviewScheduled = 5,
    Offered = 6,
    Hired = 7,
    Rejected = 8,
    Withdrawn = 9
}

public enum InterviewType
{
    Screening = 0,
    Technical = 1,
    Cultural = 2,
    Final = 3
}

public enum InterviewStatus
{
    Scheduled = 0,
    Completed = 1,
    Rescheduled = 2,
    Canceled = 3
}

