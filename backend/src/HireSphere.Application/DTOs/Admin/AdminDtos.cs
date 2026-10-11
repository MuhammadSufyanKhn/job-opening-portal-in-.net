using HireSphere.Application.DTOs.Job;

namespace HireSphere.Application.DTOs.Admin;

public class PlatformDashboardStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalCandidates { get; set; }
    public int TotalCompanyMembers { get; set; }
    public int TotalSuperAdmins { get; set; }
    public int TotalDisabledUsers { get; set; }

    public int TotalCompanies { get; set; }
    public int PendingCompanies { get; set; }
    public int ApprovedCompanies { get; set; }
    public int RejectedCompanies { get; set; }
    public int SuspendedCompanies { get; set; }

    public int TotalJobs { get; set; }
    public int PublishedJobs { get; set; }
    public int SuspendedJobs { get; set; }
    public int DraftJobs { get; set; }
    public int ClosedJobs { get; set; }

    public int TotalApplications { get; set; }
    public int WorkSimTotalAssignments { get; set; }
    public int WorkSimCompletedAssessments { get; set; }
    public decimal? WorkSimAverageScore { get; set; }

    public List<AdminAuditItemDto> RecentActivity { get; set; } = new();
}

public class AdminUserSummaryDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string AccountStatus { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public DateTimeOffset CreatedAtUtc { get; set; }
    public bool IsCandidate { get; set; }
    public List<string> CompanyNames { get; set; } = new();
}

public class AdminUserDetailDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string AccountStatus { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }

    // Candidate details if any
    public bool IsCandidate { get; set; }
    public string? CandidateHeadline { get; set; }
    public string? CandidateLocation { get; set; }
    public int? YearsOfExperience { get; set; }
    public int ApplicationsCount { get; set; }

    // Company memberships if any
    public List<AdminUserCompanyMembershipDto> CompanyMemberships { get; set; } = new();

    // Audit logs targeting this user
    public List<AdminAuditItemDto> RecentAuditLogs { get; set; } = new();
}

public class AdminUserCompanyMembershipDto
{
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset JoinedAtUtc { get; set; }
}

public class SuspendUserRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class AdminJobSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = string.Empty;
    public string WorkplaceType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public string? ModerationReason { get; set; }
    public DateTimeOffset? ModeratedAtUtc { get; set; }
    public string? ModeratedByName { get; set; }
    public int ApplicationsCount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}

public class AdminJobDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Responsibilities { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = string.Empty;
    public string WorkplaceType { get; set; } = string.Empty;
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string SalaryCurrency { get; set; } = "USD";
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public string? ModerationReason { get; set; }
    public DateTimeOffset? ModeratedAtUtc { get; set; }
    public string? ModeratedByName { get; set; }
    public int ApplicationsCount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }

    public List<AdminJobRequirementDto> Requirements { get; set; } = new();
    public List<AdminAuditItemDto> AuditHistory { get; set; } = new();
}

public class AdminJobRequirementDto
{
    public Guid Id { get; set; }
    public string RequirementText { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public class SuspendJobRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class AdminAuditItemDto
{
    public Guid Id { get; set; }
    public Guid? ActorUserId { get; set; }
    public string? ActorName { get; set; }
    public string? ActorEmail { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string TargetResource { get; set; } = string.Empty;
    public string TargetResourceId { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset TimestampUtc { get; set; }
}
