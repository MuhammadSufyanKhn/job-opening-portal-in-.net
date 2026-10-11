namespace HireSphere.Application.DTOs.Notification;

public record NotificationDto(
    Guid Id,
    string NotificationType,
    string Title,
    string Message,
    string? ActionUrl,
    bool IsRead,
    DateTimeOffset? ReadAtUtc,
    DateTimeOffset CreatedAtUtc);

public record UnreadNotificationCountDto(int UnreadCount);
