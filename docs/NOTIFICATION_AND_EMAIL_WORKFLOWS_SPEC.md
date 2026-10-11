# HireSphere Notification Center, Email Workflows, and Recruitment Updates Specification

## 1. Executive Summary

This document specifies the notification system and email dispatch workflows implemented for **Prompt 8: HireSphere Notification Center, Email Workflows, and Recruitment Updates**.

HireSphere now provides a centralized, role-aware recruitment notification center and provider-independent email dispatch engine. Candidates receive immediate updates on application progress and assessment deadlines, company recruiters stay informed about candidate actions and simulation completions, and platform administrators are alerted to pending company compliance reviews.

---

## 2. Notification Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 HireSphere UI (React)                  │
                  │   • NotificationBell (Polled unread badge & popover)   │
                  │   • /notifications (Full Notification Center page)     │
                  └───────────────────────────┬────────────────────────────┘
                                              │ HTTP /api/notifications
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │           NotificationsController (ASP.NET Core)       │
                  │   • Enforces User.GetUserId() ownership                │
                  │   • Prevents IDOR or unauthorized access               │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │           NotificationService (Application Layer)      │
                  │   • Deduplication: 5-min throttle on identical items   │
                  │   • Paged and unread retrieval                         │
                  │   • Single & Bulk "Mark As Read" operations            │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌──────────────────────────┐                    ┌──────────────────────────┐
         │     dbo.Notifications    │                    │  IEmailService (Dispatched)│
         │  (Database In-App Alert) │                    │  (DevLoggingEmailService) │
         └──────────────────────────┘                    └────────────┬─────────────┘
                                                                      │
                                              ┌───────────────────────┴───────────────────────┐
                                              ▼                                               ▼
                                 ┌─────────────────────────┐                     ┌─────────────────────────┐
                                 │  SMTP Server (If set)   │                     │dbo.EmailDeliveryAttempts│
                                 │ (Real email delivered)  │                     │ (Dev inspection table)  │
                                 └─────────────────────────┘                     └─────────────────────────┘
```

---

## 3. Supported Notification Events

| Event Type | Recipient | In-App Notification | Email Triggered | Triggered In | Action URL Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ApplicationSubmitted` | Candidate | ✅ "Application Submitted" | ✅ Application confirmation | `ApplicationService.SubmitApplicationAsync` | `/candidate/applications` |
| `CandidateApplied` | Recruiter(s) | ✅ "New Applicant: {JobTitle}" | ❌ (Recruiter in-app alert) | `ApplicationService.SubmitApplicationAsync` | `/company/applications` |
| `ApplicationStageChanged` | Candidate | ✅ "Application Status Updated" | ✅ Stage update notice | `ApplicationService.UpdateApplicationStageAsync` | `/candidate/applications` |
| `AssessmentInvitation` | Candidate | ✅ "WorkSim Assessment Invited" | ✅ Simulation invitation | `AssessmentWorkflowService.InviteCandidateAsync` | `/candidate/simulations` |
| `AssessmentDeadlineApproaching` | Candidate | ✅ "Assessment Deadline Approaching" | ✅ Reminder email | `AssessmentDeadlineBackgroundService` | `/candidate/simulations` |
| `AssessmentCompleted` | Candidate | ✅ "Simulation Assessment Completed" | ❌ | `WorkSimRuntimeService.SubmitAssessmentSessionAsync` | `/candidate/simulations/session/{id}/results` |
| `CandidateAssessmentCompleted` | Recruiter(s) | ✅ "Candidate Completed Assessment" | ❌ | `WorkSimRuntimeService.SubmitAssessmentSessionAsync` | `/company/applications` |
| `CompanyPendingApproval` | Super Admin(s) | ✅ "New Company Registration: {Name}" | ❌ | `AuthService.RegisterCompanyAsync` | `/admin/companies` |
| `CompanyApproved` | Company Owner | ✅ "Company Account Approved" | ✅ Approval notice | `AdminCompanyService.ApproveCompanyAsync` | `/company/dashboard` |
| `CompanyRejected` | Company Owner | ✅ "Company Registration Update" | ✅ Rejection explanation | `AdminCompanyService.RejectCompanyAsync` | `/company/dashboard` |
| `CompanySuspended` | Company Owner | ✅ "Company Account Suspended" | ✅ Suspension notice | `AdminCompanyService.SuspendCompanyAsync` | `/company/dashboard` |
| `CompanyRestored` | Company Owner | ✅ "Company Account Restored" | ✅ Reactivation notice | `AdminCompanyService.RestoreCompanyAsync` | `/company/dashboard` |

