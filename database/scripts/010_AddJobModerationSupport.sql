-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   010_AddJobModerationSupport.sql
-- Description: Adds moderation tracking columns (ModerationReason, ModeratedAtUtc,
--              ModeratedByUserId) to JobPostings table for platform content moderation.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- Dependency:  002_CreateRecruitmentAndApplicationsSchema.sql
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. Enhance JobPostings Table with Content Moderation Columns
    IF EXISTS (SELECT * FROM sys.tables WHERE name = N'JobPostings' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        -- Add ModerationReason
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.JobPostings') AND name = N'ModerationReason')
        BEGIN
            ALTER TABLE dbo.JobPostings ADD ModerationReason NVARCHAR(500) NULL;
            PRINT N'Added ModerationReason column to JobPostings.';
        END;

        -- Add ModeratedAtUtc
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.JobPostings') AND name = N'ModeratedAtUtc')
        BEGIN
            ALTER TABLE dbo.JobPostings ADD ModeratedAtUtc DATETIMEOFFSET NULL;
            PRINT N'Added ModeratedAtUtc column to JobPostings.';
        END;

        -- Add ModeratedByUserId
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.JobPostings') AND name = N'ModeratedByUserId')
        BEGIN
            ALTER TABLE dbo.JobPostings ADD ModeratedByUserId UNIQUEIDENTIFIER NULL;
            PRINT N'Added ModeratedByUserId column to JobPostings.';

            -- Optional foreign key constraint to Users
            IF EXISTS (SELECT * FROM sys.tables WHERE name = N'Users' AND schema_id = SCHEMA_ID(N'dbo'))
               AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = N'FK_JobPostings_Users_ModeratedByUserId')
            BEGIN
                EXEC sp_executesql N'
                    ALTER TABLE dbo.JobPostings ADD CONSTRAINT FK_JobPostings_Users_ModeratedByUserId
                        FOREIGN KEY (ModeratedByUserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION;
                ';
                PRINT N'Added FK_JobPostings_Users_ModeratedByUserId constraint.';
            END;
        END;

        -- Index for moderated job listing queries
        -- Note: Wrapped in sp_executesql so SQL Server compiles this statement at runtime after ModeratedAtUtc column is added
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_JobPostings_ModeratedAtUtc' AND object_id = OBJECT_ID(N'dbo.JobPostings'))
        BEGIN
            EXEC sp_executesql N'
                CREATE NONCLUSTERED INDEX IX_JobPostings_ModeratedAtUtc
                ON dbo.JobPostings (ModeratedAtUtc)
                WHERE ModeratedAtUtc IS NOT NULL;
            ';
            PRINT N'Created index IX_JobPostings_ModeratedAtUtc on JobPostings.';
        END;
    END
    ELSE
    BEGIN
        PRINT N'WARNING: JobPostings table not found. Ensure script 002 has been executed first.';
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 010_AddJobModerationSupport.sql executed successfully.';

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
