using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.Services;
using HireSphere.Domain.Enums;

namespace HireSphere.Api.Controllers;

[ApiController]
[Route("api/admin/audit")]
[Authorize(Roles = PlatformRoles.AnyAdmin)]
public class AdminAuditController : ControllerBase
{
    private readonly IAdminAuditService _adminAuditService;

    public AdminAuditController(IAdminAuditService adminAuditService)
    {
        _adminAuditService = adminAuditService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdminAuditItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] string? actionType,
        [FromQuery] string? targetResource,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        CancellationToken ct = default)
    {
        var result = await _adminAuditService.GetAuditLogsAsync(search, actionType, targetResource, page, pageSize, ct);
        return Ok(result);
    }
}
