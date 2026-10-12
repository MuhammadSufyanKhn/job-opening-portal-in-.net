-- ============================================================================
-- HireSphere Database Seed Script
-- Script ID:   001_SeedInitialRolesAndAdmin.sql
-- Description: Seeds the core system platform roles (Candidate, CompanyMember, SuperAdmin)
--              and provides an optional development SuperAdmin bootstrap script.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    -- 1. Seed Platform Roles (Idempotent)
    IF NOT EXISTS (SELECT * FROM dbo.Roles WHERE NormalizedName = N'CANDIDATE')
    BEGIN
        INSERT INTO dbo.Roles (Id, Name, NormalizedName, Description)
        VALUES (NEWID(), N'Candidate', N'CANDIDATE', N'Candidate job seeker');
    END;

    IF NOT EXISTS (SELECT * FROM dbo.Roles WHERE NormalizedName = N'COMPANYMEMBER')
    BEGIN
        INSERT INTO dbo.Roles (Id, Name, NormalizedName, Description)
        VALUES (NEWID(), N'CompanyMember', N'COMPANYMEMBER', N'Company employer team member');
    END;

    IF NOT EXISTS (SELECT * FROM dbo.Roles WHERE NormalizedName = N'SUPERADMIN')
    BEGIN
        INSERT INTO dbo.Roles (Id, Name, NormalizedName, Description)
        VALUES (NEWID(), N'SuperAdmin', N'SUPERADMIN', N'Platform Super Administrator with system-wide governance');
    END;

    PRINT N'[SUCCESS] Roles seeded successfully.';

    /*
    --------------------------------------------------------------------------------
    OPTIONAL DEVELOPMENT SUPERADMIN PROVISIONING:
    Uncomment the block below ONLY for local development environments if you wish
    to create an initial administrator account. 
    Never use default credentials in production environments.
    --------------------------------------------------------------------------------

    DECLARE @AdminEmail NVARCHAR(256) = N'admin@hiresphere.local';
    DECLARE @AdminNormalized NVARCHAR(256) = N'ADMIN@HIRESPHERE.LOCAL';
    DECLARE @AdminId UNIQUEIDENTIFIER = NEWID();
    DECLARE @SuperAdminRoleId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE NormalizedName = N'SUPERADMIN');

    -- Password hash for 'AdminSecure2026!' using HireSphere PBKDF2 (100,000 iterations):
    -- Format: 100000.{SaltBase64}.{HashBase64}
    DECLARE @AdminPasswordHash NVARCHAR(MAX) = N'100000.oHPUhsIxo3rTO3fJBU22iA==.dNaNCirI6gB83qTKrajM/q+pazCXB6hpF3zdjQXHshg=';

    IF NOT EXISTS (SELECT * FROM dbo.Users WHERE NormalizedEmail = @AdminNormalized)
    BEGIN
        INSERT INTO dbo.Users (Id, Email, NormalizedEmail, PasswordHash, SecurityStamp, FirstName, LastName, AccountStatus, CreatedAtUtc)
        VALUES (@AdminId, @AdminEmail, @AdminNormalized, @AdminPasswordHash, NEWID(), N'Platform', N'Administrator', 0, SYSDATETIMEOFFSET());

        INSERT INTO dbo.UserRoles (UserId, RoleId, AssignedAtUtc)
        VALUES (@AdminId, @SuperAdminRoleId, SYSDATETIMEOFFSET());

        PRINT N'[INFO] Development SuperAdmin provisioned: admin@hiresphere.local';
    END;
    --------------------------------------------------------------------------------
    */

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 001_SeedInitialRolesAndAdmin.sql completed.';

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
