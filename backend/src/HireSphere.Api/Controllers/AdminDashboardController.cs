using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.DTOs.Analytics;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = PlatformRoles.SuperAdmin)]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminDashboardService _adminDashboardService;
    private readonly IAnalyticsService _analyticsService;

    public AdminDashboardController(
        IAdminDashboardService adminDashboardService,
        IAnalyticsService analyticsService)
    {
        _adminDashboardService = adminDashboardService;
        _analyticsService = analyticsService;
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(PlatformDashboardStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        var stats = await _adminDashboardService.GetDashboardStatsAsync(ct);
        return Ok(stats);
    }

    [HttpGet("analytics")]
    [ProducesResponseType(typeof(PlatformAnalyticsOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPlatformAnalytics(
        [FromQuery] string? preset = "30d",
        [FromQuery] DateTimeOffset? startDateUtc = null,
        [FromQuery] DateTimeOffset? endDateUtc = null,
        CancellationToken ct = default)
    {
        var filter = new DateRangeFilter
        {
            Preset = preset ?? "30d",
            StartDateUtc = startDateUtc,
            EndDateUtc = endDateUtc
        };

        var analytics = await _analyticsService.GetPlatformAnalyticsAsync(filter, ct);
        return Ok(analytics);
    }
}
