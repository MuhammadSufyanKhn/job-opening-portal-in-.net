using FluentAssertions;
using Moq;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Admin;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class AdminDashboardAndOperationsTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();
    private readonly Mock<INotificationService> _notificationServiceMock = new();

    #region Dashboard Tests

    [Fact]
    public async Task GetDashboardStats_CalculatesRealDataAcrossAllEntities()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();

        // Seed roles & users
        var superAdminRole = new Role { Name = "SuperAdmin", NormalizedName = "SUPERADMIN" };
        var candidateRole = new Role { Name = "Candidate", NormalizedName = "CANDIDATE" };
        context.Roles.AddRange(superAdminRole, candidateRole);

        var adminUser = new User { Email = "admin@platform.com", FirstName = "Platform", LastName = "Admin" };
        adminUser.UserRoles.Add(new UserRole { User = adminUser, Role = superAdminRole });

        var candUser = new User { Email = "cand@test.com", FirstName = "John", LastName = "Doe" };
        candUser.UserRoles.Add(new UserRole { User = candUser, Role = candidateRole });
        var candidateProfile = new CandidateProfile { User = candUser, Headline = ".NET Developer" };

        context.Users.AddRange(adminUser, candUser);
        context.CandidateProfiles.Add(candidateProfile);

        // Seed company
        var company = new Company { Name = "Acme Corp", Slug = "acme-corp", ApprovalStatus = CompanyApprovalStatus.Approved };
        context.Companies.Add(company);

        // Seed jobs
        var job1 = new JobPosting { Company = company, Title = "C# Engineer", Status = JobPostingStatus.Published };
        var job2 = new JobPosting { Company = company, Title = "React Dev", Status = JobPostingStatus.Draft };
        context.JobPostings.AddRange(job1, job2);

        // Seed application & assessment
        var app = new JobApplication { JobPosting = job1, CandidateProfile = candidateProfile };
        var assignment = new AssessmentAssignment { JobApplication = app, CandidateProfile = candidateProfile, Company = company, Status = AssessmentAssignmentStatus.Completed };
        var result = new AssessmentResult { TotalScore = 88.5m };
        var session = new SimulationSession { AssessmentAssignment = assignment, CandidateProfile = candidateProfile, Status = SimulationSessionStatus.Submitted, AssessmentResult = result };
        assignment.Sessions.Add(session);

        context.JobApplications.Add(app);
        context.AssessmentAssignments.Add(assignment);
        context.AssessmentResults.Add(result);

        // Seed audit log
        context.AuditLogs.Add(new AuditLog
        {
            ActorUser = adminUser,
            Company = company,
            ActionType = "CompanyApproved",
            TargetResource = "Company",
            TargetResourceId = company.Id.ToString()
        });

        await context.SaveChangesAsync();

        var service = new AdminDashboardService(context);

        // Act
        var stats = await service.GetDashboardStatsAsync();

        // Assert
        stats.TotalUsers.Should().Be(2);
        stats.TotalSuperAdmins.Should().Be(1);
        stats.TotalCandidates.Should().Be(1);
        stats.TotalCompanies.Should().Be(1);
        stats.ApprovedCompanies.Should().Be(1);
        stats.PendingCompanies.Should().Be(0);
        stats.TotalJobs.Should().Be(2);
        stats.PublishedJobs.Should().Be(1);
        stats.DraftJobs.Should().Be(1);
        stats.TotalApplications.Should().Be(1);
        stats.WorkSimTotalAssignments.Should().Be(1);
        stats.WorkSimCompletedAssessments.Should().Be(1);
        stats.WorkSimAverageScore.Should().Be(88.5m);
        stats.RecentActivity.Should().HaveCount(1);
        stats.RecentActivity[0].ActionType.Should().Be("CompanyApproved");
        stats.RecentActivity[0].ActorName.Should().Be("Platform Admin");
    }

    #endregion

    #region User Management Tests

    [Fact]
    public async Task GetUsersAsync_ReturnsPaginatedUsersWithSearch()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();

        var u1 = new User { Email = "alice@example.com", FirstName = "Alice", LastName = "Smith" };
        var u2 = new User { Email = "bob@example.com", FirstName = "Bob", LastName = "Jones" };
        context.Users.AddRange(u1, u2);
        await context.SaveChangesAsync();

        var service = new AdminUserService(context, _auditServiceMock.Object);

        var result = await service.GetUsersAsync(search: "alice", page: 1, pageSize: 10);

        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items[0].Email.Should().Be("alice@example.com");
    }

    [Fact]
    public async Task SuspendUser_UpdatesStatusToDisabled_AndRecordsAudit()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var user = new User { Email = "violator@example.com", FirstName = "Bad", LastName = "User", AccountStatus = AccountStatus.Active };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AdminUserService(context, _auditServiceMock.Object);

        await service.SuspendUserAsync(user.Id, adminId, "Terms of service violation");

        var updated = await context.Users.FindAsync(user.Id);
        updated!.AccountStatus.Should().Be(AccountStatus.Disabled);

        _auditServiceMock.Verify(a => a.LogAsync(
            "UserSuspended",
            "User",
            user.Id.ToString(),
            It.IsAny<Guid?>(),
            It.IsAny<object?>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SuspendUser_RejectsSuspension_WhenUserIsLastActiveSuperAdmin()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var adminRole = new Role { Name = "SuperAdmin", NormalizedName = "SUPERADMIN" };
        context.Roles.Add(adminRole);

        var superAdmin = new User { Email = "soleadmin@platform.com", FirstName = "Sole", LastName = "Admin", AccountStatus = AccountStatus.Active };
        superAdmin.UserRoles.Add(new UserRole { User = superAdmin, Role = adminRole });
        context.Users.Add(superAdmin);
        await context.SaveChangesAsync();

        var service = new AdminUserService(context, _auditServiceMock.Object);

        // Attempt to suspend sole superadmin
        var act = async () => await service.SuspendUserAsync(superAdmin.Id, superAdmin.Id, "Accidental suspension");

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*prevent system lockout*");
    }

    [Fact]
    public async Task ReactivateUser_UpdatesStatusToActive()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var user = new User { Email = "reformed@example.com", FirstName = "Good", LastName = "User", AccountStatus = AccountStatus.Disabled };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AdminUserService(context, _auditServiceMock.Object);

        await service.ReactivateUserAsync(user.Id, adminId);

        var updated = await context.Users.FindAsync(user.Id);
        updated!.AccountStatus.Should().Be(AccountStatus.Active);
    }

    #endregion

    #region Job Moderation Tests

    [Fact]
    public async Task SuspendJob_SetsStatusToSuspended_RecordsReason_AndNotifiesCompany()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();

        var company = new Company { Name = "Shady Corp", Slug = "shady-corp" };
        var recruiterUser = new User { Email = "recruiter@shady.com", FirstName = "Rick", LastName = "Recruiter" };
        company.Members.Add(new CompanyMember { User = recruiterUser, CompanyRole = CompanyRole.Owner, MembershipStatus = CompanyMembershipStatus.Active });

        var job = new JobPosting
        {
            Company = company,
            Title = "Unrealistic Salary Job",
            Status = JobPostingStatus.Published
        };

        context.Companies.Add(company);
        context.Users.Add(recruiterUser);
        context.JobPostings.Add(job);
        await context.SaveChangesAsync();

        var service = new AdminJobService(context, _auditServiceMock.Object, _notificationServiceMock.Object);

        // Act
        await service.SuspendJobAsync(job.Id, adminId, "Misleading job description and unverified salary");

        // Assert
        var updated = await context.JobPostings.FindAsync(job.Id);
        updated!.Status.Should().Be(JobPostingStatus.Suspended);
        updated.ModerationReason.Should().Be("Misleading job description and unverified salary");
        updated.ModeratedByUserId.Should().Be(adminId);
        updated.ModeratedAtUtc.Should().NotBeNull();

        _auditServiceMock.Verify(a => a.LogAsync(
            "JobModerationSuspended",
            "JobPosting",
            job.Id.ToString(),
            company.Id,
            It.IsAny<object?>(),
            It.IsAny<CancellationToken>()), Times.Once);

        _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
            recruiterUser.Id,
            "JobModerated",
            "Job Listing Suspended",
            It.Is<string>(m => m.Contains("Misleading job description")),
            "/company/jobs",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RestoreJob_RestoresPublishedStatus_AndClearsReason()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();

        var company = new Company { Name = "Reformed Corp", Slug = "reformed-corp" };
        var recruiterUser = new User { Email = "recruiter@reformed.com", FirstName = "Rick", LastName = "Recruiter" };
        company.Members.Add(new CompanyMember { User = recruiterUser, CompanyRole = CompanyRole.Owner, MembershipStatus = CompanyMembershipStatus.Active });

        var job = new JobPosting
        {
            Company = company,
            Title = "Fixed Job Listing",
            Status = JobPostingStatus.Suspended,
            ModerationReason = "Previous violation fixed"
        };

        context.Companies.Add(company);
        context.Users.Add(recruiterUser);
        context.JobPostings.Add(job);
        await context.SaveChangesAsync();

        var service = new AdminJobService(context, _auditServiceMock.Object, _notificationServiceMock.Object);

        // Act
        await service.RestoreJobAsync(job.Id, adminId);

        // Assert
        var updated = await context.JobPostings.FindAsync(job.Id);
        updated!.Status.Should().Be(JobPostingStatus.Published);
        updated.ModerationReason.Should().BeNull();
    }

    #endregion

    #region Audit Log Tests

    [Fact]
    public async Task GetAuditLogs_ReturnsFilteredPaginatedRecords()
    {
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var admin = new User { Email = "auditor@platform.com", FirstName = "Chief", LastName = "Auditor" };
        context.Users.Add(admin);

        context.AuditLogs.AddRange(
            new AuditLog { ActorUser = admin, ActionType = "UserSuspended", TargetResource = "User", TargetResourceId = "u1" },
            new AuditLog { ActorUser = admin, ActionType = "CompanyApproved", TargetResource = "Company", TargetResourceId = "c1" },
            new AuditLog { ActorUser = admin, ActionType = "JobModerationSuspended", TargetResource = "JobPosting", TargetResourceId = "j1" }
        );
        await context.SaveChangesAsync();

        var service = new AdminAuditService(context);

        var result = await service.GetAuditLogsAsync(actionType: "UserSuspended", page: 1, pageSize: 10);

        result.TotalCount.Should().Be(1);
        result.Items[0].ActionType.Should().Be("UserSuspended");
        result.Items[0].ActorName.Should().Be("Chief Auditor");
    }

    #endregion
}
