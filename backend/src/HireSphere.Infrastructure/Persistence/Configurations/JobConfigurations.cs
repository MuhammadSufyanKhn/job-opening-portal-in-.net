using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using HireSphere.Domain.Entities;

namespace HireSphere.Infrastructure.Persistence.Configurations;

public class JobCategoryConfiguration : IEntityTypeConfiguration<JobCategory>
{
    public void Configure(EntityTypeBuilder<JobCategory> builder)
    {
        builder.ToTable("JobCategories");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Slug).HasMaxLength(120).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(255);
        builder.Property(c => c.DisplayOrder).HasDefaultValue(0);

        builder.HasIndex(c => c.Name).IsUnique();
        builder.HasIndex(c => c.Slug).IsUnique();
    }
}

public class JobPostingConfiguration : IEntityTypeConfiguration<JobPosting>
{
    public void Configure(EntityTypeBuilder<JobPosting> builder)
    {
        builder.ToTable("JobPostings");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Title).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Slug).HasMaxLength(220).IsRequired();
        builder.Property(p => p.Summary).HasMaxLength(500).IsRequired();
        builder.Property(p => p.Description).IsRequired();
        builder.Property(p => p.Responsibilities).IsRequired();
        builder.Property(p => p.Location).HasMaxLength(200).IsRequired();
        builder.Property(p => p.SalaryMin).HasPrecision(18, 2);
        builder.Property(p => p.SalaryMax).HasPrecision(18, 2);
        builder.Property(p => p.SalaryCurrency).HasMaxLength(10).HasDefaultValue("USD");
        builder.Property(p => p.ActiveVersionNumber).HasDefaultValue(1);
        builder.Property(p => p.RowVersion).IsRowVersion();

        builder.HasOne(p => p.Company)
            .WithMany(c => c.JobPostings)
            .HasForeignKey(p => p.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.JobCategory)
            .WithMany(c => c.JobPostings)
            .HasForeignKey(p => p.JobCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.CompanyId, p.Status });
        builder.HasIndex(p => new { p.Status, p.PublishedAtUtc });
    }
}

public class JobRequirementConfiguration : IEntityTypeConfiguration<JobRequirement>
{
    public void Configure(EntityTypeBuilder<JobRequirement> builder)
    {
        builder.ToTable("JobRequirements");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RequirementText).HasMaxLength(500).IsRequired();
        builder.Property(r => r.DisplayOrder).HasDefaultValue(0);

        builder.HasOne(r => r.JobPosting)
            .WithMany(p => p.Requirements)
            .HasForeignKey(r => r.JobPostingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => r.JobPostingId);
    }
}

public class JobDescriptionVersionConfiguration : IEntityTypeConfiguration<JobDescriptionVersion>
{
    public void Configure(EntityTypeBuilder<JobDescriptionVersion> builder)
    {
        builder.ToTable("JobDescriptionVersions");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.SnapshotJson).IsRequired();

        builder.HasOne(v => v.JobPosting)
            .WithMany(p => p.Versions)
            .HasForeignKey(v => v.JobPostingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(v => new { v.JobPostingId, v.VersionNumber }).IsUnique();
    }
}
