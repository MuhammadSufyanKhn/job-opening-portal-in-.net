using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using HireSphere.Api.Authorization;
using HireSphere.Api.Middleware;
using HireSphere.Application;
using HireSphere.Infrastructure;
using HireSphere.Infrastructure.Configuration;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Layers to DI
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration, builder.Environment);

// 2. Add Authorization Handlers
builder.Services.AddScoped<IAuthorizationHandler, CompanyRoleHandler>();

// 3. Add Controllers & OpenAPI
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// 4. Reverse Proxy & Forwarded Headers
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// 5. Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? (builder.Environment.IsDevelopment()
        ? new[] { "http://localhost:5173", "http://localhost:3000" }
        : Array.Empty<string>());

// Fail-fast validation in production
if (builder.Environment.IsProduction())
{
    ProductionConfigurationValidator.Validate(builder.Configuration, allowedOrigins);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendClient", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// 6. HTTP Request Pipeline
app.UseForwardedHeaders();

// Security Headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "SAMEORIGIN");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("X-XSS-Protection", "0");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
});

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("FrontendClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 7. Safe Health Check endpoint
app.MapGet("/api/health", async (
    HireSphere.Infrastructure.Persistence.HireSphereDbContext dbContext,
    IConfiguration configuration,
    IWebHostEnvironment env) =>
{
    var dbProvider = configuration.GetValue<string>("DatabaseProvider");
    if (string.Equals(dbProvider, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        return Results.Ok(new { status = "Healthy", database = "InMemory", timestampUtc = DateTimeOffset.UtcNow });
    }

    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        if (env.IsDevelopment())
        {
            var conn = dbContext.Database.GetDbConnection();
            return canConnect
                ? Results.Ok(new { status = "Healthy", database = "Connected", server = conn.DataSource, databaseName = conn.Database, timestampUtc = DateTimeOffset.UtcNow })
                : Results.Json(new { status = "Degraded", database = "Unavailable", server = conn.DataSource, databaseName = conn.Database, timestampUtc = DateTimeOffset.UtcNow }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        // Production output: zero infrastructure/connection leakage
        return canConnect
            ? Results.Ok(new { status = "Healthy", database = "Connected", timestampUtc = DateTimeOffset.UtcNow })
            : Results.Json(new { status = "Degraded", database = "Unavailable", timestampUtc = DateTimeOffset.UtcNow }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch
    {
        return Results.Json(new { status = "Degraded", database = "Unavailable", timestampUtc = DateTimeOffset.UtcNow }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

// Strict adherence to database discipline:
// No Database.Migrate() or Database.EnsureCreated() calls.
// All schema modifications are executed manually by the administrator in SSMS.

// Controlled non-blocking startup diagnostic
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var dbProvider = app.Configuration.GetValue<string>("DatabaseProvider");
    if (!string.Equals(dbProvider, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HireSphere.Infrastructure.Persistence.HireSphereDbContext>();
            var canConnect = await dbContext.Database.CanConnectAsync();
            var conn = dbContext.Database.GetDbConnection();
            if (canConnect)
            {
                logger.LogInformation("Database connectivity verified: successfully connected to database '{Database}' on server '{DataSource}'.", conn.Database, conn.DataSource);
            }
            else
            {
                logger.LogWarning("Database connectivity check failed: unable to connect to database '{Database}' on server '{DataSource}'. Ensure SQL Server is running and database exists in SSMS.", conn.Database, conn.DataSource);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning("Database connectivity probe failed during startup: {Message}. The API will start, but database operations may fail until the SQL Server instance is reachable.", ex.Message);
        }
    }
}

app.Run();

// Make Program public for WebApplicationFactory integration tests
public partial class Program { }
