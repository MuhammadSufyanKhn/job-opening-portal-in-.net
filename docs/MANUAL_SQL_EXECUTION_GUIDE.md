# HireSphere — Manual SQL Execution Runbook & SSMS Guide

**Document ID:** `HS-RUN-04`  
**Version:** 1.0  
**Phase:** Phase 1 Execution Protocol  
**Status:** Mandatory Operational Runbook  

---

## 1. Operating Protocol: Absolute Manual SQL Execution

> [!CRITICAL]
> **GOVERNANCE CONTRACT:**  
> 1. All database creations, schema modifications, table definitions, foreign keys, constraints, and seed data scripts are **executed exclusively by the user in SQL Server Management Studio (SSMS)**.
> 2. Antigravity will **never** execute SQL commands against SQL Server, invoke `Database.Migrate()`, run `Database.EnsureCreated()`, or execute automated migration tools.
> 3. Every schema alteration is authored as a standalone, numbered, idempotent SQL script in `database/scripts/`.

---

## 2. Directory Structure & Script Numbering Conventions

Scripts are located in `database/scripts/` and execute in strict sequential order:

```
database/
├── scripts/
│   ├── 001_CreateCoreIdentityAndTenantSchema.sql
│   ├── 002_CreateRecruitmentAndApplicationsSchema.sql
│   ├── 003_CreateDocumentsAndMatchingSchema.sql
│   ├── 004_CreateWorkSimAssessmentSchema.sql
│   └── 005_CreateSubscriptionsAndOperationsSchema.sql
├── seeds/
│   ├── 001_SeedInitialRolesAndPlans.sql
│   └── 002_SeedWorkSimExemplarScenarios.sql
└── README.md
```

---

## 3. Script Execution Inventory & Runbook

### Step 0: Database Creation (User Execution in SSMS)
Before running the schema scripts, create the target database in SSMS:
```sql
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'HireSphereDb')
BEGIN
    CREATE DATABASE HireSphereDb COLLATE Latin1_General_100_CI_AS_SC_UTF8;
END
GO
USE HireSphereDb;
GO
```

---

### Script 1: `001_CreateCoreIdentityAndTenantSchema.sql`
* **Purpose:** Establishes core authentication, user identity, roles, and tenant organization structures.
* **Objects Created:** `Users`, `Roles`, `UserRoles`, `RefreshTokens`, `Companies`, `CompanyMembers`, `CompanyInvitations`.
* **Prerequisites:** `HireSphereDb` database created and selected (`USE HireSphereDb;`).
* **Expected Order:** Execution Step 1.
* **Rerun Safety (Idempotency):** Safe to rerun. Guarded by `IF NOT EXISTS (SELECT * FROM sys.tables ...)` checks.
* **Data Impact:** Purely additive DDL. Zero data modification or deletion.
* **SSMS Verification Query:**
  ```sql
  SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_NAME IN ('Users', 'Roles', 'UserRoles', 'RefreshTokens', 'Companies', 'CompanyMembers', 'CompanyInvitations');
  ```
* **EF Core Mapping Alignment:** Matches `HireSphere.Infrastructure.Persistence.Configurations.Identity.*` and `Companies.*` Fluent API configurations.

---

### Script 2: `002_CreateRecruitmentAndApplicationsSchema.sql`
* **Purpose:** Establishes the job marketplace, versioned job descriptions, candidate profiles, applications, and status history.
* **Objects Created:** `JobCategories`, `JobPostings`, `JobRequirements`, `JobDescriptionVersions`, `CandidateProfiles`, `CandidateDocuments`, `JobApplications`, `ApplicationStatusHistories`, `CandidateNotes`, `InterviewSchedules`, `ScorecardReviews`.
* **Prerequisites:** Script `001` executed successfully.
* **Expected Order:** Execution Step 2.
* **Rerun Safety:** Safe to rerun. Guarded by `IF NOT EXISTS` checks on all tables and foreign keys.
* **Data Impact:** Additive DDL.
* **SSMS Verification Query:**
  ```sql
  SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_NAME IN ('JobCategories', 'JobPostings', 'JobRequirements', 'JobDescriptionVersions', 'CandidateProfiles', 'CandidateDocuments', 'JobApplications', 'ApplicationStatusHistories', 'CandidateNotes', 'InterviewSchedules', 'ScorecardReviews');
  ```
