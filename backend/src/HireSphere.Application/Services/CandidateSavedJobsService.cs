using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Candidate;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface ICandidateSavedJobsService
{
    Task<List<SavedJobSummaryDto>> GetSavedJobsAsync(Guid userId, CancellationToken ct = default);
    Task<SavedJobSummaryDto> SaveJobAsync(Guid userId, Guid jobId, CancellationToken ct = default);
    Task<bool> UnsaveJobAsync(Guid userId, Guid jobId, CancellationToken ct = default);
    Task<bool> IsJobSavedAsync(Guid userId, Guid jobId, CancellationToken ct = default);
}

public class CandidateSavedJobsService : ICandidateSavedJobsService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CandidateSavedJobsService> _logger;

    public CandidateSavedJobsService(IApplicationDbContext context, ILogger<CandidateSavedJobsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private async Task<CandidateProfile> GetCandidateProfileAsync(Guid userId, CancellationToken ct)
    {
        var profile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (profile == null)
        {
            throw new NotFoundException("Candidate profile not found for user.");
        }

        return profile;
    }

    public async Task<List<SavedJobSummaryDto>> GetSavedJobsAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await GetCandidateProfileAsync(userId, ct);
        var now = DateTimeOffset.UtcNow;

        try
        {
            var saved = await _context.CandidateSavedJobs
                .AsNoTracking()
                .Include(s => s.JobPosting)
                    .ThenInclude(j => j.Company)
                .Where(s => s.CandidateProfileId == profile.Id)
                .OrderByDescending(s => s.SavedAtUtc)
                .ToListAsync(ct);

            return saved.Select(s => new SavedJobSummaryDto(
                SavedJobId: s.Id,
                JobId: s.JobPostingId,
                Title: s.JobPosting.Title,
                CompanyName: s.JobPosting.Company.Name,
                CompanyLogoUrl: s.JobPosting.Company.LogoUrl,
                Location: s.JobPosting.Location,
                EmploymentType: s.JobPosting.EmploymentType,
                WorkplaceType: s.JobPosting.WorkplaceType,
                SalaryMin: s.JobPosting.SalaryMin,
                SalaryMax: s.JobPosting.SalaryMax,
                SalaryCurrency: s.JobPosting.SalaryCurrency,
                SavedAtUtc: s.SavedAtUtc,
                ExpiresAtUtc: s.JobPosting.ExpiresAtUtc,
                IsActive: s.JobPosting.Status == JobPostingStatus.Published
                          && !s.JobPosting.IsDeleted
                          && (s.JobPosting.ExpiresAtUtc == null || s.JobPosting.ExpiresAtUtc > now)
                          && s.JobPosting.Company.ApprovalStatus == CompanyApprovalStatus.Approved
                          && !s.JobPosting.Company.IsDeleted
            )).ToList();
        }
        catch (Exception ex) when (ex.Message.Contains("Invalid object name 'CandidateSavedJobs'") || ex.InnerException?.Message.Contains("Invalid object name 'CandidateSavedJobs'") == true)
        {
            _logger.LogWarning("Table CandidateSavedJobs does not exist yet. Please execute script 011_AddCandidateSavedJobs.sql in SSMS.");
            return new List<SavedJobSummaryDto>();
        }
    }

    public async Task<SavedJobSummaryDto> SaveJobAsync(Guid userId, Guid jobId, CancellationToken ct = default)
    {
        var profile = await GetCandidateProfileAsync(userId, ct);
        var now = DateTimeOffset.UtcNow;

        // Verify job exists and is eligible
        var job = await _context.JobPostings
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == jobId
                                      && j.Status == JobPostingStatus.Published
                                      && !j.IsDeleted
                                      && (j.ExpiresAtUtc == null || j.ExpiresAtUtc > now)
                                      && j.Company.ApprovalStatus == CompanyApprovalStatus.Approved
                                      && !j.Company.IsDeleted, ct);

        if (job == null)
        {
            throw new NotFoundException("Active published vacancy not found.");
        }

        try
        {
            // Check if already saved
            var existing = await _context.CandidateSavedJobs
                .FirstOrDefaultAsync(s => s.CandidateProfileId == profile.Id && s.JobPostingId == jobId, ct);

            if (existing != null)
            {
                return new SavedJobSummaryDto(
                    SavedJobId: existing.Id,
                    JobId: job.Id,
                    Title: job.Title,
                    CompanyName: job.Company.Name,
                    CompanyLogoUrl: job.Company.LogoUrl,
                    Location: job.Location,
                    EmploymentType: job.EmploymentType,
                    WorkplaceType: job.WorkplaceType,
                    SalaryMin: job.SalaryMin,
                    SalaryMax: job.SalaryMax,
                    SalaryCurrency: job.SalaryCurrency,
                    SavedAtUtc: existing.SavedAtUtc,
                    ExpiresAtUtc: job.ExpiresAtUtc,
                    IsActive: true
                );
            }

            var savedJob = new CandidateSavedJob
            {
                Id = Guid.NewGuid(),
                CandidateProfileId = profile.Id,
                JobPostingId = jobId,
                SavedAtUtc = DateTimeOffset.UtcNow
            };

            _context.CandidateSavedJobs.Add(savedJob);
            await _context.SaveChangesAsync(ct);

            return new SavedJobSummaryDto(
                SavedJobId: savedJob.Id,
                JobId: job.Id,
                Title: job.Title,
                CompanyName: job.Company.Name,
                CompanyLogoUrl: job.Company.LogoUrl,
                Location: job.Location,
                EmploymentType: job.EmploymentType,
                WorkplaceType: job.WorkplaceType,
                SalaryMin: job.SalaryMin,
                SalaryMax: job.SalaryMax,
                SalaryCurrency: job.SalaryCurrency,
                SavedAtUtc: savedJob.SavedAtUtc,
                ExpiresAtUtc: job.ExpiresAtUtc,
                IsActive: true
            );
        }
        catch (Exception ex) when (ex.Message.Contains("Invalid object name 'CandidateSavedJobs'") || ex.InnerException?.Message.Contains("Invalid object name 'CandidateSavedJobs'") == true)
        {
            _logger.LogError("Cannot save job: Table CandidateSavedJobs does not exist. Please run 011_AddCandidateSavedJobs.sql in SSMS.");
            throw new InvalidOperationException("Saved jobs database table has not been initialized. Please run database script 011_AddCandidateSavedJobs.sql in SSMS.");
        }
    }

    public async Task<bool> UnsaveJobAsync(Guid userId, Guid jobId, CancellationToken ct = default)
    {
        var profile = await GetCandidateProfileAsync(userId, ct);

        try
        {
            var saved = await _context.CandidateSavedJobs
                .FirstOrDefaultAsync(s => s.CandidateProfileId == profile.Id && s.JobPostingId == jobId, ct);

            if (saved == null)
            {
                return false;
            }

            _context.CandidateSavedJobs.Remove(saved);
            await _context.SaveChangesAsync(ct);
            return true;
        }
        catch (Exception ex) when (ex.Message.Contains("Invalid object name 'CandidateSavedJobs'") || ex.InnerException?.Message.Contains("Invalid object name 'CandidateSavedJobs'") == true)
        {
            _logger.LogWarning("Table CandidateSavedJobs does not exist yet. Please execute script 011_AddCandidateSavedJobs.sql in SSMS.");
            return false;
        }
    }

    public async Task<bool> IsJobSavedAsync(Guid userId, Guid jobId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (profile == null) return false;

        try
        {
            return await _context.CandidateSavedJobs
                .AsNoTracking()
                .AnyAsync(s => s.CandidateProfileId == profile.Id && s.JobPostingId == jobId, ct);
        }
        catch (Exception ex) when (ex.Message.Contains("Invalid object name 'CandidateSavedJobs'") || ex.InnerException?.Message.Contains("Invalid object name 'CandidateSavedJobs'") == true)
        {
            return false;
        }
    }
}
