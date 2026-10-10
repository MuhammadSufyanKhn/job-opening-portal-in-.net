using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.WorkSim;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Authorize]
public class CompanyAssessmentsController : ControllerBase
{
    private readonly IWorkSimManagementService _managementService;
    private readonly IWorkSimScoringService _scoringService;
    private readonly ICurrentUserService _currentUserService;

    public CompanyAssessmentsController(
        IWorkSimManagementService managementService,
        IWorkSimScoringService scoringService,
        ICurrentUserService currentUserService)
    {
        _managementService = managementService;
        _scoringService = scoringService;
        _currentUserService = currentUserService;
    }

    [HttpGet("api/companies/{companyId:guid}/assessments/scenarios")]
    [ProducesResponseType(typeof(List<SimulationScenarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCompanyScenarios(Guid companyId, CancellationToken ct)
    {
        var scenarios = await _managementService.GetAvailableScenariosAsync(companyId, ct);
        return Ok(scenarios);
    }

    [HttpPost("api/companies/{companyId:guid}/jobs/{jobId:guid}/assessments")]
    [ProducesResponseType(typeof(JobAssessmentConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignSimulation(
        Guid companyId,
        Guid jobId,
        [FromBody] AssignJobSimulationRequest request,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var config = await _managementService.AssignScenarioToJobAsync(companyId, jobId, _currentUserService.UserId.Value, request, ct);
        return Ok(config);
    }

    [HttpGet("api/companies/{companyId:guid}/jobs/{jobId:guid}/assessments")]
    [ProducesResponseType(typeof(JobAssessmentConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetJobAssessmentConfiguration(
        Guid companyId,
        Guid jobId,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var config = await _managementService.GetJobAssessmentConfigurationAsync(companyId, jobId, _currentUserService.UserId.Value, ct);
        return Ok(config);
    }

    [HttpDelete("api/companies/{companyId:guid}/jobs/{jobId:guid}/assessments")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RemoveJobAssessment(
        Guid companyId,
        Guid jobId,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var success = await _managementService.RemoveJobAssessmentConfigurationAsync(companyId, jobId, _currentUserService.UserId.Value, ct);
        if (!success) return NotFound();

        return NoContent();
    }

    [HttpGet("api/companies/{companyId:guid}/applications/{applicationId:guid}/assessment-result")]
    [ProducesResponseType(typeof(AssessmentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApplicationAssessmentResult(
        Guid companyId,
        Guid applicationId,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var result = await _scoringService.GetCompanyApplicationAssessmentResultAsync(companyId, applicationId, _currentUserService.UserId.Value, ct);
        if (result == null) return NotFound(new { message = "No completed assessment result is available for this application." });

        return Ok(result);
    }
}
