-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   009_EnhanceAssessmentInvitationsAndNotifications.sql
-- Description: Enhances AssessmentAssignments with invitation tracking columns
--              (Reminders, Cancellations, Resends), adds tracking indexes, and
--              ensures Notifications and EmailDeliveryAttempts tables exist.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- Dependency:  004_CreateWorkSimAssessmentSchema.sql, 005_CreateSubscriptionsAndOperationsSchema.sql
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. Enhance AssessmentAssignments Table with Invitation Tracking
    IF EXISTS (SELECT * FROM sys.tables WHERE name = N'AssessmentAssignments' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        -- Add ReminderSentAtUtc
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AssessmentAssignments') AND name = N'ReminderSentAtUtc')
        BEGIN
            ALTER TABLE dbo.AssessmentAssignments ADD ReminderSentAtUtc DATETIMEOFFSET NULL;
            PRINT N'Added ReminderSentAtUtc column to AssessmentAssignments.';
        END;

        -- Add CancelledAtUtc
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AssessmentAssignments') AND name = N'CancelledAtUtc')
        BEGIN
            ALTER TABLE dbo.AssessmentAssignments ADD CancelledAtUtc DATETIMEOFFSET NULL;
            PRINT N'Added CancelledAtUtc column to AssessmentAssignments.';
        END;

        -- Add CancellationReason
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AssessmentAssignments') AND name = N'CancellationReason')
        BEGIN
            ALTER TABLE dbo.AssessmentAssignments ADD CancellationReason NVARCHAR(500) NULL;
            PRINT N'Added CancellationReason column to AssessmentAssignments.';
        END;

        -- Add ResentCount
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AssessmentAssignments') AND name = N'ResentCount')
        BEGIN
            ALTER TABLE dbo.AssessmentAssignments ADD ResentCount INT NOT NULL CONSTRAINT DF_AssessmentAssignments_ResentCount DEFAULT 0;
            PRINT N'Added ResentCount column to AssessmentAssignments.';
        END;

        -- Add LastResentAtUtc
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AssessmentAssignments') AND name = N'LastResentAtUtc')
        BEGIN
            ALTER TABLE dbo.AssessmentAssignments ADD LastResentAtUtc DATETIMEOFFSET NULL;
            PRINT N'Added LastResentAtUtc column to AssessmentAssignments.';
        END;

        -- Create Composite Indexes for Performance & Deduplication
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_AssessmentAssignments_Company_Status' AND object_id = OBJECT_ID(N'dbo.AssessmentAssignments'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_AssessmentAssignments_Company_Status 
            ON dbo.AssessmentAssignments (CompanyId, Status);
            PRINT N'Created index IX_AssessmentAssignments_Company_Status.';
        END;

        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_AssessmentAssignments_Status_Deadline' AND object_id = OBJECT_ID(N'dbo.AssessmentAssignments'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_AssessmentAssignments_Status_Deadline 
            ON dbo.AssessmentAssignments (Status, DeadlineUtc);
            PRINT N'Created index IX_AssessmentAssignments_Status_Deadline.';
        END;

        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_AssessmentAssignments_App_Config' AND object_id = OBJECT_ID(N'dbo.AssessmentAssignments'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_AssessmentAssignments_App_Config 
            ON dbo.AssessmentAssignments (JobApplicationId, JobAssessmentConfigurationId);
            PRINT N'Created index IX_AssessmentAssignments_App_Config.';
        END;
    END;

    -- 2. Ensure Notifications Table exists
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Notifications' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.Notifications (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Notifications_Id DEFAULT NEWSEQUENTIALID(),
            UserId UNIQUEIDENTIFIER NOT NULL,
            NotificationType NVARCHAR(100) NOT NULL,
            Title NVARCHAR(200) NOT NULL,
            Message NVARCHAR(1000) NOT NULL,
            ActionUrl NVARCHAR(500) NULL,
            IsRead BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
            ReadAtUtc DATETIMEOFFSET NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_Notifications_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_Notifications_Users_UserId FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE CASCADE
        );

        CREATE NONCLUSTERED INDEX IX_Notifications_UserId_IsRead ON dbo.Notifications (UserId, IsRead);
        CREATE NONCLUSTERED INDEX IX_Notifications_CreatedAtUtc ON dbo.Notifications (CreatedAtUtc DESC);
        PRINT N'Created table Notifications.';
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Notifications_CreatedAtUtc' AND object_id = OBJECT_ID(N'dbo.Notifications'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Notifications_CreatedAtUtc ON dbo.Notifications (CreatedAtUtc DESC);
            PRINT N'Created index IX_Notifications_CreatedAtUtc.';
        END;
    END;

    -- 3. Ensure EmailDeliveryAttempts Table exists
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'EmailDeliveryAttempts' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.EmailDeliveryAttempts (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_EmailDeliveryAttempts_Id DEFAULT NEWSEQUENTIALID(),
            RecipientEmail NVARCHAR(256) NOT NULL,
            Subject NVARCHAR(300) NOT NULL,
            TemplateName NVARCHAR(100) NOT NULL,
            DeliveryStatus INT NOT NULL CONSTRAINT DF_EmailDeliveryAttempts_DeliveryStatus DEFAULT 0, -- 0: Pending, 1: Sent, 2: Failed
            AttemptCount INT NOT NULL CONSTRAINT DF_EmailDeliveryAttempts_AttemptCount DEFAULT 0,
            ErrorMessage NVARCHAR(2000) NULL,
            SentAtUtc DATETIMEOFFSET NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_EmailDeliveryAttempts_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_EmailDeliveryAttempts PRIMARY KEY CLUSTERED (Id)
        );

        CREATE NONCLUSTERED INDEX IX_EmailDeliveryAttempts_DeliveryStatus ON dbo.EmailDeliveryAttempts (DeliveryStatus);
        CREATE NONCLUSTERED INDEX IX_EmailDeliveryAttempts_CreatedAtUtc ON dbo.EmailDeliveryAttempts (CreatedAtUtc DESC);
        PRINT N'Created table EmailDeliveryAttempts.';
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 009_EnhanceAssessmentInvitationsAndNotifications.sql executed successfully.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO
