-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   005_CreateSubscriptionsAndOperationsSchema.sql
-- Description: Creates Subscription Plans, Company Subscriptions, Usage Records,
--              Billing Ledger, Webhook Events, Notifications, and Audit Logs.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. SubscriptionPlans Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'SubscriptionPlans' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.SubscriptionPlans (
            Id INT IDENTITY(1,1) NOT NULL,
            PlanName NVARCHAR(100) NOT NULL,
            TierType INT NOT NULL CONSTRAINT DF_SubscriptionPlans_TierType DEFAULT 0, -- 0: Starter, 1: Growth, 2: Enterprise
            MonthlyPrice DECIMAL(18,2) NOT NULL CONSTRAINT DF_SubscriptionPlans_MonthlyPrice DEFAULT 0.00,
            MaxActiveJobPostings INT NOT NULL,
            MaxCompanyMembers INT NOT NULL,
            MonthlyCvExtractionQuota INT NOT NULL,
            MonthlyAssessmentQuota INT NOT NULL,
            IsActive BIT NOT NULL CONSTRAINT DF_SubscriptionPlans_IsActive DEFAULT 1,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_SubscriptionPlans_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_SubscriptionPlans PRIMARY KEY CLUSTERED (Id)
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_SubscriptionPlans_PlanName ON dbo.SubscriptionPlans (PlanName);
    END;

    -- 2. CompanySubscriptions Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CompanySubscriptions' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CompanySubscriptions (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CompanySubscriptions_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            SubscriptionPlanId INT NOT NULL,
            Status INT NOT NULL CONSTRAINT DF_CompanySubscriptions_Status DEFAULT 0, -- 0: Active, 1: PastDue, 2: Canceled, 3: Expired
            BillingCycleStartUtc DATETIMEOFFSET NOT NULL,
            BillingCycleEndUtc DATETIMEOFFSET NOT NULL,
            AutoRenew BIT NOT NULL CONSTRAINT DF_CompanySubscriptions_AutoRenew DEFAULT 1,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_CompanySubscriptions_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            UpdatedAtUtc DATETIMEOFFSET NULL,
            RowVersion ROWVERSION NOT NULL,
            CONSTRAINT PK_CompanySubscriptions PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_CompanySubscriptions_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_CompanySubscriptions_SubscriptionPlans_SubscriptionPlanId FOREIGN KEY (SubscriptionPlanId) REFERENCES dbo.SubscriptionPlans (Id) ON DELETE NO ACTION,
            CONSTRAINT UQ_CompanySubscriptions_CompanyId UNIQUE (CompanyId)
        );

        CREATE NONCLUSTERED INDEX IX_CompanySubscriptions_Status ON dbo.CompanySubscriptions (Status);
    END;

    -- 3. TenantUsageRecords Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'TenantUsageRecords' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.TenantUsageRecords (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_TenantUsageRecords_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            BillingPeriodMonth NVARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
            ActiveJobCount INT NOT NULL CONSTRAINT DF_TenantUsageRecords_ActiveJobCount DEFAULT 0,
            CompanyMemberCount INT NOT NULL CONSTRAINT DF_TenantUsageRecords_CompanyMemberCount DEFAULT 0,
            CvExtractionsUsed INT NOT NULL CONSTRAINT DF_TenantUsageRecords_CvExtractionsUsed DEFAULT 0,
            AssessmentsCompleted INT NOT NULL CONSTRAINT DF_TenantUsageRecords_AssessmentsCompleted DEFAULT 0,
            UpdatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_TenantUsageRecords_UpdatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_TenantUsageRecords PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_TenantUsageRecords_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
            CONSTRAINT UQ_TenantUsageRecords_CompanyId_Period UNIQUE (CompanyId, BillingPeriodMonth)
        );
    END;

    -- 4. BillingRecords Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'BillingRecords' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.BillingRecords (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_BillingRecords_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            Amount DECIMAL(18,2) NOT NULL,
            Currency NVARCHAR(10) NOT NULL CONSTRAINT DF_BillingRecords_Currency DEFAULT N'USD',
            InvoiceNumber NVARCHAR(100) NOT NULL,
            PaymentStatus INT NOT NULL CONSTRAINT DF_BillingRecords_PaymentStatus DEFAULT 0, -- 0: Pending, 1: Paid, 2: Failed, 3: Refunded
            PaymentMethodDescription NVARCHAR(100) NULL,
            PaidAtUtc DATETIMEOFFSET NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_BillingRecords_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_BillingRecords PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_BillingRecords_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_BillingRecords_InvoiceNumber ON dbo.BillingRecords (InvoiceNumber);
        CREATE NONCLUSTERED INDEX IX_BillingRecords_CompanyId_CreatedAtUtc ON dbo.BillingRecords (CompanyId, CreatedAtUtc);
    END;

    -- 5. PaymentWebhookEvents Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'PaymentWebhookEvents' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.PaymentWebhookEvents (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PaymentWebhookEvents_Id DEFAULT NEWSEQUENTIALID(),
            ProviderName NVARCHAR(50) NOT NULL CONSTRAINT DF_PaymentWebhookEvents_ProviderName DEFAULT N'Stripe',
            ProviderEventId NVARCHAR(255) NOT NULL,
            EventType NVARCHAR(100) NOT NULL,
            PayloadJson NVARCHAR(MAX) NOT NULL,
            IsProcessed BIT NOT NULL CONSTRAINT DF_PaymentWebhookEvents_IsProcessed DEFAULT 0,
            ProcessedAtUtc DATETIMEOFFSET NULL,
            ErrorMessage NVARCHAR(2000) NULL,
            ReceivedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_PaymentWebhookEvents_ReceivedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_PaymentWebhookEvents PRIMARY KEY CLUSTERED (Id)
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_PaymentWebhookEvents_Provider_EventId ON dbo.PaymentWebhookEvents (ProviderName, ProviderEventId);
        CREATE NONCLUSTERED INDEX IX_PaymentWebhookEvents_IsProcessed ON dbo.PaymentWebhookEvents (IsProcessed);
    END;

    -- 6. Notifications Table
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
    END;

    -- 7. EmailDeliveryAttempts Table
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
    END;

    -- 8. AuditLogs Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'AuditLogs' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.AuditLogs (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AuditLogs_Id DEFAULT NEWSEQUENTIALID(),
            ActorUserId UNIQUEIDENTIFIER NULL,
            CompanyId UNIQUEIDENTIFIER NULL,
            ActionType NVARCHAR(100) NOT NULL,
            TargetResource NVARCHAR(100) NOT NULL,
            TargetResourceId NVARCHAR(100) NOT NULL,
            IpAddress NVARCHAR(50) NULL,
            UserAgent NVARCHAR(500) NULL,
            MetadataJson NVARCHAR(MAX) NULL,
            TimestampUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_AuditLogs_TimestampUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_AuditLogs PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_AuditLogs_Users_ActorUserId FOREIGN KEY (ActorUserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_AuditLogs_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION
        );

        CREATE NONCLUSTERED INDEX IX_AuditLogs_CompanyId_TimestampUtc ON dbo.AuditLogs (CompanyId, TimestampUtc);
        CREATE NONCLUSTERED INDEX IX_AuditLogs_ActorUserId_TimestampUtc ON dbo.AuditLogs (ActorUserId, TimestampUtc);
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 005_CreateSubscriptionsAndOperationsSchema.sql executed successfully.';

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
