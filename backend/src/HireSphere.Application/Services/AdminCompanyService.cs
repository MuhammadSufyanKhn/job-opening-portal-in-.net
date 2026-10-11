using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Company;
using HireSphere.Application.DTOs.Job;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IAdminCompanyService
{
    Task<List<CompanyReviewDto>> GetPendingCompaniesAsync(CancellationToken ct = default);
    Task<List<CompanyReviewDto>> GetAllCompaniesAsync(string? status = null, CancellationToken ct = default);
    Task<PagedResult<CompanyReviewDto>> GetCompaniesPagedAsync(string? search = null, string? status = null, int page = 1, int pageSize = 10, CancellationToken ct = default);
    Task<CompanyReviewDto> GetCompanyReviewDetailsAsync(Guid companyId, CancellationToken ct = default);
    Task ApproveCompanyAsync(Guid companyId, Guid adminUserId, CancellationToken ct = default);
    Task RejectCompanyAsync(Guid companyId, Guid adminUserId, RejectCompanyRequest request, CancellationToken ct = default);
    Task SuspendCompanyAsync(Guid companyId, Guid adminUserId, SuspendCompanyRequest request, CancellationToken ct = default);
    Task RestoreCompanyAsync(Guid companyId, Guid adminUserId, CancellationToken ct = default);
}

