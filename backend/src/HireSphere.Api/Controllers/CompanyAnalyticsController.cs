using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Analytics;
using HireSphere.Application.Services;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/companies/{companyId:guid}/analytics")]
[Authorize]
public class CompanyAnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ICurrentUserService _currentUserService;

    public CompanyAnalyticsController(
        IAnalyticsService analyticsService,
        ICurrentUserService currentUserService)
    {
        _analyticsService = analyticsService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(CompanyRecruitmentOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCompanyAnalytics(
        Guid companyId,
        [FromQuery] string? preset = "30d",
        [FromQuery] DateTimeOffset? startDateUtc = null,
        [FromQuery] DateTimeOffset? endDateUtc = null,
        CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var filter = new DateRangeFilter
        {
            Preset = preset ?? "30d",
            StartDateUtc = startDateUtc,
            EndDateUtc = endDateUtc
        };

        var analytics = await _analyticsService.GetCompanyAnalyticsAsync(
            companyId,
            _currentUserService.UserId.Value,
            filter,
            ct);

        return Ok(analytics);
    }

    [HttpGet("jobs/{jobId:guid}")]
    [ProducesResponseType(typeof(JobDetailAnalyticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetJobAnalytics(
        Guid companyId,
        Guid jobId,
        [FromQuery] string? preset = "30d",
        [FromQuery] DateTimeOffset? startDateUtc = null,
        [FromQuery] DateTimeOffset? endDateUtc = null,
        CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var filter = new DateRangeFilter
        {
            Preset = preset ?? "30d",
            StartDateUtc = startDateUtc,
            EndDateUtc = endDateUtc
        };

        var analytics = await _analyticsService.GetJobAnalyticsAsync(
            companyId,
            jobId,
            _currentUserService.UserId.Value,
            filter,
            ct);

        return Ok(analytics);
    }

    [HttpGet("export-csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportCompanyAnalyticsCsv(
        Guid companyId,
        [FromQuery] string? preset = "30d",
        [FromQuery] DateTimeOffset? startDateUtc = null,
        [FromQuery] DateTimeOffset? endDateUtc = null,
        CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var filter = new DateRangeFilter
        {
            Preset = preset ?? "30d",
            StartDateUtc = startDateUtc,
            EndDateUtc = endDateUtc
        };

        var (csvBytes, fileName) = await _analyticsService.ExportCompanyAnalyticsCsvAsync(
            companyId,
            _currentUserService.UserId.Value,
            filter,
            ct);

        return File(csvBytes, "text/csv; charset=utf-8", fileName);
    }
}
