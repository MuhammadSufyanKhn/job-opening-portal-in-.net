using Microsoft.Extensions.Configuration;

namespace HireSphere.Infrastructure.Configuration;

/// <summary>
/// Enforces fail-fast configuration security rules when running in Production environment.
/// Prevents the application from starting with development keys, insecure connection strings,
/// or overly permissive CORS policies.
/// </summary>
public static class ProductionConfigurationValidator
{
    public static void Validate(IConfiguration configuration, IEnumerable<string>? allowedOrigins)
    {
        // 1. Validate JWT Secret Key
        var jwtKey = configuration["Jwt:SecretKey"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException(
                "CRITICAL SECURITY CONFIGURATION ERROR: Production startup aborted. " +
                "Jwt:SecretKey is missing. A secure signing key must be supplied via the 'Jwt__SecretKey' environment variable or secret manager.");
        }

        if (jwtKey.Length < 32)
        {
            throw new InvalidOperationException(
                "CRITICAL SECURITY CONFIGURATION ERROR: Production startup aborted. " +
                $"Jwt:SecretKey length ({jwtKey.Length} characters) is insufficient for HMAC-SHA256 signatures. Minimum required length is 32 characters (256 bits).");
        }

        if (jwtKey.Contains("Development_Super_Secret_Key", StringComparison.OrdinalIgnoreCase) ||
            jwtKey.Contains("Default_Development_SecretKey", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "CRITICAL SECURITY CONFIGURATION ERROR: Production startup aborted. " +
                "A default development JWT signing key was detected. A cryptographically unique production key must be provided.");
        }

        // 2. Validate SQL Server Database Connection String
        var dbConn = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(dbConn))
        {
            throw new InvalidOperationException(
                "CRITICAL DATABASE CONFIGURATION ERROR: Production startup aborted. " +
                "ConnectionStrings:DefaultConnection is missing. Configure a valid SQL Server connection string via 'ConnectionStrings__DefaultConnection'.");
        }

        // 3. Validate Production CORS Allowed Origins
        var originsList = allowedOrigins?.ToList() ?? new List<string>();
        if (originsList.Count == 0)
        {
            throw new InvalidOperationException(
                "CRITICAL CORS CONFIGURATION ERROR: Production startup aborted. " +
                "Cors:AllowedOrigins is empty. Explicit production frontend origins must be configured.");
        }

        if (originsList.Any(o => o.Trim() == "*"))
        {
            throw new InvalidOperationException(
                "CRITICAL CORS CONFIGURATION ERROR: Production startup aborted. " +
                "Wildcard origin ('*') is prohibited in production when credentials are enabled. Configure explicit domain origins.");
        }
    }
}