* **EF Core Mapping Alignment:** Matches `HireSphere.Infrastructure.Persistence.Configurations.Recruitment.*`.

---

### Script 3: `003_CreateDocumentsAndMatchingSchema.sql`
* **Purpose:** Establishes CV background text extraction tracking, explainable matching reports, and itemized requirement evaluations.
* **Objects Created:** `DocumentExtractionJobs`, `CvMatchReports`, `CvRequirementEvaluations`.
* **Prerequisites:** Scripts `001` and `002` executed successfully.
* **Expected Order:** Execution Step 3.
* **Rerun Safety:** Safe to rerun. Guarded by `IF NOT EXISTS` checks.
* **Data Impact:** Additive DDL.
* **SSMS Verification Query:**
  ```sql
  SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_NAME IN ('DocumentExtractionJobs', 'CvMatchReports', 'CvRequirementEvaluations');
  ```
* **EF Core Mapping Alignment:** Matches `HireSphere.Infrastructure.Persistence.Configurations.Matching.*`.

---

### Script 4: `004_CreateWorkSimAssessmentSchema.sql`
* **Purpose:** Establishes the reusable WorkSim simulation catalog, scenario versioning, job assessment configs, live sessions, append-only action logs, server-side results, and criterion scorecards.
* **Objects Created:** `SimulationScenarios`, `ScenarioVersions`, `JobAssessmentConfigurations`, `AssessmentAssignments`, `SimulationSessions`, `SimulationActionLogs`, `AssessmentResults`, `CriterionScores`.
* **Prerequisites:** Scripts `001`, `002`, and `003` executed successfully.
* **Expected Order:** Execution Step 4.
* **Rerun Safety:** Safe to rerun. Guarded by `IF NOT EXISTS` checks.
* **Data Impact:** Additive DDL.
* **SSMS Verification Query:**
  ```sql
  SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_NAME IN ('SimulationScenarios', 'ScenarioVersions', 'JobAssessmentConfigurations', 'AssessmentAssignments', 'SimulationSessions', 'SimulationActionLogs', 'AssessmentResults', 'CriterionScores');
  ```
* **EF Core Mapping Alignment:** Matches `HireSphere.Infrastructure.Persistence.Configurations.WorkSim.*`.

---

### Script 5: `005_CreateSubscriptionsAndOperationsSchema.sql`
* **Purpose:** Establishes subscription plans, company entitlements, monthly tenant usage tracking, billing ledger records, webhook idempotency, in-app notifications, email attempts, and security audit logs.
* **Objects Created:** `SubscriptionPlans`, `CompanySubscriptions`, `TenantUsageRecords`, `BillingRecords`, `PaymentWebhookEvents`, `Notifications`, `EmailDeliveryAttempts`, `AuditLogs`.
* **Prerequisites:** Scripts `001` through `004` executed successfully.
* **Expected Order:** Execution Step 5.
* **Rerun Safety:** Safe to rerun. Guarded by `IF NOT EXISTS` checks.
* **Data Impact:** Additive DDL.
* **SSMS Verification Query:**
  ```sql
  SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_NAME IN ('SubscriptionPlans', 'CompanySubscriptions', 'TenantUsageRecords', 'BillingRecords', 'PaymentWebhookEvents', 'Notifications', 'EmailDeliveryAttempts', 'AuditLogs');
  ```
* **EF Core Mapping Alignment:** Matches `HireSphere.Infrastructure.Persistence.Configurations.Operations.*`.

### Script 6: `006_MakeCandidateDocumentOptionalInApplications.sql`
* **Purpose:** Alters `dbo.JobApplications.CandidateDocumentId` to `NULLable`, enabling candidates to submit job applications based on their verified profile and cover note prior to the document extraction/CV upload phase.
* **Objects Modified:** Column `CandidateDocumentId` on table `JobApplications`.
* **Prerequisites:** Script `002_CreateRecruitmentAndApplicationsSchema.sql` executed.
* **Expected Order:** Execution Step 6.
* **Rerun Safety (Idempotency):** Safe to rerun. Guarded by `IF EXISTS (SELECT 1 FROM sys.columns ... AND is_nullable = 0)` check.
* **Data Impact:** In-place column nullability alteration. Zero data loss.
* **SSMS Verification Query:**
  ```sql
  SELECT COLUMN_NAME, IS_NULLABLE 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'JobApplications' AND COLUMN_NAME = 'CandidateDocumentId';
  ```

