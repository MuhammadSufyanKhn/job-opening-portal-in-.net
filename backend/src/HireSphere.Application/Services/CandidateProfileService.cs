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

        return MapToDto(profile);
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

        return MapToDto(profile);
    }

    private static CandidateProfileDto MapToDto(Domain.Entities.CandidateProfile cp)
    {
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
            UpdatedAtUtc: cp.UpdatedAtUtc);
    }
}