---

## 4. Backend API Endpoints

All endpoints require authentication via JWT Bearer token:

### `GET /api/notifications`
* **Description:** Retrieves the recent in-app notifications for the authenticated user.
* **Query Parameters:** `limit` (default: 30, maximum: 100).
* **Security:** User ID is derived strictly from JWT claims (`ClaimTypes.NameIdentifier`).

### `GET /api/notifications/paged`
* **Description:** Retrieves paginated notifications with optional unread and type filtering.
* **Query Parameters:**
  * `page` (default: 1)
  * `pageSize` (default: 20)
  * `unreadOnly` (`true` or `false`)
  * `notificationType` (e.g., `ApplicationSubmitted`, `AssessmentInvitation`)
* **Response:**
  ```json
  {
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "notificationType": "ApplicationStageChanged",
        "title": "Application Status Updated: Staff Cloud Architect",
        "message": "Your application for Staff Cloud Architect at Globex Corp has progressed to Shortlisted.",
        "actionUrl": "/candidate/applications",
        "isRead": false,
        "readAtUtc": null,
        "createdAtUtc": "2026-10-11T16:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1
  }
  ```

### `GET /api/notifications/unread-count`
* **Description:** Returns the count of unread notifications for lightweight polling.
* **Response:** `{ "unreadCount": 3 }`

### `POST /api/notifications/{id}/read`
* **Description:** Marks a single notification as read.
* **Security:** Verifies that `notification.UserId == currentUserId`. Returns `403 Forbidden` if another user attempts access. Returns `404 Not Found` if notification does not exist.

### `POST /api/notifications/read-all`
* **Description:** Marks all unread notifications belonging to the authenticated user as read in bulk.

---

## 5. Email Service Configuration

### Provider-Independent Abstraction
The system uses the `IEmailService` interface:
* `SendApplicationSubmittedEmailAsync`
* `SendApplicationStatusUpdatedEmailAsync`
* `SendAssessmentInvitationEmailAsync`
* `SendAssessmentReminderEmailAsync`
* `SendCompanyReviewDecisionEmailAsync`

The active implementation is `DevLoggingEmailService` (`backend/src/HireSphere.Infrastructure/Services/DevLoggingEmailService.cs`).

### Environment & Configuration Settings
In `appsettings.json` (or environment variables):
```json
"Email": {
  "SmtpHost": "",
  "SmtpPort": 587,
  "SmtpUser": "",
  "SmtpPassword": "",
  "EnableSsl": true,
  "SenderEmail": "no-reply@hiresphere.local",
  "SenderName": "HireSphere Recruitment"
}
```

### Development / Offline Fallback Behavior
* If `Email:SmtpHost` is left blank, the email service operates in **Dev-Logging Mode**.
* Rather than crashing or throwing unhandled socket errors, each email dispatch is:
  1. Rendered with clean HTML and plain text in HireSphere's white & light-blue theme.
  2. Logged via `Microsoft.Extensions.Logging`.
  3. Recorded in `dbo.EmailDeliveryAttempts` with status `Sent` (`1`) and timestamp `SentAtUtc`.
* If `Email:SmtpHost` is populated, real SMTP transport is used via `System.Net.Mail.SmtpClient`. Failed deliveries are recorded in `dbo.EmailDeliveryAttempts` with `DeliveryStatus = Failed` and the sanitized error message recorded in `ErrorMessage`.

---

## 6. Database Schema and Manual SQL Scripts

> [!NOTE]
> **No new SQL scripts or database migrations were required for Prompt 8.**
> The required database tables (`dbo.Notifications` and `dbo.EmailDeliveryAttempts`) were previously defined in `database/scripts/009_EnhanceAssessmentInvitationsAndNotifications.sql`.

### Existing Schema Reference

