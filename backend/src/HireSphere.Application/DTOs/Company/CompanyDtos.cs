namespace HireSphere.Application.DTOs.Company;

public record CompanyDto(
    Guid Id,
    string Name,
    string Slug,
    string? BusinessRegistrationNumber,
    string? WebsiteUrl,
    string? LogoUrl,
    string Industry,
    string? CompanySize,
    string? Description,
    string ContactEmail,
    string ApprovalStatus,
    string? RejectionReason,
    DateTimeOffset CreatedAtUtc);

public record CompanyMemberDto(
    Guid Id,
    Guid CompanyId,
    Guid UserId,
    string Email,
    string FullName,
    string CompanyRole,
    string MembershipStatus,
    DateTimeOffset JoinedAtUtc);

public record UpdateCompanyProfileRequest(
    string Name,
    string? BusinessRegistrationNumber,
    string? WebsiteUrl,
    string? LogoUrl,
    string Industry,
    string? CompanySize,
    string? Description,
    string ContactEmail);

public record InviteMemberRequest(
    string Email,
    string CompanyRole);

public record CompanyReviewDto(
    Guid Id,
    string Name,
    string Slug,
    string? BusinessRegistrationNumber,
    string? WebsiteUrl,
    string Industry,
    string ContactEmail,
    string ApprovalStatus,
    string? RejectionReason,
    string OwnerName,
    string OwnerEmail,
    DateTimeOffset CreatedAtUtc);

public record ApproveCompanyRequest();

public record RejectCompanyRequest(
    string RejectionReason);

public record SuspendCompanyRequest(
    string Reason);
