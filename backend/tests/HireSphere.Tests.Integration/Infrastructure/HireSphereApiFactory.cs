using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Auth;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Infrastructure.Persistence;

namespace HireSphere.Tests.Integration.Infrastructure;

public class HireSphereApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName;

    public HireSphereApiFactory()
    {
        _databaseName = Guid.NewGuid().ToString("N");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("DatabaseProvider", "InMemory");
        builder.UseSetting("InMemoryDatabaseName", _databaseName);

        builder.ConfigureServices(services =>
        {
            // Remove background hosted services to keep tests deterministic and quiet
            var hostedServices = services.Where(d => d.ServiceType == typeof(IHostedService)).ToList();
            foreach (var hs in hostedServices)
            {
                services.Remove(hs);
            }
        });
    }

    /// <summary>
    /// Executes an isolated action with a scoped DbContext.
    /// </summary>
    public async Task ExecuteDbContextAsync(Func<HireSphereDbContext, Task> action)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HireSphereDbContext>();
        await action(db);
    }

    /// <summary>
    /// Executes an isolated function with a scoped DbContext and returns a result.
    /// </summary>
    public async Task<T> ExecuteDbContextAsync<T>(Func<HireSphereDbContext, Task<T>> func)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HireSphereDbContext>();
        return await func(db);
    }

    /// <summary>
    /// Pre-seeds a default JobCategory if not already present.
    /// </summary>
    public async Task<JobCategory> EnsureDefaultCategoryAsync(string name = "Software Engineering")
    {
        return await ExecuteDbContextAsync(async db =>
        {
            var category = await db.JobCategories.FirstOrDefaultAsync(c => c.Name == name);
            if (category == null)
            {
                category = new JobCategory
                {
                    Name = name,
                    Slug = name.ToLowerInvariant().Replace(" ", "-"),
                    Description = $"{name} job category",
                    DisplayOrder = 1
                };
                db.JobCategories.Add(category);
                await db.SaveChangesAsync();
            }
            return category;
        });
    }

    /// <summary>
    /// Pre-seeds a platform SuperAdmin account with password.
    /// </summary>
    public async Task<(User User, string Token)> SeedSuperAdminAsync(
        string email = "superadmin@platform.local",
        string password = "AdminPassword123!")
    {
        return await ExecuteDbContextAsync(async db =>
        {
            using var scope = Services.CreateScope();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasherService>();
            var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

            var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.NormalizedName == PlatformRoles.SuperAdmin.ToUpperInvariant());
            if (adminRole == null)
            {
                adminRole = new Role
                {
                    Name = PlatformRoles.SuperAdmin,
                    NormalizedName = PlatformRoles.SuperAdmin.ToUpperInvariant(),
                    Description = "Platform Super Administrator"
                };
                db.Roles.Add(adminRole);
                await db.SaveChangesAsync();
            }

            var adminUser = await db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == email.ToUpperInvariant());
            if (adminUser == null)
            {
                adminUser = new User
                {
                    Email = email,
                    NormalizedEmail = email.ToUpperInvariant(),
                    FirstName = "Platform",
                    LastName = "SuperAdmin",
                    AccountStatus = AccountStatus.Active,
                    SecurityStamp = Guid.NewGuid().ToString("N"),
                    PasswordHash = hasher.HashPassword(password),
                    CreatedAtUtc = DateTimeOffset.UtcNow
                };
                adminUser.UserRoles.Add(new UserRole
                {
                    UserId = adminUser.Id,
                    RoleId = adminRole.Id,
                    AssignedAtUtc = DateTimeOffset.UtcNow
                });
                db.Users.Add(adminUser);
                await db.SaveChangesAsync();
            }

            var token = tokenService.GenerateAccessToken(adminUser, new[] { PlatformRoles.SuperAdmin });
            return (adminUser, token);
        });
    }

    /// <summary>
    /// Creates an authenticated HttpClient using a Bearer token.
    /// </summary>
    public HttpClient CreateClientWithToken(string token)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
