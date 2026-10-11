namespace HireSphere.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendAssessmentInvitationEmailAsync(
        string recipientEmail,
        string candidateName,
        string companyName,
        string jobTitle,
        string assessmentTitle,
        bool isRequired,
        DateTimeOffset? deadlineUtc,
        string invitationLink,
        CancellationToken cancellationToken = default);

    Task SendAssessmentReminderEmailAsync(
        string recipientEmail,
        string candidateName,
        string companyName,
        string jobTitle,
        string assessmentTitle,
        DateTimeOffset? deadlineUtc,
        string invitationLink,
        CancellationToken cancellationToken = default);
}
