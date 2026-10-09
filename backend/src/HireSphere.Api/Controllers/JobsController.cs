using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/jobs")]
public class JobsController : ControllerBase
{
    private readonly IJobMarketplaceService _marketplaceService;

    public JobsController(IJobMarketplaceService marketplaceService)
    {
        _marketplaceService = marketplaceService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<PublicJobPostingSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchJobs(
        [FromQuery] string? search,
        [FromQuery] string? location,
        [FromQuery] EmploymentType? employmentType,
        [FromQuery] WorkplaceType? workplaceType,
        [FromQuery] int? categoryId,
        [FromQuery] decimal? salaryMin,
        [FromQuery] decimal? salaryMax,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        var filter = new JobMarketplaceFilterRequest(
            Search: search,
            Location: location,
            EmploymentType: employmentType,
            WorkplaceType: workplaceType,
            CategoryId: categoryId,
            SalaryMin: salaryMin,
            SalaryMax: salaryMax,
            SortBy: sortBy,
            Page: page,
            PageSize: pageSize);

        var result = await _marketplaceService.SearchPublishedJobsAsync(filter, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PublicJobPostingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetJobDetail(Guid id, CancellationToken ct)
    {
        var job = await _marketplaceService.GetPublicJobDetailAsync(id, ct);
        return Ok(job);
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<JobCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        var categories = await _marketplaceService.GetCategoriesAsync(ct);
        return Ok(categories);
    }
}
