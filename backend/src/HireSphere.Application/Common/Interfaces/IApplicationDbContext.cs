using Microsoft.EntityFrameworkCore;
using HireSphere.Domain.Entities;

namespace HireSphere.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Company> Companies { get; }
    DbSet<CompanyMember> CompanyMembers { get; }
    DbSet<CompanyInvitation> CompanyInvitations { get; }
    DbSet<CandidateProfile> CandidateProfiles { get; }
    DbSet<AuditLog> AuditLogs { get; }

    DbSet<JobCategory> JobCategories { get; }
    DbSet<JobPosting> JobPostings { get; }
    DbSet<JobRequirement> JobRequirements { get; }
    DbSet<JobDescriptionVersion> JobDescriptionVersions { get; }
    DbSet<CandidateDocument> CandidateDocuments { get; }
    DbSet<JobApplication> JobApplications { get; }
    DbSet<ApplicationStatusHistory> ApplicationStatusHistories { get; }
    DbSet<CandidateNote> CandidateNotes { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
