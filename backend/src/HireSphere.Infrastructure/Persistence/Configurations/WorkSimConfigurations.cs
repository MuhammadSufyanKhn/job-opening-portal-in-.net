using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using HireSphere.Domain.Entities;

namespace HireSphere.Infrastructure.Persistence.Configurations;

public class SimulationScenarioConfiguration : IEntityTypeConfiguration<SimulationScenario>
{
    public void Configure(EntityTypeBuilder<SimulationScenario> builder)
    {
        builder.ToTable("SimulationScenarios");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Title).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Category).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Description).IsRequired();

        builder.HasOne(s => s.OwnerCompany)
            .WithMany()
            .HasForeignKey(s => s.OwnerCompanyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(s => new { s.Category, s.IsActive });
    }
}

public class ScenarioVersionConfiguration : IEntityTypeConfiguration<ScenarioVersion>
{
    public void Configure(EntityTypeBuilder<ScenarioVersion> builder)
    {
        builder.ToTable("ScenarioVersions");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.DefinitionJson).IsRequired();
        builder.Property(v => v.RubricJson).IsRequired();

        builder.HasOne(v => v.SimulationScenario)
            .WithMany(s => s.Versions)
            .HasForeignKey(v => v.SimulationScenarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(v => new { v.SimulationScenarioId, v.VersionNumber }).IsUnique();
    }
}

public class JobAssessmentConfigurationConfiguration : IEntityTypeConfiguration<JobAssessmentConfiguration>
{
    public void Configure(EntityTypeBuilder<JobAssessmentConfiguration> builder)
    {
        builder.ToTable("JobAssessmentConfigurations");
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.Company)
            .WithMany()
            .HasForeignKey(c => c.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.JobPosting)
            .WithMany()
            .HasForeignKey(c => c.JobPostingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.ScenarioVersion)
            .WithMany(v => v.JobConfigurations)
            .HasForeignKey(c => c.ScenarioVersionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.JobPostingId);
    }
}

public class AssessmentAssignmentConfiguration : IEntityTypeConfiguration<AssessmentAssignment>
{
    public void Configure(EntityTypeBuilder<AssessmentAssignment> builder)
    {
        builder.ToTable("AssessmentAssignments");
        builder.HasKey(a => a.Id);

        builder.HasOne(a => a.Company)
            .WithMany()
            .HasForeignKey(a => a.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.JobApplication)
            .WithMany(app => app.AssessmentAssignments)
            .HasForeignKey(a => a.JobApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.JobAssessmentConfiguration)
            .WithMany(c => c.Assignments)
            .HasForeignKey(a => a.JobAssessmentConfigurationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.CandidateProfile)
            .WithMany()
            .HasForeignKey(a => a.CandidateProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(a => a.CancellationReason)
            .HasMaxLength(500);

        builder.HasIndex(a => a.JobApplicationId);
        builder.HasIndex(a => a.CandidateProfileId);
        builder.HasIndex(a => new { a.CompanyId, a.Status });
        builder.HasIndex(a => new { a.Status, a.DeadlineUtc });
        builder.HasIndex(a => new { a.JobApplicationId, a.JobAssessmentConfigurationId });
    }
}

public class SimulationSessionConfiguration : IEntityTypeConfiguration<SimulationSession>
{
    public void Configure(EntityTypeBuilder<SimulationSession> builder)
    {
        builder.ToTable("SimulationSessions");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.CurrentStateVectorJson).IsRequired();
        builder.Property(s => s.RowVersion).IsRowVersion();

        builder.HasOne(s => s.AssessmentAssignment)
            .WithMany(a => a.Sessions)
            .HasForeignKey(s => s.AssessmentAssignmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.CandidateProfile)
            .WithMany()
            .HasForeignKey(s => s.CandidateProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.ScenarioVersion)
            .WithMany(v => v.Sessions)
            .HasForeignKey(s => s.ScenarioVersionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.AssessmentAssignmentId);
        builder.HasIndex(s => new { s.CandidateProfileId, s.Status });
    }
}

public class SimulationActionLogConfiguration : IEntityTypeConfiguration<SimulationActionLog>
{
    public void Configure(EntityTypeBuilder<SimulationActionLog> builder)
    {
        builder.ToTable("SimulationActionLogs");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.ActionType).HasMaxLength(100).IsRequired();
        builder.Property(l => l.ActionPayloadJson).IsRequired();
        builder.Property(l => l.CandidateRationale).HasMaxLength(1000);

        builder.HasOne(l => l.SimulationSession)
            .WithMany(s => s.ActionLogs)
            .HasForeignKey(l => l.SimulationSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => new { l.SimulationSessionId, l.SequenceNumber }).IsUnique();
        builder.HasIndex(l => new { l.SimulationSessionId, l.TimestampUtc });
    }
}

public class AssessmentResultConfiguration : IEntityTypeConfiguration<AssessmentResult>
{
    public void Configure(EntityTypeBuilder<AssessmentResult> builder)
    {
        builder.ToTable("AssessmentResults");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.TotalScore).HasPrecision(5, 2);
        builder.Property(r => r.EvaluationSummary).IsRequired();
        builder.Property(r => r.CandidateFeedback).IsRequired();

        builder.HasOne(r => r.SimulationSession)
            .WithOne(s => s.AssessmentResult)
            .HasForeignKey<AssessmentResult>(r => r.SimulationSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.ScenarioVersion)
            .WithMany()
            .HasForeignKey(r => r.ScenarioVersionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.SimulationSessionId).IsUnique();
    }
}

public class CriterionScoreConfiguration : IEntityTypeConfiguration<CriterionScore>
{
    public void Configure(EntityTypeBuilder<CriterionScore> builder)
    {
        builder.ToTable("CriterionScores");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.CriterionName).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Score).HasPrecision(5, 2);
        builder.Property(c => c.MaxScore).HasPrecision(5, 2);
        builder.Property(c => c.SupportingEvidenceJson).IsRequired();

        builder.HasOne(c => c.AssessmentResult)
            .WithMany(r => r.CriterionScores)
            .HasForeignKey(c => c.AssessmentResultId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.AssessmentResultId);
    }
}
