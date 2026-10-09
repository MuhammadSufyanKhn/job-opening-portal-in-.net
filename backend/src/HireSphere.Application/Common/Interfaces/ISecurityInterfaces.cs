using HireSphere.Domain.Entities;

namespace HireSphere.Application.Common.Interfaces;

public interface IPasswordHasherService
{
    string HashPassword(string password);
    bool VerifyPassword(string hashedPassword, string providedPassword);
}

public interface ITokenService
{
    string GenerateAccessToken(User user, IEnumerable<string> roles, Guid? activeCompanyId = null, string? companyRole = null);
    string GenerateRefreshToken();
    string HashToken(string token);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    IEnumerable<string> Roles { get; }
    Guid? ActiveCompanyId { get; }
    string? CompanyRole { get; }
    bool IsAuthenticated { get; }
    bool IsSuperAdmin { get; }
}

public interface IAuditService
{
    Task LogAsync(
        string action,
        string targetResource,
        string targetResourceId,
        Guid? companyId = null,
        object? metadata = null,
        CancellationToken cancellationToken = default);
}
