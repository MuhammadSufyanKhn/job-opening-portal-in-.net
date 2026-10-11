using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Job;
using HireSphere.Application.DTOs.Notification;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface INotificationService
{
    Task<NotificationDto> CreateNotificationAsync(
        Guid userId,
        string notificationType,
        string title,
        string message,
        string? actionUrl = null,
        CancellationToken ct = default);

    Task<IReadOnlyList<NotificationDto>> GetUserNotificationsAsync(
        Guid userId,
        int limit = 30,
        CancellationToken ct = default);

    Task<PagedResult<NotificationDto>> GetUserNotificationsPagedAsync(
        Guid userId,
        int page = 1,
        int pageSize = 20,
        bool? unreadOnly = null,
        string? notificationType = null,
        CancellationToken ct = default);

    Task MarkNotificationAsReadAsync(
        Guid userId,
        Guid notificationId,
        CancellationToken ct = default);

    Task MarkAllAsReadAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<UnreadNotificationCountDto> GetUnreadCountAsync(
        Guid userId,
        CancellationToken ct = default);
}

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;

    public NotificationService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationDto> CreateNotificationAsync(
        Guid userId,
        string notificationType,
        string title,
        string message,
        string? actionUrl = null,
        CancellationToken ct = default)
    {
        // Deduplication: if an unread notification for the same user, type, and title exists within the last 5 minutes, avoid duplicate flooding
        var recentWindow = DateTimeOffset.UtcNow.AddMinutes(-5);
        var existing = await _context.Notifications
            .FirstOrDefaultAsync(n => n.UserId == userId &&
                                      n.NotificationType == notificationType &&
                                      n.Title == title &&
                                      !n.IsRead &&
                                      n.CreatedAtUtc >= recentWindow, ct);

        if (existing != null)
        {
            return new NotificationDto(
                existing.Id,
                existing.NotificationType,
                existing.Title,
                existing.Message,
                existing.ActionUrl,
                existing.IsRead,
                existing.ReadAtUtc,
                existing.CreatedAtUtc);
        }

        var notification = new Notification
        {
            UserId = userId,
            NotificationType = notificationType,
            Title = title,
            Message = message,
            ActionUrl = actionUrl,
            IsRead = false,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        return new NotificationDto(
            notification.Id,
            notification.NotificationType,
            notification.Title,
            notification.Message,
            notification.ActionUrl,
            notification.IsRead,
            notification.ReadAtUtc,
            notification.CreatedAtUtc);
    }

    public async Task<IReadOnlyList<NotificationDto>> GetUserNotificationsAsync(
        Guid userId,
        int limit = 30,
        CancellationToken ct = default)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(limit)
            .Select(n => new NotificationDto(
                n.Id,
                n.NotificationType,
                n.Title,
                n.Message,
                n.ActionUrl,
                n.IsRead,
                n.ReadAtUtc,
                n.CreatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<PagedResult<NotificationDto>> GetUserNotificationsPagedAsync(
        Guid userId,
        int page = 1,
        int pageSize = 20,
        bool? unreadOnly = null,
        string? notificationType = null,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        if (!string.IsNullOrWhiteSpace(notificationType))
        {
            query = query.Where(n => n.NotificationType == notificationType.Trim());
        }

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.NotificationType,
                n.Title,
                n.Message,
                n.ActionUrl,
                n.IsRead,
                n.ReadAtUtc,
                n.CreatedAtUtc))
            .ToListAsync(ct);

        return new PagedResult<NotificationDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task MarkNotificationAsReadAsync(
        Guid userId,
        Guid notificationId,
        CancellationToken ct = default)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId, ct);

        if (notification == null)
            throw new NotFoundException("Notification", notificationId);

        if (notification.UserId != userId)
            throw new ForbiddenAccessException("You can only update your own notifications.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task MarkAllAsReadAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        if (unread.Count > 0)
        {
            var now = DateTimeOffset.UtcNow;
            foreach (var n in unread)
            {
                n.IsRead = true;
                n.ReadAtUtc = now;
            }

            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task<UnreadNotificationCountDto> GetUnreadCountAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        int count = await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);

        return new UnreadNotificationCountDto(count);
    }
}
