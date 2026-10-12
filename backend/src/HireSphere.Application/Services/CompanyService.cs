using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Company;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface ICompanyService
{
    Task<List<CompanyDto>> GetUserCompaniesAsync(Guid userId, CancellationToken ct = default);
    Task<CompanyDto> GetCompanyByIdAsync(Guid companyId, Guid userId, CancellationToken ct = default);
    Task<CompanyDto> UpdateCompanyProfileAsync(Guid companyId, Guid userId, UpdateCompanyProfileRequest request, CancellationToken ct = default);
    Task<List<CompanyMemberDto>> GetMembersAsync(Guid companyId, Guid userId, CancellationToken ct = default);
    Task<CompanyMemberDto> InviteMemberAsync(Guid companyId, Guid userId, InviteMemberRequest request, CancellationToken ct = default);
    Task RemoveMemberAsync(Guid companyId, Guid memberId, Guid currentUserId, CancellationToken ct = default);
    Task<List<PublicCompanySummaryDto>> GetPublicFeaturedCompaniesAsync(int limit = 8, CancellationToken ct = default);
    Task<PublicCompanyDirectoryResult> GetPublicCompanyDirectoryAsync(string? search, string? industry, int page = 1, int pageSize = 12, CancellationToken ct = default);
}

public class CompanyService : ICompanyService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public CompanyService(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<List<CompanyDto>> GetUserCompaniesAsync(Guid userId, CancellationToken ct = default)
    {
        var companies = await _context.CompanyMembers
            .Where(cm => cm.UserId == userId && cm.MembershipStatus == CompanyMembershipStatus.Active)
            .Select(cm => cm.Company)
            .Where(c => !c.IsDeleted)
            .ToListAsync(ct);

        return companies.Select(MapToCompanyDto).ToList();
    }

    public async Task<CompanyDto> GetCompanyByIdAsync(Guid companyId, Guid userId, CancellationToken ct = default)
    {
        var isMember = await _context.CompanyMembers
            .AnyAsync(cm => cm.CompanyId == companyId && cm.UserId == userId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (!isMember)
        {
            throw new ForbiddenAccessException("You are not an active member of this organization.");
        }

        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);
        if (company == null)
        {
            throw new NotFoundException("Company", companyId);
        }

        return MapToCompanyDto(company);
    }

    public async Task<CompanyDto> UpdateCompanyProfileAsync(Guid companyId, Guid userId, UpdateCompanyProfileRequest request, CancellationToken ct = default)
    {
        var membership = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.CompanyId == companyId && cm.UserId == userId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (membership == null || membership.CompanyRole != CompanyRole.Owner)
        {
            throw new ForbiddenAccessException("Only company owners can update the organization profile.");
        }

        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);
        if (company == null)
        {
            throw new NotFoundException("Company", companyId);
        }

        company.Name = request.Name.Trim();
        company.BusinessRegistrationNumber = request.BusinessRegistrationNumber?.Trim();
        company.WebsiteUrl = request.WebsiteUrl?.Trim();
        company.LogoUrl = request.LogoUrl?.Trim();
        company.Industry = request.Industry.Trim();
        company.CompanySize = request.CompanySize?.Trim();
        company.Description = request.Description?.Trim();
        company.ContactEmail = request.ContactEmail.Trim();
        company.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CompanyProfileUpdated",
            targetResource: "Company",
            targetResourceId: company.Id.ToString(),
            companyId: company.Id,
            cancellationToken: ct);

        return MapToCompanyDto(company);
    }

    public async Task<List<CompanyMemberDto>> GetMembersAsync(Guid companyId, Guid userId, CancellationToken ct = default)
    {
        var isMember = await _context.CompanyMembers
            .AnyAsync(cm => cm.CompanyId == companyId && cm.UserId == userId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (!isMember)
        {
            throw new ForbiddenAccessException("Access denied.");
        }

        var members = await _context.CompanyMembers
            .Include(cm => cm.User)
            .Where(cm => cm.CompanyId == companyId && cm.MembershipStatus == CompanyMembershipStatus.Active)
            .ToListAsync(ct);

        return members.Select(MapToMemberDto).ToList();
    }

    public async Task<CompanyMemberDto> InviteMemberAsync(Guid companyId, Guid userId, InviteMemberRequest request, CancellationToken ct = default)
    {
        var currentMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.CompanyId == companyId && cm.UserId == userId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (currentMember == null || currentMember.CompanyRole != CompanyRole.Owner)
        {
            throw new ForbiddenAccessException("Only owners can invite new company members.");
        }

        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);
        if (company == null)
        {
            throw new NotFoundException("Company", companyId);
        }

        if (company.ApprovalStatus != CompanyApprovalStatus.Approved)
        {
            throw new ForbiddenAccessException("Company must be approved by platform administrators before inviting team members.");
        }

        if (!Enum.TryParse<CompanyRole>(request.CompanyRole, out var role) || role == CompanyRole.Owner)
        {
            throw new ConflictException("Invited role must be Recruiter or HiringManager.");
        }

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        // Check if user already exists
        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, ct);
        if (targetUser != null)
        {
            var existingMembership = await _context.CompanyMembers
                .FirstOrDefaultAsync(cm => cm.CompanyId == companyId && cm.UserId == targetUser.Id, ct);

            if (existingMembership != null && existingMembership.MembershipStatus == CompanyMembershipStatus.Active)
            {
                throw new ConflictException("User is already an active member of this company.");
            }

            if (existingMembership != null)
            {
                existingMembership.MembershipStatus = CompanyMembershipStatus.Active;
                existingMembership.CompanyRole = role;
                existingMembership.UpdatedAtUtc = DateTimeOffset.UtcNow;
            }
            else
            {
                existingMembership = new CompanyMember
                {
                    CompanyId = companyId,
                    UserId = targetUser.Id,
                    CompanyRole = role,
                    MembershipStatus = CompanyMembershipStatus.Active,
                    JoinedAtUtc = DateTimeOffset.UtcNow
                };
                _context.CompanyMembers.Add(existingMembership);
            }

            await _context.SaveChangesAsync(ct);

            await _auditService.LogAsync(
                action: "MemberAddedDirectly",
                targetResource: "CompanyMember",
                targetResourceId: existingMembership.Id.ToString(),
                companyId: companyId,
                metadata: new { Email = request.Email, Role = role.ToString() },
                cancellationToken: ct);

            return MapToMemberDto(existingMembership);
        }

        // User does not exist yet -> Create Invitation Token
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("/", "_").Replace("+", "-").TrimEnd('=');
        var invitation = new CompanyInvitation
        {
            CompanyId = companyId,
            InvitedEmail = request.Email.Trim(),
            CompanyRole = role,
            InvitationToken = token,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7),
            InvitedByUserId = userId,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.CompanyInvitations.Add(invitation);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "MemberInvitationCreated",
            targetResource: "CompanyInvitation",
            targetResourceId: invitation.Id.ToString(),
            companyId: companyId,
            metadata: new { Email = request.Email, Role = role.ToString() },
            cancellationToken: ct);

        return new CompanyMemberDto(
            Id: invitation.Id,
            CompanyId: companyId,
            UserId: Guid.Empty,
            Email: request.Email.Trim(),
            FullName: "Invited Pending Registration",
            CompanyRole: role.ToString(),
            MembershipStatus: "PendingInvitation",
            JoinedAtUtc: invitation.CreatedAtUtc);
    }

    public async Task RemoveMemberAsync(Guid companyId, Guid memberId, Guid currentUserId, CancellationToken ct = default)
    {
        var currentMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.CompanyId == companyId && cm.UserId == currentUserId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (currentMember == null || currentMember.CompanyRole != CompanyRole.Owner)
        {
            throw new ForbiddenAccessException("Only company owners can remove members.");
        }

        var targetMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.Id == memberId && cm.CompanyId == companyId, ct);

        if (targetMember == null)
        {
            throw new NotFoundException("CompanyMember", memberId);
        }

        if (targetMember.CompanyRole == CompanyRole.Owner)
        {
            throw new ConflictException("Company owner cannot be removed. Transfer ownership first.");
        }

        targetMember.MembershipStatus = CompanyMembershipStatus.Left;
        targetMember.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "MemberRemoved",
            targetResource: "CompanyMember",
            targetResourceId: memberId.ToString(),
            companyId: companyId,
            cancellationToken: ct);
    }

    public async Task<List<PublicCompanySummaryDto>> GetPublicFeaturedCompaniesAsync(int limit = 8, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        return await _context.Companies
            .Where(c => c.ApprovalStatus == CompanyApprovalStatus.Approved && !c.IsDeleted)
            .OrderByDescending(c => c.JobPostings.Count(j => j.Status == JobPostingStatus.Published
                && !j.IsDeleted
                && (j.ExpiresAtUtc == null || j.ExpiresAtUtc > now)))
            .ThenBy(c => c.Name)
            .Take(limit)
            .Select(c => new PublicCompanySummaryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.WebsiteUrl,
                c.LogoUrl,
                c.Industry,
                c.CompanySize,
                c.Description,
                c.JobPostings.Count(j => j.Status == JobPostingStatus.Published
                    && !j.IsDeleted
                    && (j.ExpiresAtUtc == null || j.ExpiresAtUtc > now))
            ))
            .ToListAsync(ct);
    }

    public async Task<PublicCompanyDirectoryResult> GetPublicCompanyDirectoryAsync(string? search, string? industry, int page = 1, int pageSize = 12, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var query = _context.Companies
            .Where(c => c.ApprovalStatus == CompanyApprovalStatus.Approved && !c.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(term)
                                  || (c.Description != null && c.Description.ToLower().Contains(term))
                                  || c.Industry.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(industry))
        {
            var ind = industry.Trim().ToLower();
            query = query.Where(c => c.Industry.ToLower() == ind);
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(c => c.JobPostings.Count(j => j.Status == JobPostingStatus.Published
                && !j.IsDeleted
                && (j.ExpiresAtUtc == null || j.ExpiresAtUtc > now)))
            .ThenBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new PublicCompanySummaryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.WebsiteUrl,
                c.LogoUrl,
                c.Industry,
                c.CompanySize,
                c.Description,
                c.JobPostings.Count(j => j.Status == JobPostingStatus.Published
                    && !j.IsDeleted
                    && (j.ExpiresAtUtc == null || j.ExpiresAtUtc > now))
            ))
            .ToListAsync(ct);

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PublicCompanyDirectoryResult(items, totalCount, page, pageSize, totalPages);
    }

    private static CompanyDto MapToCompanyDto(Company c) => new(
        Id: c.Id,
        Name: c.Name,
        Slug: c.Slug,
        BusinessRegistrationNumber: c.BusinessRegistrationNumber,
        WebsiteUrl: c.WebsiteUrl,
        LogoUrl: c.LogoUrl,
        Industry: c.Industry,
        CompanySize: c.CompanySize,
        Description: c.Description,
        ContactEmail: c.ContactEmail,
        ApprovalStatus: c.ApprovalStatus.ToString(),
        RejectionReason: c.RejectionReason,
        CreatedAtUtc: c.CreatedAtUtc);

    private static CompanyMemberDto MapToMemberDto(CompanyMember m) => new(
        Id: m.Id,
        CompanyId: m.CompanyId,
        UserId: m.UserId,
        Email: m.User?.Email ?? string.Empty,
        FullName: m.User?.FullName ?? string.Empty,
        CompanyRole: m.CompanyRole.ToString(),
        MembershipStatus: m.MembershipStatus.ToString(),
        JoinedAtUtc: m.JoinedAtUtc);
}
