using Xunit;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class NotificationServiceTests
{
    [Fact]
    public async Task CreateNotificationAsync_SavesNotificationSuccessfully()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var service = new NotificationService(context);
        var userId = Guid.NewGuid();

        var notification = await service.CreateNotificationAsync(
            userId: userId,
            notificationType: "AssessmentInvitation",
            title: "New Assessment Available",
            message: "You have been invited to complete a simulation.",
            actionUrl: "/candidate/simulations");

        Assert.NotNull(notification);
        Assert.Equal(userId, (await context.Notifications.FindAsync(notification.Id))?.UserId);
        Assert.False(notification.IsRead);
        Assert.Equal("New Assessment Available", notification.Title);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_ReturnsOnlyNotificationsForGivenUser()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var service = new NotificationService(context);
        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();

        await service.CreateNotificationAsync(user1, "Type1", "Title 1", "Msg 1");
        await service.CreateNotificationAsync(user1, "Type2", "Title 2", "Msg 2");
        await service.CreateNotificationAsync(user2, "Type3", "Title 3", "Msg 3");

        var user1Notifications = await service.GetUserNotificationsAsync(user1);
        var user2Notifications = await service.GetUserNotificationsAsync(user2);

        Assert.Equal(2, user1Notifications.Count);
        Assert.Single(user2Notifications);
        Assert.Equal("Title 3", user2Notifications[0].Title);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ReturnsAccurateCountOfUnreadNotifications()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var service = new NotificationService(context);
        var userId = Guid.NewGuid();

        var notif1 = await service.CreateNotificationAsync(userId, "Type1", "Title 1", "Msg 1");
        var notif2 = await service.CreateNotificationAsync(userId, "Type2", "Title 2", "Msg 2");

        var countBefore = await service.GetUnreadCountAsync(userId);
        Assert.Equal(2, countBefore.UnreadCount);

        await service.MarkNotificationAsReadAsync(userId, notif1.Id);

        var countAfter = await service.GetUnreadCountAsync(userId);
        Assert.Equal(1, countAfter.UnreadCount);
    }

    [Fact]
    public async Task MarkNotificationAsReadAsync_ThrowsForbidden_WhenUserDoesNotOwnNotification()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var service = new NotificationService(context);
        var ownerId = Guid.NewGuid();
        var attackerId = Guid.NewGuid();

        var notif = await service.CreateNotificationAsync(ownerId, "Type1", "Title 1", "Msg 1");

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            service.MarkNotificationAsReadAsync(attackerId, notif.Id));
    }

    [Fact]
    public async Task MarkAllAsReadAsync_MarksAllUnreadNotificationsAsReadForUser()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var service = new NotificationService(context);
        var userId = Guid.NewGuid();

        await service.CreateNotificationAsync(userId, "Type1", "Title 1", "Msg 1");
        await service.CreateNotificationAsync(userId, "Type2", "Title 2", "Msg 2");

        await service.MarkAllAsReadAsync(userId);

        var unread = await service.GetUnreadCountAsync(userId);
        Assert.Equal(0, unread.UnreadCount);
    }
}
