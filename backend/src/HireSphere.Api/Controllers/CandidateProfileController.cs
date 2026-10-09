using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Profile;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/candidates")]
[Authorize(Roles = PlatformRoles.Candidate)]
public class CandidateProfileController : ControllerBase
{
    private readonly ICandidateProfileService _profileService;
    private readonly ICurrentUserService _currentUserService;

    public CandidateProfileController(ICandidateProfileService profileService, ICurrentUserService currentUserService)
    {
        _profileService = profileService;
        _currentUserService = currentUserService;
    }

    [HttpGet("me/profile")]
    [ProducesResponseType(typeof(CandidateProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var profile = await _profileService.GetProfileAsync(_currentUserService.UserId.Value, ct);
        return Ok(profile);
    }

    [HttpPut("me/profile")]
    [ProducesResponseType(typeof(CandidateProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateCandidateProfileRequest request,
        [FromServices] IValidator<UpdateCandidateProfileRequest> validator,
        CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await validator.ValidateAndThrowAsync(request, ct);
        var updated = await _profileService.UpdateProfileAsync(_currentUserService.UserId.Value, request, ct);
        return Ok(updated);
    }
}
