using Microsoft.AspNetCore.Authorization;
using HireSphere.Api.Authorization;
using HireSphere.Api.Middleware;
using HireSphere.Application;
using HireSphere.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Layers to DI
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Add Authorization Handlers
builder.Services.AddScoped<IAuthorizationHandler, CompanyRoleHandler>();

// 3. Add Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// 4. Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendClient", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 5. HTTP Request Pipeline
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

// Strict adherence to database discipline:
// No Database.Migrate() or Database.EnsureCreated() calls.
// All schema modifications are executed manually by the administrator in SSMS.

app.Run();

// Make Program public for WebApplicationFactory integration tests
public partial class Program { }
