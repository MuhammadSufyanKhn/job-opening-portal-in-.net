using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Profile;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface ICandidateProfileService
{
    Task<CandidateProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<CandidateProfileDto> UpdateProfileAsync(Guid userId, UpdateCandidateProfileRequest request, CancellationToken ct = default);
}

public class CandidateProfileService : ICandidateProfileService
{
    private readonly IApplicationDbContext _context;

    public CandidateProfileService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CandidateProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles
            .Include(cp => cp.User)
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (profile == null)
        {
            throw new NotFoundException("CandidateProfile", userId);
        }

        var hasPrimaryCv = await _context.CandidateDocuments
            .AnyAsync(d => d.CandidateProfileId == profile.Id && !d.IsDeleted && d.IsDefault, ct);

        return MapToDto(profile, hasPrimaryCv);
    }

    public async Task<CandidateProfileDto> UpdateProfileAsync(Guid userId, UpdateCandidateProfileRequest request, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles
            .Include(cp => cp.User)
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (profile == null)
        {
            throw new NotFoundException("CandidateProfile", userId);
        }

        profile.User.FirstName = request.FirstName.Trim();
        profile.User.LastName = request.LastName.Trim();
        profile.User.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        profile.User.UpdatedAtUtc = DateTimeOffset.UtcNow;

        profile.Headline = request.Headline?.Trim();
        profile.Summary = request.Summary?.Trim();
        profile.Location = request.Location?.Trim();
        profile.YearsOfExperience = request.YearsOfExperience;
        profile.LinkedInUrl = request.LinkedInUrl?.Trim();
        profile.GitHubUrl = request.GitHubUrl?.Trim();
        profile.PortfolioUrl = request.PortfolioUrl?.Trim();
        profile.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        var hasPrimaryCv = await _context.CandidateDocuments
            .AnyAsync(d => d.CandidateProfileId == profile.Id && !d.IsDeleted && d.IsDefault, ct);

        return MapToDto(profile, hasPrimaryCv);
    }

    public static (int Percentage, List<string> MissingFields) CalculateProfileCompletion(
        string? firstName,
        string? lastName,
        string? headline,
        string? summary,
        string? location,
        int? yearsOfExperience,
        string? linkedInUrl,
        string? gitHubUrl,
        string? portfolioUrl,
        bool hasPrimaryCv)
    {
        int percentage = 0;
        var missing = new List<string>();

        // 1. Name: 15%
        if (!string.IsNullOrWhiteSpace(firstName) && !string.IsNullOrWhiteSpace(lastName))
        {
            percentage += 15;
        }
        else
        {
            missing.Add("Complete your full name");
        }

        // 2. Headline: 15%
        if (!string.IsNullOrWhiteSpace(headline))
        {
            percentage += 15;
        }
        else
        {
            missing.Add("Add a professional headline");
        }

        // 3. Location: 10%
        if (!string.IsNullOrWhiteSpace(location))
        {
            percentage += 10;
        }
        else
        {
            missing.Add("Specify your geographic location");
        }

        // 4. Years of experience: 10%
        if (yearsOfExperience.HasValue)
        {
            percentage += 10;
        }
        else
        {
            missing.Add("Add your years of professional experience");
        }

        // 5. Career Summary: 20%
        if (!string.IsNullOrWhiteSpace(summary) && summary.Trim().Length >= 20)
        {
            percentage += 20;
        }
        else
        {
            missing.Add("Write a detailed career summary (at least 20 characters)");
        }

        // 6. Portfolio/Social Link: 10%
        if (!string.IsNullOrWhiteSpace(linkedInUrl) || !string.IsNullOrWhiteSpace(gitHubUrl) || !string.IsNullOrWhiteSpace(portfolioUrl))
        {
            percentage += 10;
        }
        else
        {
            missing.Add("Add a LinkedIn, GitHub, or portfolio website URL");
        }

        // 7. Primary CV: 20%
        if (hasPrimaryCv)
        {
            percentage += 20;
        }
        else
        {
            missing.Add("Upload your verified primary CV");
        }

        return (Math.Min(100, percentage), missing);
    }

    private static CandidateProfileDto MapToDto(Domain.Entities.CandidateProfile cp, bool hasPrimaryCv)
    {
        var (percentage, missing) = CalculateProfileCompletion(
            cp.User.FirstName,
            cp.User.LastName,
            cp.Headline,
            cp.Summary,
            cp.Location,
            cp.YearsOfExperience,
            cp.LinkedInUrl,
            cp.GitHubUrl,
            cp.PortfolioUrl,
            hasPrimaryCv);

        return new CandidateProfileDto(
            Id: cp.Id,
            UserId: cp.UserId,
            Email: cp.User.Email,
            FirstName: cp.User.FirstName,
            LastName: cp.User.LastName,
            FullName: cp.User.FullName,
            Headline: cp.Headline,
            Summary: cp.Summary,
            Location: cp.Location,
            YearsOfExperience: cp.YearsOfExperience,
            LinkedInUrl: cp.LinkedInUrl,
            GitHubUrl: cp.GitHubUrl,
            PortfolioUrl: cp.PortfolioUrl,
            UpdatedAtUtc: cp.UpdatedAtUtc,
            PhoneNumber: cp.User.PhoneNumber,
            CompletionPercentage: percentage,
            MissingFields: missing);
    }
}
