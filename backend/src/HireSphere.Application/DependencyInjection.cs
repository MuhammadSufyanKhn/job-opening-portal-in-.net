using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using HireSphere.Application.Services;

namespace HireSphere.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICandidateProfileService, CandidateProfileService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IAdminCompanyService, AdminCompanyService>();

        return services;
    }
}
