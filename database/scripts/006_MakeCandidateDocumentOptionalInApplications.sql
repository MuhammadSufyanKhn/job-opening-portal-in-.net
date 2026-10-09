-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   006_MakeCandidateDocumentOptionalInApplications.sql
-- Description: Alters dbo.JobApplications to make CandidateDocumentId NULLable.
--              Allows candidates to submit applications using their verified candidate
--              profile and structured cover note prior to the document extraction phase.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    IF EXISTS (
        SELECT 1 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.JobApplications') 
          AND name = N'CandidateDocumentId' 
          AND is_nullable = 0
    )
    BEGIN
        PRINT N'[INFO] Altering dbo.JobApplications.CandidateDocumentId to NULLable...';
        ALTER TABLE dbo.JobApplications ALTER COLUMN CandidateDocumentId UNIQUEIDENTIFIER NULL;
        PRINT N'[SUCCESS] dbo.JobApplications.CandidateDocumentId is now NULLable.';
    END
    ELSE
    BEGIN
        PRINT N'[INFO] dbo.JobApplications.CandidateDocumentId is already NULLable or table does not exist yet.';
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 006_MakeCandidateDocumentOptionalInApplications.sql executed successfully.';

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