---

### Script 7: `007_EnhanceCandidateDocumentsWithVersioning.sql`
* **Purpose:** Adds document versioning (`VersionNumber`), document family tracking (`RootDocumentId` with self-referencing foreign key), and SHA-256 digital integrity hash (`ContentHash`) to `dbo.CandidateDocuments`.
* **Objects Modified:** Table `dbo.CandidateDocuments` (adds `VersionNumber`, `RootDocumentId`, `ContentHash`, foreign key, and indexes).
* **Prerequisites:** Script `002_CreateRecruitmentAndApplicationsSchema.sql` executed.
* **Expected Order:** Execution Step 7 (Prompt 4 CV Management & Versioning).
* **Rerun Safety (Idempotency):** Safe to rerun. Guarded by `IF NOT EXISTS (SELECT * FROM sys.columns ...)` checks.
* **Data Impact:** Purely additive column and index additions with defaults. Zero data loss. Existing documents default to `VersionNumber = 1`.
* **SSMS Verification Query:**
  ```sql
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'CandidateDocuments' 
    AND COLUMN_NAME IN ('VersionNumber', 'RootDocumentId', 'ContentHash');
  ```
* **EF Core Mapping Alignment:** Matches `HireSphere.Infrastructure.Persistence.Configurations.ApplicationConfigurations.CandidateDocumentConfiguration`.

---

### Script 4: `004_CreateWorkSimAssessmentSchema.sql`
* **Purpose:** Creates the 8 core tables for HireSphere's reusable WorkSim interactive simulation engine: `SimulationScenarios`, `ScenarioVersions`, `JobAssessmentConfigurations`, `AssessmentAssignments`, `SimulationSessions`, `SimulationActionLogs`, `AssessmentResults`, and `CriterionScores`.
* **Objects Created / Modified:** 
  - `dbo.SimulationScenarios` (with `OwnerCompanyId` column and tenant index)
  - `dbo.ScenarioVersions` (stores immutable JSON scenario definitions and scoring rubrics)
  - `dbo.JobAssessmentConfigurations` (links jobs to scenario versions)
  - `dbo.AssessmentAssignments` (assigns simulations to candidate applications)
  - `dbo.SimulationSessions` (authoritative runtime state vector, concurrency rowversion)
  - `dbo.SimulationActionLogs` (tamper-evident audit trail of candidate decisions)
  - `dbo.AssessmentResults` (deterministic total score and summary)
  - `dbo.CriterionScores` (criterion-level points, evidence, and feedback)
* **Prerequisites:** Script `001_CreateCoreIdentityAndTenantSchema.sql` and `002_CreateRecruitmentAndApplicationsSchema.sql` executed.
* **Expected Order:** Execution Step 8.
* **Rerun Safety (Idempotency):** Fully guarded with `IF NOT EXISTS (SELECT * FROM sys.tables ...)` and `ALTER TABLE ... ADD` column checks.
* **SSMS Verification Query:**
  ```sql
  SELECT TABLE_NAME 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_NAME IN (
    'SimulationScenarios', 'ScenarioVersions', 'JobAssessmentConfigurations', 
    'AssessmentAssignments', 'SimulationSessions', 'SimulationActionLogs', 
    'AssessmentResults', 'CriterionScores'
  );
  ```

---

### Script 8: `008_SeedWorkSimIncidentScenario.sql`
* **Purpose:** Seeds the initial platform-wide **Software Engineering Incident Response** simulation scenario ("Payment Gateway Latency Spike & 504 Timeouts") and its immutable Version 1 definition and rubric.
* **Objects Modified:** Inserts into `dbo.SimulationScenarios` (Scenario ID: `11111111-1111-1111-1111-111111111111`) and `dbo.ScenarioVersions` (Version ID: `22222222-2222-2222-2222-222222222222`).
* **Prerequisites:** Script `004_CreateWorkSimAssessmentSchema.sql` executed.
* **Expected Order:** Execution Step 9.
* **Rerun Safety (Idempotency):** Safe to rerun. Guarded with `IF NOT EXISTS` checks on primary keys.
* **Data Impact:** Inserts the initial scenario and rubric definitions without altering existing candidate records.
* **SSMS Verification Query:**
  ```sql
  SELECT s.Title, s.Category, v.VersionNumber, LEN(v.DefinitionJson) AS DefLength, LEN(v.RubricJson) AS RubricLength
  FROM dbo.SimulationScenarios s
  JOIN dbo.ScenarioVersions v ON v.SimulationScenarioId = s.Id
  WHERE s.Id = '11111111-1111-1111-1111-111111111111';
  ```

