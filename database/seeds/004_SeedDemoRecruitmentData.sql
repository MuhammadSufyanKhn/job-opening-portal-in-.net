-- ============================================================================
-- HireSphere Development Seed
-- Script ID:   004_SeedDemoRecruitmentData.sql
-- Description: Adds repeatable demo companies, employees, candidate, jobs,
--              and applications for local development and UI walkthroughs.
-- Target DB:   Microsoft SQL Server 2019+
-- Credentials: all demo users use AdminSecure2026!
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

BEGIN TRY
    DECLARE @PasswordHash NVARCHAR(MAX) =
        N'100000.oHPUhsIxo3rTO3fJBU22iA==.dNaNCirI6gB83qTKrajM/q+pazCXB6hpF3zdjQXHshg=';
    DECLARE @CandidateRoleId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.Roles WHERE NormalizedName = N'CANDIDATE');
    DECLARE @CompanyMemberRoleId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.Roles WHERE NormalizedName = N'COMPANYMEMBER');
    DECLARE @SoftwareCategoryId INT = (SELECT TOP 1 Id FROM dbo.JobCategories WHERE Slug = N'software-engineering');
    DECLARE @DataCategoryId INT = (SELECT TOP 1 Id FROM dbo.JobCategories WHERE Slug = N'data-ai');

    IF @CandidateRoleId IS NULL OR @CompanyMemberRoleId IS NULL OR @SoftwareCategoryId IS NULL OR @DataCategoryId IS NULL
        THROW 51000, 'Run the roles and job category seed scripts before the demo data seed.', 1;

    DECLARE @NorthstarOwnerId UNIQUEIDENTIFIER = 'A0000000-0000-0000-0000-000000000001';
    DECLARE @NorthstarRecruiterId UNIQUEIDENTIFIER = 'A0000000-0000-0000-0000-000000000002';
    DECLARE @VertexOwnerId UNIQUEIDENTIFIER = 'A0000000-0000-0000-0000-000000000003';
    DECLARE @VertexRecruiterId UNIQUEIDENTIFIER = 'A0000000-0000-0000-0000-000000000004';
    DECLARE @CandidateId UNIQUEIDENTIFIER = 'A0000000-0000-0000-0000-000000000005';
    DECLARE @NorthstarCompanyId UNIQUEIDENTIFIER = 'B0000000-0000-0000-0000-000000000001';
    DECLARE @VertexCompanyId UNIQUEIDENTIFIER = 'B0000000-0000-0000-0000-000000000002';
    DECLARE @NorthstarJobId UNIQUEIDENTIFIER = 'C0000000-0000-0000-0000-000000000001';
    DECLARE @VertexJobId UNIQUEIDENTIFIER = 'C0000000-0000-0000-0000-000000000002';
    DECLARE @NorthstarVersionId UNIQUEIDENTIFIER = 'D0000000-0000-0000-0000-000000000001';
    DECLARE @VertexVersionId UNIQUEIDENTIFIER = 'D0000000-0000-0000-0000-000000000002';
    DECLARE @NorthstarRequirementId UNIQUEIDENTIFIER = 'E0000000-0000-0000-0000-000000000001';
    DECLARE @VertexRequirementId UNIQUEIDENTIFIER = 'E0000000-0000-0000-0000-000000000002';

    INSERT INTO dbo.Users (Id, Email, NormalizedEmail, PasswordHash, SecurityStamp, FirstName, LastName, AccountStatus)
    SELECT v.Id, v.Email, UPPER(v.Email), @PasswordHash, REPLACE(NEWID(), '-', ''), v.FirstName, v.LastName, 0
    FROM (VALUES
        (@NorthstarOwnerId, N'owner@northstarlabs.demo', N'Maya', N'Khan'),
        (@NorthstarRecruiterId, N'recruiter@northstarlabs.demo', N'Omar', N'Raza'),
        (@VertexOwnerId, N'owner@vertexanalytics.demo', N'Zainab', N'Ahmed'),
        (@VertexRecruiterId, N'recruiter@vertexanalytics.demo', N'Bilal', N'Sheikh'),
        (@CandidateId, N'candidate@demo.hiresphere.local', N'Ayesha', N'Farooq')
    ) v(Id, Email, FirstName, LastName)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Users u WHERE u.Id = v.Id);

    INSERT INTO dbo.UserRoles (UserId, RoleId)
    SELECT v.UserId, v.RoleId
    FROM (VALUES
        (@NorthstarOwnerId, @CompanyMemberRoleId),
        (@NorthstarRecruiterId, @CompanyMemberRoleId),
        (@VertexOwnerId, @CompanyMemberRoleId),
        (@VertexRecruiterId, @CompanyMemberRoleId),
        (@CandidateId, @CandidateRoleId)
    ) v(UserId, RoleId)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.UserRoles ur WHERE ur.UserId = v.UserId AND ur.RoleId = v.RoleId);

    INSERT INTO dbo.Companies (Id, Name, Slug, WebsiteUrl, Industry, CompanySize, Description, ContactEmail, ApprovalStatus, ApprovedAtUtc)
    SELECT v.Id, v.Name, v.Slug, v.WebsiteUrl, v.Industry, v.CompanySize, v.Description, v.ContactEmail, 1, SYSDATETIMEOFFSET()
    FROM (VALUES
        (@NorthstarCompanyId, N'Northstar Labs', N'northstar-labs', N'https://northstar.example', N'Software & Cloud', N'51-200', N'Product engineering teams building reliable cloud platforms.', N'hello@northstarlabs.demo'),
        (@VertexCompanyId, N'Vertex Analytics', N'vertex-analytics', N'vertex.example', N'Data & AI', N'11-50', N'Data products that help modern teams make faster decisions.', N'hello@vertexanalytics.demo')
    ) v(Id, Name, Slug, WebsiteUrl, Industry, CompanySize, Description, ContactEmail)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Companies c WHERE c.Id = v.Id);

    INSERT INTO dbo.CompanyMembers (Id, CompanyId, UserId, CompanyRole, MembershipStatus)
    SELECT NEWID(), v.CompanyId, v.UserId, v.CompanyRole, 0
    FROM (VALUES
        (@NorthstarCompanyId, @NorthstarOwnerId, 0),
        (@NorthstarCompanyId, @NorthstarRecruiterId, 1),
        (@VertexCompanyId, @VertexOwnerId, 0),
        (@VertexCompanyId, @VertexRecruiterId, 1)
    ) v(CompanyId, UserId, CompanyRole)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CompanyMembers m WHERE m.CompanyId = v.CompanyId AND m.UserId = v.UserId);

    INSERT INTO dbo.CandidateProfiles (Id, UserId, Headline, Summary, Location, YearsOfExperience, GitHubUrl, PortfolioUrl)
    SELECT 'F0000000-0000-0000-0000-000000000001', @CandidateId, N'Full-stack .NET Engineer', N'Builds accessible, resilient web products with ASP.NET Core and React.', N'Lahore, Pakistan', 5, N'https://github.com/ayesha-demo', N'https://ayesha-demo.example'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CandidateProfiles WHERE UserId = @CandidateId);

    INSERT INTO dbo.JobPostings (Id, CompanyId, JobCategoryId, Title, Slug, Summary, Description, Responsibilities, EmploymentType, WorkplaceType, Location, SalaryMin, SalaryMax, SalaryCurrency, Status, PublishedAtUtc, ActiveVersionNumber)
    SELECT @NorthstarJobId, @NorthstarCompanyId, @SoftwareCategoryId, N'Senior .NET Platform Engineer', N'demo-senior-dotnet-platform-engineer', N'Own backend services powering a growing hiring platform.', N'Join a product-minded platform team building secure, observable services.', N'Design APIs; improve reliability; mentor engineers.', 0, 1, N'Remote - Pakistan', 350000, 500000, N'PKR', 1, SYSDATETIMEOFFSET(), 1
    WHERE NOT EXISTS (SELECT 1 FROM dbo.JobPostings WHERE Id = @NorthstarJobId);

    INSERT INTO dbo.JobPostings (Id, CompanyId, JobCategoryId, Title, Slug, Summary, Description, Responsibilities, EmploymentType, WorkplaceType, Location, SalaryMin, SalaryMax, SalaryCurrency, Status, PublishedAtUtc, ActiveVersionNumber)
    SELECT @VertexJobId, @VertexCompanyId, @DataCategoryId, N'Machine Learning Product Engineer', N'demo-machine-learning-product-engineer', N'Turn practical ML ideas into delightful product experiences.', N'Work with product and data teams to ship responsible ML features.', N'Build evaluation pipelines; ship model-backed APIs; measure outcomes.', 0, 2, N'Islamabad, Pakistan', 300000, 450000, N'PKR', 1, SYSDATETIMEOFFSET(), 1
    WHERE NOT EXISTS (SELECT 1 FROM dbo.JobPostings WHERE Id = @VertexJobId);

    INSERT INTO dbo.JobDescriptionVersions (Id, JobPostingId, VersionNumber, SnapshotJson)
    SELECT @NorthstarVersionId, @NorthstarJobId, 1, N'{"demo":true,"title":"Senior .NET Platform Engineer"}'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.JobDescriptionVersions WHERE Id = @NorthstarVersionId);
    INSERT INTO dbo.JobDescriptionVersions (Id, JobPostingId, VersionNumber, SnapshotJson)
    SELECT @VertexVersionId, @VertexJobId, 1, N'{"demo":true,"title":"Machine Learning Product Engineer"}'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.JobDescriptionVersions WHERE Id = @VertexVersionId);

    INSERT INTO dbo.JobRequirements (Id, JobPostingId, RequirementText, RequirementCategory, RequirementType, DisplayOrder)
    SELECT @NorthstarRequirementId, @NorthstarJobId, N'5+ years of C# and ASP.NET Core experience', 1, 0, 1
    WHERE NOT EXISTS (SELECT 1 FROM dbo.JobRequirements WHERE Id = @NorthstarRequirementId);
    INSERT INTO dbo.JobRequirements (Id, JobPostingId, RequirementText, RequirementCategory, RequirementType, DisplayOrder)
    SELECT @VertexRequirementId, @VertexJobId, N'Experience shipping Python or ML-backed production services', 0, 0, 1
    WHERE NOT EXISTS (SELECT 1 FROM dbo.JobRequirements WHERE Id = @VertexRequirementId);

    INSERT INTO dbo.JobApplications (Id, CompanyId, JobPostingId, JobDescriptionVersionId, CandidateProfileId, CurrentStage, CandidateCoverNote)
    SELECT '90000000-0000-0000-0000-000000000001', @NorthstarCompanyId, @NorthstarJobId, @NorthstarVersionId, cp.Id, 2, N'I enjoy building reliable platform services and would love to help Northstar scale.'
    FROM dbo.CandidateProfiles cp
    WHERE cp.UserId = @CandidateId
      AND NOT EXISTS (SELECT 1 FROM dbo.JobApplications WHERE JobPostingId = @NorthstarJobId AND CandidateProfileId = cp.Id);

    INSERT INTO dbo.JobApplications (Id, CompanyId, JobPostingId, JobDescriptionVersionId, CandidateProfileId, CurrentStage, CandidateCoverNote)
    SELECT '90000000-0000-0000-0000-000000000002', @VertexCompanyId, @VertexJobId, @VertexVersionId, cp.Id, 0, N'I am excited to bring product engineering and applied ML experience to Vertex Analytics.'
    FROM dbo.CandidateProfiles cp
    WHERE cp.UserId = @CandidateId
      AND NOT EXISTS (SELECT 1 FROM dbo.JobApplications WHERE JobPostingId = @VertexJobId AND CandidateProfileId = cp.Id);

    COMMIT TRANSACTION;
    PRINT N'[SUCCESS] Demo recruitment data seeded. Demo password: AdminSecure2026!';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
