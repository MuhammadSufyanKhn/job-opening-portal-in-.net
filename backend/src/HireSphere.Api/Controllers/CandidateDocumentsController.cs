using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireSphere.Domain.Exceptions;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Document;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/candidate/documents")]
[Authorize(Roles = PlatformRoles.Candidate)]
public class CandidateDocumentsController : ControllerBase
{
    private readonly ICandidateDocumentService _documentService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _context;

    public CandidateDocumentsController(
        ICandidateDocumentService documentService,
        ICurrentUserService currentUserService,
        IApplicationDbContext context)
    {
        _documentService = documentService;
        _currentUserService = currentUserService;
        _context = context;
    }

    private async Task<Guid> GetCandidateProfileIdAsync(CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }

        var profile = await _context.CandidateProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == _currentUserService.UserId.Value, ct);

        if (profile == null)
        {
            throw new NotFoundException("Candidate profile not found for authenticated user.");
        }

        return profile.Id;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)]
    [ProducesResponseType(typeof(CandidateDocumentDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadCv([FromForm(Name = "file")] IFormFile? file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing file",
                Detail = "Please provide a valid CV file to upload (.pdf or .docx)."
            });
        }

        var profileId = await GetCandidateProfileIdAsync(ct);

        await using var stream = file.OpenReadStream();
        var result = await _documentService.UploadCvAsync(profileId, stream, file.FileName, file.ContentType, ct);

        return CreatedAtAction(nameof(GetDocument), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/versions")]
    [Consumes("multipart/form-data")]
    [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)]
    [ProducesResponseType(typeof(CandidateDocumentDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadNewVersion(Guid id, [FromForm(Name = "file")] IFormFile? file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing file",
                Detail = "Please provide a valid new version CV file (.pdf or .docx)."
            });
        }

        var profileId = await GetCandidateProfileIdAsync(ct);

        await using var stream = file.OpenReadStream();
        var result = await _documentService.UploadNewVersionAsync(profileId, id, stream, file.FileName, file.ContentType, ct);

        return CreatedAtAction(nameof(GetDocument), new { id = result.Id }, result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CandidateDocumentSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyDocuments(CancellationToken ct)
    {
        var profileId = await GetCandidateProfileIdAsync(ct);
        var docs = await _documentService.GetCandidateDocumentsAsync(profileId, ct);
        return Ok(docs);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CandidateDocumentDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDocument(Guid id, CancellationToken ct)
    {
        var profileId = await GetCandidateProfileIdAsync(ct);
        var doc = await _documentService.GetDocumentDetailAsync(profileId, id, ct);
        return Ok(doc);
    }

    [HttpPost("{id:guid}/set-default")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDefaultCv(Guid id, CancellationToken ct)
    {
        var profileId = await GetCandidateProfileIdAsync(ct);
        await _documentService.SetDefaultCvAsync(profileId, id, ct);
        return Ok(new { success = true, message = "Primary CV set successfully." });
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(Guid id, CancellationToken ct)
    {
        var profileId = await GetCandidateProfileIdAsync(ct);
        await _documentService.DeleteDocumentAsync(profileId, id, ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadCv(Guid id, CancellationToken ct)
    {
        var profileId = await GetCandidateProfileIdAsync(ct);
        var (stream, fileName, contentType) = await _documentService.GetDocumentFileForCandidateAsync(profileId, id, ct);

        Response.Headers.Append("X-Content-Type-Options", "nosniff");
        Response.Headers.Append("Content-Security-Policy", "default-src 'none'");

        var safeFileName = Path.GetFileName(fileName).Replace("\r", "").Replace("\n", "");
        return File(stream, contentType, safeFileName);
    }
}