public class AdminCompanyService : IAdminCompanyService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly INotificationService? _notificationService;
    private readonly IEmailService? _emailService;

    public AdminCompanyService(
        IApplicationDbContext context,
        IAuditService auditService,
        INotificationService? notificationService = null,
        IEmailService? emailService = null)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
        _emailService = emailService;
    }

    public async Task<List<CompanyReviewDto>> GetPendingCompaniesAsync(CancellationToken ct = default)
    {
        return await GetCompaniesByStatusAsync(CompanyApprovalStatus.PendingApproval, ct);
    }

    public async Task<List<CompanyReviewDto>> GetAllCompaniesAsync(string? status = null, CancellationToken ct = default)
    {
        IQueryable<Domain.Entities.Company> query = _context.Companies
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .Where(c => !c.IsDeleted);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<CompanyApprovalStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(c => c.ApprovalStatus == parsedStatus);
        }

        var companies = await query.OrderByDescending(c => c.CreatedAtUtc).ToListAsync(ct);
        return companies.Select(MapToReviewDto).ToList();
    }

    public async Task<PagedResult<CompanyReviewDto>> GetCompaniesPagedAsync(
        string? search = null,
        string? status = null,
        int page = 1,
        int pageSize = 10,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        IQueryable<Domain.Entities.Company> query = _context.Companies
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .Where(c => !c.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                c.ContactEmail.ToLower().Contains(term) ||
                c.Industry.ToLower().Contains(term) ||
                (c.BusinessRegistrationNumber != null && c.BusinessRegistrationNumber.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<CompanyApprovalStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(c => c.ApprovalStatus == parsedStatus);
        }

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var companies = await query
            .OrderByDescending(c => c.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = companies.Select(MapToReviewDto).ToList();
        return new PagedResult<CompanyReviewDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<CompanyReviewDto> GetCompanyReviewDetailsAsync(Guid companyId, CancellationToken ct = default)
    {
        var company = await _context.Companies
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);

        if (company == null)
        {
            throw new NotFoundException("Company", companyId);
        }

        return MapToReviewDto(company);
    }

    public async Task ApproveCompanyAsync(Guid companyId, Guid adminUserId, CancellationToken ct = default)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);
        if (company == null)
        {
            throw new NotFoundException("Company", companyId);
        }

        company.ApprovalStatus = CompanyApprovalStatus.Approved;
        company.ApprovedAtUtc = DateTimeOffset.UtcNow;
        company.ApprovedByUserId = adminUserId;
        company.RejectionReason = null;
        company.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CompanyApproved",
            targetResource: "Company",
            targetResourceId: company.Id.ToString(),
            companyId: company.Id,
            metadata: new { ApprovedBy = adminUserId },
            cancellationToken: ct);

        await NotifyCompanyMembersAsync(
            company.Id,
            "Company Workspace Approved",
            $"Your organization '{company.Name}' has been verified and approved for HireSphere.",
            "Approved",
            null,
            ct);
    }

    public async Task RejectCompanyAsync(Guid companyId, Guid adminUserId, RejectCompanyRequest request, CancellationToken ct = default)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);
        if (company == null)
        {
            throw new NotFoundException("Company", companyId);
        }

        company.ApprovalStatus = CompanyApprovalStatus.Rejected;
        company.RejectionReason = request.RejectionReason.Trim();
        company.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CompanyRejected",
            targetResource: "Company",
            targetResourceId: company.Id.ToString(),
            companyId: company.Id,
            metadata: new { RejectedBy = adminUserId, Reason = request.RejectionReason },
            cancellationToken: ct);

        await NotifyCompanyMembersAsync(
            company.Id,
            "Company Registration Rejected",
            $"Your organization registration was rejected. Reason: {request.RejectionReason.Trim()}",
            "Rejected",
            request.RejectionReason.Trim(),
            ct);
    }

    public async Task SuspendCompanyAsync(Guid companyId, Guid adminUserId, SuspendCompanyRequest request, CancellationToken ct = default)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);
        if (company == null)
        {
            throw new NotFoundException("Company", companyId);
        }

        company.ApprovalStatus = CompanyApprovalStatus.Suspended;
        company.RejectionReason = request.Reason.Trim();
        company.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CompanySuspended",
            targetResource: "Company",
            targetResourceId: company.Id.ToString(),
            companyId: company.Id,
            metadata: new { SuspendedBy = adminUserId, Reason = request.Reason },
            cancellationToken: ct);

        await NotifyCompanyMembersAsync(
            company.Id,
            "Company Workspace Suspended",
            $"Your organization workspace has been suspended. Reason: {request.Reason.Trim()}",
            "Suspended",
            request.Reason.Trim(),
            ct);
    }

    public async Task RestoreCompanyAsync(Guid companyId, Guid adminUserId, CancellationToken ct = default)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);
        if (company == null)
        {
            throw new NotFoundException("Company", companyId);
        }

        company.ApprovalStatus = CompanyApprovalStatus.Approved;
        company.RejectionReason = null;
        company.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CompanyRestored",
            targetResource: "Company",
            targetResourceId: company.Id.ToString(),
            companyId: company.Id,
            metadata: new { RestoredBy = adminUserId },
            cancellationToken: ct);

        await NotifyCompanyMembersAsync(
            company.Id,
            "Company Workspace Restored",
            $"Your organization workspace '{company.Name}' has been restored to active approved status.",
            "Restored",
            null,
            ct);
    }

    private async Task<List<CompanyReviewDto>> GetCompaniesByStatusAsync(CompanyApprovalStatus status, CancellationToken ct)
    {
        var companies = await _context.Companies
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .Where(c => c.ApprovalStatus == status && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(ct);

        return companies.Select(MapToReviewDto).ToList();
    }

    private async Task NotifyCompanyMembersAsync(
        Guid companyId,
        string title,
        string message,
        string decision,
        string? reason,
        CancellationToken ct)
    {
        var members = await _context.CompanyMembers
            .Include(m => m.User)
            .Include(m => m.Company)
            .Where(m => m.CompanyId == companyId && m.MembershipStatus == CompanyMembershipStatus.Active)
            .ToListAsync(ct);

        if (_notificationService != null)
        {
            foreach (var m in members)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: m.UserId,
                    notificationType: "CompanyStatusChanged",
                    title: title,
                    message: message,
                    actionUrl: "/company/dashboard",
                    ct: ct);
            }
        }

        if (_emailService != null)
        {
            var owner = members.FirstOrDefault(m => m.CompanyRole == CompanyRole.Owner) ?? members.FirstOrDefault();
            if (owner != null)
            {
                await _emailService.SendCompanyReviewDecisionEmailAsync(
                    recipientEmail: owner.User.Email,
                    ownerName: owner.User.FullName,
                    companyName: owner.Company.Name,
                    decision: decision,
                    reason: reason,
                    cancellationToken: ct);
            }
        }
    }

    private static CompanyReviewDto MapToReviewDto(Domain.Entities.Company c)
    {
        var ownerMember = c.Members.FirstOrDefault(m => m.CompanyRole == CompanyRole.Owner);
        return new CompanyReviewDto(
            Id: c.Id,
            Name: c.Name,
            Slug: c.Slug,
            BusinessRegistrationNumber: c.BusinessRegistrationNumber,
            WebsiteUrl: c.WebsiteUrl,
            Industry: c.Industry,
            ContactEmail: c.ContactEmail,
            ApprovalStatus: c.ApprovalStatus.ToString(),
            RejectionReason: c.RejectionReason,
            OwnerName: ownerMember?.User.FullName ?? "Unknown",
            OwnerEmail: ownerMember?.User.Email ?? "Unknown",
            CreatedAtUtc: c.CreatedAtUtc);
    }
}
