using HireSphere.Domain.Enums;

namespace HireSphere.Domain.Entities;

public class CompanyMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public CompanyRole CompanyRole { get; set; } = CompanyRole.Recruiter;
    public CompanyMembershipStatus MembershipStatus { get; set; } = CompanyMembershipStatus.Active;
    public DateTimeOffset JoinedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}

public class CompanyInvitation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public string InvitedEmail { get; set; } = string.Empty;
    public CompanyRole CompanyRole { get; set; } = CompanyRole.Recruiter;
    public string InvitationToken { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public bool IsAccepted { get; set; }
    public DateTimeOffset? AcceptedAtUtc { get; set; }
    public Guid InvitedByUserId { get; set; }
    public User InvitedByUser { get; set; } = null!;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAtUtc;
}
