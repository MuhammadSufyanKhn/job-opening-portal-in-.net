namespace HireSphere.Domain.Entities;

public class CandidateProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string? Headline { get; set; }
    public string? Summary { get; set; }
    public string? Location { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }

    public ICollection<CandidateDocument> Documents { get; set; } = new List<CandidateDocument>();
    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
}

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ActorUserId { get; set; }
    public User? ActorUser { get; set; }
    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string TargetResource { get; set; } = string.Empty;
    public string TargetResourceId { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset TimestampUtc { get; set; } = DateTimeOffset.UtcNow;
}
