using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Xunit;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Infrastructure.Services;

namespace HireSphere.Tests.Unit;

public class InfrastructureServiceTests
{
    private readonly Xunit.Abstractions.ITestOutputHelper _output;

    public InfrastructureServiceTests(Xunit.Abstractions.ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public void PasswordHasher_InspectSeedHash()
    {
        var hasher = new PasswordHasherService();
        var seedHash = "100000.vQ9+p3w2rT7yK1mN4xZ8wQ==.X7j9K2vL5mN8pQ1rT4wZ6xY9vB2nC5mQ8rT1wZ4xY7A=";
        bool seedVerifies = hasher.VerifyPassword(seedHash, "AdminSecure2026!");
        var realHash = hasher.HashPassword("AdminSecure2026!");
        bool realVerifies = hasher.VerifyPassword(realHash, "AdminSecure2026!");
        realVerifies.Should().BeTrue();
        seedVerifies.Should().BeFalse();
    }

    [Fact]
    public void PasswordHasher_VerifiedAdminSeedHash_VerifiesSuccessfully()
    {
        var hasher = new PasswordHasherService();
        var verifiedAdminHash = "100000.oHPUhsIxo3rTO3fJBU22iA==.dNaNCirI6gB83qTKrajM/q+pazCXB6hpF3zdjQXHshg=";
        bool result = hasher.VerifyPassword(verifiedAdminHash, "AdminSecure2026!");
        result.Should().BeTrue();
    }

    [Fact]
    public void PasswordHasher_EmptyPassword_ThrowsArgumentException()
    {
        var hasher = new PasswordHasherService();
        var act = () => hasher.HashPassword("");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void TokenService_GenerateAccessToken_ContainsExpectedClaims()
    {
        // Arrange
        var options = Options.Create(new JwtOptions
        {
            Issuer = "HireSphereTest",
            Audience = "HireSphereAppTest",
            SecretKey = "SuperSecretDevelopmentSigningKeyWith32Chars!",
            AccessTokenExpirationMinutes = 30
        });

        var tokenService = new TokenService(options);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test.candidate@hiresphere.local",
            NormalizedEmail = "TEST.CANDIDATE@HIRESPHERE.LOCAL",
            FirstName = "Alice",
            LastName = "Wonder",
            SecurityStamp = Guid.NewGuid().ToString(),
            AccountStatus = AccountStatus.Active
        };

        var roles = new[] { PlatformRoles.Candidate };

        // Act
        var jwt = tokenService.GenerateAccessToken(user, roles);

        // Assert
        jwt.Should().NotBeNullOrWhiteSpace();

        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(jwt);

        token.Issuer.Should().Be("HireSphereTest");
        token.Audiences.Should().Contain("HireSphereAppTest");
        token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Email)?.Value.Should().Be("test.candidate@hiresphere.local");
        token.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value.Should().Be(PlatformRoles.Candidate);
    }

    [Fact]
    public void TokenService_GenerateRefreshToken_ReturnsRandomOpaqueString()
    {
        // Arrange
        var options = Options.Create(new JwtOptions());
        var tokenService = new TokenService(options);

        // Act
        var token1 = tokenService.GenerateRefreshToken();
        var token2 = tokenService.GenerateRefreshToken();
        var hash1 = tokenService.HashToken(token1);

        // Assert
        token1.Should().NotBeNullOrWhiteSpace();
        token2.Should().NotBeNullOrWhiteSpace();
        token1.Should().NotBe(token2);
        hash1.Should().NotBeNullOrWhiteSpace();
        hash1.Should().NotBe(token1);
    }

    [Fact]
    public void HireSphereDbContext_ModelValidation_HasNoWarning10622()
    {
        var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<HireSphere.Infrastructure.Persistence.HireSphereDbContext>()
            .UseInMemoryDatabase("TestValidationDb")
            .ConfigureWarnings(w => w.Throw(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning))
            .Options;

        using var context = new HireSphere.Infrastructure.Persistence.HireSphereDbContext(options);
        try
        {
            var _ = context.Model;
        }
        catch (System.InvalidOperationException ex)
        {
            Assert.Fail($"Warning 10622 triggered: {ex.Message}");
        }
    }
}
