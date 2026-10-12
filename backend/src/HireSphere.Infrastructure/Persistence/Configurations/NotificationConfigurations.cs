using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using HireSphere.Domain.Entities;

namespace HireSphere.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.NotificationType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Message)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(n => n.ActionUrl)
            .HasMaxLength(500);

        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => new { n.UserId, n.IsRead });
        builder.HasIndex(n => n.CreatedAtUtc);
    }
}

public class EmailDeliveryAttemptConfiguration : IEntityTypeConfiguration<EmailDeliveryAttempt>
{
    public void Configure(EntityTypeBuilder<EmailDeliveryAttempt> builder)
    {
        builder.ToTable("EmailDeliveryAttempts");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.RecipientEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(e => e.Subject)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(e => e.TemplateName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.ErrorMessage)
            .HasMaxLength(2000);

        builder.HasIndex(e => e.DeliveryStatus);
        builder.HasIndex(e => e.CreatedAtUtc);
    }
}
