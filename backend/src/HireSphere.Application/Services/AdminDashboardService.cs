using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Domain.Enums;

namespace HireSphere.Application.Services;

public interface IAdminDashboardService
{
    Task<PlatformDashboardStatsDto> GetDashboardStatsAsync(CancellationToken ct = default);
}

public class AdminDashboardService : IAdminDashboardService
{
    private readonly IApplicationDbContext _context;

    public AdminDashboardService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PlatformDashboardStatsDto> GetDashboardStatsAsync(CancellationToken ct = default)
    {
        var stats = new PlatformDashboardStatsDto();

        // 1. User Statistics
        stats.TotalUsers = await _context.Users.CountAsync(u => !u.IsDeleted, ct);
        stats.TotalCandidates = await _context.CandidateProfiles.CountAsync(ct);
        stats.TotalCompanyMembers = await _context.CompanyMembers
            .Where(m => m.MembershipStatus == CompanyMembershipStatus.Active)
            .Select(m => m.UserId)
            .Distinct()
            .CountAsync(ct);
        stats.TotalSuperAdmins = await _context.UserRoles
            .Include(ur => ur.Role)
            .CountAsync(ur => ur.Role.NormalizedName == "SUPERADMIN", ct);
        stats.TotalDisabledUsers = await _context.Users
            .CountAsync(u => !u.IsDeleted && u.AccountStatus == AccountStatus.Disabled, ct);

        // 2. Company Statistics
        stats.TotalCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted, ct);
        stats.PendingCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted && c.ApprovalStatus == CompanyApprovalStatus.PendingApproval, ct);
        stats.ApprovedCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted && c.ApprovalStatus == CompanyApprovalStatus.Approved, ct);
        stats.RejectedCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted && c.ApprovalStatus == CompanyApprovalStatus.Rejected, ct);
        stats.SuspendedCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted && c.ApprovalStatus == CompanyApprovalStatus.Suspended, ct);

        // 3. Job Statistics
        stats.TotalJobs = await _context.JobPostings.CountAsync(j => !j.IsDeleted, ct);
        stats.PublishedJobs = await _context.JobPostings.CountAsync(j => !j.IsDeleted && j.Status == JobPostingStatus.Published, ct);
        stats.SuspendedJobs = await _context.JobPostings.CountAsync(j => !j.IsDeleted && j.Status == JobPostingStatus.Suspended, ct);
        stats.DraftJobs = await _context.JobPostings.CountAsync(j => !j.IsDeleted && j.Status == JobPostingStatus.Draft, ct);
        stats.ClosedJobs = await _context.JobPostings.CountAsync(j => !j.IsDeleted && j.Status == JobPostingStatus.Closed, ct);

        // 4. Recruitment & WorkSim Statistics
        stats.TotalApplications = await _context.JobApplications.CountAsync(ct);
        stats.WorkSimTotalAssignments = await _context.AssessmentAssignments.CountAsync(ct);
        stats.WorkSimCompletedAssessments = await _context.AssessmentAssignments.CountAsync(a => a.Status == AssessmentAssignmentStatus.Completed, ct);
        
        var avgScore = await _context.AssessmentResults
            .Select(r => (decimal?)r.TotalScore)
            .AverageAsync(ct);
        stats.WorkSimAverageScore = avgScore.HasValue ? Math.Round(avgScore.Value, 1) : null;

        // 5. Recent Platform Activity
        var recentLogs = await _context.AuditLogs
            .Include(al => al.ActorUser)
            .Include(al => al.Company)
            .OrderByDescending(al => al.TimestampUtc)
            .Take(12)
            .ToListAsync(ct);

        stats.RecentActivity = recentLogs.Select(al => new AdminAuditItemDto
        {
            Id = al.Id,
            ActorUserId = al.ActorUserId,
            ActorName = al.ActorUser?.FullName ?? "System",
            ActorEmail = al.ActorUser?.Email,
            CompanyId = al.CompanyId,
            CompanyName = al.Company?.Name,
            ActionType = al.ActionType,
            TargetResource = al.TargetResource,
            TargetResourceId = al.TargetResourceId,
            IpAddress = al.IpAddress,
            MetadataJson = al.MetadataJson,
            TimestampUtc = al.TimestampUtc
        }).ToList();

        return stats;
    }
}
