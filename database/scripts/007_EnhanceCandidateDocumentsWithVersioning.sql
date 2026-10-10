-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   007_EnhanceCandidateDocumentsWithVersioning.sql
-- Description: Adds VersionNumber, RootDocumentId (version chaining), and 
--              ContentHash (SHA-256) to dbo.CandidateDocuments.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- Prerequisites: 002_CreateRecruitmentAndApplicationsSchema.sql executed.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    IF EXISTS (SELECT * FROM sys.tables WHERE name = N'CandidateDocuments' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        -- 1. VersionNumber
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CandidateDocuments') AND name = N'VersionNumber')
        BEGIN
            ALTER TABLE dbo.CandidateDocuments
            ADD VersionNumber INT NOT NULL CONSTRAINT DF_CandidateDocuments_VersionNumber DEFAULT 1;
            PRINT N'[INFO] Added VersionNumber to CandidateDocuments.';
        END;

        -- 2. RootDocumentId (Self-referencing version family)
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CandidateDocuments') AND name = N'RootDocumentId')
        BEGIN
            ALTER TABLE dbo.CandidateDocuments
            ADD RootDocumentId UNIQUEIDENTIFIER NULL;

            ALTER TABLE dbo.CandidateDocuments
            ADD CONSTRAINT FK_CandidateDocuments_CandidateDocuments_RootDocumentId
            FOREIGN KEY (RootDocumentId) REFERENCES dbo.CandidateDocuments (Id) ON DELETE NO ACTION;

            CREATE NONCLUSTERED INDEX IX_CandidateDocuments_RootDocumentId 
            ON dbo.CandidateDocuments (RootDocumentId);

            PRINT N'[INFO] Added RootDocumentId to CandidateDocuments with self-referencing foreign key.';
        END;

        -- 3. ContentHash (SHA-256 hexadecimal hash)
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CandidateDocuments') AND name = N'ContentHash')
        BEGIN
            ALTER TABLE dbo.CandidateDocuments
            ADD ContentHash NVARCHAR(64) NULL;

            CREATE NONCLUSTERED INDEX IX_CandidateDocuments_ContentHash
            ON dbo.CandidateDocuments (ContentHash);

            PRINT N'[INFO] Added ContentHash to CandidateDocuments.';
        END;
    END;
    ELSE
    BEGIN
        RAISERROR (N'Table dbo.CandidateDocuments does not exist. Please run 002_CreateRecruitmentAndApplicationsSchema.sql first.', 16, 1);
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 007_EnhanceCandidateDocumentsWithVersioning.sql executed successfully.';

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
