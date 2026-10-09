using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;

namespace HireSphere.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var sub = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue(ClaimTypes.Name);
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? Email => User?.FindFirstValue(ClaimTypes.Email);

    public IEnumerable<string> Roles => User?.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? Enumerable.Empty<string>();

    public Guid? ActiveCompanyId
    {
        get
        {
            var tenantClaim = User?.FindFirstValue("tenant_id");
            return Guid.TryParse(tenantClaim, out var id) ? id : null;
        }
    }

    public string? CompanyRole => User?.FindFirstValue("company_role");

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public bool IsSuperAdmin => Roles.Contains(PlatformRoles.SuperAdmin);
}

public class AuditService : IAuditService
{
    private readonly IApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(IApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
        string action,
        string targetResource,
        string targetResourceId,
        Guid? companyId = null,
        object? metadata = null,
        CancellationToken cancellationToken = default)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var userIdClaim = httpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? actorUserId = Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        string? ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
        string? userAgent = httpContext?.Request?.Headers.UserAgent.ToString();

        string? serializedMetadata = null;
        if (metadata != null)
        {
            try
            {
                serializedMetadata = JsonSerializer.Serialize(metadata);
            }
            catch
            {
                serializedMetadata = metadata.ToString();
            }
        }

        var log = new AuditLog
        {
            ActorUserId = actorUserId,
            CompanyId = companyId,
            ActionType = action,
            TargetResource = targetResource,
            TargetResourceId = targetResourceId,
            IpAddress = ipAddress?.Length > 50 ? ipAddress[..50] : ipAddress,
            UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
            MetadataJson = serializedMetadata,
            TimestampUtc = DateTimeOffset.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
