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

---

## 4. How the EF Core Model Stays Strictly Aligned

To guarantee that the C# Entity Framework Core model never drifts from the SQL schema:
1. **Explicit Fluent API Configurations:** Every entity class in `HireSphere.Domain` maps to a dedicated `IEntityTypeConfiguration<T>` class in `HireSphere.Infrastructure`.
2. **Zero Automated Migration Execution:** The application startup code in `Program.cs` registers the `DbContext` with `options.UseSqlServer(connectionString)` but contains **no calls to `Database.Migrate()` or `Database.EnsureCreated()`**.
3. **Database Drift Integration Test:** In Phase 10, an automated xUnit integration test will compare the EF Core model metadata against the SQL Server schema views (`INFORMATION_SCHEMA.COLUMNS`, `sys.indexes`) to programmatically verify zero drift.
