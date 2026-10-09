-- ============================================================================
-- HireSphere Database Migration Script
-- Script ID:   001_CreateCoreIdentityAndTenantSchema.sql
-- Description: Creates Core Identity (Users, Roles, UserRoles, RefreshTokens)
--              and Tenant Organizations (Companies, Members, Invitations).
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. Users Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Users' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.Users (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_Id DEFAULT NEWSEQUENTIALID(),
            Email NVARCHAR(256) NOT NULL,
            NormalizedEmail NVARCHAR(256) NOT NULL,
            PasswordHash NVARCHAR(MAX) NOT NULL,
            SecurityStamp NVARCHAR(MAX) NOT NULL,
            PhoneNumber NVARCHAR(50) NULL,
            FirstName NVARCHAR(100) NOT NULL,
            LastName NVARCHAR(100) NOT NULL,
            AccountStatus INT NOT NULL CONSTRAINT DF_Users_AccountStatus DEFAULT 0, -- 0: Active, 1: Disabled, 2: PendingVerification
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_Users_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            UpdatedAtUtc DATETIMEOFFSET NULL,
            IsDeleted BIT NOT NULL CONSTRAINT DF_Users_IsDeleted DEFAULT 0,
            DeletedAtUtc DATETIMEOFFSET NULL,
            CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id)
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_NormalizedEmail ON dbo.Users (NormalizedEmail);
        CREATE NONCLUSTERED INDEX IX_Users_AccountStatus ON dbo.Users (AccountStatus);
    END;

    -- 2. Roles Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Roles' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.Roles (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Roles_Id DEFAULT NEWSEQUENTIALID(),
            Name NVARCHAR(50) NOT NULL,
            NormalizedName NVARCHAR(50) NOT NULL,
            Description NVARCHAR(255) NULL,
            CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (Id)
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_Roles_NormalizedName ON dbo.Roles (NormalizedName);
    END;

    -- 3. UserRoles Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'UserRoles' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.UserRoles (
            UserId UNIQUEIDENTIFIER NOT NULL,
            RoleId UNIQUEIDENTIFIER NOT NULL,
            AssignedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_UserRoles_AssignedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_UserRoles PRIMARY KEY CLUSTERED (UserId, RoleId),
            CONSTRAINT FK_UserRoles_Users_UserId FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE CASCADE,
            CONSTRAINT FK_UserRoles_Roles_RoleId FOREIGN KEY (RoleId) REFERENCES dbo.Roles (Id) ON DELETE CASCADE
        );
    END;

    -- 4. RefreshTokens Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'RefreshTokens' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.RefreshTokens (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_RefreshTokens_Id DEFAULT NEWSEQUENTIALID(),
            UserId UNIQUEIDENTIFIER NOT NULL,
            TokenHash NVARCHAR(256) NOT NULL,
            ExpiresAtUtc DATETIMEOFFSET NOT NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_RefreshTokens_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            RevokedAtUtc DATETIMEOFFSET NULL,
            ReplacedByTokenHash NVARCHAR(256) NULL,
            CONSTRAINT PK_RefreshTokens PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_RefreshTokens_Users_UserId FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE CASCADE
        );

        CREATE NONCLUSTERED INDEX IX_RefreshTokens_UserId_TokenHash ON dbo.RefreshTokens (UserId, TokenHash);
    END;

    -- 5. Companies Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Companies' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.Companies (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Companies_Id DEFAULT NEWSEQUENTIALID(),
            Name NVARCHAR(200) NOT NULL,
            Slug NVARCHAR(220) NOT NULL,
            BusinessRegistrationNumber NVARCHAR(100) NULL,
            WebsiteUrl NVARCHAR(500) NULL,
            LogoUrl NVARCHAR(500) NULL,
            Industry NVARCHAR(100) NOT NULL,
            CompanySize NVARCHAR(50) NULL,
            Description NVARCHAR(MAX) NULL,
            ContactEmail NVARCHAR(256) NOT NULL,
            ApprovalStatus INT NOT NULL CONSTRAINT DF_Companies_ApprovalStatus DEFAULT 0, -- 0: PendingApproval, 1: Approved, 2: Rejected, 3: Suspended
            RejectionReason NVARCHAR(1000) NULL,
            ApprovedAtUtc DATETIMEOFFSET NULL,
            ApprovedByUserId UNIQUEIDENTIFIER NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_Companies_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            UpdatedAtUtc DATETIMEOFFSET NULL,
            IsDeleted BIT NOT NULL CONSTRAINT DF_Companies_IsDeleted DEFAULT 0,
            DeletedAtUtc DATETIMEOFFSET NULL,
            CONSTRAINT PK_Companies PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_Companies_Users_ApprovedByUserId FOREIGN KEY (ApprovedByUserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_Companies_Slug ON dbo.Companies (Slug);
        CREATE NONCLUSTERED INDEX IX_Companies_ApprovalStatus ON dbo.Companies (ApprovalStatus);
    END;

    -- 6. CompanyMembers Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CompanyMembers' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CompanyMembers (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CompanyMembers_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            UserId UNIQUEIDENTIFIER NOT NULL,
            CompanyRole INT NOT NULL CONSTRAINT DF_CompanyMembers_CompanyRole DEFAULT 1, -- 0: Owner, 1: Recruiter, 2: HiringManager
            MembershipStatus INT NOT NULL CONSTRAINT DF_CompanyMembers_MembershipStatus DEFAULT 0, -- 0: Active, 1: Suspended, 2: Left
            JoinedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_CompanyMembers_JoinedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            UpdatedAtUtc DATETIMEOFFSET NULL,
            CONSTRAINT PK_CompanyMembers PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_CompanyMembers_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_CompanyMembers_Users_UserId FOREIGN KEY (UserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION,
            CONSTRAINT UQ_CompanyMembers_CompanyId_UserId UNIQUE (CompanyId, UserId)
        );

        CREATE NONCLUSTERED INDEX IX_CompanyMembers_UserId ON dbo.CompanyMembers (UserId);
    END;

    -- 7. CompanyInvitations Table
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'CompanyInvitations' AND schema_id = SCHEMA_ID(N'dbo'))
    BEGIN
        CREATE TABLE dbo.CompanyInvitations (
            Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CompanyInvitations_Id DEFAULT NEWSEQUENTIALID(),
            CompanyId UNIQUEIDENTIFIER NOT NULL,
            InvitedEmail NVARCHAR(256) NOT NULL,
            CompanyRole INT NOT NULL CONSTRAINT DF_CompanyInvitations_CompanyRole DEFAULT 1,
            InvitationToken NVARCHAR(256) NOT NULL,
            ExpiresAtUtc DATETIMEOFFSET NOT NULL,
            IsAccepted BIT NOT NULL CONSTRAINT DF_CompanyInvitations_IsAccepted DEFAULT 0,
            AcceptedAtUtc DATETIMEOFFSET NULL,
            InvitedByUserId UNIQUEIDENTIFIER NOT NULL,
            CreatedAtUtc DATETIMEOFFSET NOT NULL CONSTRAINT DF_CompanyInvitations_CreatedAtUtc DEFAULT SYSDATETIMEOFFSET(),
            CONSTRAINT PK_CompanyInvitations PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_CompanyInvitations_Companies_CompanyId FOREIGN KEY (CompanyId) REFERENCES dbo.Companies (Id) ON DELETE NO ACTION,
            CONSTRAINT FK_CompanyInvitations_Users_InvitedByUserId FOREIGN KEY (InvitedByUserId) REFERENCES dbo.Users (Id) ON DELETE NO ACTION
        );

        CREATE UNIQUE NONCLUSTERED INDEX UQ_CompanyInvitations_InvitationToken ON dbo.CompanyInvitations (InvitationToken);
        CREATE NONCLUSTERED INDEX IX_CompanyInvitations_CompanyId_InvitedEmail ON dbo.CompanyInvitations (CompanyId, InvitedEmail);
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 001_CreateCoreIdentityAndTenantSchema.sql executed successfully.';

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
