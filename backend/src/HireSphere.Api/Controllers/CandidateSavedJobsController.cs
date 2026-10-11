using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Candidate;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/candidate/saved-jobs")]
[Authorize(Roles = PlatformRoles.Candidate)]
public class CandidateSavedJobsController : ControllerBase
{
    private readonly ICandidateSavedJobsService _savedJobsService;
    private readonly ICurrentUserService _currentUserService;

    public CandidateSavedJobsController(
        ICandidateSavedJobsService savedJobsService,
        ICurrentUserService currentUserService)
    {
        _savedJobsService = savedJobsService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<SavedJobSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSavedJobs(CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var saved = await _savedJobsService.GetSavedJobsAsync(_currentUserService.UserId.Value, ct);
        return Ok(saved);
    }

    [HttpPost("{jobId:guid}")]
    [ProducesResponseType(typeof(SavedJobSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SaveJob(Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var result = await _savedJobsService.SaveJobAsync(_currentUserService.UserId.Value, jobId, ct);
        return Ok(result);
    }

    [HttpDelete("{jobId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UnsaveJob(Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _savedJobsService.UnsaveJobAsync(_currentUserService.UserId.Value, jobId, ct);
        return NoContent();
    }

    [HttpGet("{jobId:guid}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckJobSavedStatus(Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var isSaved = await _savedJobsService.IsJobSavedAsync(_currentUserService.UserId.Value, jobId, ct);
        return Ok(new { jobId, isSaved });
    }
}
