using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Infrastructure.Persistence;
using HireSphere.Infrastructure.Services;

namespace HireSphere.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment? environment = null)
    {
        var dbProvider = configuration.GetValue<string>("DatabaseProvider");
        if (string.Equals(dbProvider, "InMemory", StringComparison.OrdinalIgnoreCase))
        {
            var inMemoryDbName = configuration.GetValue<string>("InMemoryDatabaseName") ?? "HireSphereTestDb";
            services.AddDbContext<HireSphereDbContext>(options =>
            {
                options.UseInMemoryDatabase(inMemoryDbName);
                options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning));
            });
        }
        else
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? "Server=.\\SQLEXPRESS;Database=HireSphereDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;";

            // Strict discipline: No Database.Migrate() or EnsureCreated()
            services.AddDbContext<HireSphereDbContext>(options =>
            {
                options.UseSqlServer(connectionString, sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
                });
            });
        }

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<HireSphereDbContext>());

        // JWT Options configuration
        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(jwtSection);
        var jwtOptions = jwtSection.Get<JwtOptions>() ?? new JwtOptions();

        // Core security & storage services
        services.AddHttpContextAccessor();
        services.AddSingleton<IPasswordHasherService, PasswordHasherService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddSingleton<ICvStorageService, LocalCvStorageService>();
        services.AddSingleton<IMalwareScanner, NullMalwareScanner>();
        services.AddSingleton<IDocumentParsingService, DocumentParsingService>();
        services.AddScoped<IEmailService, DevLoggingEmailService>();
        services.AddHostedService<AssessmentDeadlineBackgroundService>();

        // JWT Authentication registration
        var isProduction = environment?.IsProduction() ?? string.Equals(configuration["ASPNETCORE_ENVIRONMENT"], "Production", StringComparison.OrdinalIgnoreCase);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = isProduction;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
                ClockSkew = TimeSpan.FromMinutes(1)
            };

            // Server-side account status and security stamp validation: reject suspended, deleted, or revoked sessions
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var db = context.HttpContext.RequestServices.GetRequiredService<IApplicationDbContext>();
                    var userIdClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? context.Principal?.FindFirst("sub")?.Value;

                    if (Guid.TryParse(userIdClaim, out var userId))
                    {
                        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                        if (user == null || user.AccountStatus == Domain.Enums.AccountStatus.Disabled || user.IsDeleted)
                        {
                            context.Fail("User account has been disabled or suspended.");
                            return;
                        }

                        var stampClaim = context.Principal?.FindFirst("security_stamp")?.Value;
                        if (!string.IsNullOrEmpty(stampClaim) && user.SecurityStamp != stampClaim)
                        {
                            context.Fail("User credentials or security stamp have changed.");
                        }
                    }
                }
            };
        });

        return services;
    }
}
