using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.DTOs.Job;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserSummaryDto>> GetUsersAsync(
        string? search = null,
        string? role = null,
        string? status = null,
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default);

    Task<AdminUserDetailDto> GetUserByIdAsync(Guid userId, CancellationToken ct = default);

    Task SuspendUserAsync(Guid userId, Guid adminUserId, string reason, CancellationToken ct = default);

    Task ReactivateUserAsync(Guid userId, Guid adminUserId, CancellationToken ct = default);
}

public class AdminUserService : IAdminUserService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public AdminUserService(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<PagedResult<AdminUserSummaryDto>> GetUsersAsync(
        string? search = null,
        string? role = null,
        string? status = null,
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.CompanyMembers)
                .ThenInclude(cm => cm.Company)
            .Include(u => u.CandidateProfile)
            .Where(u => !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(term) ||
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var normalizedRole = role.Trim().ToUpperInvariant();
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.NormalizedName == normalizedRole));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AccountStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(u => u.AccountStatus == parsedStatus);
        }

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var users = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = users.Select(u => new AdminUserSummaryDto
        {
            Id = u.Id,
            Email = u.Email,
            FullName = u.FullName,
            FirstName = u.FirstName,
            LastName = u.LastName,
            PhoneNumber = u.PhoneNumber,
            AccountStatus = u.AccountStatus.ToString(),
            Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
            CreatedAtUtc = u.CreatedAtUtc,
            IsCandidate = u.CandidateProfile != null,
            CompanyNames = u.CompanyMembers.Select(cm => cm.Company.Name).Distinct().ToList()
        }).ToList();

        return new PagedResult<AdminUserSummaryDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<AdminUserDetailDto> GetUserByIdAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.CompanyMembers)
                .ThenInclude(cm => cm.Company)
            .Include(u => u.CandidateProfile)
                .ThenInclude(cp => cp!.Applications)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, ct);

        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        var recentAudit = await _context.AuditLogs
            .Include(al => al.ActorUser)
            .Where(al => al.TargetResource == "User" && al.TargetResourceId == userId.ToString())
            .OrderByDescending(al => al.TimestampUtc)
            .Take(10)
            .ToListAsync(ct);

        return new AdminUserDetailDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            AccountStatus = user.AccountStatus.ToString(),
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            CreatedAtUtc = user.CreatedAtUtc,
            UpdatedAtUtc = user.UpdatedAtUtc,
            IsCandidate = user.CandidateProfile != null,
            CandidateHeadline = user.CandidateProfile?.Headline,
            CandidateLocation = user.CandidateProfile?.Location,
            YearsOfExperience = user.CandidateProfile?.YearsOfExperience,
            ApplicationsCount = user.CandidateProfile?.Applications.Count ?? 0,
            CompanyMemberships = user.CompanyMembers.Select(cm => new AdminUserCompanyMembershipDto
            {
                CompanyId = cm.CompanyId,
                CompanyName = cm.Company.Name,
                Role = cm.CompanyRole.ToString(),
                Status = cm.MembershipStatus.ToString(),
                JoinedAtUtc = cm.JoinedAtUtc
            }).ToList(),
            RecentAuditLogs = recentAudit.Select(al => new AdminAuditItemDto
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

    public async Task SuspendUserAsync(Guid userId, Guid adminUserId, string reason, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ValidationException("Suspension reason is required.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, ct);

        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        // Lockout protection: Cannot suspend the last active SuperAdmin
        var isSuperAdmin = user.UserRoles.Any(ur => ur.Role.NormalizedName == "SUPERADMIN");
        if (isSuperAdmin)
        {
            var activeSuperAdminCount = await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .CountAsync(ur => ur.Role.NormalizedName == "SUPERADMIN" &&
                                  !ur.User.IsDeleted &&
                                  ur.User.AccountStatus == AccountStatus.Active, ct);

            if (activeSuperAdminCount <= 1)
            {
                throw new ConflictException("Cannot suspend the only remaining active SuperAdmin account to prevent system lockout.");
            }
        }

        user.AccountStatus = AccountStatus.Disabled;
        user.SecurityStamp = Guid.NewGuid().ToString("N");
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;

        // Immediately revoke all active refresh tokens for the suspended user
        var activeRefreshTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAtUtc == null)
            .ToListAsync(ct);
        foreach (var rt in activeRefreshTokens)
        {
            rt.RevokedAtUtc = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "UserSuspended",
            targetResource: "User",
            targetResourceId: user.Id.ToString(),
            metadata: new { SuspendedBy = adminUserId, Reason = reason.Trim(), Email = user.Email },
            cancellationToken: ct);
    }

    public async Task ReactivateUserAsync(Guid userId, Guid adminUserId, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, ct);
        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        user.AccountStatus = AccountStatus.Active;
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "UserReactivated",
            targetResource: "User",
            targetResourceId: user.Id.ToString(),
            metadata: new { ReactivatedBy = adminUserId, Email = user.Email },
            cancellationToken: ct);
    }
}
