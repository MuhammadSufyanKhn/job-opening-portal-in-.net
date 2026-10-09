using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/companies/{companyId:guid}/jobs")]
[Authorize]
public class CompanyJobsController : ControllerBase
{
    private readonly IJobService _jobService;
    private readonly ICurrentUserService _currentUserService;

    public CompanyJobsController(IJobService jobService, ICurrentUserService currentUserService)
    {
        _jobService = jobService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<JobPostingSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetJobs(
        Guid companyId,
        [FromQuery] JobPostingStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var jobs = await _jobService.GetCompanyJobsAsync(companyId, _currentUserService.UserId.Value, status, page, pageSize, ct);
        return Ok(jobs);
    }

    [HttpGet("{jobId:guid}")]
    [ProducesResponseType(typeof(JobPostingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetJob(Guid companyId, Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var job = await _jobService.GetCompanyJobByIdAsync(companyId, jobId, _currentUserService.UserId.Value, ct);
        return Ok(job);
    }

    [HttpPost]
    [ProducesResponseType(typeof(JobPostingDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateJob(
        Guid companyId,
        [FromBody] CreateJobPostingRequest request,
        [FromServices] IValidator<CreateJobPostingRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ValidationProblemDetails(validationResult.ToDictionary()));
        }

        var created = await _jobService.CreateJobAsync(companyId, _currentUserService.UserId.Value, request, ct);
        return CreatedAtAction(nameof(GetJob), new { companyId, jobId = created.Id }, created);
    }

    [HttpPut("{jobId:guid}")]
    [ProducesResponseType(typeof(JobPostingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateJob(
        Guid companyId,
        Guid jobId,
        [FromBody] UpdateJobPostingRequest request,
        [FromServices] IValidator<UpdateJobPostingRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ValidationProblemDetails(validationResult.ToDictionary()));
        }

        var updated = await _jobService.UpdateJobAsync(companyId, jobId, _currentUserService.UserId.Value, request, ct);
        return Ok(updated);
    }

    [HttpPost("{jobId:guid}/publish")]
    [ProducesResponseType(typeof(JobPostingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PublishJob(Guid companyId, Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var published = await _jobService.PublishJobAsync(companyId, jobId, _currentUserService.UserId.Value, ct);
        return Ok(published);
    }

    [HttpPost("{jobId:guid}/pause")]
    [ProducesResponseType(typeof(JobPostingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PauseJob(Guid companyId, Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var paused = await _jobService.PauseJobAsync(companyId, jobId, _currentUserService.UserId.Value, ct);
        return Ok(paused);
    }

    [HttpPost("{jobId:guid}/reopen")]
    [ProducesResponseType(typeof(JobPostingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReopenJob(Guid companyId, Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var reopened = await _jobService.ReopenJobAsync(companyId, jobId, _currentUserService.UserId.Value, ct);
        return Ok(reopened);
    }

    [HttpPost("{jobId:guid}/close")]
    [ProducesResponseType(typeof(JobPostingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseJob(Guid companyId, Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var closed = await _jobService.CloseJobAsync(companyId, jobId, _currentUserService.UserId.Value, ct);
        return Ok(closed);
    }

    [HttpPost("{jobId:guid}/archive")]
    [ProducesResponseType(typeof(JobPostingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveJob(Guid companyId, Guid jobId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var archived = await _jobService.ArchiveJobAsync(companyId, jobId, _currentUserService.UserId.Value, ct);
        return Ok(archived);
    }
}
