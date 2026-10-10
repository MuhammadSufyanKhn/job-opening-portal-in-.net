using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Application;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/companies/{companyId:guid}/applications")]
[Authorize]
public class CompanyApplicationsController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly ICurrentUserService _currentUserService;

    public CompanyApplicationsController(IApplicationService applicationService, ICurrentUserService currentUserService)
    {
        _applicationService = applicationService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CompanyApplicationSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetApplications(
        Guid companyId,
        [FromQuery] Guid? jobPostingId,
        [FromQuery] ApplicationStage? stage,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var applications = await _applicationService.GetCompanyApplicationsAsync(
            companyId,
            _currentUserService.UserId.Value,
            jobPostingId,
            stage,
            page,
            pageSize,
            ct);

        return Ok(applications);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CompanyApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApplication(Guid companyId, Guid id, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var application = await _applicationService.GetCompanyApplicationByIdAsync(
            companyId,
            id,
            _currentUserService.UserId.Value,
            ct);

        return Ok(application);
    }

    [HttpPost("{id:guid}/stage")]
    [ProducesResponseType(typeof(CompanyApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateStage(
        Guid companyId,
        Guid id,
        [FromBody] UpdateApplicationStageRequest request,
        [FromServices] IValidator<UpdateApplicationStageRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ValidationProblemDetails(validationResult.ToDictionary()));
        }

        var updated = await _applicationService.UpdateApplicationStageAsync(
            companyId,
            id,
            _currentUserService.UserId.Value,
            request,
            ct);

        return Ok(updated);
    }

    [HttpGet("{id:guid}/cv")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadApplicationCv(
        Guid companyId,
        Guid id,
        [FromServices] ICandidateDocumentService documentService,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var (stream, fileName, contentType) = await documentService.GetDocumentFileForCompanyAsync(companyId, id, ct);
        return File(stream, contentType, fileName);
    }

    [HttpGet("{id:guid}/match-report")]
    [ProducesResponseType(typeof(HireSphere.Application.DTOs.Document.CvMatchReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMatchReport(
        Guid companyId,
        Guid id,
        [FromServices] ICvMatchingService matchingService,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var report = await matchingService.GetMatchReportForApplicationAsync(companyId, id, ct);
        return Ok(report);
    }

    [HttpPost("{id:guid}/match-report/recalculate")]
    [ProducesResponseType(typeof(HireSphere.Application.DTOs.Document.CvMatchReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecalculateMatchReport(
        Guid companyId,
        Guid id,
        [FromServices] ICvMatchingService matchingService,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var report = await matchingService.RecalculateMatchReportAsync(companyId, id, ct);
        return Ok(report);
    }
}
