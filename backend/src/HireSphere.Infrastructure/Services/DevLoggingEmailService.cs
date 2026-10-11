using Microsoft.Extensions.Logging;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;

namespace HireSphere.Infrastructure.Services;

/// <summary>
/// Development-safe implementation of IEmailService.
/// Records delivery attempts in dbo.EmailDeliveryAttempts and logs dispatch information,
/// without sending real external emails or crashing offline local environments.
/// </summary>
public class DevLoggingEmailService : IEmailService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<DevLoggingEmailService> _logger;

    public DevLoggingEmailService(IApplicationDbContext context, ILogger<DevLoggingEmailService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SendAssessmentInvitationEmailAsync(
        string recipientEmail,
        string candidateName,
        string companyName,
        string jobTitle,
        string assessmentTitle,
        bool isRequired,
        DateTimeOffset? deadlineUtc,
        string invitationLink,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Assessment Invitation: {assessmentTitle} for {jobTitle} at {companyName}";
        var attempt = new EmailDeliveryAttempt
        {
            RecipientEmail = recipientEmail,
            Subject = subject,
            TemplateName = "AssessmentInvitation",
            DeliveryStatus = EmailDeliveryStatus.Sent,
            AttemptCount = 1,
            SentAtUtc = DateTimeOffset.UtcNow,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        try
        {
            _context.EmailDeliveryAttempts.Add(attempt);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "[DevEmail] Assessment Invitation sent to {Recipient} ({CandidateName}). Company: {Company}, Job: {Job}, Assessment: {Assessment}, Required: {IsRequired}, Deadline: {Deadline}, Link: {Link}",
                recipientEmail, candidateName, companyName, jobTitle, assessmentTitle, isRequired, deadlineUtc, invitationLink);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DevEmail] Failed to record email delivery attempt to {Recipient}", recipientEmail);
        }
    }

    public async Task SendAssessmentReminderEmailAsync(
        string recipientEmail,
        string candidateName,
        string companyName,
        string jobTitle,
        string assessmentTitle,
        DateTimeOffset? deadlineUtc,
        string invitationLink,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Reminder: Upcoming Assessment Deadline for {jobTitle} at {companyName}";
        var attempt = new EmailDeliveryAttempt
        {
            RecipientEmail = recipientEmail,
            Subject = subject,
            TemplateName = "AssessmentReminder",
            DeliveryStatus = EmailDeliveryStatus.Sent,
            AttemptCount = 1,
            SentAtUtc = DateTimeOffset.UtcNow,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        try
        {
            _context.EmailDeliveryAttempts.Add(attempt);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "[DevEmail] Assessment Reminder sent to {Recipient} ({CandidateName}). Company: {Company}, Job: {Job}, Assessment: {Assessment}, Deadline: {Deadline}, Link: {Link}",
                recipientEmail, candidateName, companyName, jobTitle, assessmentTitle, deadlineUtc, invitationLink);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DevEmail] Failed to record email reminder attempt to {Recipient}", recipientEmail);
        }
    }
}
