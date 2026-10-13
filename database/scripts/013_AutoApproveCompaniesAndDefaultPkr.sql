-- ==============================================================================
-- 013_AutoApproveCompaniesAndDefaultPkr.sql
-- Description:
--   Ensures that existing non-suspended companies are set to Approved (status = 1)
--   so companies can directly moderate, edit, and publish vacancies without waiting
--   for platform admin intervention.
--   Also ensures existing job posting default currency is updated to PKR.
-- Target DB: SQL Server (HireSphere / TalentConnect)
-- ==============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Auto-approve existing companies that are pending approval
    UPDATE [identity].[Companies]
    SET [ApprovalStatus] = 1, -- Approved
        [UpdatedAtUtc] = SYSUTCDATETIME()
    WHERE [ApprovalStatus] = 0 -- PendingApproval
      AND [IsDeleted] = 0;

    PRINT 'Companies updated to Approved: ' + CAST(@@ROWCOUNT AS VARCHAR(10));

    -- 2. Update existing USD job postings to PKR for currency standardization
    IF OBJECT_ID(N'[recruitment].[JobPostings]', N'U') IS NOT NULL
    BEGIN
        UPDATE [recruitment].[JobPostings]
        SET [SalaryCurrency] = 'PKR',
            [UpdatedAtUtc] = SYSUTCDATETIME()
        WHERE [SalaryCurrency] = 'USD' OR [SalaryCurrency] IS NULL;

        PRINT 'Job postings updated to PKR: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
    END

    COMMIT TRANSACTION;
    PRINT '013_AutoApproveCompaniesAndDefaultPkr.sql executed successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
