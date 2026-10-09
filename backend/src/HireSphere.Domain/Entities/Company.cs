using HireSphere.Domain.Enums;

namespace HireSphere.Domain.Entities;

public class Company
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? BusinessRegistrationNumber { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? LogoUrl { get; set; }
    public string Industry { get; set; } = string.Empty;
    public string? CompanySize { get; set; }
    public string? Description { get; set; }
    public string ContactEmail { get; set; } = string.Empty;
    public CompanyApprovalStatus ApprovalStatus { get; set; } = CompanyApprovalStatus.PendingApproval;
    public string? RejectionReason { get; set; }
    public DateTimeOffset? ApprovedAtUtc { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public User? ApprovedByUser { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }

    // Navigations
    public ICollection<CompanyMember> Members { get; set; } = new List<CompanyMember>();
    public ICollection<CompanyInvitation> Invitations { get; set; } = new List<CompanyInvitation>();
    public ICollection<JobPosting> JobPostings { get; set; } = new List<JobPosting>();
    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
}
