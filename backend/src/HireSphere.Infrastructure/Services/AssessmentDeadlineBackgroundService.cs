using System.Data.Common;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using HireSphere.Application.Services;

namespace HireSphere.Infrastructure.Services;

/// <summary>
/// Hosted background service that periodically processes assessment deadlines,
/// marks expired assignments accurately, and sends deduplicated upcoming reminders.
/// Safely handles database outages with backoff retries and non-leaking diagnostic logs.
/// </summary>
public class AssessmentDeadlineBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AssessmentDeadlineBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(15);
    private readonly TimeSpan _transientRetryInterval = TimeSpan.FromSeconds(60);
    private bool _wasDatabaseUnavailable;

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
            TimeSpan nextDelay = _checkInterval;

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var workflowService = scope.ServiceProvider.GetRequiredService<IAssessmentWorkflowService>();

                var result = await workflowService.ProcessDeadlinesAndRemindersAsync(stoppingToken);

                if (_wasDatabaseUnavailable)
                {
                    _logger.LogInformation("Database connectivity restored. Assessment deadline background processing resumed normally.");
                    _wasDatabaseUnavailable = false;
                }

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
            catch (Exception ex) when (IsDatabaseConnectivityException(ex))
            {
                _wasDatabaseUnavailable = true;
                nextDelay = _transientRetryInterval;

                _logger.LogWarning(
                    "Database is currently unavailable for assessment deadline processing. Will retry in {Seconds} seconds. Reason: {Reason}",
                    (int)_transientRetryInterval.TotalSeconds,
                    SanitizeMessage(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during assessment deadline background check. Resuming in {Minutes} minutes.", (int)_checkInterval.TotalMinutes);
            }

            try
            {
                await Task.Delay(nextDelay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("AssessmentDeadlineBackgroundService is stopping.");
    }

    private static bool IsDatabaseConnectivityException(Exception ex)
    {
        return ex is SqlException
            || ex is DbException
            || ex is TimeoutException
            || (ex is DbUpdateException dbUpdateEx && dbUpdateEx.InnerException is DbException)
            || (ex.InnerException != null && IsDatabaseConnectivityException(ex.InnerException));
    }

    private static string SanitizeMessage(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return "Connection failed.";

        var firstLine = message.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return firstLine ?? "Database connection could not be established.";
    }
}
