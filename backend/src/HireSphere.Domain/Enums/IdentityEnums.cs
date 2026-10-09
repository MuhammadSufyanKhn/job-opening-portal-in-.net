namespace HireSphere.Domain.Enums;

public enum AccountStatus
{
    Active = 0,
    Disabled = 1,
    PendingVerification = 2
}

public enum CompanyApprovalStatus
{
    PendingApproval = 0,
    Approved = 1,
    Rejected = 2,
    Suspended = 3
}

public enum CompanyRole
{
    Owner = 0,
    Recruiter = 1,
    HiringManager = 2
}

public enum CompanyMembershipStatus
{
    Active = 0,
    Suspended = 1,
    Left = 2
}

public static class PlatformRoles
{
    public const string Candidate = "Candidate";
    public const string CompanyMember = "CompanyMember";
    public const string SuperAdmin = "SuperAdmin";
}
