using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using HireSphere.Domain.Entities;

namespace HireSphere.Infrastructure.Persistence.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(c => c.Name).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Slug).IsRequired().HasMaxLength(220);
        builder.HasIndex(c => c.Slug).IsUnique();

        builder.Property(c => c.BusinessRegistrationNumber).HasMaxLength(100);
        builder.Property(c => c.WebsiteUrl).HasMaxLength(500);
        builder.Property(c => c.LogoUrl).HasMaxLength(500);
        builder.Property(c => c.Industry).IsRequired().HasMaxLength(100);
        builder.Property(c => c.CompanySize).HasMaxLength(50);
        builder.Property(c => c.ContactEmail).IsRequired().HasMaxLength(256);
        builder.Property(c => c.ApprovalStatus).IsRequired().HasConversion<int>();
        builder.Property(c => c.RejectionReason).HasMaxLength(1000);

        builder.Property(c => c.CreatedAtUtc).IsRequired().HasDefaultValueSql("SYSDATETIMEOFFSET()");
        builder.Property(c => c.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.HasOne(c => c.ApprovedByUser)
            .WithMany()
            .HasForeignKey(c => c.ApprovedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}

public class CompanyMemberConfiguration : IEntityTypeConfiguration<CompanyMember>
{
    public void Configure(EntityTypeBuilder<CompanyMember> builder)
    {
        builder.ToTable("CompanyMembers");

        builder.HasKey(cm => cm.Id);
        builder.Property(cm => cm.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(cm => cm.CompanyRole).IsRequired().HasConversion<int>();
        builder.Property(cm => cm.MembershipStatus).IsRequired().HasConversion<int>();
        builder.Property(cm => cm.JoinedAtUtc).IsRequired().HasDefaultValueSql("SYSDATETIMEOFFSET()");

        builder.HasOne(cm => cm.Company)
            .WithMany(c => c.Members)
            .HasForeignKey(cm => cm.CompanyId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(cm => cm.User)
            .WithMany(u => u.CompanyMembers)
            .HasForeignKey(cm => cm.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(cm => new { cm.CompanyId, cm.UserId }).IsUnique();
        builder.HasIndex(cm => cm.UserId);
    }
}

public class CompanyInvitationConfiguration : IEntityTypeConfiguration<CompanyInvitation>
{
    public void Configure(EntityTypeBuilder<CompanyInvitation> builder)
    {
        builder.ToTable("CompanyInvitations");

        builder.HasKey(ci => ci.Id);
        builder.Property(ci => ci.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(ci => ci.InvitedEmail).IsRequired().HasMaxLength(256);
        builder.Property(ci => ci.CompanyRole).IsRequired().HasConversion<int>();
        builder.Property(ci => ci.InvitationToken).IsRequired().HasMaxLength(256);
        builder.HasIndex(ci => ci.InvitationToken).IsUnique();

        builder.Property(ci => ci.ExpiresAtUtc).IsRequired();
        builder.Property(ci => ci.IsAccepted).IsRequired().HasDefaultValue(false);
        builder.Property(ci => ci.CreatedAtUtc).IsRequired().HasDefaultValueSql("SYSDATETIMEOFFSET()");

        builder.HasOne(ci => ci.Company)
            .WithMany(c => c.Invitations)
            .HasForeignKey(ci => ci.CompanyId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(ci => ci.InvitedByUser)
            .WithMany()
            .HasForeignKey(ci => ci.InvitedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(ci => new { ci.CompanyId, ci.InvitedEmail });
    }
}

public class CandidateProfileConfiguration : IEntityTypeConfiguration<CandidateProfile>
{
    public void Configure(EntityTypeBuilder<CandidateProfile> builder)
    {
        builder.ToTable("CandidateProfiles");

        builder.HasKey(cp => cp.Id);
        builder.Property(cp => cp.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(cp => cp.Headline).HasMaxLength(200);
        builder.Property(cp => cp.Location).HasMaxLength(200);
        builder.Property(cp => cp.LinkedInUrl).HasMaxLength(500);
        builder.Property(cp => cp.GitHubUrl).HasMaxLength(500);
        builder.Property(cp => cp.PortfolioUrl).HasMaxLength(500);

        builder.HasOne(cp => cp.User)
            .WithOne(u => u.CandidateProfile)
            .HasForeignKey<CandidateProfile>(cp => cp.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(cp => cp.UserId).IsUnique();
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(al => al.Id);
        builder.Property(al => al.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(al => al.ActionType).IsRequired().HasMaxLength(100);
        builder.Property(al => al.TargetResource).IsRequired().HasMaxLength(100);
        builder.Property(al => al.TargetResourceId).IsRequired().HasMaxLength(100);
        builder.Property(al => al.IpAddress).HasMaxLength(50);
        builder.Property(al => al.UserAgent).HasMaxLength(500);
        builder.Property(al => al.TimestampUtc).IsRequired().HasDefaultValueSql("SYSDATETIMEOFFSET()");

        builder.HasOne(al => al.ActorUser)
            .WithMany()
            .HasForeignKey(al => al.ActorUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(al => al.Company)
            .WithMany()
            .HasForeignKey(al => al.CompanyId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(al => new { al.CompanyId, al.TimestampUtc });
        builder.HasIndex(al => new { al.ActorUserId, al.TimestampUtc });
    }
}
