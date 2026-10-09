-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   002_CreateRecruitmentAndApplicationsSchema.sql
-- Description: Creates Job Marketplace, Versioned Job Descriptions,
--              Candidate Profiles, Documents, Applications, Interviews, Notes.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. JobCategories Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'JobCategories' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.JobCategories (
            Id INT IDENTITY(1,1) NOT NULL,
            Name NVARCHAR(100) NOT NULL,
            Slug NVARCHAR(120) NOT NULL,
            Description NVARCHAR(255) NULL,
            DisplayOrder INT NOT NULL CONSTRAINT DF_JobCategories_DisplayOrder DEFAULT 0,
            CONSTRAINT PK_JobCategories PRIMARY KEY CLUSTERED (Id)
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_JobCategories_Name ON dbo.JobCategories (Name);
        CREATE UNIQUE NONCLUSTERED INDEX UQ_JobCategories_Slug ON dbo.JobCategories (Slug);
    END;

    -- 2. JobPostings Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'JobPostings' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.JobPostings (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_JobPostings_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            JobCategoryId INT NOT NULL,
            Title NVARCHAR(200) NOT NULL,
            Slug NVARCHAR(220) NOT NULL,
            Summary NVARCHAR(500) NOT NULL,
            Description NVARCHAR(MAX) NOT NULL,
            Responsibilities NVARCHAR(MAX) NOT NULL,
            EmploymentType INT NOT NULL CONSTRAINT DF_JobPostings_EmploymentType DEFAULT 0, -- 0: FullTime, 1: PartTime, 2: Contract, 3: Internship
            WorkplaceType INT NOT NULL CONSTRAINT DF_JobPostings_WorkplaceType DEFAULT 0,   -- 0: OnSite, 1: Hybrid, 2: Remote
            Location NVARCHAR(200) NOT NULL,
            SalaryMin DECIMAL(18,2) NULL,
            SalaryMax DECIMAL(18,2) NULL,
            SalaryCurrency NVARCHAR(10) NOT NULL CONSTRAINT DF_JobPostings_SalaryCurrency DEFAULT N'USD',
            Status INT NOT NULL CONSTRAINT DF_JobPostings_Status DEFAULT 0, -- 0: Draft, 1: Published, 2: Paused, 3: Closed, 4: Archived
            PublishedAtUtc DATETIMEOFFSET NULL,
            ExpiresAtUtc DATETIMEOFFSET NULL,
            ActiveVersionNumber INT NOT NULL CONSTRAINT DF_JobPostings_ActiveVersionNumber DEFAULT 1,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_JobPostings_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            UpdatedAtUtc DATETIMEOFFSET NULL,
            RowVersion ROWVERSION NOT NULL,
            IsDeleted BIT NOT NULL CONSTRAINT DF_JobPostings_IsDeleted DEFAULT 0,
            DeletedAtUtc DATETIMEOFFSET NULL,
            CONSTRAINT PK_JobPostings PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_JobPostings_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_JobPostings_JobCategories_JobCategoryId FOREIGN KEY (JobCategoryId) REFERENCES dbo.JobCategories (Id) ON DELETE NO ACTION
        );

        CREATE NONCLUSTERED INDEX IX_JobPostings_CompanyId_Status ON dbo.JobPostings (CompanyId, Status);
        CREATE NONCLUSTERED INDEX IX_JobPostings_Status_PublishedAtUtc ON dbo.JobPostings (Status, PublishedAtUtc)
            INCLUDE (Title, Location, WorkplaceType, EmploymentType, SalaryMin, SalaryMax, CompanyId)
            WHERE IsDeleted = 0;
    END;

    -- 3. JobRequirements Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'JobRequirements' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.JobRequirements (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_JobRequirements_Id DEFAULT NEWSEQUENTIALID(),
            JobPostingId UNIQUEIDENTIFIER NOT NULL,
            RequirementText NVARCHAR(500) NOT NULL,
            RequirementCategory INT NOT NULL CONSTRAINT DF_JobRequirements_RequirementCategory DEFAULT 0, -- 0: Skill, 1: Experience, 2: Education, 3: Certification
            RequirementType INT NOT NULL CONSTRAINT DF_JobRequirements_RequirementType DEFAULT 0,         -- 0: Mandatory, 1: Preferred
            DisplayOrder INT NOT NULL CONSTRAINT DF_JobRequirements_DisplayOrder DEFAULT 0,
            CONSTRAINT PK_JobRequirements PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_JobRequirements_JobPostings_JobPostingId FOREIGN KEY (JobPostingId) REFERENCES dbo.JobPostings (Id) ON DELETE CASCADE
        );

        CREATE NONCLUSTERED INDEX IX_JobRequirements_JobPostingId ON dbo.JobRequirements (JobPostingId);
    END;

    -- 4. JobDescriptionVersions Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'JobDescriptionVersions' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.JobDescriptionVersions (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_JobDescriptionVersions_Id DEFAULT NEWSEQUENTIALID(),
            JobPostingId UNIQUEIDENTIFIER NOT NULL,
            VersionNumber INT NOT NULL,
            SnapshotJson NVARCHAR(MAX) NOT NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_JobDescriptionVersions_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_JobDescriptionVersions PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_JobDescriptionVersions_JobPostings_JobPostingId FOREIGN KEY (JobPostingId) REFERENCES dbo.JobPostings (Id) ON DELETE NO ACTION,
            CONSTRAINT UQ_JobDescriptionVersions_JobPostingId_VersionNumber UNIQUE (JobPostingId, VersionNumber)
        );
    END;

    -- 5. CandidateProfiles Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CandidateProfiles' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CandidateProfiles (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CandidateProfiles_Id DEFAULT NEWSEQUENTIALID(),
            UserId UNIQUEIDENTIFIER NOT NULL,
            Headline NVARCHAR(200) NULL,
            Summary NVARCHAR(MAX) NULL,
            Location NVARCHAR(200) NULL,
            YearsOfExperience INT NULL,
            LinkedInUrl NVARCHAR(500) NULL,
            GitHubUrl NVARCHAR(500) NULL,
            PortfolioUrl NVARCHAR(500) NULL,
            UpdatedAtUtc DATETIMEOFFSET NULL,
            CONSTRAINT PK_CandidateProfiles PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_CandidateProfiles_Users_UserId FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE CASCADE,
            CONSTRAINT UQ_CandidateProfiles_UserId UNIQUE (UserId)
        );
    END;

    -- 6. CandidateDocuments Table (CVs)
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CandidateDocuments' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CandidateDocuments (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CandidateDocuments_Id DEFAULT NEWSEQUENTIALID(),
            CandidateProfileId UNIQUEIDENTIFIER NOT NULL,
            OriginalFileName NVARCHAR(255) NOT NULL,
            StorageKey NVARCHAR(255) NOT NULL,
            FileExtension NVARCHAR(10) NOT NULL,
            MimeType NVARCHAR(100) NOT NULL,
            FileSizeBytes BIGINT NOT NULL,
            IsDefault BIT NOT NULL CONSTRAINT DF_CandidateDocuments_IsDefault DEFAULT 0,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_CandidateDocuments_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            IsDeleted BIT NOT NULL CONSTRAINT DF_CandidateDocuments_IsDeleted DEFAULT 0,
            DeletedAtUtc DATETIMEOFFSET NULL,
            CONSTRAINT PK_CandidateDocuments PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_CandidateDocuments_CandidateProfiles_CandidateProfileId FOREIGN KEY (CandidateProfileId) REFERENCES dbo.CandidateProfiles (Id) ON DELETE NO ACTION
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_CandidateDocuments_StorageKey ON dbo.CandidateDocuments (StorageKey);
        CREATE NONCLUSTERED INDEX IX_CandidateDocuments_CandidateProfileId ON dbo.CandidateDocuments (CandidateProfileId, IsDefault);
    END;

    -- 7. JobApplications Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'JobApplications' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.JobApplications (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_JobApplications_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            JobPostingId UNIQUEIDENTIFIER NOT NULL,
            JobDescriptionVersionId UNIQUEIDENTIFIER NOT NULL,
            CandidateProfileId UNIQUEIDENTIFIER NOT NULL,
            CandidateDocumentId UNIQUEIDENTIFIER NULL,
            CurrentStage INT NOT NULL CONSTRAINT DF_JobApplications_CurrentStage DEFAULT 0, -- 0: Submitted, 1: UnderReview, 2: Shortlisted, 3: AssessmentPending, 4: AssessmentCompleted, 5: InterviewScheduled, 6: Offered, 7: Hired, 8: Rejected, 9: Withdrawn
            SubmittedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_JobApplications_SubmittedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            StageUpdatedAtUtc DATETIMEOFFSET NULL,
            CandidateCoverNote NVARCHAR(2000) NULL,
            CONSTRAINT PK_JobApplications PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_JobApplications_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_JobApplications_JobPostings_JobPostingId FOREIGN KEY (JobPostingId) REFERENCES dbo.JobPostings (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_JobApplications_JobDescriptionVersions_JobDescriptionVersionId FOREIGN KEY (JobDescriptionVersionId) REFERENCES dbo.JobDescriptionVersions (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_JobApplications_CandidateProfiles_CandidateProfileId FOREIGN KEY (CandidateProfileId) REFERENCES dbo.CandidateProfiles (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_JobApplications_CandidateDocuments_CandidateDocumentId FOREIGN KEY (CandidateDocumentId) REFERENCES dbo.CandidateDocuments (Id) ON DELETE NO ACTION,
            CONSTRAINT UQ_JobApplications_JobPostingId_CandidateProfileId UNIQUE (JobPostingId, CandidateProfileId)
        );

        CREATE NONCLUSTERED INDEX IX_JobApplications_CompanyId_CurrentStage ON dbo.JobApplications (CompanyId, CurrentStage);
        CREATE NONCLUSTERED INDEX IX_JobApplications_CandidateProfileId ON dbo.JobApplications (CandidateProfileId);
    END;

    -- 8. ApplicationStatusHistories Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'ApplicationStatusHistories' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.ApplicationStatusHistories (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ApplicationStatusHistories_Id DEFAULT NEWSEQUENTIALID(),
            JobApplicationId UNIQUEIDENTIFIER NOT NULL,
            PreviousStage INT NOT NULL,
            NewStage INT NOT NULL,
            ChangedByUserId UNIQUEIDENTIFIER NOT NULL,
            ReasonNote NVARCHAR(1000) NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_ApplicationStatusHistories_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_ApplicationStatusHistories PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_ApplicationStatusHistories_JobApplications_JobApplicationId FOREIGN KEY (JobApplicationId) REFERENCES dbo.JobApplications (Id) ON DELETE CASCADE,
            CONSTRAINT FK_ApplicationStatusHistories_Users_ChangedByUserId FOREIGN KEY (ChangedByUserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION
        );

        CREATE NONCLUSTERED INDEX IX_ApplicationStatusHistories_JobApplicationId ON dbo.ApplicationStatusHistories (JobApplicationId, CreatedAtUtc);
    END;

    -- 9. CandidateNotes Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CandidateNotes' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
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

        CREATE NONCLUSTERED INDEX IX_CandidateNotes_JobApplicationId ON dbo.CandidateNotes (JobApplicationId);
    END;

    -- 10. InterviewSchedules Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'InterviewSchedules' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
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

        CREATE NONCLUSTERED INDEX IX_InterviewSchedules_CompanyId_ScheduledStartUtc ON dbo.InterviewSchedules (CompanyId, ScheduledStartUtc);
        CREATE NONCLUSTERED INDEX IX_InterviewSchedules_JobApplicationId ON dbo.InterviewSchedules (JobApplicationId);
    END;

    -- 11. ScorecardReviews Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'ScorecardReviews' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.ScorecardReviews (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ScorecardReviews_Id DEFAULT NEWSEQUENTIALID(),
            InterviewScheduleId UNIQUEIDENTIFIER NOT NULL,
            ReviewerUserId UNIQUEIDENTIFIER NOT NULL,
            Recommendation INT NOT NULL CONSTRAINT DF_ScorecardReviews_Recommendation DEFAULT 2, -- 0: StrongNo, 1: No, 2: Neutral, 3: Yes, 4: StrongYes
            EvaluationJson NVARCHAR(MAX) NOT NULL,
            SubmittedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_ScorecardReviews_SubmittedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_ScorecardReviews PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_ScorecardReviews_InterviewSchedules_InterviewScheduleId FOREIGN KEY (InterviewScheduleId) REFERENCES dbo.InterviewSchedules (Id) ON DELETE CASCADE,
            CONSTRAINT FK_ScorecardReviews_Users_ReviewerUserId FOREIGN KEY (ReviewerUserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION
        );

        CREATE NONCLUSTERED INDEX IX_ScorecardReviews_InterviewScheduleId ON dbo.ScorecardReviews (InterviewScheduleId);
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 002_CreateRecruitmentAndApplicationsSchema.sql executed successfully.';

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
