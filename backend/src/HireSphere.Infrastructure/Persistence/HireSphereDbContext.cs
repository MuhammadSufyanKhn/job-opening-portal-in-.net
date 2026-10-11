using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Domain.Entities;

namespace HireSphere.Infrastructure.Persistence;

public class HireSphereDbContext : DbContext, IApplicationDbContext
{
    public HireSphereDbContext(DbContextOptions<HireSphereDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyMember> CompanyMembers => Set<CompanyMember>();
    public DbSet<CompanyInvitation> CompanyInvitations => Set<CompanyInvitation>();
    public DbSet<CandidateProfile> CandidateProfiles => Set<CandidateProfile>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<JobCategory> JobCategories => Set<JobCategory>();
    public DbSet<JobPosting> JobPostings => Set<JobPosting>();
    public DbSet<JobRequirement> JobRequirements => Set<JobRequirement>();
    public DbSet<JobDescriptionVersion> JobDescriptionVersions => Set<JobDescriptionVersion>();
    public DbSet<CandidateDocument> CandidateDocuments => Set<CandidateDocument>();
    public DbSet<CandidateSavedJob> CandidateSavedJobs => Set<CandidateSavedJob>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<ApplicationStatusHistory> ApplicationStatusHistories => Set<ApplicationStatusHistory>();
    public DbSet<CandidateNote> CandidateNotes => Set<CandidateNote>();
    public DbSet<InterviewSchedule> InterviewSchedules => Set<InterviewSchedule>();
    public DbSet<DocumentExtractionJob> DocumentExtractionJobs => Set<DocumentExtractionJob>();
    public DbSet<CvMatchReport> CvMatchReports => Set<CvMatchReport>();
    public DbSet<CvRequirementEvaluation> CvRequirementEvaluations => Set<CvRequirementEvaluation>();

    public DbSet<SimulationScenario> SimulationScenarios => Set<SimulationScenario>();
    public DbSet<ScenarioVersion> ScenarioVersions => Set<ScenarioVersion>();
    public DbSet<JobAssessmentConfiguration> JobAssessmentConfigurations => Set<JobAssessmentConfiguration>();
    public DbSet<AssessmentAssignment> AssessmentAssignments => Set<AssessmentAssignment>();
    public DbSet<SimulationSession> SimulationSessions => Set<SimulationSession>();
    public DbSet<SimulationActionLog> SimulationActionLogs => Set<SimulationActionLog>();
    public DbSet<AssessmentResult> AssessmentResults => Set<AssessmentResult>();
    public DbSet<CriterionScore> CriterionScores => Set<CriterionScore>();

    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<EmailDeliveryAttempt> EmailDeliveryAttempts => Set<EmailDeliveryAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HireSphereDbContext).Assembly);

        if (Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
        {
            modelBuilder.Entity<JobPosting>().Property(p => p.RowVersion).IsConcurrencyToken(false);
            modelBuilder.Entity<SimulationSession>().Property(p => p.RowVersion).IsConcurrencyToken(false);
        }
    }
}
