using FluentAssertions;
using Xunit;
using HireSphere.Application.DTOs.Profile;
using HireSphere.Application.Services;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Tests.Unit;

public class CandidateProfileServiceTests
{
    [Fact]
    public async Task GetProfileAsync_ExistingProfile_ReturnsDto()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "jane.dev@example.com",
            NormalizedEmail = "JANE.DEV@EXAMPLE.COM",
            FirstName = "Jane",
            LastName = "Developer",
            SecurityStamp = "sec-stamp-1",
            AccountStatus = AccountStatus.Active
        };
        var profile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Headline = "Full Stack Engineer",
            Summary = "Experienced in C# and TypeScript",
            Location = "Berlin, Germany",
            YearsOfExperience = 5
        };
        context.Users.Add(user);
        context.CandidateProfiles.Add(profile);
        await context.SaveChangesAsync();

        var service = new CandidateProfileService(context);

        // Act
        var result = await service.GetProfileAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(user.Id);
        result.Headline.Should().Be("Full Stack Engineer");
        result.YearsOfExperience.Should().Be(5);
        result.Email.Should().Be("jane.dev@example.com");
    }

    [Fact]
    public async Task GetProfileAsync_NonExistentUser_ThrowsNotFoundException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var service = new CandidateProfileService(context);

        // Act
        var act = async () => await service.GetProfileAsync(Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateProfileAsync_ValidUpdate_PersistsChanges()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "candidate@hiresphere.local",
            NormalizedEmail = "CANDIDATE@HIRESPHERE.LOCAL",
            FirstName = "Alice",
            LastName = "Smith",
            SecurityStamp = "sec-stamp-2",
            AccountStatus = AccountStatus.Active
        };
        var profile = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Headline = "Junior Developer",
            Location = "Remote"
        };
        context.Users.Add(user);
        context.CandidateProfiles.Add(profile);
        await context.SaveChangesAsync();

        var service = new CandidateProfileService(context);
        var updateRequest = new UpdateCandidateProfileRequest(
            FirstName: "Alicia",
            LastName: "Smith-Jones",
            Headline: "Mid-level Full Stack Developer",
            Summary: "Specialized in cloud distributed systems",
            Location: "Manchester, UK",
            YearsOfExperience: 3,
            LinkedInUrl: "https://linkedin.com/in/aliciasmith",
            GitHubUrl: "https://github.com/aliciasmith",
            PortfolioUrl: "https://aliciasmith.dev");

        // Act
        var result = await service.UpdateProfileAsync(user.Id, updateRequest);

        // Assert
        result.Should().NotBeNull();
        result.FirstName.Should().Be("Alicia");
        result.LastName.Should().Be("Smith-Jones");
        result.Headline.Should().Be("Mid-level Full Stack Developer");
        result.YearsOfExperience.Should().Be(3);
        result.LinkedInUrl.Should().Be("https://linkedin.com/in/aliciasmith");

        var updatedEntity = context.CandidateProfiles.First(cp => cp.UserId == user.Id);
        updatedEntity.Headline.Should().Be("Mid-level Full Stack Developer");
        updatedEntity.User.FirstName.Should().Be("Alicia");
    }
}
