using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.DTOs.Job;

namespace HireSphere.Application.Services;

public interface IAdminAuditService
{
    Task<PagedResult<AdminAuditItemDto>> GetAuditLogsAsync(
        string? search = null,
        string? actionType = null,
        string? targetResource = null,
        int page = 1,
        int pageSize = 15,
        CancellationToken ct = default);
}

public class AdminAuditService : IAdminAuditService
{
    private readonly IApplicationDbContext _context;

    public AdminAuditService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminAuditItemDto>> GetAuditLogsAsync(
        string? search = null,
        string? actionType = null,
        string? targetResource = null,
        int page = 1,
        int pageSize = 15,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.AuditLogs
            .Include(al => al.ActorUser)
            .Include(al => al.Company)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(actionType))
        {
            query = query.Where(al => al.ActionType == actionType.Trim());
        }

        if (!string.IsNullOrWhiteSpace(targetResource))
        {
            query = query.Where(al => al.TargetResource == targetResource.Trim());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(al =>
                al.ActionType.ToLower().Contains(term) ||
                al.TargetResource.ToLower().Contains(term) ||
                al.TargetResourceId.ToLower().Contains(term) ||
                (al.ActorUser != null && (al.ActorUser.Email.ToLower().Contains(term) || al.ActorUser.FirstName.ToLower().Contains(term) || al.ActorUser.LastName.ToLower().Contains(term))) ||
                (al.Company != null && al.Company.Name.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var logs = await query
            .OrderByDescending(al => al.TimestampUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = logs.Select(al => new AdminAuditItemDto
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

        return new PagedResult<AdminAuditItemDto>(items, totalCount, page, pageSize, totalPages);
    }
}
