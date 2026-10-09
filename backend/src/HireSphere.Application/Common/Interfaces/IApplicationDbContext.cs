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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
