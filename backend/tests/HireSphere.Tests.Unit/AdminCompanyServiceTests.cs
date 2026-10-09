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

public class AdminCompanyServiceTests
{
    private readonly Mock<IAuditService> _auditServiceMock = new();

    [Fact]
    public async Task GetPendingCompanies_ReturnsOnlyPendingOrganizations()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        context.Companies.AddRange(
            new Company { Name = "Pending 1", Slug = "pending-1", Industry = "Tech", ContactEmail = "p1@p.com", ApprovalStatus = CompanyApprovalStatus.PendingApproval },
            new Company { Name = "Pending 2", Slug = "pending-2", Industry = "Health", ContactEmail = "p2@p.com", ApprovalStatus = CompanyApprovalStatus.PendingApproval },
            new Company { Name = "Approved 1", Slug = "approved-1", Industry = "Finance", ContactEmail = "a1@a.com", ApprovalStatus = CompanyApprovalStatus.Approved }
        );
        await context.SaveChangesAsync();

        var service = new AdminCompanyService(context, _auditServiceMock.Object);

        // Act
        var result = await service.GetPendingCompaniesAsync();

        // Assert
        result.Should().HaveCount(2);
        result.Select(c => c.Name).Should().Contain(new[] { "Pending 1", "Pending 2" });
    }

    [Fact]
    public async Task ApproveCompany_UpdatesStatusToApprovedAndRecordsAudit()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company
        {
            Name = "New Startup",
            Slug = "new-startup",
            Industry = "AI",
            ContactEmail = "contact@ai.com",
            ApprovalStatus = CompanyApprovalStatus.PendingApproval
        };
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var adminUserId = Guid.NewGuid();
        var service = new AdminCompanyService(context, _auditServiceMock.Object);

        // Act
        await service.ApproveCompanyAsync(company.Id, adminUserId);

        // Assert
        var companyInDb = context.Companies.Find(company.Id);
        companyInDb.Should().NotBeNull();
        companyInDb!.ApprovalStatus.Should().Be(CompanyApprovalStatus.Approved);
        companyInDb.ApprovedAtUtc.Should().NotBeNull();
        companyInDb.ApprovedByUserId.Should().Be(adminUserId);

        _auditServiceMock.Verify(a => a.LogAsync(
            "CompanyApproved",
            "Company",
            company.Id.ToString(),
            company.Id,
            It.IsAny<object>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RejectCompany_UpdatesStatusToRejectedWithReason()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company
        {
            Name = "Fake Company",
            Slug = "fake-company",
            Industry = "Unknown",
            ContactEmail = "spam@fake.com",
            ApprovalStatus = CompanyApprovalStatus.PendingApproval
        };
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var adminUserId = Guid.NewGuid();
        var service = new AdminCompanyService(context, _auditServiceMock.Object);

        // Act
        await service.RejectCompanyAsync(company.Id, adminUserId, new RejectCompanyRequest("Fraudulent business registration number."));

        // Assert
        var companyInDb = context.Companies.Find(company.Id);
        companyInDb.Should().NotBeNull();
        companyInDb!.ApprovalStatus.Should().Be(CompanyApprovalStatus.Rejected);
        companyInDb.RejectionReason.Should().Be("Fraudulent business registration number.");
    }

    [Fact]
    public async Task SuspendAndRestoreCompany_LifecycleBehavesCorrectly()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var company = new Company
        {
            Name = "Active Org",
            Slug = "active-org",
            Industry = "Security",
            ContactEmail = "sec@org.com",
            ApprovalStatus = CompanyApprovalStatus.Approved
        };
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var adminUserId = Guid.NewGuid();
        var service = new AdminCompanyService(context, _auditServiceMock.Object);

        // Act 1: Suspend
        await service.SuspendCompanyAsync(company.Id, adminUserId, new SuspendCompanyRequest("Terms of service violation."));

        var suspended = context.Companies.Find(company.Id);
        suspended!.ApprovalStatus.Should().Be(CompanyApprovalStatus.Suspended);

        // Act 2: Restore
        await service.RestoreCompanyAsync(company.Id, adminUserId);

        var restored = context.Companies.Find(company.Id);
        restored!.ApprovalStatus.Should().Be(CompanyApprovalStatus.Approved);
        restored.RejectionReason.Should().BeNull();
    }
}
