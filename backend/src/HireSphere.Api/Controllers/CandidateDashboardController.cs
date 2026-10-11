using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Candidate;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/candidate")]
[Authorize(Roles = PlatformRoles.Candidate)]
public class CandidateDashboardController : ControllerBase
{
    private readonly ICandidateDashboardService _dashboardService;
    private readonly ICurrentUserService _currentUserService;

    public CandidateDashboardController(
        ICandidateDashboardService dashboardService,
        ICurrentUserService currentUserService)
    {
        _dashboardService = dashboardService;
        _currentUserService = currentUserService;
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(CandidateDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var dashboard = await _dashboardService.GetDashboardAsync(_currentUserService.UserId.Value, ct);
        return Ok(dashboard);
    }

    [HttpGet("cv-suggestions")]
    [ProducesResponseType(typeof(ExtractedCvSuggestionsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCvSuggestions(CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var suggestions = await _dashboardService.GetExtractedCvSuggestionsAsync(_currentUserService.UserId.Value, ct);
        return Ok(suggestions);
    }
}
