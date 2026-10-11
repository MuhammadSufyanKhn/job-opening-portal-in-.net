using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Job;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IJobService
{
    Task<JobPostingDetailDto> CreateJobAsync(Guid companyId, Guid userId, CreateJobPostingRequest request, CancellationToken ct = default);
    Task<JobPostingDetailDto> UpdateJobAsync(Guid companyId, Guid jobId, Guid userId, UpdateJobPostingRequest request, CancellationToken ct = default);
    Task<JobPostingDetailDto> PublishJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default);
    Task<JobPostingDetailDto> PauseJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default);
    Task<JobPostingDetailDto> ReopenJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default);
    Task<JobPostingDetailDto> CloseJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default);
    Task<JobPostingDetailDto> ArchiveJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default);
    Task<PagedResult<JobPostingSummaryDto>> GetCompanyJobsAsync(Guid companyId, Guid userId, JobPostingStatus? status = null, int page = 1, int pageSize = 10, CancellationToken ct = default);
    Task<JobPostingDetailDto> GetCompanyJobByIdAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default);
}

public class JobService : IJobService
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public JobService(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<JobPostingDetailDto> CreateJobAsync(Guid companyId, Guid userId, CreateJobPostingRequest request, CancellationToken ct = default)
    {
        var company = await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: true, ct);

        var category = await _context.JobCategories.FirstOrDefaultAsync(c => c.Id == request.JobCategoryId, ct);
        if (category == null)
            throw new NotFoundException("JobCategory", request.JobCategoryId);

        var slug = GenerateSlug(request.Title);

        var job = new JobPosting
        {
            CompanyId = companyId,
            JobCategoryId = request.JobCategoryId,
            Title = request.Title.Trim(),
            Slug = slug,
            Summary = request.Summary.Trim(),
            Description = request.Description.Trim(),
            Responsibilities = request.Responsibilities.Trim(),
            EmploymentType = request.EmploymentType,
            WorkplaceType = request.WorkplaceType,
            Location = request.Location.Trim(),
            SalaryMin = request.SalaryMin,
            SalaryMax = request.SalaryMax,
            SalaryCurrency = string.IsNullOrWhiteSpace(request.SalaryCurrency) ? "USD" : request.SalaryCurrency.Trim().ToUpperInvariant(),
            ExpiresAtUtc = request.ExpiresAtUtc,
            Status = JobPostingStatus.Draft,
            ActiveVersionNumber = 1,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        if (request.Requirements != null)
        {
            int order = 1;
            foreach (var req in request.Requirements)
            {
                job.Requirements.Add(new JobRequirement
                {
                    JobPostingId = job.Id,
                    RequirementText = req.RequirementText.Trim(),
                    RequirementCategory = req.RequirementCategory,
                    RequirementType = req.RequirementType,
                    DisplayOrder = req.DisplayOrder > 0 ? req.DisplayOrder : order++
                });
            }
        }

        var snapshotJson = CreateSnapshotJson(job);
        job.Versions.Add(new JobDescriptionVersion
        {
            JobPostingId = job.Id,
            VersionNumber = 1,
            SnapshotJson = snapshotJson,
            CreatedAtUtc = DateTimeOffset.UtcNow
        });

        _context.JobPostings.Add(job);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobCreated",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: companyId,
            metadata: new { Title = job.Title, Status = job.Status.ToString() },
            cancellationToken: ct);

        return MapToDetailDto(job, category.Name, company.Name, company.Slug, company.LogoUrl);
    }

    public async Task<JobPostingDetailDto> UpdateJobAsync(Guid companyId, Guid jobId, Guid userId, UpdateJobPostingRequest request, CancellationToken ct = default)
    {
        var company = await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: true, ct);

        var job = await _context.JobPostings
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .Include(j => j.Versions)
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        if (job.Status == JobPostingStatus.Archived)
            throw new ConflictException("Archived jobs cannot be modified.");

        var category = await _context.JobCategories.FirstOrDefaultAsync(c => c.Id == request.JobCategoryId, ct);
        if (category == null)
            throw new NotFoundException("JobCategory", request.JobCategoryId);

        job.Title = request.Title.Trim();
        job.JobCategoryId = request.JobCategoryId;
        job.Summary = request.Summary.Trim();
        job.Description = request.Description.Trim();
        job.Responsibilities = request.Responsibilities.Trim();
        job.EmploymentType = request.EmploymentType;
        job.WorkplaceType = request.WorkplaceType;
        job.Location = request.Location.Trim();
        job.SalaryMin = request.SalaryMin;
        job.SalaryMax = request.SalaryMax;
        job.SalaryCurrency = string.IsNullOrWhiteSpace(request.SalaryCurrency) ? "USD" : request.SalaryCurrency.Trim().ToUpperInvariant();
        job.ExpiresAtUtc = request.ExpiresAtUtc;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;

        // Replace requirements
        _context.JobRequirements.RemoveRange(job.Requirements);

        if (request.Requirements != null)
        {
            int order = 1;
            foreach (var req in request.Requirements)
            {
                _context.JobRequirements.Add(new JobRequirement
                {
                    JobPostingId = job.Id,
                    RequirementText = req.RequirementText.Trim(),
                    RequirementCategory = req.RequirementCategory,
                    RequirementType = req.RequirementType,
                    DisplayOrder = req.DisplayOrder > 0 ? req.DisplayOrder : order++
                });
            }
        }

        // If job is already Published, bump version and preserve immutable historical snapshot
        if (job.Status == JobPostingStatus.Published)
        {
            job.ActiveVersionNumber++;
            var newSnapshot = CreateSnapshotJson(job);
            var version = new JobDescriptionVersion
            {
                JobPostingId = job.Id,
                VersionNumber = job.ActiveVersionNumber,
                SnapshotJson = newSnapshot,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            _context.JobDescriptionVersions.Add(version);
        }

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobUpdated",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: companyId,
            metadata: new { Title = job.Title, Version = job.ActiveVersionNumber },
            cancellationToken: ct);

        return MapToDetailDto(job, category.Name, company.Name, company.Slug, company.LogoUrl);
    }

    public async Task<JobPostingDetailDto> PublishJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default)
    {
        var company = await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: true, ct);

        if (company.ApprovalStatus != CompanyApprovalStatus.Approved)
            throw new ForbiddenAccessException("Company must be approved by a platform administrator before publishing vacancies.");

        var job = await _context.JobPostings
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .Include(j => j.Versions)
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        if (job.Status != JobPostingStatus.Draft && job.Status != JobPostingStatus.Paused)
            throw new ConflictException($"Cannot publish job with status '{job.Status}'. Only Draft or Paused jobs can be published.");

        if (job.Requirements.Count == 0)
            throw new ConflictException("A vacancy must have at least one structured qualification requirement before publishing.");

        job.Status = JobPostingStatus.Published;
        job.PublishedAtUtc = DateTimeOffset.UtcNow;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;

        if (!job.Versions.Any(v => v.VersionNumber == job.ActiveVersionNumber))
        {
            job.Versions.Add(new JobDescriptionVersion
            {
                JobPostingId = job.Id,
                VersionNumber = job.ActiveVersionNumber,
                SnapshotJson = CreateSnapshotJson(job),
                CreatedAtUtc = DateTimeOffset.UtcNow
            });
        }

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobPublished",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: companyId,
            metadata: new { Title = job.Title },
            cancellationToken: ct);

        return MapToDetailDto(job, job.JobCategory.Name, company.Name, company.Slug, company.LogoUrl);
    }

    public async Task<JobPostingDetailDto> PauseJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default)
    {
        var company = await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: true, ct);

        var job = await _context.JobPostings
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .Include(j => j.Versions)
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        if (job.Status != JobPostingStatus.Published)
            throw new ConflictException($"Cannot pause job with status '{job.Status}'. Only Published jobs can be paused.");

        job.Status = JobPostingStatus.Paused;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobPaused",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: companyId,
            cancellationToken: ct);

        return MapToDetailDto(job, job.JobCategory.Name, company.Name, company.Slug, company.LogoUrl);
    }

    public async Task<JobPostingDetailDto> ReopenJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default)
    {
        var company = await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: true, ct);

        if (company.ApprovalStatus != CompanyApprovalStatus.Approved)
            throw new ForbiddenAccessException("Company must be approved by a platform administrator before publishing vacancies.");

        var job = await _context.JobPostings
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .Include(j => j.Versions)
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        if (job.Status != JobPostingStatus.Paused)
            throw new ConflictException($"Cannot reopen job with status '{job.Status}'. Only Paused jobs can be reopened.");

        job.Status = JobPostingStatus.Published;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobReopened",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: companyId,
            cancellationToken: ct);

        return MapToDetailDto(job, job.JobCategory.Name, company.Name, company.Slug, company.LogoUrl);
    }

    public async Task<JobPostingDetailDto> CloseJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default)
    {
        var company = await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: true, ct);

        var job = await _context.JobPostings
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .Include(j => j.Versions)
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        job.Status = JobPostingStatus.Closed;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobClosed",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: companyId,
            cancellationToken: ct);

        return MapToDetailDto(job, job.JobCategory.Name, company.Name, company.Slug, company.LogoUrl);
    }

    public async Task<JobPostingDetailDto> ArchiveJobAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default)
    {
        var company = await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: true, ct);

        var job = await _context.JobPostings
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .Include(j => j.Versions)
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        job.Status = JobPostingStatus.Archived;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "JobArchived",
            targetResource: "JobPosting",
            targetResourceId: job.Id.ToString(),
            companyId: companyId,
            cancellationToken: ct);

        return MapToDetailDto(job, job.JobCategory.Name, company.Name, company.Slug, company.LogoUrl);
    }

    public async Task<PagedResult<JobPostingSummaryDto>> GetCompanyJobsAsync(Guid companyId, Guid userId, JobPostingStatus? status = null, int page = 1, int pageSize = 10, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: false, ct);

        var query = _context.JobPostings
            .Include(j => j.Company)
            .Include(j => j.JobCategory)
            .Include(j => j.Applications)
            .Where(j => j.CompanyId == companyId && !j.IsDeleted);

        if (status.HasValue)
        {
            query = query.Where(j => j.Status == status.Value);
        }

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(j => j.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(j => new JobPostingSummaryDto(
                j.Id,
                j.CompanyId,
                j.Company.Name,
                j.JobCategoryId,
                j.JobCategory.Name,
                j.Title,
                j.Slug,
                j.Summary,
                j.EmploymentType,
                j.WorkplaceType,
                j.Location,
                j.SalaryMin,
                j.SalaryMax,
                j.SalaryCurrency,
                j.Status,
                j.PublishedAtUtc,
                j.ExpiresAtUtc,
                j.ActiveVersionNumber,
                j.Applications.Count,
                j.CreatedAtUtc,
                j.UpdatedAtUtc))
            .ToListAsync(ct);

        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<JobPostingSummaryDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<JobPostingDetailDto> GetCompanyJobByIdAsync(Guid companyId, Guid jobId, Guid userId, CancellationToken ct = default)
    {
        await ValidateCompanyMembershipAndRole(companyId, userId, canWrite: false, ct);

        var job = await _context.JobPostings
            .Include(j => j.Company)
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .Include(j => j.Versions)
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        return MapToDetailDto(job, job.JobCategory.Name, job.Company.Name, job.Company.Slug, job.Company.LogoUrl);
    }

    private async Task<Company> ValidateCompanyMembershipAndRole(Guid companyId, Guid userId, bool canWrite, CancellationToken ct)
    {
        var company = await _context.Companies
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct);

        if (company == null)
            throw new NotFoundException("Company", companyId);

        var membership = company.Members.FirstOrDefault(m => m.UserId == userId && m.MembershipStatus == CompanyMembershipStatus.Active);
        if (membership == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        if (canWrite && membership.CompanyRole != CompanyRole.Owner && membership.CompanyRole != CompanyRole.Recruiter)
        {
            throw new ForbiddenAccessException("Only company Owners and Recruiters can create or modify job postings.");
        }

        return company;
    }

    private static string CreateSnapshotJson(JobPosting job)
    {
        var snapshot = new
        {
            job.Title,
            job.Summary,
            job.Description,
            job.Responsibilities,
            EmploymentType = job.EmploymentType.ToString(),
            WorkplaceType = job.WorkplaceType.ToString(),
            job.Location,
            job.SalaryMin,
            job.SalaryMax,
            job.SalaryCurrency,
            Requirements = job.Requirements.OrderBy(r => r.DisplayOrder).Select(r => new
            {
                r.RequirementText,
                Category = r.RequirementCategory.ToString(),
                Type = r.RequirementType.ToString(),
                r.DisplayOrder
            })
        };

        return JsonSerializer.Serialize(snapshot);
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant().Trim();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-").Trim('-');
        return $"{slug}-{Guid.NewGuid().ToString("N")[..8]}";
    }

    private static JobPostingDetailDto MapToDetailDto(JobPosting job, string categoryName, string companyName, string companySlug, string? logoUrl)
    {
        var requirements = job.Requirements
            .OrderBy(r => r.DisplayOrder)
            .Select(r => new JobRequirementDto(r.Id, r.RequirementText, r.RequirementCategory, r.RequirementType, r.DisplayOrder))
            .ToList();

        return new JobPostingDetailDto(
            job.Id,
            job.CompanyId,
            companyName,
            companySlug,
            logoUrl,
            job.JobCategoryId,
            categoryName,
            job.Title,
            job.Slug,
            job.Summary,
            job.Description,
            job.Responsibilities,
            job.EmploymentType,
            job.WorkplaceType,
            job.Location,
            job.SalaryMin,
            job.SalaryMax,
            job.SalaryCurrency,
            job.Status,
            job.PublishedAtUtc,
            job.ExpiresAtUtc,
            job.ActiveVersionNumber,
            job.Applications?.Count ?? 0,
            job.CreatedAtUtc,
            job.UpdatedAtUtc,
            requirements,
            job.Versions?.Count ?? 1);
    }
}
