namespace HireSphere.Application.DTOs.Auth;

public record RegisterCandidateRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? PhoneNumber = null,
    string? Headline = null,
    string? Location = null);

public record RegisterCompanyRequest(
    string CompanyName,
    string Industry,
    string ContactEmail,
    string? BusinessRegistrationNumber,
    string? WebsiteUrl,
    string? Description,
    string OwnerFirstName,
    string OwnerLastName,
    string OwnerEmail,
    string OwnerPassword);

public record LoginRequest(
    string Email,
    string Password,
    Guid? ActiveCompanyId = null);

public record RefreshTokenRequest(
    string RefreshToken,
    Guid? ActiveCompanyId = null);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);

public record UserResponse(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    string? PhoneNumber,
    string AccountStatus,
    List<string> Roles,
    List<CompanyMembershipSummaryDto> Companies);

public record CompanyMembershipSummaryDto(
    Guid CompanyId,
    string CompanyName,
    string CompanySlug,
    string CompanyRole,
    string MembershipStatus,
    string ApprovalStatus);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAtUtc,
    UserResponse User);
