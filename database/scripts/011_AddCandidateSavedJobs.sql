-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   011_AddCandidateSavedJobs.sql
-- Description: Creates CandidateSavedJobs table to support candidate job bookmarking
--              with unique constraint, foreign keys, and indexes.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- Dependency:  001_CreateCoreIdentityAndTenantSchema.sql, 002_CreateRecruitmentAndApplicationsSchema.sql
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. Create CandidateSavedJobs Table if it does not exist
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CandidateSavedJobs' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CandidateSavedJobs (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CandidateSavedJobs PRIMARY KEY DEFAULT NEWID(),
            CandidateProfileId UNIQUEIDENTIFIER NOT NULL,
            JobPostingId UNIQUEIDENTIFIER NOT NULL,
            SavedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            
            CONSTRAINT FK_CandidateSavedJobs_CandidateProfiles 
                FOREIGN KEY (CandidateProfileId) REFERENCES dbo.CandidateProfiles(Id) ON DELETE CASCADE,
                
            CONSTRAINT FK_CandidateSavedJobs_JobPostings 
                FOREIGN KEY (JobPostingId) REFERENCES dbo.JobPostings(Id) ON DELETE CASCADE,

            CONSTRAINT UQ_CandidateSavedJobs_Candidate_Job 
                UNIQUE (CandidateProfileId, JobPostingId)
        );

        PRINT N'Created table dbo.CandidateSavedJobs with unique candidate-job constraint.';
    END
    ELSE
    BEGIN
        PRINT N'Table dbo.CandidateSavedJobs already exists. Skipping table creation.';
    END;

    -- 2. Create Index on CandidateProfileId and SavedAtUtc for fast candidate dashboard / saved jobs querying
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_CandidateSavedJobs_CandidateProfileId_SavedAtUtc' AND object_id = OBJECT_ID(N'dbo.CandidateSavedJobs'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_CandidateSavedJobs_CandidateProfileId_SavedAtUtc
            ON dbo.CandidateSavedJobs (CandidateProfileId, SavedAtUtc DESC);

        PRINT N'Created index IX_CandidateSavedJobs_CandidateProfileId_SavedAtUtc.';
    END;

    -- 3. Create Index on JobPostingId
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_CandidateSavedJobs_JobPostingId' AND object_id = OBJECT_ID(N'dbo.CandidateSavedJobs'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_CandidateSavedJobs_JobPostingId
            ON dbo.CandidateSavedJobs (JobPostingId);

        PRINT N'Created index IX_CandidateSavedJobs_JobPostingId.';
    END;

    COMMIT TRANSACTION;
    PRINT N'Migration 011_AddCandidateSavedJobs completed successfully.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
