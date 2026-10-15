using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Job;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IJobMarketplaceService
{
    Task<PagedResult<PublicJobPostingSummaryDto>> SearchPublishedJobsAsync(JobMarketplaceFilterRequest request, CancellationToken ct = default);
    Task<PublicJobPostingDetailDto> GetPublicJobDetailAsync(Guid jobId, CancellationToken ct = default);
    Task<IReadOnlyList<JobCategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
}

public class JobMarketplaceService : IJobMarketplaceService
{
    private readonly IApplicationDbContext _context;

    public JobMarketplaceService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<PublicJobPostingSummaryDto>> SearchPublishedJobsAsync(JobMarketplaceFilterRequest request, CancellationToken ct = default)
    {
        int page = request.Page < 1 ? 1 : request.Page;
        int pageSize = request.PageSize < 1 ? 12 : Math.Min(request.PageSize, 50);

        var now = DateTimeOffset.UtcNow;

        var query = _context.JobPostings
            .Include(j => j.Company)
            .Include(j => j.JobCategory)
            .Where(j => j.Status == JobPostingStatus.Published
                        && !j.IsDeleted
                        && (j.ExpiresAtUtc == null || j.ExpiresAtUtc > now)
                        && j.Company.ApprovalStatus == CompanyApprovalStatus.Approved
                        && !j.Company.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(j => j.Title.ToLower().Contains(search)
                                     || j.Summary.ToLower().Contains(search)
                                     || j.Description.ToLower().Contains(search)
                                     || j.Company.Name.ToLower().Contains(search)
                                     || j.Requirements.Any(r => r.RequirementText.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(request.Skill))
        {
            var skill = request.Skill.Trim().ToLower();
            query = query.Where(j => j.Requirements.Any(r => r.RequirementCategory == RequirementCategory.Skill && r.RequirementText.ToLower().Contains(skill)));
        }

        if (!string.IsNullOrWhiteSpace(request.Location))
        {
            var loc = request.Location.Trim().ToLower();
            query = query.Where(j => j.Location.ToLower().Contains(loc));
        }

        if (request.EmploymentType.HasValue)
        {
            query = query.Where(j => j.EmploymentType == request.EmploymentType.Value);
        }

        if (request.WorkplaceType.HasValue)
        {
            query = query.Where(j => j.WorkplaceType == request.WorkplaceType.Value);
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(j => j.JobCategoryId == request.CategoryId.Value);
        }

        if (request.SalaryMin.HasValue)
        {
            query = query.Where(j => j.SalaryMax == null || j.SalaryMax >= request.SalaryMin.Value);
        }

        if (request.SalaryMax.HasValue)
        {
            query = query.Where(j => j.SalaryMin == null || j.SalaryMin <= request.SalaryMax.Value);
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "salary_desc" => query.OrderByDescending(j => j.SalaryMax ?? j.SalaryMin ?? 0),
            "title_asc" => query.OrderBy(j => j.Title),
            _ => query.OrderByDescending(j => j.PublishedAtUtc ?? j.CreatedAtUtc)
        };

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(j => new PublicJobPostingSummaryDto(
                j.Id,
                j.CompanyId,
                j.Company.Name,
                j.Company.LogoUrl,
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
                j.PublishedAtUtc,
                j.ExpiresAtUtc,
                j.Requirements
                    .Where(r => r.RequirementCategory == RequirementCategory.Skill)
                    .OrderBy(r => r.DisplayOrder)
                    .Select(r => r.RequirementText)
                    .Take(4)
                    .ToList()))
            .ToListAsync(ct);

        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<PublicJobPostingSummaryDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<PublicJobPostingDetailDto> GetPublicJobDetailAsync(Guid jobId, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;

        var job = await _context.JobPostings
            .Include(j => j.Company)
            .Include(j => j.JobCategory)
            .Include(j => j.Requirements)
            .FirstOrDefaultAsync(j => j.Id == jobId
                                      && j.Status == JobPostingStatus.Published
                                      && !j.IsDeleted
                                      && (j.ExpiresAtUtc == null || j.ExpiresAtUtc > now)
                                      && j.Company.ApprovalStatus == CompanyApprovalStatus.Approved
                                      && !j.Company.IsDeleted, ct);

        if (job == null)
            throw new NotFoundException("JobPosting", jobId);

        var requirements = job.Requirements
            .OrderBy(r => r.DisplayOrder)
            .Select(r => new JobRequirementDto(r.Id, r.RequirementText, r.RequirementCategory, r.RequirementType, r.DisplayOrder))
            .ToList();

        return new PublicJobPostingDetailDto(
            job.Id,
            job.CompanyId,
            job.Company.Name,
            job.Company.LogoUrl,
            job.Company.WebsiteUrl,
            job.Company.Industry,
            job.JobCategory.Name,
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
            job.PublishedAtUtc,
            job.ExpiresAtUtc,
            requirements);
    }

    public async Task<IReadOnlyList<JobCategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        if (!await _context.JobCategories.AnyAsync(ct))
        {
            var defaults = new List<JobCategory>
            {
                new() { Name = "Software Engineering", Slug = "software-engineering", Description = "Full-stack, backend, frontend, systems, and mobile software engineering", DisplayOrder = 1 },
                new() { Name = "Cloud Infrastructure & DevOps", Slug = "cloud-devops", Description = "AWS, Azure, GCP, Kubernetes, CI/CD, and site reliability engineering", DisplayOrder = 2 },
                new() { Name = "Data Science, AI & Machine Learning", Slug = "data-ai", Description = "MLOps, LLMs, data engineering, statistical analysis, and BI", DisplayOrder = 3 },
                new() { Name = "Product Management", Slug = "product-management", Description = "Product strategy, agile roadmapping, and technical product ownership", DisplayOrder = 4 },
                new() { Name = "UI/UX & Product Design", Slug = "design-creative", Description = "User experience research, UI design, Figma design systems, and interaction", DisplayOrder = 5 },
                new() { Name = "Cybersecurity & InfoSec", Slug = "cybersecurity", Description = "Security engineering, penetration testing, compliance, SOC, and governance", DisplayOrder = 6 },
                new() { Name = "Quality Assurance & Test Automation", Slug = "qa-testing", Description = "Manual QA, SDET, Cypress, Playwright, and test architecture", DisplayOrder = 7 },
                new() { Name = "Sales & Business Development", Slug = "sales-marketing", Description = "Enterprise B2B sales, account executive, inbound/outbound SDR, and partnerships", DisplayOrder = 8 },
                new() { Name = "Marketing, Growth & Content", Slug = "marketing-growth", Description = "Digital marketing, SEO, paid performance, copywriting, and brand strategy", DisplayOrder = 9 },
                new() { Name = "Customer Success & Technical Support", Slug = "customer-support", Description = "Customer onboarding, client success management, and helpdesk operations", DisplayOrder = 10 },
                new() { Name = "Human Resources & Talent Acquisition", Slug = "human-resources", Description = "Technical recruiting, people operations, HR business partnering, and culture", DisplayOrder = 11 },
                new() { Name = "Finance, Accounting & Auditing", Slug = "finance-accounting", Description = "Financial planning, accounting, corporate tax, treasury, and payroll", DisplayOrder = 12 },
                new() { Name = "Operations, Supply Chain & Logistics", Slug = "operations-logistics", Description = "Operational scaling, logistics management, procurement, and process design", DisplayOrder = 13 },
                new() { Name = "Legal, Regulatory & Compliance", Slug = "legal-compliance", Description = "Corporate law, contract negotiations, GDPR, data protection, and IP", DisplayOrder = 14 },
                new() { Name = "Healthcare & Life Sciences", Slug = "healthcare-biotech", Description = "Clinical research, biomedical engineering, pharmacy, and health-tech", DisplayOrder = 15 },
                new() { Name = "Education, EdTech & Instructional Design", Slug = "education-training", Description = "Curriculum development, corporate training, and online instructional design", DisplayOrder = 16 },
                new() { Name = "Hardware, Embedded Systems & IoT", Slug = "hardware-embedded", Description = "Firmware development, PCB layout, robotics, and hardware testing", DisplayOrder = 17 },
                new() { Name = "Project & Technical Program Management", Slug = "project-management", Description = "Scrum management, technical delivery, agile coordination, and PMO", DisplayOrder = 18 }
            };
            _context.JobCategories.AddRange(defaults);
            await _context.SaveChangesAsync(ct);
        }

        var now = DateTimeOffset.UtcNow;
        return await _context.JobCategories
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new JobCategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                c.DisplayOrder,
                c.JobPostings.Count(j => j.Status == JobPostingStatus.Published
                    && !j.IsDeleted
                    && (j.ExpiresAtUtc == null || j.ExpiresAtUtc > now)
                    && j.Company.ApprovalStatus == CompanyApprovalStatus.Approved
                    && !j.Company.IsDeleted)))
            .ToListAsync(ct);
    }
}
