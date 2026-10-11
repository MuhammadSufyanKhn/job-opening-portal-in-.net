-- =====================================================================================
-- HireSphere Database Migration Script
-- Script ID: 012_EnsureRecruiterNotesAndInterviewSchedules.sql
-- Description: Idempotent script ensuring dbo.CandidateNotes and dbo.InterviewSchedules
--              tables, constraints, and indexes exist for Prompt 11 Company Workspace
--              recruitment pipeline, interview coordination, and private recruiter notes.
-- Author: HireSphere Engineering
-- Target Engine: Microsoft SQL Server 2019+
-- Execution Mode: Manual (SSMS) - NEVER automatically executed by code
-- =====================================================================================

USE HireSphereDb;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

PRINT '>>> [012] Verifying and ensuring CandidateNotes and InterviewSchedules schema...';

-- -------------------------------------------------------------------------------------
-- 1. CandidateNotes Table
-- -------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CandidateNotes' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    PRINT '    Creating dbo.CandidateNotes table...';
    CREATE TABLE dbo.CandidateNotes (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CandidateNotes_Id DEFAULT NEWSEQUENTIALID(),
        CompanyId UNIQUEIDENTIFIER NOT NULL,
        JobApplicationId UNIQUEIDENTIFIER NOT NULL,
        AuthorUserId UNIQUEIDENTIFIER NOT NULL,
        NoteText NVARCHAR(MAX) NOT NULL,
        CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_CandidateNotes_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
        UpdatedAtUtc DATETIMEOFFSET NULL,
        IsDeleted BIT NOT NULL CONSTRAINT DF_CandidateNotes_IsDeleted DEFAULT 0,
        CONSTRAINT PK_CandidateNotes PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_CandidateNotes_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
        CONSTRAINT FK_CandidateNotes_JobApplications_JobApplicationId FOREIGN KEY (JobApplicationId) REFERENCES dbo.JobApplications (Id) ON DELETE CASCADE,
        CONSTRAINT FK_CandidateNotes_Users_AuthorUserId FOREIGN KEY (AuthorUserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION
    );
END
ELSE
BEGIN
    PRINT '    dbo.CandidateNotes already exists. Ensuring columns and defaults...';
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CandidateNotes') AND name = N'IsDeleted')
    BEGIN
        ALTER TABLE dbo.CandidateNotes ADD IsDeleted BIT NOT NULL CONSTRAINT DF_CandidateNotes_IsDeleted DEFAULT 0;
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CandidateNotes') AND name = N'UpdatedAtUtc')
    BEGIN
        ALTER TABLE dbo.CandidateNotes ADD UpdatedAtUtc DATETIMEOFFSET NULL;
    END;
END;
GO

-- Indexes for CandidateNotes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.CandidateNotes') AND name = N'IX_CandidateNotes_JobApplicationId')
BEGIN
    PRINT '    Creating non-clustered index IX_CandidateNotes_JobApplicationId...';
    CREATE NONCLUSTERED INDEX IX_CandidateNotes_JobApplicationId ON dbo.CandidateNotes (JobApplicationId);
END;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.CandidateNotes') AND name = N'IX_CandidateNotes_CompanyId_CreatedAtUtc')
BEGIN
    PRINT '    Creating non-clustered index IX_CandidateNotes_CompanyId_CreatedAtUtc...';
    CREATE NONCLUSTERED INDEX IX_CandidateNotes_CompanyId_CreatedAtUtc ON dbo.CandidateNotes (CompanyId, CreatedAtUtc DESC);
END;
GO

-- -------------------------------------------------------------------------------------
-- 2. InterviewSchedules Table
-- -------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'InterviewSchedules' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    PRINT '    Creating dbo.InterviewSchedules table...';
    CREATE TABLE dbo.InterviewSchedules (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_InterviewSchedules_Id DEFAULT NEWSEQUENTIALID(),
        CompanyId UNIQUEIDENTIFIER NOT NULL,
        JobApplicationId UNIQUEIDENTIFIER NOT NULL,
        InterviewType INT NOT NULL CONSTRAINT DF_InterviewSchedules_InterviewType DEFAULT 0, -- 0: Screening, 1: Technical, 2: Cultural, 3: Final
        ScheduledStartUtc DATETIMEOFFSET NOT NULL,
        ScheduledEndUtc DATETIMEOFFSET NOT NULL,
        MeetingLocation NVARCHAR(500) NULL,
        Status INT NOT NULL CONSTRAINT DF_InterviewSchedules_Status DEFAULT 0, -- 0: Scheduled, 1: Completed, 2: Rescheduled, 3: Canceled
        CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_InterviewSchedules_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
        UpdatedAtUtc DATETIMEOFFSET NULL,
        CONSTRAINT PK_InterviewSchedules PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_InterviewSchedules_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
        CONSTRAINT FK_InterviewSchedules_JobApplications_JobApplicationId FOREIGN KEY (JobApplicationId) REFERENCES dbo.JobApplications (Id) ON DELETE CASCADE
    );
END
ELSE
BEGIN
    PRINT '    dbo.InterviewSchedules already exists. Ensuring columns and defaults...';

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.InterviewSchedules') AND name = N'MeetingLocation')
    BEGIN
        ALTER TABLE dbo.InterviewSchedules ADD MeetingLocation NVARCHAR(500) NULL;
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.InterviewSchedules') AND name = N'Status')
    BEGIN
        ALTER TABLE dbo.InterviewSchedules ADD Status INT NOT NULL CONSTRAINT DF_InterviewSchedules_Status DEFAULT 0;
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.InterviewSchedules') AND name = N'UpdatedAtUtc')
    BEGIN
        ALTER TABLE dbo.InterviewSchedules ADD UpdatedAtUtc DATETIMEOFFSET NULL;
    END;
END;
GO

-- Indexes for InterviewSchedules
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.InterviewSchedules') AND name = N'IX_InterviewSchedules_CompanyId_ScheduledStartUtc')
BEGIN
    PRINT '    Creating non-clustered index IX_InterviewSchedules_CompanyId_ScheduledStartUtc...';
    CREATE NONCLUSTERED INDEX IX_InterviewSchedules_CompanyId_ScheduledStartUtc ON dbo.InterviewSchedules (CompanyId, ScheduledStartUtc);
END;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.InterviewSchedules') AND name = N'IX_InterviewSchedules_JobApplicationId')
BEGIN
    PRINT '    Creating non-clustered index IX_InterviewSchedules_JobApplicationId...';
    CREATE NONCLUSTERED INDEX IX_InterviewSchedules_JobApplicationId ON dbo.InterviewSchedules (JobApplicationId);
END;
GO

PRINT '>>> [012] CandidateNotes and InterviewSchedules verification completed successfully.';
GO
