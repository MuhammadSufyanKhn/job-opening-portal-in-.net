using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Authorize(Roles = PlatformRoles.Candidate)]
public class CandidateApplicationsController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly ICurrentUserService _currentUserService;

    public CandidateApplicationsController(IApplicationService applicationService, ICurrentUserService currentUserService)
    {
        _applicationService = applicationService;
        _currentUserService = currentUserService;
    }

    [HttpPost("api/jobs/{jobId:guid}/apply")]
    [ProducesResponseType(typeof(CandidateApplicationDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Apply(
        Guid jobId,
        [FromBody] SubmitApplicationRequest request,
        [FromServices] IValidator<SubmitApplicationRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ValidationProblemDetails(validationResult.ToDictionary()));
        }

        var result = await _applicationService.SubmitApplicationAsync(jobId, _currentUserService.UserId.Value, request, ct);
        return CreatedAtAction(nameof(GetApplication), new { id = result.Id }, result);
    }

    [HttpGet("api/candidate/applications")]
    [ProducesResponseType(typeof(List<CandidateApplicationSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyApplications(CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var applications = await _applicationService.GetCandidateApplicationsAsync(_currentUserService.UserId.Value, ct);
        return Ok(applications);
    }

    [HttpGet("api/candidate/applications/{id:guid}")]
    [ProducesResponseType(typeof(CandidateApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApplication(Guid id, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var application = await _applicationService.GetCandidateApplicationByIdAsync(id, _currentUserService.UserId.Value, ct);
        return Ok(application);
    }

    [HttpPost("api/candidate/applications/{id:guid}/withdraw")]
    [ProducesResponseType(typeof(CandidateApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> WithdrawApplication(Guid id, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var application = await _applicationService.WithdrawApplicationAsync(id, _currentUserService.UserId.Value, ct);
        return Ok(application);
    }
}
