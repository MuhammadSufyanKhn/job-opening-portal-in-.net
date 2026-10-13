using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterCandidateAsync(RegisterCandidateRequest request, CancellationToken ct = default);
    Task<AuthResponse> RegisterCompanyAsync(RegisterCompanyRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task<UserResponse> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct = default);
    Task LogoutAsync(Guid userId, string? refreshToken, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IAuditService _auditService;
    private readonly INotificationService? _notificationService;

    public AuthService(
        IApplicationDbContext context,
        IPasswordHasherService passwordHasher,
        ITokenService tokenService,
        IAuditService auditService,
        INotificationService? notificationService = null)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    public async Task<AuthResponse> RegisterCandidateAsync(RegisterCandidateRequest request, CancellationToken ct = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        if (await _context.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail, ct))
        {
            throw new ConflictException("An account with this email address already exists.");
        }

        var candidateRole = await _context.Roles.FirstOrDefaultAsync(r => r.NormalizedName == PlatformRoles.Candidate.ToUpperInvariant(), ct)
            ?? new Role
            {
                Name = PlatformRoles.Candidate,
                NormalizedName = PlatformRoles.Candidate.ToUpperInvariant(),
                Description = "Candidate job seeker"
            };

        if (candidateRole.Id == Guid.Empty || !_context.Roles.Local.Contains(candidateRole))
        {
            _context.Roles.Add(candidateRole);
        }

        var user = new User
        {
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            AccountStatus = AccountStatus.Active,
            SecurityStamp = Guid.NewGuid().ToString("N"),
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(request.Password);

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = candidateRole.Id,
            AssignedAtUtc = DateTimeOffset.UtcNow
        });

        var profile = new CandidateProfile
        {
            UserId = user.Id,
            Headline = request.Headline?.Trim(),
            Location = request.Location?.Trim(),
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.Users.Add(user);
        _context.CandidateProfiles.Add(profile);

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CandidateRegistered",
            targetResource: "User",
            targetResourceId: user.Id.ToString(),
            metadata: new { Email = user.Email },
            cancellationToken: ct);

        return await GenerateAuthResponseAsync(user, new List<string> { PlatformRoles.Candidate }, null, null, ct);
    }

    public async Task<AuthResponse> RegisterCompanyAsync(RegisterCompanyRequest request, CancellationToken ct = default)
    {
        var normalizedEmail = request.OwnerEmail.Trim().ToUpperInvariant();

        if (await _context.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail, ct))
        {
            throw new ConflictException("An account with this owner email address already exists.");
        }

        var slug = GenerateSlug(request.CompanyName);
        if (await _context.Companies.AnyAsync(c => c.Slug == slug, ct))
        {
            slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
        }

        var companyRole = await _context.Roles.FirstOrDefaultAsync(r => r.NormalizedName == PlatformRoles.CompanyMember.ToUpperInvariant(), ct)
            ?? new Role
            {
                Name = PlatformRoles.CompanyMember,
                NormalizedName = PlatformRoles.CompanyMember.ToUpperInvariant(),
                Description = "Company employer team member"
            };

        if (companyRole.Id == Guid.Empty || !_context.Roles.Local.Contains(companyRole))
        {
            _context.Roles.Add(companyRole);
        }

        var user = new User
        {
            Email = request.OwnerEmail.Trim(),
            NormalizedEmail = normalizedEmail,
            FirstName = request.OwnerFirstName.Trim(),
            LastName = request.OwnerLastName.Trim(),
            AccountStatus = AccountStatus.Active,
            SecurityStamp = Guid.NewGuid().ToString("N"),
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(request.OwnerPassword);

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = companyRole.Id,
            AssignedAtUtc = DateTimeOffset.UtcNow
        });

        var company = new Company
        {
            Name = request.CompanyName.Trim(),
            Slug = slug,
            BusinessRegistrationNumber = request.BusinessRegistrationNumber?.Trim(),
            WebsiteUrl = request.WebsiteUrl?.Trim(),
            Industry = request.Industry.Trim(),
            Description = request.Description?.Trim(),
            ContactEmail = request.ContactEmail.Trim(),
            ApprovalStatus = CompanyApprovalStatus.PendingApproval,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        var member = new CompanyMember
        {
            CompanyId = company.Id,
            UserId = user.Id,
            CompanyRole = CompanyRole.Owner,
            MembershipStatus = CompanyMembershipStatus.Active,
            JoinedAtUtc = DateTimeOffset.UtcNow
        };

        _context.Users.Add(user);
        _context.Companies.Add(company);
        _context.CompanyMembers.Add(member);

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "CompanyRegistered",
            targetResource: "Company",
            targetResourceId: company.Id.ToString(),
            companyId: company.Id,
            metadata: new { CompanyName = company.Name, OwnerEmail = user.Email },
            cancellationToken: ct);

        if (_notificationService != null)
        {
            var adminUserIds = await _context.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.Role.Name == PlatformRoles.SuperAdmin)
                .Select(ur => ur.UserId)
                .ToListAsync(ct);

            foreach (var adminId in adminUserIds)
            {
                await _notificationService.CreateNotificationAsync(
                    userId: adminId,
                    notificationType: "CompanyPendingApproval",
                    title: $"New Organization Registered: {company.Name}",
                    message: $"'{company.Name}' ({company.Industry}) has registered and requires platform verification.",
                    actionUrl: "/admin/companies",
                    ct: ct);
            }
        }

        return await GenerateAuthResponseAsync(user, new List<string> { PlatformRoles.CompanyMember }, company.Id, CompanyRole.Owner.ToString(), ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.CompanyMembers)
                .ThenInclude(cm => cm.Company)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, ct);

        if (user == null || !_passwordHasher.VerifyPassword(user.PasswordHash, request.Password))
        {
            throw new UnauthorizedException("Invalid email address or password.");
        }

        if (user.AccountStatus == AccountStatus.Disabled)
        {
            throw new AccountLockedException("Your account has been disabled. Please contact support.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        Guid? activeCompanyId = request.ActiveCompanyId;
        string? activeCompanyRole = null;

        if (activeCompanyId.HasValue)
        {
            var membership = user.CompanyMembers.FirstOrDefault(m => m.CompanyId == activeCompanyId.Value && m.MembershipStatus == CompanyMembershipStatus.Active);
            if (membership != null)
            {
                activeCompanyRole = membership.CompanyRole.ToString();
            }
            else
            {
                activeCompanyId = null;
            }
        }
        else if (user.CompanyMembers.Any(m => m.MembershipStatus == CompanyMembershipStatus.Active))
        {
            var defaultMembership = user.CompanyMembers.First(m => m.MembershipStatus == CompanyMembershipStatus.Active);
            activeCompanyId = defaultMembership.CompanyId;
            activeCompanyRole = defaultMembership.CompanyRole.ToString();
        }

        await _auditService.LogAsync(
            action: "UserLogin",
            targetResource: "User",
            targetResourceId: user.Id.ToString(),
            companyId: activeCompanyId,
            metadata: new { Email = user.Email },
            cancellationToken: ct);

        return await GenerateAuthResponseAsync(user, roles, activeCompanyId, activeCompanyRole, ct);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default)
    {
        var tokenHash = _tokenService.HashToken(request.RefreshToken);

        var existingToken = await _context.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Include(rt => rt.User)
                .ThenInclude(u => u.CompanyMembers)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, ct);

        if (existingToken == null || !existingToken.IsActive)
        {
            throw new UnauthorizedException("Refresh token is invalid, revoked, or expired.");
        }

        var user = existingToken.User;
        if (user.AccountStatus == AccountStatus.Disabled)
        {
            throw new AccountLockedException("Account is disabled.");
        }

        // Revoke used token
        existingToken.RevokedAtUtc = DateTimeOffset.UtcNow;

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        Guid? activeCompanyId = request.ActiveCompanyId;
        string? activeCompanyRole = null;

        if (activeCompanyId.HasValue)
        {
            var membership = user.CompanyMembers.FirstOrDefault(m => m.CompanyId == activeCompanyId.Value && m.MembershipStatus == CompanyMembershipStatus.Active);
            if (membership != null)
            {
                activeCompanyRole = membership.CompanyRole.ToString();
            }
            else
            {
                activeCompanyId = null;
            }
        }

        return await GenerateAuthResponseAsync(user, roles, activeCompanyId, activeCompanyRole, ct);
    }

    public async Task<UserResponse> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.CompanyMembers)
                .ThenInclude(cm => cm.Company)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        return MapToUserResponse(user);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        if (!_passwordHasher.VerifyPassword(user.PasswordHash, request.CurrentPassword))
        {
            throw new UnauthorizedException("Current password verification failed.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.SecurityStamp = Guid.NewGuid().ToString("N");
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;

        // Invalidate active refresh tokens
        var tokens = await _context.RefreshTokens.Where(rt => rt.UserId == userId && rt.RevokedAtUtc == null).ToListAsync(ct);
        foreach (var t in tokens)
        {
            t.RevokedAtUtc = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "PasswordChanged",
            targetResource: "User",
            targetResourceId: user.Id.ToString(),
            cancellationToken: ct);
    }

    public async Task LogoutAsync(Guid userId, string? refreshToken, CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            var tokenHash = _tokenService.HashToken(refreshToken);
            var token = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.UserId == userId && rt.TokenHash == tokenHash, ct);
            if (token != null)
            {
                token.RevokedAtUtc = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync(ct);
            }
        }

        await _auditService.LogAsync(
            action: "UserLogout",
            targetResource: "User",
            targetResourceId: userId.ToString(),
            cancellationToken: ct);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(
        User user,
        IEnumerable<string> roles,
        Guid? activeCompanyId,
        string? activeCompanyRole,
        CancellationToken ct)
    {
        var accessToken = _tokenService.GenerateAccessToken(user, roles, activeCompanyId, activeCompanyRole);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();
        var hashedRefreshToken = _tokenService.HashToken(rawRefreshToken);

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hashedRefreshToken,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync(ct);

        var userResponse = MapToUserResponse(user, roles);

        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            ExpiresAtUtc: DateTimeOffset.UtcNow.AddMinutes(60),
            User: userResponse);
    }

    private static UserResponse MapToUserResponse(User user, IEnumerable<string>? roles = null)
    {
        var resolvedRoles = roles?.ToList() ?? user.UserRoles.Select(ur => ur.Role.Name).ToList();

        var companies = user.CompanyMembers.Select(cm => new CompanyMembershipSummaryDto(
            CompanyId: cm.CompanyId,
            CompanyName: cm.Company.Name,
            CompanySlug: cm.Company.Slug,
            CompanyRole: cm.CompanyRole.ToString(),
            MembershipStatus: cm.MembershipStatus.ToString(),
            ApprovalStatus: cm.Company.ApprovalStatus.ToString()
        )).ToList();

        return new UserResponse(
            Id: user.Id,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            FullName: user.FullName,
            PhoneNumber: user.PhoneNumber,
            AccountStatus: user.AccountStatus.ToString(),
            Roles: resolvedRoles,
            Companies: companies);
    }

    private static string GenerateSlug(string phrase)
    {
        var str = phrase.ToLowerInvariant();
        str = System.Text.RegularExpressions.Regex.Replace(str, @"[^a-z0-9\s-]", "");
        str = System.Text.RegularExpressions.Regex.Replace(str, @"\s+", " ").Trim();
        str = str.Substring(0, str.Length <= 45 ? str.Length : 45).Trim();
        str = System.Text.RegularExpressions.Regex.Replace(str, @"\s", "-");
        return string.IsNullOrWhiteSpace(str) ? "company" : str;
    }
}
