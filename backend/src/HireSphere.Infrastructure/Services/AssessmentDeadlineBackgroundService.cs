using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using HireSphere.Application.Services;

namespace HireSphere.Infrastructure.Services;

/// <summary>
/// Hosted background service that periodically processes assessment deadlines,
/// marks expired assignments accurately, and sends deduplicated upcoming reminders.
/// </summary>
public class AssessmentDeadlineBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AssessmentDeadlineBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(15);

    public AssessmentDeadlineBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<AssessmentDeadlineBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AssessmentDeadlineBackgroundService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var workflowService = scope.ServiceProvider.GetRequiredService<IAssessmentWorkflowService>();

                var result = await workflowService.ProcessDeadlinesAndRemindersAsync(stoppingToken);

                if (result.ExpiredCount > 0 || result.RemindersSentCount > 0)
                {
                    _logger.LogInformation(
                        "Assessment deadline cycle processed: {Expired} expired, {Reminders} reminders sent at {Time}.",
                        result.ExpiredCount, result.RemindersSentCount, result.ProcessedAtUtc);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during assessment deadline background check.");
            }

            try
            {
                await Task.Delay(_checkInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("AssessmentDeadlineBackgroundService is stopping.");
    }
}
