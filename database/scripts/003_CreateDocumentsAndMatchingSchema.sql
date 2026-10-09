-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   003_CreateDocumentsAndMatchingSchema.sql
-- Description: Creates CV Text Extraction Jobs, Explainable Match Reports,
--              and Itemized Requirement Evaluations.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. DocumentExtractionJobs Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'DocumentExtractionJobs' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.DocumentExtractionJobs (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_DocumentExtractionJobs_Id DEFAULT NEWSEQUENTIALID(),
            CandidateDocumentId UNIQUEIDENTIFIER NOT NULL,
            Status INT NOT NULL CONSTRAINT DF_DocumentExtractionJobs_Status DEFAULT 0, -- 0: Pending, 1: Processing, 2: Success, 3: Failed, 4: ScannedPdfDetected
            ExtractedText NVARCHAR(MAX) NULL,
            ParserVersion NVARCHAR(50) NOT NULL CONSTRAINT DF_DocumentExtractionJobs_ParserVersion DEFAULT N'1.0',
            ErrorMessage NVARCHAR(2000) NULL,
            AttemptCount INT NOT NULL CONSTRAINT DF_DocumentExtractionJobs_AttemptCount DEFAULT 0,
            StartedAtUtc DATETIMEOFFSET NULL,
            CompletedAtUtc DATETIMEOFFSET NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_DocumentExtractionJobs_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_DocumentExtractionJobs PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_DocumentExtractionJobs_CandidateDocuments_CandidateDocumentId FOREIGN KEY (CandidateDocumentId) REFERENCES dbo.CandidateDocuments (Id) ON DELETE CASCADE
        );

        CREATE NONCLUSTERED INDEX IX_DocumentExtractionJobs_Status ON dbo.DocumentExtractionJobs (Status, CandidateDocumentId);
    END;

    -- 2. CvMatchReports Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CvMatchReports' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CvMatchReports (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CvMatchReports_Id DEFAULT NEWSEQUENTIALID(),
            JobApplicationId UNIQUEIDENTIFIER NOT NULL,
            JobDescriptionVersionId UNIQUEIDENTIFIER NOT NULL,
            DocumentExtractionJobId UNIQUEIDENTIFIER NOT NULL,
            OverallEvidenceIndex DECIMAL(5, 2) NOT NULL, -- Summary index (0.00 to 100.00)
            EngineVersion NVARCHAR(50) NOT NULL CONSTRAINT DF_CvMatchReports_EngineVersion DEFAULT N'1.0-deterministic',
            CalculationSummary NVARCHAR(MAX) NOT NULL,
            CalculatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_CvMatchReports_CalculatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_CvMatchReports PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_CvMatchReports_JobApplications_JobApplicationId FOREIGN KEY (JobApplicationId) REFERENCES dbo.JobApplications (Id) ON DELETE CASCADE,
            CONSTRAINT FK_CvMatchReports_JobDescriptionVersions_JobDescriptionVersionId FOREIGN KEY (JobDescriptionVersionId) REFERENCES dbo.JobDescriptionVersions (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_CvMatchReports_DocumentExtractionJobs_DocumentExtractionJobId FOREIGN KEY (DocumentExtractionJobId) REFERENCES dbo.DocumentExtractionJobs (Id) ON DELETE NO ACTION,
            CONSTRAINT UQ_CvMatchReports_JobApplicationId UNIQUE (JobApplicationId)
        );
    END;

    -- 3. CvRequirementEvaluations Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CvRequirementEvaluations' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CvRequirementEvaluations (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CvRequirementEvaluations_Id DEFAULT NEWSEQUENTIALID(),
            CvMatchReportId UNIQUEIDENTIFIER NOT NULL,
            JobRequirementId UNIQUEIDENTIFIER NOT NULL,
            Status INT NOT NULL, -- 0: SupportedByEvidence, 1: PartiallySupported, 2: NotFound, 3: RequiresManualReview
            ConfidenceLevel DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
            ExtractedExcerpt NVARCHAR(2000) NULL,
            ReviewerNote NVARCHAR(1000) NULL,
            ReviewerOverriddenStatus INT NULL,
            EvaluatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_CvRequirementEvaluations_EvaluatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_CvRequirementEvaluations PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_CvRequirementEvaluations_CvMatchReports_CvMatchReportId FOREIGN KEY (CvMatchReportId) REFERENCES dbo.CvMatchReports (Id) ON DELETE CASCADE,
            CONSTRAINT FK_CvRequirementEvaluations_JobRequirements_JobRequirementId FOREIGN KEY (JobRequirementId) REFERENCES dbo.JobRequirements (Id) ON DELETE NO ACTION
        );

        CREATE NONCLUSTERED INDEX IX_CvRequirementEvaluations_CvMatchReportId ON dbo.CvRequirementEvaluations (CvMatchReportId);
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 003_CreateDocumentsAndMatchingSchema.sql executed successfully.';

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
