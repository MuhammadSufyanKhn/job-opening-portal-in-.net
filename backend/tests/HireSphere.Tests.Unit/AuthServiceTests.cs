using FluentAssertions;
using Moq;
using Xunit;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class AuthServiceTests
{
    private readonly Mock<IPasswordHasherService> _passwordHasherMock = new();
    private readonly Mock<ITokenService> _tokenServiceMock = new();
    private readonly Mock<IAuditService> _auditServiceMock = new();

    public AuthServiceTests()
    {
        _passwordHasherMock.Setup(p => p.HashPassword(It.IsAny<string>())).Returns("hashed_password_123");
        _passwordHasherMock.Setup(p => p.VerifyPassword(It.IsAny<string>(), It.IsAny<string>()))
            .Returns((string hash, string provided) => provided == "CorrectPassword123!");

        _tokenServiceMock.Setup(t => t.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<string>>(), It.IsAny<Guid?>(), It.IsAny<string?>()))
            .Returns("jwt_access_token_xyz");
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken()).Returns("raw_refresh_token_abc");
        _tokenServiceMock.Setup(t => t.HashToken(It.IsAny<string>())).Returns((string t) => $"hash_{t}");
    }

    [Fact]
    public async Task RegisterCandidate_ValidRequest_CreatesUserAndProfile()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var service = new AuthService(context, _passwordHasherMock.Object, _tokenServiceMock.Object, _auditServiceMock.Object);

        var request = new RegisterCandidateRequest(
            Email: "john.doe@example.com",
            Password: "SecurePassword123!",
            FirstName: "John",
            LastName: "Doe",
            Headline: "Senior .NET Engineer",
            Location: "London, UK");

        // Act
        var result = await service.RegisterCandidateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("jwt_access_token_xyz");
        result.User.Email.Should().Be("john.doe@example.com");
        result.User.Roles.Should().Contain(PlatformRoles.Candidate);

        var userInDb = context.Users.FirstOrDefault(u => u.Email == "john.doe@example.com");
        userInDb.Should().NotBeNull();
        userInDb!.AccountStatus.Should().Be(AccountStatus.Active);

        var profileInDb = context.CandidateProfiles.FirstOrDefault(cp => cp.UserId == userInDb.Id);
        profileInDb.Should().NotBeNull();
        profileInDb!.Headline.Should().Be("Senior .NET Engineer");
    }

    [Fact]
    public async Task RegisterCandidate_DuplicateEmail_ThrowsConflictException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        context.Users.Add(new User
        {
            Email = "existing@example.com",
            NormalizedEmail = "EXISTING@EXAMPLE.COM",
            FirstName = "Existing",
            LastName = "User",
            PasswordHash = "hash"
        });
        await context.SaveChangesAsync();

        var service = new AuthService(context, _passwordHasherMock.Object, _tokenServiceMock.Object, _auditServiceMock.Object);

        var request = new RegisterCandidateRequest(
            Email: "existing@example.com",
            Password: "SecurePassword123!",
            FirstName: "New",
            LastName: "User");

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => service.RegisterCandidateAsync(request));
    }

    [Fact]
    public async Task RegisterCompany_ValidRequest_CreatesCompanyAsPendingAndSetsOwner()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var service = new AuthService(context, _passwordHasherMock.Object, _tokenServiceMock.Object, _auditServiceMock.Object);

        var request = new RegisterCompanyRequest(
            CompanyName: "Acme Corp",
            Industry: "FinTech",
            ContactEmail: "contact@acme.com",
            BusinessRegistrationNumber: "REG-9999",
            WebsiteUrl: "https://acme.com",
            Description: "Leading financial infrastructure",
            OwnerFirstName: "Alice",
            OwnerLastName: "Smith",
            OwnerEmail: "alice@acme.com",
            OwnerPassword: "SecurePassword123!");

        // Act
        var result = await service.RegisterCompanyAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.User.Email.Should().Be("alice@acme.com");
        result.User.Roles.Should().Contain(PlatformRoles.CompanyMember);

        var companyInDb = context.Companies.FirstOrDefault(c => c.Name == "Acme Corp");
        companyInDb.Should().NotBeNull();
        companyInDb!.ApprovalStatus.Should().Be(CompanyApprovalStatus.PendingApproval);

        var memberInDb = context.CompanyMembers.FirstOrDefault(cm => cm.CompanyId == companyInDb.Id);
        memberInDb.Should().NotBeNull();
        memberInDb!.CompanyRole.Should().Be(CompanyRole.Owner);
        memberInDb.MembershipStatus.Should().Be(CompanyMembershipStatus.Active);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = new User
        {
            Email = "user@example.com",
            NormalizedEmail = "USER@EXAMPLE.COM",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hashed",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AuthService(context, _passwordHasherMock.Object, _tokenServiceMock.Object, _auditServiceMock.Object);

        // Act
        var result = await service.LoginAsync(new LoginRequest("user@example.com", "CorrectPassword123!"));

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("jwt_access_token_xyz");
    }

    [Fact]
    public async Task Login_InvalidPassword_ThrowsUnauthorizedException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = new User
        {
            Email = "user@example.com",
            NormalizedEmail = "USER@EXAMPLE.COM",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hashed",
            AccountStatus = AccountStatus.Active
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AuthService(context, _passwordHasherMock.Object, _tokenServiceMock.Object, _auditServiceMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            service.LoginAsync(new LoginRequest("user@example.com", "WrongPassword!")));
    }

    [Fact]
    public async Task Login_DisabledAccount_ThrowsAccountLockedException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = new User
        {
            Email = "locked@example.com",
            NormalizedEmail = "LOCKED@EXAMPLE.COM",
            FirstName = "Locked",
            LastName = "User",
            PasswordHash = "hashed",
            AccountStatus = AccountStatus.Disabled
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AuthService(context, _passwordHasherMock.Object, _tokenServiceMock.Object, _auditServiceMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<AccountLockedException>(() =>
            service.LoginAsync(new LoginRequest("locked@example.com", "CorrectPassword123!")));
    }
}
