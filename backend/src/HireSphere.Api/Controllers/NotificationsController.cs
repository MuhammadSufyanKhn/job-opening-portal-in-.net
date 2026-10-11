using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Notification;
using HireSphere.Application.Services;

namespace HireSphere.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;

    public NotificationsController(
        INotificationService notificationService,
        ICurrentUserService currentUserService)
    {
        _notificationService = notificationService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetNotifications([FromQuery] int limit = 30, CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var notifications = await _notificationService.GetUserNotificationsAsync(
            _currentUserService.UserId.Value, limit, ct);

        return Ok(notifications);
    }

    [HttpGet("paged")]
    [ProducesResponseType(typeof(HireSphere.Application.DTOs.Job.PagedResult<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetNotificationsPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? unreadOnly = null,
        [FromQuery] string? type = null,
        CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var paged = await _notificationService.GetUserNotificationsPagedAsync(
            _currentUserService.UserId.Value,
            page,
            pageSize,
            unreadOnly,
            type,
            ct);

        return Ok(paged);
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadNotificationCountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        var count = await _notificationService.GetUnreadCountAsync(_currentUserService.UserId.Value, ct);
        return Ok(count);
    }

    [HttpPost("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _notificationService.MarkNotificationAsReadAsync(_currentUserService.UserId.Value, id, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct = default)
    {
        if (!_currentUserService.UserId.HasValue) return Unauthorized();

        await _notificationService.MarkAllAsReadAsync(_currentUserService.UserId.Value, ct);
        return NoContent();
    }
}
