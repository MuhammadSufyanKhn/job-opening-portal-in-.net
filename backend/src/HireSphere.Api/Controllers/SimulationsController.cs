using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.WorkSim;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
public class SimulationsController : ControllerBase
{
    private readonly IWorkSimRuntimeService _runtimeService;
    private readonly IWorkSimScoringService _scoringService;
    private readonly IWorkSimManagementService _managementService;
    private readonly ICurrentUserService _currentUserService;

    public SimulationsController(
        IWorkSimRuntimeService runtimeService,
        IWorkSimScoringService scoringService,
        IWorkSimManagementService managementService,
        ICurrentUserService currentUserService)
    {
        _runtimeService = runtimeService;
        _scoringService = scoringService;
        _managementService = managementService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet("api/simulations/catalog")]
    [ProducesResponseType(typeof(List<SimulationScenarioDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCatalog(CancellationToken ct)
    {
        var scenarios = await _managementService.GetAvailableScenariosAsync(null, ct);
        return Ok(scenarios);
    }

    [Authorize(Roles = PlatformRoles.Candidate)]
    [HttpGet("api/candidate/simulations")]
    [ProducesResponseType(typeof(List<AssessmentAssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyAssignments(CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var assignments = await _managementService.GetCandidateAssignmentsAsync(_currentUserService.UserId.Value, ct);
        return Ok(assignments);
    }

    [Authorize(Roles = PlatformRoles.Candidate)]
    [HttpPost("api/candidate/simulations/assignments/{assignmentId:guid}/start")]
    [ProducesResponseType(typeof(CandidateSimulationRuntimeStateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> StartSession(Guid assignmentId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var state = await _runtimeService.StartSessionAsync(_currentUserService.UserId.Value, assignmentId, ct);
        return Ok(state);
    }

    [Authorize(Roles = PlatformRoles.Candidate)]
    [HttpGet("api/candidate/simulations/sessions/{sessionId:guid}")]
    [ProducesResponseType(typeof(CandidateSimulationRuntimeStateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSessionState(Guid sessionId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var state = await _runtimeService.GetSessionStateAsync(_currentUserService.UserId.Value, sessionId, ct);
        return Ok(state);
    }

    [Authorize(Roles = PlatformRoles.Candidate)]
    [HttpPost("api/candidate/simulations/sessions/{sessionId:guid}/actions")]
    [ProducesResponseType(typeof(SubmitSimulationActionResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitAction(
        Guid sessionId,
        [FromBody] SubmitSimulationActionRequest request,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var result = await _runtimeService.SubmitActionAsync(_currentUserService.UserId.Value, sessionId, request, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("api/candidate/simulations/sessions/{sessionId:guid}/results")]
    [ProducesResponseType(typeof(AssessmentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSessionResults(Guid sessionId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var result = await _scoringService.GetSessionResultAsync(sessionId, _currentUserService.UserId.Value, ct);
        if (result == null) return NotFound(new { message = "Assessment result is not yet available for this session." });

        return Ok(result);
    }
}