```sql
-- dbo.Notifications
CREATE TABLE [dbo].[Notifications] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [NotificationType] NVARCHAR(100) NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Message] NVARCHAR(1000) NOT NULL,
    [ActionUrl] NVARCHAR(500) NULL,
    [IsRead] BIT NOT NULL DEFAULT 0,
    [ReadAtUtc] DATETIMEOFFSET NULL,
    [CreatedAtUtc] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId])
        REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Notifications_UserId_IsRead]
    ON [dbo].[Notifications]([UserId], [IsRead]);

-- dbo.EmailDeliveryAttempts
CREATE TABLE [dbo].[EmailDeliveryAttempts] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [RecipientEmail] NVARCHAR(256) NOT NULL,
    [Subject] NVARCHAR(300) NOT NULL,
    [TemplateName] NVARCHAR(100) NOT NULL,
    [DeliveryStatus] INT NOT NULL DEFAULT 0,
    [AttemptCount] INT NOT NULL DEFAULT 0,
    [ErrorMessage] NVARCHAR(MAX) NULL,
    [SentAtUtc] DATETIMEOFFSET NULL,
    [CreatedAtUtc] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
```

---

## 7. Assessment & Interview Reminders

HireSphere includes a background hosted service:
* **Service:** `AssessmentDeadlineBackgroundService` (`HireSphere.Infrastructure/Services/AssessmentDeadlineBackgroundService.cs`).
* **Interval:** Runs every 15 minutes.
* **Capabilities:**
  1. Checks for active candidate invitations where `DeadlineUtc < DateTimeOffset.UtcNow` and marks them as expired.
  2. Identifies upcoming deadlines within the next 24 hours.
  3. Sends deduplicated in-app notification and email reminder (`SendAssessmentReminderEmailAsync`) if no reminder was sent within the past 24 hours.
* **Production Recommendation:** For multi-instance load balancing, migrate background processing to Quartz.NET or an Azure Functions timer trigger.

---

## 8. Frontend Integration

### UI Components
1. **`NotificationBell` (`frontend/src/components/NotificationBell.tsx`)**:
   - Integrated into the global navigation bar (`Navbar.tsx`).
   - Polls `unread-count` every 45 seconds (lightweight, non-aggressive).
   - Opens interactive popover with recent notifications, type-specific icons, quick "Mark all read" button, and link to the full Notification Center.
2. **`NotificationCenter` (`frontend/src/pages/NotificationCenter.tsx`)**:
   - Accessible via `/notifications` for all authenticated roles.
   - Filter tabs: "All Notifications" vs "Unread Only".
   - Category filtering: All, Applications, Assessments, Operations.
   - Pagination controls with total count and page indicators.
   - Direct navigation to relevant resource routes on click.

### Theme & Styling
- Adheres strictly to HireSphere's **white and light-blue theme**:
  - Background: `#f8fafc` / `#ffffff`
  - Accent / Primary: `#0284c7` / `#0ea5e9`
  - Subtle borders: `#e2e8f0`
  - Unread indicators: Light blue background (`#f0f9ff`) with soft cyan dot indicator.

---

## 9. How to Add a New Notification Event Later

Adding a new notification event takes three simple steps:

1. **Inject `INotificationService` (and optionally `IEmailService`) into your application service:**
   ```csharp
   public class MyNewFeatureService
   {
       private readonly INotificationService _notificationService;
       public MyNewFeatureService(INotificationService notificationService)
       {
           _notificationService = notificationService;
       }
   }
   ```
2. **Trigger `CreateNotificationAsync` upon successful completion of the business event:**
   ```csharp
   await _notificationService.CreateNotificationAsync(
       userId: targetUserId,
       notificationType: "InterviewScheduled",
       title: $"Interview Scheduled: {jobTitle}",
       message: $"Your interview with {companyName} is scheduled for {dateTime:MMM dd, yyyy}.",
       actionUrl: "/candidate/interviews");
   ```
3. **If email is also needed:**
   Add a method to `IEmailService` and implement the corresponding HTML template in `DevLoggingEmailService`.

---

## 10. Automated Test Results

### Backend Unit Tests (`dotnet test backend/HireSphere.slnx`)
* **Total Tests:** 92
* **Passed:** 92
* **Failed:** 0
* **Duration:** ~3 seconds

### Frontend Build & Lint (`npm run build` & `npm run lint`)
* **TypeScript Compilation:** Passed (0 errors).
* **Vite Production Bundle:** Built successfully in 410ms.
* **Linter (`oxlint`):** Passed (0 errors, 44 benign existing warnings).
