using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using HireSphere.Domain.Entities;

namespace HireSphere.Infrastructure.Persistence.Configurations;

public class CandidateDocumentConfiguration : IEntityTypeConfiguration<CandidateDocument>
{
    public void Configure(EntityTypeBuilder<CandidateDocument> builder)
    {
        builder.ToTable("CandidateDocuments");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.OriginalFileName).HasMaxLength(255).IsRequired();
        builder.Property(d => d.StorageKey).HasMaxLength(255).IsRequired();
        builder.Property(d => d.FileExtension).HasMaxLength(10).IsRequired();
        builder.Property(d => d.MimeType).HasMaxLength(100).IsRequired();
        builder.Property(d => d.VersionNumber).HasDefaultValue(1);
        builder.Property(d => d.ContentHash).HasMaxLength(64);

        builder.HasOne(d => d.CandidateProfile)
            .WithMany(p => p.Documents)
            .HasForeignKey(d => d.CandidateProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.RootDocument)
            .WithMany(d => d.Versions)
            .HasForeignKey(d => d.RootDocumentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.StorageKey).IsUnique();
        builder.HasIndex(d => new { d.CandidateProfileId, d.IsDefault });
        builder.HasIndex(d => d.RootDocumentId);
        builder.HasIndex(d => d.ContentHash);
    }
}

public class JobApplicationConfiguration : IEntityTypeConfiguration<JobApplication>
{
    public void Configure(EntityTypeBuilder<JobApplication> builder)
    {
        builder.ToTable("JobApplications");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.CandidateCoverNote).HasMaxLength(2000);

        builder.HasOne(a => a.Company)
            .WithMany(c => c.JobApplications)
            .HasForeignKey(a => a.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.JobPosting)
            .WithMany(p => p.Applications)
            .HasForeignKey(a => a.JobPostingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.JobDescriptionVersion)
            .WithMany()
            .HasForeignKey(a => a.JobDescriptionVersionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.CandidateProfile)
            .WithMany(p => p.Applications)
            .HasForeignKey(a => a.CandidateProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.CandidateDocument)
            .WithMany()
            .HasForeignKey(a => a.CandidateDocumentId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasIndex(a => new { a.JobPostingId, a.CandidateProfileId }).IsUnique();
        builder.HasIndex(a => new { a.CompanyId, a.CurrentStage });
        builder.HasIndex(a => a.CandidateProfileId);
    }
}

public class ApplicationStatusHistoryConfiguration : IEntityTypeConfiguration<ApplicationStatusHistory>
{
    public void Configure(EntityTypeBuilder<ApplicationStatusHistory> builder)
    {
        builder.ToTable("ApplicationStatusHistories");
        builder.HasKey(h => h.Id);

        builder.Property(h => h.ReasonNote).HasMaxLength(1000);

        builder.HasOne(h => h.JobApplication)
            .WithMany(a => a.StatusHistories)
            .HasForeignKey(h => h.JobApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.ChangedByUser)
            .WithMany()
            .HasForeignKey(h => h.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => new { h.JobApplicationId, h.CreatedAtUtc });
    }
}

public class CandidateNoteConfiguration : IEntityTypeConfiguration<CandidateNote>
{
    public void Configure(EntityTypeBuilder<CandidateNote> builder)
    {
        builder.ToTable("CandidateNotes");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.NoteText).IsRequired();

        builder.HasOne(n => n.Company)
            .WithMany()
            .HasForeignKey(n => n.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.JobApplication)
            .WithMany(a => a.CandidateNotes)
            .HasForeignKey(n => n.JobApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.AuthorUser)
            .WithMany()
            .HasForeignKey(n => n.AuthorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(n => n.JobApplicationId);
    }
}

public class CandidateSavedJobConfiguration : IEntityTypeConfiguration<CandidateSavedJob>
{
    public void Configure(EntityTypeBuilder<CandidateSavedJob> builder)
    {
        builder.ToTable("CandidateSavedJobs");
        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.CandidateProfile)
            .WithMany(p => p.SavedJobs)
            .HasForeignKey(s => s.CandidateProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.JobPosting)
            .WithMany()
            .HasForeignKey(s => s.JobPostingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.CandidateProfileId, s.JobPostingId }).IsUnique();
        builder.HasIndex(s => new { s.CandidateProfileId, s.SavedAtUtc });
    }
}
