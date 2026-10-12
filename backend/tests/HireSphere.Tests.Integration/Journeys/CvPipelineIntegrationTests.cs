using System.Net;
using System.Net.Http.Headers;
using System.Text;
using FluentAssertions;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Application.DTOs.Document;
using HireSphere.Tests.Integration.Infrastructure;
using Xunit;

namespace HireSphere.Tests.Integration.Journeys;

public class CvPipelineIntegrationTests : IClassFixture<HireSphereApiFactory>
{
    private readonly HireSphereApiFactory _factory;
    private readonly HttpClient _client;

    public CvPipelineIntegrationTests(HireSphereApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(HttpClient Client, UserResponse User, string Token)> RegisterCandidateAsync(string name)
    {
        var email = $"cand_{name.ToLowerInvariant()}_{Guid.NewGuid():N}@cvtest.local";
        var reg = new RegisterCandidateRequest(email, "StrongPass123!", name, "Tester", null, null, null);
        var resp = await _client.PostAsJsonAsync("/api/auth/register-candidate", reg);
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await resp.ReadJsonAsync<AuthResponse>();
        var client = _factory.CreateClientWithToken(auth!.AccessToken);
        return (client, auth.User, auth.AccessToken);
    }

    [Fact]
    public async Task UploadCv_WithUnsupportedExtension_ReturnsBadRequest()
    {
        // Arrange
        var (candidateClient, _, _) = await RegisterCandidateAsync("Alice");

        using var content = new MultipartFormDataContent();
        var fakeBytes = Encoding.UTF8.GetBytes("MZ executable header mock");
        var fileContent = new ByteArrayContent(fakeBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileContent, "file", "malicious_script.exe");

        // Act
        var response = await candidateClient.PostAsync("/api/candidate/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UploadCv_WithPdfExtension_ButInvalidMagicBytes_ReturnsBadRequest()
    {
        // Arrange
        var (candidateClient, _, _) = await RegisterCandidateAsync("Bob");

        using var content = new MultipartFormDataContent();
        var fakeBytes = Encoding.UTF8.GetBytes("THIS IS PLAIN TEXT NOT A REAL PDF FILE FORMAT");
        var fileContent = new ByteArrayContent(fakeBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "fake_resume.pdf");

        // Act
        var response = await candidateClient.PostAsync("/api/candidate/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UploadCv_WithEmptyFile_ReturnsBadRequest()
    {
        // Arrange
        var (candidateClient, _, _) = await RegisterCandidateAsync("Charlie");

        using var content = new MultipartFormDataContent();
        var emptyBytes = Array.Empty<byte>();
        var fileContent = new ByteArrayContent(emptyBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "empty_resume.pdf");

        // Act
        var response = await candidateClient.PostAsync("/api/candidate/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CandidateB_CannotDownloadCandidateA_PrivateCv()
    {
        // Arrange
        var (clientA, _, _) = await RegisterCandidateAsync("CandidateA");
        var (clientB, _, _) = await RegisterCandidateAsync("CandidateB");

        // Candidate A uploads valid PDF
        var validPdf = Encoding.UTF8.GetBytes("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>%%EOF");
        using var contentA = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(validPdf);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        contentA.Add(fileContent, "file", "CandidateA_Resume.pdf");

        var uploadResp = await clientA.PostAsync("/api/candidate/documents", contentA);
        uploadResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var docA = await uploadResp.ReadJsonAsync<CandidateDocumentDetailDto>();
        docA.Should().NotBeNull();

        // Candidate A can download their own document
        var selfDownload = await clientA.GetAsync($"/api/candidate/documents/{docA!.Id}/download");
        selfDownload.StatusCode.Should().Be(HttpStatusCode.OK);

        // Act - Candidate B attempts to download Candidate A's CV
        var crossDownload = await clientB.GetAsync($"/api/candidate/documents/{docA.Id}/download");

        // Assert - Unauthorized or NotFound to prevent discovery of private document IDs
        crossDownload.StatusCode.Should().Match(code => code == HttpStatusCode.NotFound || code == HttpStatusCode.Forbidden);
    }
}
