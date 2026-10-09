using FluentAssertions;
using Moq;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Company;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class CompanyServiceTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();

    [Fact]
    public async Task GetCompanyById_ActiveMember_ReturnsCompany()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company
        {
            Name = "Tech Innovators",
            Slug = "tech-innovators",
            Industry = "Technology",
            ContactEmail = "hr@tech.com",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        var user = new User { Email = "member@tech.com", FirstName = "Jane", LastName = "Doe" };
        context.Companies.Add(company);
        context.Users.Add(user);
        context.CompanyMembers.Add(new CompanyMember
        {
            CompanyId = company.Id,
            UserId = user.Id,
            CompanyRole = CompanyRole.Recruiter,
            MembershipStatus = CompanyMembershipStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new CompanyService(context, _auditServiceMock.Object);

        // Act
        var result = await service.GetCompanyByIdAsync(company.Id, user.Id);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Tech Innovators");
        result.ApprovalStatus.Should().Be(CompanyApprovalStatus.Approved.ToString());
    }

    [Fact]
    public async Task GetCompanyById_NonMember_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company { Name = "Secret Corp", Slug = "secret-corp", Industry = "Defense", ContactEmail = "a@a.com" };
        var outsider = new User { Email = "outsider@other.com", FirstName = "Eve", LastName = "Hacker" };
        context.Companies.Add(company);
        context.Users.Add(outsider);
        await context.SaveChangesAsync();

        var service = new CompanyService(context, _auditServiceMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            service.GetCompanyByIdAsync(company.Id, outsider.Id));
    }

    [Fact]
    public async Task InviteMember_PendingCompany_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company
        {
            Name = "Pending Corp",
            Slug = "pending-corp",
            Industry = "Retail",
            ContactEmail = "contact@pending.com",
            ApprovalStatus = CompanyApprovalStatus.PendingApproval
        };
        var owner = new User { Email = "owner@pending.com", FirstName = "Bob", LastName = "Boss" };
        context.Companies.Add(company);
        context.Users.Add(owner);
        context.CompanyMembers.Add(new CompanyMember
        {
            CompanyId = company.Id,
            UserId = owner.Id,
            CompanyRole = CompanyRole.Owner,
            MembershipStatus = CompanyMembershipStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new CompanyService(context, _auditServiceMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            service.InviteMemberAsync(company.Id, owner.Id, new InviteMemberRequest("new.recruiter@pending.com", "Recruiter")));
    }

    [Fact]
    public async Task InviteMember_ApprovedCompanyByOwner_CreatesInvitation()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company
        {
            Name = "Approved Corp",
            Slug = "approved-corp",
            Industry = "Tech",
            ContactEmail = "contact@approved.com",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        var owner = new User { Email = "owner@approved.com", FirstName = "Bob", LastName = "Boss" };
        context.Companies.Add(company);
        context.Users.Add(owner);
        context.CompanyMembers.Add(new CompanyMember
        {
            CompanyId = company.Id,
            UserId = owner.Id,
            CompanyRole = CompanyRole.Owner,
            MembershipStatus = CompanyMembershipStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new CompanyService(context, _auditServiceMock.Object);

        // Act
        var result = await service.InviteMemberAsync(company.Id, owner.Id, new InviteMemberRequest("recruiter@approved.com", "Recruiter"));

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("recruiter@approved.com");
        result.CompanyRole.Should().Be("Recruiter");

        var invitationInDb = context.CompanyInvitations.FirstOrDefault(ci => ci.CompanyId == company.Id);
        invitationInDb.Should().NotBeNull();
        invitationInDb!.InvitedEmail.Should().Be("recruiter@approved.com");
    }

    [Fact]
    public async Task InviteMember_ByRecruiter_ThrowsForbiddenAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company
        {
            Name = "Approved Corp",
            Slug = "approved-corp",
            Industry = "Tech",
            ContactEmail = "contact@approved.com",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        var recruiter = new User { Email = "recruiter@approved.com", FirstName = "Sarah", LastName = "Hire" };
        context.Companies.Add(company);
        context.Users.Add(recruiter);
        context.CompanyMembers.Add(new CompanyMember
        {
            CompanyId = company.Id,
            UserId = recruiter.Id,
            CompanyRole = CompanyRole.Recruiter, // Not Owner
            MembershipStatus = CompanyMembershipStatus.Active
        });
        await context.SaveChangesAsync();

        var service = new CompanyService(context, _auditServiceMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            service.InviteMemberAsync(company.Id, recruiter.Id, new InviteMemberRequest("another@approved.com", "Recruiter")));
    }
}
