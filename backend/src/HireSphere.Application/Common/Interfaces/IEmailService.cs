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

    Task SendApplicationSubmittedEmailAsync(
        string recipientEmail,
        string candidateName,
        string companyName,
        string jobTitle,
        Guid applicationId,
        CancellationToken cancellationToken = default);

    Task SendApplicationStatusUpdatedEmailAsync(
        string recipientEmail,
        string candidateName,
        string companyName,
        string jobTitle,
        string newStage,
        string? note,
        CancellationToken cancellationToken = default);

    Task SendCompanyReviewDecisionEmailAsync(
        string recipientEmail,
        string ownerName,
        string companyName,
        string decision,
        string? reason,
        CancellationToken cancellationToken = default);
}
