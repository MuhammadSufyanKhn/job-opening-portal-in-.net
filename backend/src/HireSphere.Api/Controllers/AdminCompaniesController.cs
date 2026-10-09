using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Company;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/admin/companies")]
[Authorize(Roles = PlatformRoles.SuperAdmin)]
public class AdminCompaniesController : ControllerBase
{
    private readonly IAdminCompanyService _adminCompanyService;
    private readonly ICurrentUserService _currentUserService;

    public AdminCompaniesController(IAdminCompanyService adminCompanyService, ICurrentUserService currentUserService)
    {
        _adminCompanyService = adminCompanyService;
        _currentUserService = currentUserService;
    }

    [HttpGet("pending")]
    [ProducesResponseType(typeof(List<CompanyReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPendingCompanies(CancellationToken ct)
    {
        var pending = await _adminCompanyService.GetPendingCompaniesAsync(ct);
        return Ok(pending);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CompanyReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAllCompanies([FromQuery] string? status, CancellationToken ct)
    {
        var companies = await _adminCompanyService.GetAllCompaniesAsync(status, ct);
        return Ok(companies);
    }

    [HttpGet("{companyId:guid}")]
    [ProducesResponseType(typeof(CompanyReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCompanyDetails(Guid companyId, CancellationToken ct)
    {
        var details = await _adminCompanyService.GetCompanyReviewDetailsAsync(companyId, ct);
        return Ok(details);
    }

    [HttpPost("{companyId:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveCompany(Guid companyId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _adminCompanyService.ApproveCompanyAsync(companyId, _currentUserService.UserId.Value, ct);
        return Ok(new { message = "Company has been approved successfully." });
    }

    [HttpPost("{companyId:guid}/reject")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectCompany(Guid companyId, [FromBody] RejectCompanyRequest request, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            return BadRequest(new { message = "Rejection reason is required." });
        }

        await _adminCompanyService.RejectCompanyAsync(companyId, _currentUserService.UserId.Value, request, ct);
        return Ok(new { message = "Company has been rejected." });
    }

    [HttpPost("{companyId:guid}/suspend")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendCompany(Guid companyId, [FromBody] SuspendCompanyRequest request, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { message = "Suspension reason is required." });
        }

        await _adminCompanyService.SuspendCompanyAsync(companyId, _currentUserService.UserId.Value, request, ct);
        return Ok(new { message = "Company has been suspended." });
    }

    [HttpPost("{companyId:guid}/restore")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreCompany(Guid companyId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _adminCompanyService.RestoreCompanyAsync(companyId, _currentUserService.UserId.Value, ct);
        return Ok(new { message = "Company has been restored to active approved status." });
    }
}
