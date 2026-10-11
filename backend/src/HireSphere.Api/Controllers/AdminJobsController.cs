using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/admin/jobs")]
[Authorize(Roles = PlatformRoles.SuperAdmin)]
public class AdminJobsController : ControllerBase
{
    private readonly IAdminJobService _adminJobService;
    private readonly ICurrentUserService _currentUserService;

    public AdminJobsController(IAdminJobService adminJobService, ICurrentUserService currentUserService)
    {
        _adminJobService = adminJobService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdminJobSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetJobs(
        [FromQuery] string? search,
        [FromQuery] Guid? companyId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _adminJobService.GetJobsAsync(search, companyId, status, page, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{jobId:guid}")]
    [ProducesResponseType(typeof(AdminJobDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetJobById(Guid jobId, CancellationToken ct)
    {
        var job = await _adminJobService.GetJobByIdAsync(jobId, ct);
        return Ok(job);
    }

    [HttpPost("{jobId:guid}/suspend")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendJob(Guid jobId, [FromBody] SuspendJobRequest request, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { message = "Moderation suspension reason is required." });
        }

        await _adminJobService.SuspendJobAsync(jobId, _currentUserService.UserId.Value, request.Reason, ct);
        return Ok(new { message = "Job listing has been suspended by platform administration." });
    }

    [HttpPost("{jobId:guid}/restore")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreJob(Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _adminJobService.RestoreJobAsync(jobId, _currentUserService.UserId.Value, ct);
        return Ok(new { message = "Job listing has been restored to published status." });
    }
}
