using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = PlatformRoles.SuperAdmin)]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;
    private readonly ICurrentUserService _currentUserService;

    public AdminUsersController(IAdminUserService adminUserService, ICurrentUserService currentUserService)
    {
        _adminUserService = adminUserService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdminUserSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _adminUserService.GetUsersAsync(search, role, status, page, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{userId:guid}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(Guid userId, CancellationToken ct)
    {
        var user = await _adminUserService.GetUserByIdAsync(userId, ct);
        return Ok(user);
    }

    [HttpPost("{userId:guid}/suspend")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SuspendUser(Guid userId, [FromBody] SuspendUserRequest request, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { message = "Suspension reason is required." });
        }

        await _adminUserService.SuspendUserAsync(userId, _currentUserService.UserId.Value, request.Reason, ct);
        return Ok(new { message = "User account has been suspended successfully." });
    }

    [HttpPost("{userId:guid}/reactivate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReactivateUser(Guid userId, CancellationToken ct)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _adminUserService.ReactivateUserAsync(userId, _currentUserService.UserId.Value, ct);
        return Ok(new { message = "User account has been reactivated successfully." });
    }
}
