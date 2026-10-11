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
        [FromQuery] string? search,
        [FromQuery] string? sortBy,
        [FromQuery] bool sortDescending = true,
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
            search,
            sortBy,
            sortDescending,
            page,
            pageSize,
            ct);

        return Ok(applications);
    }

    [HttpGet("board")]
    [ProducesResponseType(typeof(PipelineBoardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPipelineBoard(
        Guid companyId,
        [FromQuery] Guid? jobPostingId,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var board = await _applicationService.GetPipelineBoardAsync(
            companyId,
            _currentUserService.UserId.Value,
            jobPostingId,
            ct);

        return Ok(board);
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

        var (stream, fileName, contentType) = await documentService.GetDocumentFileForCompanyAsync(
            companyId, id, _currentUserService.UserId.Value, ct);

        // Security headers against MIME-sniffing and active content
        Response.Headers.Append("X-Content-Type-Options", "nosniff");
        Response.Headers.Append("Content-Security-Policy", "default-src 'none'");

        var safeFileName = Path.GetFileName(fileName).Replace("\r", "").Replace("\n", "");
        return File(stream, contentType, safeFileName);
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

        var report = await matchingService.GetMatchReportForApplicationAsync(
            companyId, id, _currentUserService.UserId.Value, ct);
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

        var report = await matchingService.RecalculateMatchReportAsync(
            companyId, id, _currentUserService.UserId.Value, ct);
        return Ok(report);
    }

    // --- Private Recruiter Notes ---

    [HttpGet("{id:guid}/notes")]
    [ProducesResponseType(typeof(IReadOnlyList<CandidateNoteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetNotes(Guid companyId, Guid id, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var notes = await _applicationService.GetApplicationNotesAsync(
            companyId,
            id,
            _currentUserService.UserId.Value,
            ct);

        return Ok(notes);
    }

    [HttpPost("{id:guid}/notes")]
    [ProducesResponseType(typeof(CandidateNoteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddNote(
        Guid companyId,
        Guid id,
        [FromBody] CreateCandidateNoteRequest request,
        [FromServices] IValidator<CreateCandidateNoteRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ValidationProblemDetails(validationResult.ToDictionary()));
        }

        var note = await _applicationService.AddCandidateNoteAsync(
            companyId,
            id,
            _currentUserService.UserId.Value,
            request,
            ct);

        return Ok(note);
    }

    [HttpDelete("{id:guid}/notes/{noteId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNote(Guid companyId, Guid id, Guid noteId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _applicationService.DeleteCandidateNoteAsync(
            companyId,
            id,
            noteId,
            _currentUserService.UserId.Value,
            ct);

        return NoContent();
    }

    // --- Interview Coordination ---

    [HttpGet("{id:guid}/interviews")]
    [ProducesResponseType(typeof(IReadOnlyList<InterviewScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInterviews(Guid companyId, Guid id, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var interviews = await _applicationService.GetApplicationInterviewsAsync(
            companyId,
            id,
            _currentUserService.UserId.Value,
            ct);

        return Ok(interviews);
    }

    [HttpPost("{id:guid}/interviews")]
    [ProducesResponseType(typeof(InterviewScheduleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ScheduleInterview(
        Guid companyId,
        Guid id,
        [FromBody] ScheduleInterviewRequest request,
        [FromServices] IValidator<ScheduleInterviewRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ValidationProblemDetails(validationResult.ToDictionary()));
        }

        var scheduled = await _applicationService.ScheduleInterviewAsync(
            companyId,
            id,
            _currentUserService.UserId.Value,
            request,
            ct);

        return Ok(scheduled);
    }

    [HttpPut("{id:guid}/interviews/{interviewId:guid}")]
    [ProducesResponseType(typeof(InterviewScheduleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateInterview(
        Guid companyId,
        Guid id,
        Guid interviewId,
        [FromBody] UpdateInterviewRequest request,
        [FromServices] IValidator<UpdateInterviewRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ValidationProblemDetails(validationResult.ToDictionary()));
        }

        var updated = await _applicationService.UpdateInterviewAsync(
            companyId,
            id,
            interviewId,
            _currentUserService.UserId.Value,
            request,
            ct);

        return Ok(updated);
    }

    [HttpPost("{id:guid}/interviews/{interviewId:guid}/cancel")]
    [ProducesResponseType(typeof(InterviewScheduleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelInterview(
        Guid companyId,
        Guid id,
        Guid interviewId,
        [FromBody] CancelInterviewRequest? request,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var cancelled = await _applicationService.CancelInterviewAsync(
            companyId,
            id,
            interviewId,
            _currentUserService.UserId.Value,
            request?.Reason,
            ct);

        return Ok(cancelled);
    }
}

