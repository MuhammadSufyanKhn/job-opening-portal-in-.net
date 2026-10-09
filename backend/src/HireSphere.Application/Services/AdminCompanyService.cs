using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Company;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IAdminCompanyService
{
    Task<List<CompanyReviewDto>> GetPendingCompaniesAsync(CancellationToken ct = default);
    Task<List<CompanyReviewDto>> GetAllCompaniesAsync(string? status = null, CancellationToken ct = default);
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

    public AdminCompanyService(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
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
