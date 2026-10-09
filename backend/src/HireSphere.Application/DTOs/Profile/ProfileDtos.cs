namespace HireSphere.Application.DTOs.Profile;

public record CandidateProfileDto(
    Guid Id,
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    string? Headline,
    string? Summary,
    string? Location,
    int? YearsOfExperience,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? PortfolioUrl,
    DateTimeOffset? UpdatedAtUtc);

public record UpdateCandidateProfileRequest(
    string FirstName,
    string LastName,
    string? Headline,
    string? Summary,
    string? Location,
    int? YearsOfExperience,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? PortfolioUrl);
