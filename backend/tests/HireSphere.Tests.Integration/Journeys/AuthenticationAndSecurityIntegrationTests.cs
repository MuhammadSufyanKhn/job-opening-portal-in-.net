using System.Net;
using FluentAssertions;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Domain.Enums;
using HireSphere.Tests.Integration.Infrastructure;
using Xunit;

namespace HireSphere.Tests.Integration.Journeys;

public class AuthenticationAndSecurityIntegrationTests : IClassFixture<HireSphereApiFactory>
{
    private readonly HireSphereApiFactory _factory;
    private readonly HttpClient _client;

    public AuthenticationAndSecurityIntegrationTests(HireSphereApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RegisterCandidate_WithValidPayload_ReturnsOkAndValidAuthResponse()
    {
        // Arrange
        var request = new RegisterCandidateRequest(
            Email: $"candidate_{Guid.NewGuid():N}@test.local",
            Password: "SecurePassword123!",
            FirstName: "Jane",
            LastName: "Applicant",
            Headline: "Senior .NET Engineer",
            Location: "New York, USA",
            PhoneNumber: "+1234567890");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register-candidate", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var authResponse = await response.ReadJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        authResponse!.AccessToken.Should().NotBeNullOrWhiteSpace();
        authResponse.User.Should().NotBeNull();
        authResponse.User.Email.Should().Be(request.Email.ToLowerInvariant());
        authResponse.User.Roles.Should().Contain(PlatformRoles.Candidate);
    }

    [Fact]
    public async Task RegisterCandidate_WithInvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        var request = new RegisterCandidateRequest(
            Email: "invalid-email-address",
            Password: "SecurePassword123!",
            FirstName: "Jane",
            LastName: "Applicant",
            Headline: "Developer",
            Location: null,
            PhoneNumber: null);

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register-candidate", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RegisterCandidate_WithDuplicateEmail_ReturnsConflict()
    {
        // Arrange
        var email = $"dup_{Guid.NewGuid():N}@test.local";
        var request = new RegisterCandidateRequest(
            Email: email,
            Password: "SecurePassword123!",
            FirstName: "Duplicate",
            LastName: "Candidate",
            Headline: null,
            Location: null,
            PhoneNumber: null);

        var first = await _client.PostAsJsonAsync("/api/auth/register-candidate", request);
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        // Act - Attempt duplicate registration
        var second = await _client.PostAsJsonAsync("/api/auth/register-candidate", request);

        // Assert
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkAndToken()
    {
        // Arrange
        var email = $"login_{Guid.NewGuid():N}@test.local";
        var password = "SecurePassword123!";
        var reg = new RegisterCandidateRequest(email, password, "Bob", "LoginTester", null, null, null);
        await _client.PostAsJsonAsync("/api/auth/register-candidate", reg);

        var loginReq = new LoginRequest(email, password);

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginReq);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.ReadJsonAsync<AuthResponse>();
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.User.Email.Should().Be(email.ToLowerInvariant());
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        // Arrange
        var email = $"wrong_pw_{Guid.NewGuid():N}@test.local";
        var reg = new RegisterCandidateRequest(email, "CorrectPassword123!", "Alice", "WrongPw", null, null, null);
        await _client.PostAsJsonAsync("/api/auth/register-candidate", reg);

        var loginReq = new LoginRequest(email, "WrongPassword123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginReq);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_WithValidToken_Returns200AndUserDetails()
    {
        // Arrange
        var email = $"me_{Guid.NewGuid():N}@test.local";
        var reg = new RegisterCandidateRequest(email, "Password123!", "Current", "User", null, null, null);
        var regResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", reg);
        var authData = await regResp.ReadJsonAsync<AuthResponse>();

        var authClient = _factory.CreateClientWithToken(authData!.AccessToken);

        // Act
        var response = await authClient.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await response.ReadJsonAsync<UserResponse>();
        user.Should().NotBeNull();
        user!.Email.Should().Be(email.ToLowerInvariant());
        user.Roles.Should().Contain(PlatformRoles.Candidate);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutToken_Returns401Unauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedAdminEndpoint_WithCandidateToken_Returns403Forbidden()
    {
        // Arrange
        var email = $"candidate_probe_{Guid.NewGuid():N}@test.local";
        var reg = new RegisterCandidateRequest(email, "Password123!", "Probe", "Candidate", null, null, null);
        var regResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", reg);
        var authData = await regResp.ReadJsonAsync<AuthResponse>();

        var candidateClient = _factory.CreateClientWithToken(authData!.AccessToken);

        // Act - Candidate attempts to access SuperAdmin-only endpoint
        var response = await candidateClient.GetAsync("/api/admin/users");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DisabledUser_ExistingTokenIsRejectedByJwtValidationMiddleware()
    {
        // Arrange
        var email = $"disabled_{Guid.NewGuid():N}@test.local";
        var reg = new RegisterCandidateRequest(email, "Password123!", "Dave", "Disabled", null, null, null);
        var regResp = await _client.PostAsJsonAsync("/api/auth/register-candidate", reg);
        var authData = await regResp.ReadJsonAsync<AuthResponse>();
        var token = authData!.AccessToken;

        // Manually disable the user in the database
        await _factory.ExecuteDbContextAsync(async db =>
        {
            var user = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                db.Users, u => u.NormalizedEmail == email.ToUpperInvariant());
            if (user != null)
            {
                user.AccountStatus = AccountStatus.Disabled;
                await db.SaveChangesAsync();
            }
        });

        // Act - Request using previous token
        var clientWithDisabledUserToken = _factory.CreateClientWithToken(token);
        var response = await clientWithDisabledUserToken.GetAsync("/api/auth/me");

        // Assert - JwtBearerEvents.OnTokenValidated checks AccountStatus and rejects
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RegisterCompany_WithValidPayload_ReturnsOkAndOwnerToken()
    {
        // Arrange
        var request = new RegisterCompanyRequest(
            CompanyName: $"Acme Corp {Guid.NewGuid():N}"[..18],
            Industry: "Technology",
            ContactEmail: $"contact_{Guid.NewGuid():N}@acme.local",
            BusinessRegistrationNumber: "REG-123456",
            WebsiteUrl: "https://acme-test.example.com",
            Description: "Building next-gen platforms",
            OwnerFirstName: "Alice",
            OwnerLastName: "Owner",
            OwnerEmail: $"owner_{Guid.NewGuid():N}@acme-test.example.com",
            OwnerPassword: "SecurePassword123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register-company", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var authResponse = await response.ReadJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        authResponse!.AccessToken.Should().NotBeNullOrWhiteSpace();
        authResponse.User.Companies.Should().NotBeEmpty();
        authResponse.User.Companies.First().CompanyRole.Should().Be(CompanyRole.Owner.ToString());
    }
}
