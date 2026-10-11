using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;

namespace HireSphere.Infrastructure.Services;

/// <summary>
/// Development-safe and provider-configurable implementation of IEmailService.
/// Supports SMTP when configured in appsettings (Email:SmtpHost).
/// When SMTP is unconfigured, safely records delivery attempts in dbo.EmailDeliveryAttempts
/// and logs rendered email details without crashing offline or developer environments.
/// </summary>
public class DevLoggingEmailService : IEmailService
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DevLoggingEmailService> _logger;

    public DevLoggingEmailService(
        IApplicationDbContext context,
        IConfiguration configuration,
        ILogger<DevLoggingEmailService> logger)
    {
        _context = context;
        _configuration = configuration;
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
        var htmlBody = $@"
<div style=""font-family: Arial, sans-serif; background-color: #f0f7ff; padding: 24px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; padding: 24px;"">
        <h2 style=""color: #2563eb; margin-top: 0;"">HireSphere Recruitment Assessment</h2>
        <p>Dear <strong>{candidateName}</strong>,</p>
        <p>You have been invited to complete a WorkSim interactive job simulation for the position of <strong>{jobTitle}</strong> at <strong>{companyName}</strong>.</p>
        <div style=""background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0;"">
            <p style=""margin: 0;""><strong>Assessment:</strong> {assessmentTitle}</p>
            <p style=""margin: 4px 0 0;""><strong>Mandatory:</strong> {(isRequired ? "Yes" : "Optional")}</p>
            <p style=""margin: 4px 0 0;""><strong>Deadline:</strong> {(deadlineUtc.HasValue ? deadlineUtc.Value.ToString("MMM dd, yyyy HH:mm UTC") : "Open")}</p>
        </div>
        <p><a href=""{invitationLink}"" style=""display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;"">Start Simulation</a></p>
        <p style=""font-size: 12px; color: #64748b; margin-top: 24px;"">Sent via HireSphere SaaS Recruitment Platform.</p>
    </div>
</div>";

        await RecordAndDispatchEmailAsync(recipientEmail, subject, "AssessmentInvitation", htmlBody, cancellationToken);
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
        var htmlBody = $@"
<div style=""font-family: Arial, sans-serif; background-color: #f0f7ff; padding: 24px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; padding: 24px;"">
        <h2 style=""color: #d97706; margin-top: 0;"">Assessment Deadline Reminder</h2>
        <p>Dear <strong>{candidateName}</strong>,</p>
        <p>This is a reminder that your simulation assessment for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> is approaching its deadline.</p>
        <div style=""background: #fffbeb; border-left: 4px solid #d97706; padding: 12px 16px; margin: 16px 0;"">
            <p style=""margin: 0;""><strong>Assessment:</strong> {assessmentTitle}</p>
            <p style=""margin: 4px 0 0;""><strong>Deadline:</strong> {(deadlineUtc.HasValue ? deadlineUtc.Value.ToString("MMM dd, yyyy HH:mm UTC") : "Open")}</p>
        </div>
        <p><a href=""{invitationLink}"" style=""display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;"">Resume Assessment</a></p>
        <p style=""font-size: 12px; color: #64748b; margin-top: 24px;"">Sent via HireSphere SaaS Recruitment Platform.</p>
    </div>
</div>";

        await RecordAndDispatchEmailAsync(recipientEmail, subject, "AssessmentReminder", htmlBody, cancellationToken);
    }

    public async Task SendApplicationSubmittedEmailAsync(
        string recipientEmail,
        string candidateName,
        string companyName,
        string jobTitle,
        Guid applicationId,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Application Received: {jobTitle} at {companyName}";
        var htmlBody = $@"
<div style=""font-family: Arial, sans-serif; background-color: #f0f7ff; padding: 24px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; padding: 24px;"">
        <h2 style=""color: #2563eb; margin-top: 0;"">Application Submitted Successfully</h2>
        <p>Dear <strong>{candidateName}</strong>,</p>
        <p>Your application for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> has been received by the hiring team.</p>
        <p>You can track the progress of your application and any requested assessment simulations on your candidate portal.</p>
        <div style=""margin: 20px 0;"">
            <a href=""/candidate/applications"" style=""display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;"">View My Applications</a>
        </div>
        <p style=""font-size: 12px; color: #64748b; margin-top: 24px;"">Sent via HireSphere SaaS Recruitment Platform.</p>
    </div>
</div>";

        await RecordAndDispatchEmailAsync(recipientEmail, subject, "ApplicationSubmitted", htmlBody, cancellationToken);
    }

    public async Task SendApplicationStatusUpdatedEmailAsync(
        string recipientEmail,
        string candidateName,
        string companyName,
        string jobTitle,
        string newStage,
        string? note,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Application Status Update: {jobTitle} at {companyName}";
        var htmlBody = $@"
<div style=""font-family: Arial, sans-serif; background-color: #f0f7ff; padding: 24px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; padding: 24px;"">
        <h2 style=""color: #2563eb; margin-top: 0;"">Application Update</h2>
        <p>Dear <strong>{candidateName}</strong>,</p>
        <p>The recruitment status of your application for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> has been updated to:</p>
        <div style=""background: #f0f7ff; border: 1px solid #93c5fd; padding: 12px 16px; margin: 16px 0; border-radius: 6px;"">
            <span style=""font-size: 16px; font-weight: bold; color: #1e40af;"">{newStage}</span>
            {(string.IsNullOrWhiteSpace(note) ? "" : $"<p style=\"margin: 8px 0 0; color: #334155; font-size: 14px;\"><em>Note: {note}</em></p>")}
        </div>
        <p><a href=""/candidate/applications"" style=""display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;"">Check Application Timeline</a></p>
        <p style=""font-size: 12px; color: #64748b; margin-top: 24px;"">Sent via HireSphere SaaS Recruitment Platform.</p>
    </div>
</div>";

        await RecordAndDispatchEmailAsync(recipientEmail, subject, "ApplicationStatusUpdated", htmlBody, cancellationToken);
    }

    public async Task SendCompanyReviewDecisionEmailAsync(
        string recipientEmail,
        string ownerName,
        string companyName,
        string decision,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Organization Verification Decision: {companyName} ({decision})";
        var isApproved = decision.Equals("Approved", StringComparison.OrdinalIgnoreCase);
        var bannerColor = isApproved ? "#059669" : "#dc2626";

        var htmlBody = $@"
<div style=""font-family: Arial, sans-serif; background-color: #f0f7ff; padding: 24px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; padding: 24px;"">
        <h2 style=""color: {bannerColor}; margin-top: 0;"">HireSphere Organization Verification</h2>
        <p>Dear <strong>{ownerName}</strong>,</p>
        <p>The platform compliance review for <strong>{companyName}</strong> has been updated to: <strong>{decision}</strong>.</p>
        {(string.IsNullOrWhiteSpace(reason) ? "" : $"<div style=\"background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;\"><p style=\"margin:0;\"><strong>Recorded Reason:</strong> {reason}</p></div>")}
        <p><a href=""/company/dashboard"" style=""display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;"">Open Employer Portal</a></p>
        <p style=""font-size: 12px; color: #64748b; margin-top: 24px;"">Sent via HireSphere SaaS Recruitment Platform.</p>
    </div>
</div>";

        await RecordAndDispatchEmailAsync(recipientEmail, subject, "CompanyReviewDecision", htmlBody, cancellationToken);
    }

    private async Task RecordAndDispatchEmailAsync(
        string recipientEmail,
        string subject,
        string templateName,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        var smtpHost = _configuration["Email:SmtpHost"];
        var attempt = new EmailDeliveryAttempt
        {
            RecipientEmail = recipientEmail,
            Subject = subject,
            TemplateName = templateName,
            AttemptCount = 1,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        if (string.IsNullOrWhiteSpace(smtpHost))
        {
            // Dev/offline mode: no SMTP credentials configured.
            // Record attempt as Sent for development workflow inspection and log detail.
            attempt.DeliveryStatus = EmailDeliveryStatus.Sent;
            attempt.SentAtUtc = DateTimeOffset.UtcNow;
            _logger.LogInformation(
                "[DevEmail] Dispatch recorded for {Recipient}. Subject: '{Subject}'. Template: {Template}. (SMTP host unconfigured; stored in EmailDeliveryAttempts).",
                recipientEmail, subject, templateName);
        }
        else
        {
            try
            {
                var smtpPort = _configuration.GetValue<int>("Email:SmtpPort", 587);
                var smtpUser = _configuration["Email:SmtpUser"];
                var smtpPass = _configuration["Email:SmtpPassword"];
                var senderEmail = _configuration["Email:SenderEmail"] ?? "no-reply@hiresphere.local";
                var senderName = _configuration["Email:SenderName"] ?? "HireSphere";
                var enableSsl = _configuration.GetValue<bool>("Email:EnableSsl", true);

                using var message = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                message.To.Add(recipientEmail);

                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = enableSsl
                };

                if (!string.IsNullOrWhiteSpace(smtpUser))
                {
                    client.Credentials = new NetworkCredential(smtpUser, smtpPass);
                }

                await client.SendMailAsync(message, cancellationToken);
                attempt.DeliveryStatus = EmailDeliveryStatus.Sent;
                attempt.SentAtUtc = DateTimeOffset.UtcNow;
                _logger.LogInformation("[Email] Dispatched via SMTP to {Recipient}. Subject: {Subject}", recipientEmail, subject);
            }
            catch (Exception ex)
            {
                attempt.DeliveryStatus = EmailDeliveryStatus.Failed;
                attempt.ErrorMessage = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
                _logger.LogError(ex, "[Email] SMTP dispatch failed for {Recipient}. Subject: {Subject}", recipientEmail, subject);
            }
        }

        try
        {
            _context.EmailDeliveryAttempts.Add(attempt);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Email] Failed to persist EmailDeliveryAttempt for {Recipient}", recipientEmail);
        }
    }
}
