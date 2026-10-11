using HireSphere.Domain.Enums;

namespace HireSphere.Domain.Entities;

public class InterviewSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid JobApplicationId { get; set; }
    public JobApplication JobApplication { get; set; } = null!;
    public InterviewType InterviewType { get; set; } = InterviewType.Screening;
    public DateTimeOffset ScheduledStartUtc { get; set; }
    public DateTimeOffset ScheduledEndUtc { get; set; }
    public string? MeetingLocation { get; set; }
    public InterviewStatus Status { get; set; } = InterviewStatus.Scheduled;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
