using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using HireSphere.Domain.Entities;

namespace HireSphere.Infrastructure.Persistence.Configurations;

public class DocumentExtractionJobConfiguration : IEntityTypeConfiguration<DocumentExtractionJob>
{
    public void Configure(EntityTypeBuilder<DocumentExtractionJob> builder)
    {
        builder.ToTable("DocumentExtractionJobs");
        builder.HasKey(j => j.Id);

        builder.Property(j => j.ParserVersion).HasMaxLength(50).IsRequired();
        builder.Property(j => j.ErrorMessage).HasMaxLength(2000);

        builder.HasOne(j => j.CandidateDocument)
            .WithMany(d => d.ExtractionJobs)
            .HasForeignKey(j => j.CandidateDocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(j => new { j.Status, j.CandidateDocumentId });
    }
}

public class CvMatchReportConfiguration : IEntityTypeConfiguration<CvMatchReport>
{
    public void Configure(EntityTypeBuilder<CvMatchReport> builder)
    {
        builder.ToTable("CvMatchReports");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.OverallEvidenceIndex).HasPrecision(5, 2);
        builder.Property(r => r.EngineVersion).HasMaxLength(50).IsRequired();
        builder.Property(r => r.CalculationSummary).IsRequired();

        builder.HasOne(r => r.JobApplication)
            .WithOne(a => a.CvMatchReport)
            .HasForeignKey<CvMatchReport>(r => r.JobApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.JobDescriptionVersion)
            .WithMany()
            .HasForeignKey(r => r.JobDescriptionVersionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.DocumentExtractionJob)
            .WithMany(j => j.MatchReports)
            .HasForeignKey(r => r.DocumentExtractionJobId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.JobApplicationId).IsUnique();
    }
}

public class CvRequirementEvaluationConfiguration : IEntityTypeConfiguration<CvRequirementEvaluation>
{
    public void Configure(EntityTypeBuilder<CvRequirementEvaluation> builder)
    {
        builder.ToTable("CvRequirementEvaluations");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ConfidenceLevel).HasPrecision(5, 2);
        builder.Property(e => e.ExtractedExcerpt).HasMaxLength(2000);
        builder.Property(e => e.ReviewerNote).HasMaxLength(1000);

        builder.HasOne(e => e.CvMatchReport)
            .WithMany(r => r.Evaluations)
            .HasForeignKey(e => e.CvMatchReportId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.JobRequirement)
            .WithMany()
            .HasForeignKey(e => e.JobRequirementId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.CvMatchReportId);
    }
}
