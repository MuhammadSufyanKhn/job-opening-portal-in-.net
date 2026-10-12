# Multi-Stage Dockerfile for HireSphere Backend (.NET 10.0)
# =============================================================================
# Build & Publish Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project definitions for optimized caching
COPY HireSphere.slnx ./
COPY src/HireSphere.Domain/HireSphere.Domain.csproj src/HireSphere.Domain/
COPY src/HireSphere.Application/HireSphere.Application.csproj src/HireSphere.Application/
COPY src/HireSphere.Infrastructure/HireSphere.Infrastructure.csproj src/HireSphere.Infrastructure/
COPY src/HireSphere.Api/HireSphere.Api.csproj src/HireSphere.Api/
COPY tests/HireSphere.Tests.Unit/HireSphere.Tests.Unit.csproj tests/HireSphere.Tests.Unit/
COPY tests/HireSphere.Tests.Integration/HireSphere.Tests.Integration.csproj tests/HireSphere.Tests.Integration/

# Restore dependencies
RUN dotnet restore HireSphere.slnx

# Copy complete source code
COPY . .

# Build and Publish API in Release configuration
RUN dotnet publish src/HireSphere.Api/HireSphere.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# =============================================================================
# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install curl for container health check probes
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create persistent storage folder for candidate CVs and set permissions
RUN mkdir -p /app/cv_storage

# Copy published binaries from build stage
COPY --from=build /app/publish .

# Environment Defaults for Container Execution
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_HTTP_PORTS=5000
ENV CvStorage__LocalStoragePath=/app/cv_storage

EXPOSE 5000

# Container health probe checking /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

ENTRYPOINT ["dotnet", "HireSphere.Api.dll"]
