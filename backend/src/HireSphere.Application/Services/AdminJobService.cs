using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.DTOs.Job;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IAdminJobService
{
    Task<PagedResult<AdminJobSummaryDto>> GetJobsAsync(
        string? search = null,
        Guid? companyId = null,
        string? status = null,
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default);

    Task<AdminJobDetailDto> GetJobByIdAsync(Guid jobId, CancellationToken ct = default);

    Task SuspendJobAsync(Guid jobId, Guid adminUserId, string reason, CancellationToken ct = default);

    Task RestoreJobAsync(Guid jobId, Guid adminUserId, CancellationToken ct = default);
}

public class AdminJobService : IAdminJobService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly INotificationService? _notificationService;

    public AdminJobService(
        IApplicationDbContext context,
        IAuditService auditService,
        INotificationService? notificationService = null)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<PagedResult<AdminJobSummaryDto>> GetJobsAsync(
        string? search = null,
        Guid? companyId = null,
        string? status = null,
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.JobPostings
            .Include(j => j.Company)
            .Include(j => j.JobCategory)
            .Include(j => j.ModeratedByUser)
            .Include(j => j.Applications)
            .Where(j => !j.IsDeleted);

        if (companyId.HasValue)
        {
            query = query.Where(j => j.CompanyId == companyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(j =>
                j.Title.ToLower().Contains(term) ||
                j.Company.Name.ToLower().Contains(term) ||
                j.Location.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<JobPostingStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(j => j.Status == parsedStatus);
        }

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var jobs = await query
            .OrderByDescending(j => j.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = jobs.Select(j => new AdminJobSummaryDto
        {
            Id = j.Id,
            Title = j.Title,
            Slug = j.Slug,
            CompanyId = j.CompanyId,
            CompanyName = j.Company.Name,
            CategoryName = j.JobCategory.Name,
            Location = j.Location,
            EmploymentType = j.EmploymentType.ToString(),
            WorkplaceType = j.WorkplaceType.ToString(),
            Status = j.Status.ToString(),
            PublishedAtUtc = j.PublishedAtUtc,
            ModerationReason = j.ModerationReason,
            ModeratedAtUtc = j.ModeratedAtUtc,
            ModeratedByName = j.ModeratedByUser?.FullName,
            ApplicationsCount = j.Applications.Count,
            CreatedAtUtc = j.CreatedAtUtc
        }).ToList();

        return new PagedResult<AdminJobSummaryDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<AdminJobDetailDto> GetJobByIdAsync(Guid jobId, CancellationToken ct = default)
    {
        var job = await _context.JobPostings
            .Include(j => j.Company)
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .Include(j => j.ModeratedByUser)
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.IsDeleted, ct);

        if (job == null)
        {
            throw new NotFoundException("JobPosting", jobId);
        }

        var recentAudit = await _context.AuditLogs
            .Include(al => al.ActorUser)
            .Where(al => al.TargetResource == "JobPosting" && al.TargetResourceId == jobId.ToString())
            .OrderByDescending(al => al.TimestampUtc)
            .Take(10)
            .ToListAsync(ct);

        return new AdminJobDetailDto
        {
            Id = job.Id,
            Title = job.Title,
            Slug = job.Slug,
            CompanyId = job.CompanyId,
            CompanyName = job.Company.Name,
            CategoryName = job.JobCategory.Name,
            Summary = job.Summary,
            Description = job.Description,
            Responsibilities = job.Responsibilities,
            Location = job.Location,
            EmploymentType = job.EmploymentType.ToString(),
            WorkplaceType = job.WorkplaceType.ToString(),
            SalaryMin = job.SalaryMin,
            SalaryMax = job.SalaryMax,
            SalaryCurrency = job.SalaryCurrency,
            Status = job.Status.ToString(),
            PublishedAtUtc = job.PublishedAtUtc,
            ModerationReason = job.ModerationReason,
            ModeratedAtUtc = job.ModeratedAtUtc,
            ModeratedByName = job.ModeratedByUser?.FullName,
            ApplicationsCount = job.Applications.Count,
            CreatedAtUtc = job.CreatedAtUtc,
            UpdatedAtUtc = job.UpdatedAtUtc,
            Requirements = job.Requirements.Select(r => new AdminJobRequirementDto
            {
                Id = r.Id,
                RequirementText = r.RequirementText,
                Category = r.RequirementCategory.ToString(),
                Type = r.RequirementType.ToString()
            }).ToList(),
            AuditHistory = recentAudit.Select(al => new AdminAuditItemDto
            {
                Id = al.Id,
                ActorUserId = al.ActorUserId,
                ActorName = al.ActorUser?.FullName ?? "System",
                ActorEmail = al.ActorUser?.Email,
                ActionType = al.ActionType,
                TargetResource = al.TargetResource,
                TargetResourceId = al.TargetResourceId,
                IpAddress = al.IpAddress,
                MetadataJson = al.MetadataJson,
                TimestampUtc = al.TimestampUtc
            }).ToList()
        };
    }

    public async Task SuspendJobAsync(Guid jobId, Guid adminUserId, string reason, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ValidationException("Moderation suspension reason is required.");
        }

        var job = await _context.JobPostings
            .Include(j => j.Company)
                .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.IsDeleted, ct);

        if (job == null)
        {
            throw new NotFoundException("JobPosting", jobId);
        }

        job.Status = JobPostingStatus.Suspended;
        job.ModerationReason = reason.Trim();
        job.ModeratedAtUtc = DateTimeOffset.UtcNow;
        job.ModeratedByUserId = adminUserId;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobModerationSuspended",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: job.CompanyId,
            metadata: new { SuspendedBy = adminUserId, Reason = reason.Trim(), JobTitle = job.Title },
            cancellationToken: ct);

        // Notify company team
        if (_notificationService != null)
        {
            var targetMembers = job.Company.Members
                .Where(m => m.MembershipStatus == CompanyMembershipStatus.Active)
                .ToList();

            foreach (var member in targetMembers)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: member.UserId,
                    notificationType: "JobModerated",
                    title: "Job Listing Suspended",
                    message: $"Your job listing '{job.Title}' was suspended by platform administration: {reason.Trim()}",
                    actionUrl: "/company/jobs",
                    ct: ct);
            }
        }
    }

    public async Task RestoreJobAsync(Guid jobId, Guid adminUserId, CancellationToken ct = default)
    {
        var job = await _context.JobPostings
            .Include(j => j.Company)
                .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.IsDeleted, ct);

        if (job == null)
        {
            throw new NotFoundException("JobPosting", jobId);
        }

        job.Status = JobPostingStatus.Published;
        job.ModerationReason = null;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobModerationRestored",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: job.CompanyId,
            metadata: new { RestoredBy = adminUserId, JobTitle = job.Title },
            cancellationToken: ct);

        // Notify company team
        if (_notificationService != null)
        {
            var targetMembers = job.Company.Members
                .Where(m => m.MembershipStatus == CompanyMembershipStatus.Active)
                .ToList();

            foreach (var member in targetMembers)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: member.UserId,
                    notificationType: "JobModerated",
                    title: "Job Listing Restored",
                    message: $"Your job listing '{job.Title}' has been restored to published status.",
                    actionUrl: "/company/jobs",
                    ct: ct);
            }
        }
    }
}
