using HireSphere.Domain.Enums;

namespace HireSphere.Domain.Entities;

public class JobCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }

    public ICollection<JobPosting> JobPostings { get; set; } = new List<JobPosting>();
}

public class JobPosting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public int JobCategoryId { get; set; }
    public JobCategory JobCategory { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Responsibilities { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FullTime;
    public WorkplaceType WorkplaceType { get; set; } = WorkplaceType.OnSite;
    public string Location { get; set; } = string.Empty;
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string SalaryCurrency { get; set; } = "USD";
    public JobPostingStatus Status { get; set; } = JobPostingStatus.Draft;
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public DateTimeOffset? ExpiresAtUtc { get; set; }
    public int ActiveVersionNumber { get; set; } = 1;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public byte[]? RowVersion { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }

    // Content moderation
    public string? ModerationReason { get; set; }
    public DateTimeOffset? ModeratedAtUtc { get; set; }
    public Guid? ModeratedByUserId { get; set; }
    public User? ModeratedByUser { get; set; }

    public ICollection<JobRequirement> Requirements { get; set; } = new List<JobRequirement>();
    public ICollection<JobDescriptionVersion> Versions { get; set; } = new List<JobDescriptionVersion>();
    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
}

public class JobRequirement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobPostingId { get; set; }
    public JobPosting JobPosting { get; set; } = null!;
    public string RequirementText { get; set; } = string.Empty;
    public RequirementCategory RequirementCategory { get; set; } = RequirementCategory.Skill;
    public RequirementType RequirementType { get; set; } = RequirementType.Mandatory;
    public int DisplayOrder { get; set; }
}

public class JobDescriptionVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobPostingId { get; set; }
    public JobPosting JobPosting { get; set; } = null!;
    public int VersionNumber { get; set; }
    public string SnapshotJson { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