---

### Script 9: `009_EnhanceAssessmentInvitationsAndNotifications.sql`
* **Purpose:** Extends `dbo.AssessmentAssignments` with columns for reminder delivery (`ReminderSentAtUtc`), cancellations (`CancelledAtUtc`, `CancellationReason`), and resend tracking (`ResentCount`, `LastResentAtUtc`). Also ensures indexes and tables for in-app `Notifications` and `EmailDeliveryAttempts` exist.
* **Objects Modified:** Alters `dbo.AssessmentAssignments`, creates/verifies `dbo.Notifications`, `dbo.EmailDeliveryAttempts`, and adds composite indexes.
* **Prerequisites:** Scripts `004_CreateWorkSimAssessmentSchema.sql` and `005_CreateSubscriptionsAndOperationsSchema.sql` executed.
* **Expected Order:** Execution Step 10.
* **Rerun Safety (Idempotency):** Fully idempotent; guarded by `IF NOT EXISTS` column, index, and table checks.
* **Data Impact:** Additive only; existing records receive `NULL` or default `0` without data loss.
* **SSMS Verification Query:**
  ```sql
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'AssessmentAssignments'
    AND COLUMN_NAME IN ('ReminderSentAtUtc', 'CancelledAtUtc', 'CancellationReason', 'ResentCount', 'LastResentAtUtc');
  ```

---

### Seed Script 1: `database/seeds/001_SeedInitialRolesAndAdmin.sql`
* **Purpose:** Seeds foundational platform roles (`Candidate`, `CompanyMember`, `SuperAdmin`) into the `Roles` table with idempotent checks. Includes an optional, commented bootstrap block for a local development SuperAdmin (`admin@hiresphere.local`).
* **Objects Modified:** Inserts into `Roles` (and conditionally `Users`, `UserRoles`).
* **Prerequisites:** Schema Script `001_CreateCoreIdentityAndTenantSchema.sql` executed.
* **Expected Order:** Seed Step 1.
* **Rerun Safety (Idempotency):** Safe to rerun. Guarded by `IF NOT EXISTS` checks.
* **Data Impact:** Inserts 3 core role records if missing. Zero destructive alterations.
* **SSMS Verification Query:**
  ```sql
  SELECT Id, Name, NormalizedName, Description FROM dbo.Roles;
  ```

---

### Seed Script 2: `database/seeds/002_SeedJobCategories.sql`
* **Purpose:** Seeds standard job categories (`Software Engineering`, `Product Management`, `Data & AI`, `DevOps & Cloud`, `Design & Creative`, `Sales & Marketing`, `Customer Support`, `Human Resources`) in `dbo.JobCategories`.
* **Objects Modified:** Inserts into `JobCategories`.
* **Prerequisites:** Schema Script `002_CreateRecruitmentAndApplicationsSchema.sql` executed.
* **Expected Order:** Seed Step 2.
* **Rerun Safety (Idempotency):** Safe to rerun. Guarded by `IF NOT EXISTS` slug checks.
* **Data Impact:** Purely additive reference data insertion.
* **SSMS Verification Query:**
  ```sql
  SELECT Id, Name, Slug, DisplayOrder FROM dbo.JobCategories ORDER BY DisplayOrder;
  ```

---

## 4. How the EF Core Model Stays Strictly Aligned

To guarantee that the C# Entity Framework Core model never drifts from the SQL schema:
1. **Explicit Fluent API Configurations:** Every entity class in `HireSphere.Domain` maps to a dedicated `IEntityTypeConfiguration<T>` class in `HireSphere.Infrastructure`.
2. **Zero Automated Migration Execution:** The application startup code in `Program.cs` registers the `DbContext` with `options.UseSqlServer(connectionString)` but contains **no calls to `Database.Migrate()` or `Database.EnsureCreated()`**.
3. **Database Drift Integration Test:** In Phase 10, an automated xUnit integration test will compare the EF Core model metadata against the SQL Server schema views (`INFORMATION_SCHEMA.COLUMNS`, `sys.indexes`) to programmatically verify zero drift.

