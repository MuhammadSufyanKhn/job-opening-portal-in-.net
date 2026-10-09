-- ============================================================================
-- HireSphere Database Seed Script
-- Script ID:   002_SeedJobCategories.sql
-- Description: Seeds the core reference job categories in dbo.JobCategories.
-- Target DB:   Microsoft SQL Server 2019+
-- Execution:   Manual execution via SSMS by database administrator.
-- ============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY

    IF NOT EXISTS (SELECT 1 FROM dbo.JobCategories WHERE Slug = N'software-engineering')
    BEGIN
        INSERT INTO dbo.JobCategories (Name, Slug, Description, DisplayOrder)
        VALUES (N'Software Engineering', N'software-engineering', N'Full-stack, backend, frontend, and distributed systems engineering', 1);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.JobCategories WHERE Slug = N'product-management')
    BEGIN
        INSERT INTO dbo.JobCategories (Name, Slug, Description, DisplayOrder)
        VALUES (N'Product Management', N'product-management', N'Product strategy, roadmap execution, and technical product ownership', 2);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.JobCategories WHERE Slug = N'data-ai')
    BEGIN
        INSERT INTO dbo.JobCategories (Name, Slug, Description, DisplayOrder)
        VALUES (N'Data & AI', N'data-ai', N'Machine learning, data engineering, analytics, and business intelligence', 3);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.JobCategories WHERE Slug = N'devops-cloud')
    BEGIN
        INSERT INTO dbo.JobCategories (Name, Slug, Description, DisplayOrder)
        VALUES (N'DevOps & Cloud', N'devops-cloud', N'Cloud infrastructure, site reliability engineering, and CI/CD automation', 4);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.JobCategories WHERE Slug = N'design-creative')
    BEGIN
        INSERT INTO dbo.JobCategories (Name, Slug, Description, DisplayOrder)
        VALUES (N'Design & Creative', N'design-creative', N'UI/UX design, design systems, and product research', 5);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.JobCategories WHERE Slug = N'sales-marketing')
    BEGIN
        INSERT INTO dbo.JobCategories (Name, Slug, Description, DisplayOrder)
        VALUES (N'Sales & Marketing', N'sales-marketing', N'Go-to-market strategy, growth marketing, enterprise sales, and customer success', 6);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.JobCategories WHERE Slug = N'customer-support')
    BEGIN
        INSERT INTO dbo.JobCategories (Name, Slug, Description, DisplayOrder)
        VALUES (N'Customer Support', N'customer-support', N'Technical support, customer onboarding, and service operations', 7);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.JobCategories WHERE Slug = N'human-resources')
    BEGIN
        INSERT INTO dbo.JobCategories (Name, Slug, Description, DisplayOrder)
        VALUES (N'Human Resources', N'human-resources', N'Talent acquisition, people operations, and employee experience', 8);
    END;

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Script 002_SeedJobCategories.sql executed successfully.';

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
