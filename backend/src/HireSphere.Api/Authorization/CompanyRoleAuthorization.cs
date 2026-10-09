using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Authorization;

public class CompanyRoleRequirement : IAuthorizationRequirement
{
    public CompanyRole? MinimumRole { get; }
    public bool RequireApprovedCompany { get; }

    public CompanyRoleRequirement(CompanyRole? minimumRole = null, bool requireApprovedCompany = false)
    {
        MinimumRole = minimumRole;
        RequireApprovedCompany = requireApprovedCompany;
    }
}

public class CompanyRoleHandler : AuthorizationHandler<CompanyRoleRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IApplicationDbContext _context;

    public CompanyRoleHandler(IHttpContextAccessor httpContextAccessor, IApplicationDbContext context)
    {
        _httpContextAccessor = httpContextAccessor;
        _context = context;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, CompanyRoleRequirement requirement)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return;

        // SuperAdmin bypasses company-level restrictions for admin tasks
        if (context.User.IsInRole(PlatformRoles.SuperAdmin))
        {
            context.Succeed(requirement);
            return;
        }

        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return;
        }

        // Extract companyId from route data e.g. /api/companies/{companyId}
        if (!httpContext.Request.RouteValues.TryGetValue("companyId", out var rawCompanyId) ||
            !Guid.TryParse(rawCompanyId?.ToString(), out var companyId))
        {
            return;
        }

        var membership = await _context.CompanyMembers
            .Include(cm => cm.Company)
            .FirstOrDefaultAsync(cm => cm.CompanyId == companyId && cm.UserId == userId && cm.MembershipStatus == CompanyMembershipStatus.Active);

        if (membership == null)
        {
            return; // Not a member
        }

        if (requirement.RequireApprovedCompany && membership.Company.ApprovalStatus != CompanyApprovalStatus.Approved)
        {
            return; // Company not approved yet
        }

        if (requirement.MinimumRole.HasValue)
        {
            // Owner has highest rank (0), Recruiter (1), HiringManager (2)
            if (membership.CompanyRole > requirement.MinimumRole.Value)
            {
                return; // Insufficient role
            }
        }

        context.Succeed(requirement);
    }
}
