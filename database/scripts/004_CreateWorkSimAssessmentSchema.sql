-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   004_CreateWorkSimAssessmentSchema.sql
-- Description: Creates Reusable WorkSim Simulation Scenarios, Versions,
--              Job Assessment Configs, Sessions, Action Logs, and Results.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. SimulationScenarios Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'SimulationScenarios' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.SimulationScenarios (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_SimulationScenarios_Id DEFAULT NEWSEQUENTIALID(),
            OwnerCompanyId UNIQUEIDENTIFIER NULL,
            Title NVARCHAR(200) NOT NULL,
            Category NVARCHAR(100) NOT NULL,
            Description NVARCHAR(MAX) NOT NULL,
            EstimatedDurationMinutes INT NOT NULL,
            IsActive BIT NOT NULL CONSTRAINT DF_SimulationScenarios_IsActive DEFAULT 1,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_SimulationScenarios_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            UpdatedAtUtc DATETIMEOFFSET NULL,
            CONSTRAINT PK_SimulationScenarios PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_SimulationScenarios_Companies_OwnerCompanyId FOREIGN KEY (OwnerCompanyId) REFERENCES dbo.Companies (Id) ON DELETE SET NULL
        );

        CREATE NONCLUSTERED INDEX IX_SimulationScenarios_Category_IsActive ON dbo.SimulationScenarios (Category, IsActive);
        CREATE NONCLUSTERED INDEX IX_SimulationScenarios_OwnerCompanyId ON dbo.SimulationScenarios (OwnerCompanyId);
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SimulationScenarios') AND name = N'OwnerCompanyId')
        BEGIN
            ALTER TABLE dbo.SimulationScenarios ADD OwnerCompanyId UNIQUEIDENTIFIER NULL;
            ALTER TABLE dbo.SimulationScenarios ADD CONSTRAINT FK_SimulationScenarios_Companies_OwnerCompanyId FOREIGN KEY (OwnerCompanyId) REFERENCES dbo.Companies (Id) ON DELETE SET NULL;
            CREATE NONCLUSTERED INDEX IX_SimulationScenarios_OwnerCompanyId ON dbo.SimulationScenarios (OwnerCompanyId);
        END;
    END;

    -- 2. ScenarioVersions Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'ScenarioVersions' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.ScenarioVersions (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ScenarioVersions_Id DEFAULT NEWSEQUENTIALID(),
            SimulationScenarioId UNIQUEIDENTIFIER NOT NULL,
            VersionNumber INT NOT NULL,
            DefinitionJson NVARCHAR(MAX) NOT NULL,
            RubricJson NVARCHAR(MAX) NOT NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_ScenarioVersions_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_ScenarioVersions PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_ScenarioVersions_SimulationScenarios_SimulationScenarioId FOREIGN KEY (SimulationScenarioId) REFERENCES dbo.SimulationScenarios (Id) ON DELETE NO ACTION,
            CONSTRAINT UQ_ScenarioVersions_SimulationScenarioId_VersionNumber UNIQUE (SimulationScenarioId, VersionNumber)
        );
    END;

    -- 3. JobAssessmentConfigurations Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'JobAssessmentConfigurations' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.JobAssessmentConfigurations (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_JobAssessmentConfigurations_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            JobPostingId UNIQUEIDENTIFIER NOT NULL,
            ScenarioVersionId UNIQUEIDENTIFIER NOT NULL,
            IsRequired BIT NOT NULL CONSTRAINT DF_JobAssessmentConfigurations_IsRequired DEFAULT 1,
            MaxAllowedAttempts INT NOT NULL CONSTRAINT DF_JobAssessmentConfigurations_MaxAllowedAttempts DEFAULT 1,
            DeadlineDaysAfterAssignment INT NOT NULL CONSTRAINT DF_JobAssessmentConfigurations_DeadlineDaysAfterAssignment DEFAULT 7,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_JobAssessmentConfigurations_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_JobAssessmentConfigurations PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_JobAssessmentConfigurations_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_JobAssessmentConfigurations_JobPostings_JobPostingId FOREIGN KEY (JobPostingId) REFERENCES dbo.JobPostings (Id) ON DELETE CASCADE,
            CONSTRAINT FK_JobAssessmentConfigurations_ScenarioVersions_ScenarioVersionId FOREIGN KEY (ScenarioVersionId) REFERENCES dbo.ScenarioVersions (Id) ON DELETE NO ACTION
        );

        CREATE NONCLUSTERED INDEX IX_JobAssessmentConfigurations_JobPostingId ON dbo.JobAssessmentConfigurations (JobPostingId);
    END;

    -- 4. AssessmentAssignments Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'AssessmentAssignments' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.AssessmentAssignments (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AssessmentAssignments_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            JobApplicationId UNIQUEIDENTIFIER NOT NULL,
            JobAssessmentConfigurationId UNIQUEIDENTIFIER NOT NULL,
            CandidateProfileId UNIQUEIDENTIFIER NOT NULL,
            DeadlineUtc DATETIMEOFFSET NOT NULL,
            Status INT NOT NULL CONSTRAINT DF_AssessmentAssignments_Status DEFAULT 0, -- 0: Assigned, 1: InProgress, 2: Completed, 3: Expired
            AssignedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_AssessmentAssignments_AssignedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CompletedAtUtc DATETIMEOFFSET NULL,
            CONSTRAINT PK_AssessmentAssignments PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_AssessmentAssignments_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_AssessmentAssignments_JobApplications_JobApplicationId FOREIGN KEY (JobApplicationId) REFERENCES dbo.JobApplications (Id) ON DELETE CASCADE,
            CONSTRAINT FK_AssessmentAssignments_JobAssessmentConfigurations_JobAssessmentConfigurationId FOREIGN KEY (JobAssessmentConfigurationId) REFERENCES dbo.JobAssessmentConfigurations (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_AssessmentAssignments_CandidateProfiles_CandidateProfileId FOREIGN KEY (CandidateProfileId) REFERENCES dbo.CandidateProfiles (Id) ON DELETE NO ACTION
        );

        CREATE NONCLUSTERED INDEX IX_AssessmentAssignments_JobApplicationId ON dbo.AssessmentAssignments (JobApplicationId);
        CREATE NONCLUSTERED INDEX IX_AssessmentAssignments_CandidateProfileId ON dbo.AssessmentAssignments (CandidateProfileId);
    END;

    -- 5. SimulationSessions Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'SimulationSessions' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.SimulationSessions (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_SimulationSessions_Id DEFAULT NEWSEQUENTIALID(),
            AssessmentAssignmentId UNIQUEIDENTIFIER NOT NULL,
            CandidateProfileId UNIQUEIDENTIFIER NOT NULL,
            ScenarioVersionId UNIQUEIDENTIFIER NOT NULL,
            CurrentStateVectorJson NVARCHAR(MAX) NOT NULL,
            Status INT NOT NULL CONSTRAINT DF_SimulationSessions_Status DEFAULT 0, -- 0: Active, 1: Submitted, 2: TimedOut, 3: Aborted
            StartedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_SimulationSessions_StartedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            ExpiresAtUtc DATETIMEOFFSET NOT NULL,
            SubmittedAtUtc DATETIMEOFFSET NULL,
            TotalActionsTaken INT NOT NULL CONSTRAINT DF_SimulationSessions_TotalActionsTaken DEFAULT 0,
            RowVersion ROWVERSION NOT NULL,
            CONSTRAINT PK_SimulationSessions PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_SimulationSessions_AssessmentAssignments_AssessmentAssignmentId FOREIGN KEY (AssessmentAssignmentId) REFERENCES dbo.AssessmentAssignments (Id) ON DELETE CASCADE,
            CONSTRAINT FK_SimulationSessions_CandidateProfiles_CandidateProfileId FOREIGN KEY (CandidateProfileId) REFERENCES dbo.CandidateProfiles (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_SimulationSessions_ScenarioVersions_ScenarioVersionId FOREIGN KEY (ScenarioVersionId) REFERENCES dbo.ScenarioVersions (Id) ON DELETE NO ACTION
        );

        CREATE NONCLUSTERED INDEX IX_SimulationSessions_AssessmentAssignmentId ON dbo.SimulationSessions (AssessmentAssignmentId);
        CREATE NONCLUSTERED INDEX IX_SimulationSessions_CandidateProfileId_Status ON dbo.SimulationSessions (CandidateProfileId, Status);
    END;

    -- 6. SimulationActionLogs Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'SimulationActionLogs' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.SimulationActionLogs (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_SimulationActionLogs_Id DEFAULT NEWSEQUENTIALID(),
            SimulationSessionId UNIQUEIDENTIFIER NOT NULL,
            SequenceNumber INT NOT NULL,
            ActionType NVARCHAR(100) NOT NULL,
            ActionPayloadJson NVARCHAR(MAX) NOT NULL,
            CandidateRationale NVARCHAR(1000) NULL,
            ElapsedMillisecondsFromStart BIGINT NOT NULL,
            TimestampUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_SimulationActionLogs_TimestampUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_SimulationActionLogs PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_SimulationActionLogs_SimulationSessions_SimulationSessionId FOREIGN KEY (SimulationSessionId) REFERENCES dbo.SimulationSessions (Id) ON DELETE CASCADE,
            CONSTRAINT UQ_SimulationActionLogs_SimulationSessionId_SequenceNumber UNIQUE (SimulationSessionId, SequenceNumber)
        );

        CREATE NONCLUSTERED INDEX IX_SimulationActionLogs_Session_Timestamp ON dbo.SimulationActionLogs (SimulationSessionId, TimestampUtc);
    END;

    -- 7. AssessmentResults Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'AssessmentResults' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.AssessmentResults (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AssessmentResults_Id DEFAULT NEWSEQUENTIALID(),
            SimulationSessionId UNIQUEIDENTIFIER NOT NULL,
            ScenarioVersionId UNIQUEIDENTIFIER NOT NULL,
            TotalScore DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
            EvaluationSummary NVARCHAR(MAX) NOT NULL,
            CandidateFeedback NVARCHAR(MAX) NOT NULL,
            EvaluatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_AssessmentResults_EvaluatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_AssessmentResults PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_AssessmentResults_SimulationSessions_SimulationSessionId FOREIGN KEY (SimulationSessionId) REFERENCES dbo.SimulationSessions (Id) ON DELETE CASCADE,
            CONSTRAINT FK_AssessmentResults_ScenarioVersions_ScenarioVersionId FOREIGN KEY (ScenarioVersionId) REFERENCES dbo.ScenarioVersions (Id) ON DELETE NO ACTION,
            CONSTRAINT UQ_AssessmentResults_SimulationSessionId UNIQUE (SimulationSessionId)
        );
    END;

    -- 8. CriterionScores Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CriterionScores' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CriterionScores (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CriterionScores_Id DEFAULT NEWSEQUENTIALID(),
            AssessmentResultId UNIQUEIDENTIFIER NOT NULL,
            CriterionName NVARCHAR(100) NOT NULL,
            Score DECIMAL(5, 2) NOT NULL,
            MaxScore DECIMAL(5, 2) NOT NULL,
            SupportingEvidenceJson NVARCHAR(MAX) NOT NULL,
            Feedback NVARCHAR(MAX) NULL,
            CONSTRAINT PK_CriterionScores PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_CriterionScores_AssessmentResults_AssessmentResultId FOREIGN KEY (AssessmentResultId) REFERENCES dbo.AssessmentResults (Id) ON DELETE CASCADE
        );

        CREATE NONCLUSTERED INDEX IX_CriterionScores_AssessmentResultId ON dbo.CriterionScores (AssessmentResultId);
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CriterionScores') AND name = N'Feedback')
        BEGIN
            ALTER TABLE dbo.CriterionScores ADD Feedback NVARCHAR(MAX) NULL;
        END;
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 004_CreateWorkSimAssessmentSchema.sql executed successfully.';

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
