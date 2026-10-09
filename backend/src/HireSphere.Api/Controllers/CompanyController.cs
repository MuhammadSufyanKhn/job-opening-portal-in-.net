using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Company;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
public class CompanyController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ICurrentUserService _currentUserService;

    public CompanyController(ICompanyService companyService, ICurrentUserService currentUserService)
    {
        _companyService = companyService;
        _currentUserService = currentUserService;
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(List<CompanyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyCompanies(CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var companies = await _companyService.GetUserCompaniesAsync(_currentUserService.UserId.Value, ct);
        return Ok(companies);
    }

    [HttpGet("{companyId:guid}")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCompany(Guid companyId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var company = await _companyService.GetCompanyByIdAsync(companyId, _currentUserService.UserId.Value, ct);
        return Ok(company);
    }

    [HttpPut("{companyId:guid}")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateCompany(
        Guid companyId,
        [FromBody] UpdateCompanyProfileRequest request,
        [FromServices] IValidator<UpdateCompanyProfileRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await validator.ValidateAndThrowAsync(request, ct);
        var updated = await _companyService.UpdateCompanyProfileAsync(companyId, _currentUserService.UserId.Value, request, ct);
        return Ok(updated);
    }

    [HttpGet("{companyId:guid}/members")]
    [ProducesResponseType(typeof(List<CompanyMemberDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMembers(Guid companyId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var members = await _companyService.GetMembersAsync(companyId, _currentUserService.UserId.Value, ct);
        return Ok(members);
    }

    [HttpPost("{companyId:guid}/members/invite")]
    [ProducesResponseType(typeof(CompanyMemberDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> InviteMember(
        Guid companyId,
        [FromBody] InviteMemberRequest request,
        [FromServices] IValidator<InviteMemberRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await validator.ValidateAndThrowAsync(request, ct);
        var member = await _companyService.InviteMemberAsync(companyId, _currentUserService.UserId.Value, request, ct);
        return Ok(member);
    }

    [HttpDelete("{companyId:guid}/members/{memberId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveMember(Guid companyId, Guid memberId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _companyService.RemoveMemberAsync(companyId, memberId, _currentUserService.UserId.Value, ct);
        return Ok(new { message = "Member removed successfully." });
    }
}
