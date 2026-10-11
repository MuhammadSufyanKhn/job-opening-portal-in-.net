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
        services.AddScoped<IJobService, JobService>();
        services.AddScoped<IJobMarketplaceService, JobMarketplaceService>();
        services.AddScoped<IApplicationService, ApplicationService>();
        services.AddScoped<ICandidateDocumentService, CandidateDocumentService>();
        services.AddScoped<ICvMatchingService, CvMatchingService>();
        services.AddScoped<IWorkSimScoringService, WorkSimScoringService>();
        services.AddScoped<IWorkSimRuntimeService, WorkSimRuntimeService>();
        services.AddScoped<IWorkSimManagementService, WorkSimManagementService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IAssessmentWorkflowService, AssessmentWorkflowService>();
        services.AddScoped<IAdminDashboardService, AdminDashboardService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminJobService, AdminJobService>();
        services.AddScoped<IAdminAuditService, AdminAuditService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<ICandidateSavedJobsService, CandidateSavedJobsService>();
        services.AddScoped<ICandidateDashboardService, CandidateDashboardService>();

        return services;
    }
}
