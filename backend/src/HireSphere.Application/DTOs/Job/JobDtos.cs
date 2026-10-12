using HireSphere.Domain.Enums;

namespace HireSphere.Application.DTOs.Job;

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);

public record JobCategoryDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    int DisplayOrder,
    int OpenJobsCount = 0);

public record JobRequirementDto(
    Guid Id,
    string RequirementText,
    RequirementCategory RequirementCategory,
    RequirementType RequirementType,
    int DisplayOrder);

public record CreateJobRequirementDto(
    string RequirementText,
    RequirementCategory RequirementCategory,
    RequirementType RequirementType,
    int DisplayOrder);

public record CreateJobPostingRequest(
    int JobCategoryId,
    string Title,
    string Summary,
    string Description,
    string Responsibilities,
    EmploymentType EmploymentType,
    WorkplaceType WorkplaceType,
    string Location,
    decimal? SalaryMin,
    decimal? SalaryMax,
    string SalaryCurrency,
    DateTimeOffset? ExpiresAtUtc,
    List<CreateJobRequirementDto> Requirements);

public record UpdateJobPostingRequest(
    int JobCategoryId,
    string Title,
    string Summary,
    string Description,
    string Responsibilities,
    EmploymentType EmploymentType,
    WorkplaceType WorkplaceType,
    string Location,
    decimal? SalaryMin,
    decimal? SalaryMax,
    string SalaryCurrency,
    DateTimeOffset? ExpiresAtUtc,
    List<CreateJobRequirementDto> Requirements);

public record JobPostingSummaryDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    int JobCategoryId,
    string CategoryName,
    string Title,
    string Slug,
    string Summary,
    EmploymentType EmploymentType,
    WorkplaceType WorkplaceType,
    string Location,
    decimal? SalaryMin,
    decimal? SalaryMax,
    string SalaryCurrency,
    JobPostingStatus Status,
    DateTimeOffset? PublishedAtUtc,
    DateTimeOffset? ExpiresAtUtc,
    int ActiveVersionNumber,
    int ApplicationCount,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);

public record JobPostingDetailDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    string CompanySlug,
    string? CompanyLogoUrl,
    int JobCategoryId,
    string CategoryName,
    string Title,
    string Slug,
    string Summary,
    string Description,
    string Responsibilities,
    EmploymentType EmploymentType,
    WorkplaceType WorkplaceType,
    string Location,
    decimal? SalaryMin,
    decimal? SalaryMax,
    string SalaryCurrency,
    JobPostingStatus Status,
    DateTimeOffset? PublishedAtUtc,
    DateTimeOffset? ExpiresAtUtc,
    int ActiveVersionNumber,
    int ApplicationCount,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    IReadOnlyList<JobRequirementDto> Requirements,
    int VersionCount);

public record PublicJobPostingSummaryDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    string? CompanyLogoUrl,
    string CategoryName,
    string Title,
    string Slug,
    string Summary,
    EmploymentType EmploymentType,
    WorkplaceType WorkplaceType,
    string Location,
    decimal? SalaryMin,
    decimal? SalaryMax,
    string SalaryCurrency,
    DateTimeOffset? PublishedAtUtc,
    DateTimeOffset? ExpiresAtUtc,
    IReadOnlyList<string>? TopSkills = null);

public record PublicJobPostingDetailDto(
    Guid Id,
    Guid CompanyId,
    string CompanyName,
    string? CompanyLogoUrl,
    string? CompanyWebsiteUrl,
    string CompanyIndustry,
    string CategoryName,
    string Title,
    string Slug,
    string Summary,
    string Description,
    string Responsibilities,
    EmploymentType EmploymentType,
    WorkplaceType WorkplaceType,
    string Location,
    decimal? SalaryMin,
    decimal? SalaryMax,
    string SalaryCurrency,
    DateTimeOffset? PublishedAtUtc,
    DateTimeOffset? ExpiresAtUtc,
    IReadOnlyList<JobRequirementDto> Requirements);

public record JobMarketplaceFilterRequest(
    string? Search = null,
    string? Location = null,
    EmploymentType? EmploymentType = null,
    WorkplaceType? WorkplaceType = null,
    int? CategoryId = null,
    string? Skill = null,
    decimal? SalaryMin = null,
    decimal? SalaryMax = null,
    string? SortBy = "date_desc",
    int Page = 1,
    int PageSize = 12);
