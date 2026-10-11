namespace HireSphere.Domain.Entities;

public class CandidateSavedJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CandidateProfileId { get; set; }
    public CandidateProfile CandidateProfile { get; set; } = null!;
    public Guid JobPostingId { get; set; }
    public JobPosting JobPosting { get; set; } = null!;
    public DateTimeOffset SavedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
