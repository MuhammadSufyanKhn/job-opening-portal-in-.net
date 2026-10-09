# HireSphere — Database Scripts Directory

This directory contains versioned, idempotent T-SQL scripts for manual execution via **Microsoft SQL Server Management Studio (SSMS)**.

## Mandatory Execution Rules
1. **Never run automated migrations:** The backend application is intentionally configured without `Database.Migrate()` or `Database.EnsureCreated()`.
2. **Execute scripts sequentially:** Execute `001` through `005` in numerical order against the `HireSphereDb` database.
3. **Transactional Safety:** Every script wraps its DDL inside a transaction (`BEGIN TRANSACTION ... COMMIT TRANSACTION`) with structured `TRY...CATCH` error handling.
4. **Idempotency:** Every script is defensive and checks `IF NOT EXISTS` on all tables, indexes, and constraints.

## Script Inventory

| Order | Script File | Description |
| :--- | :--- | :--- |
| **0** | `CREATE DATABASE HireSphereDb;` | Database initialization |
| **1** | [`001_CreateCoreIdentityAndTenantSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/001_CreateCoreIdentityAndTenantSchema.sql) | Users, Roles, UserRoles, RefreshTokens, Companies, CompanyMembers, CompanyInvitations |
| **2** | [`002_CreateRecruitmentAndApplicationsSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/002_CreateRecruitmentAndApplicationsSchema.sql) | JobCategories, JobPostings, JobRequirements, JobDescriptionVersions, CandidateProfiles, CandidateDocuments, JobApplications, ApplicationStatusHistories, CandidateNotes, InterviewSchedules, ScorecardReviews |
| **3** | [`003_CreateDocumentsAndMatchingSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/003_CreateDocumentsAndMatchingSchema.sql) | DocumentExtractionJobs, CvMatchReports, CvRequirementEvaluations |
| **4** | [`004_CreateWorkSimAssessmentSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/004_CreateWorkSimAssessmentSchema.sql) | SimulationScenarios, ScenarioVersions, JobAssessmentConfigurations, AssessmentAssignments, SimulationSessions, SimulationActionLogs, AssessmentResults, CriterionScores |
| **5** | [`005_CreateSubscriptionsAndOperationsSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/005_CreateSubscriptionsAndOperationsSchema.sql) | SubscriptionPlans, CompanySubscriptions, TenantUsageRecords, BillingRecords, PaymentWebhookEvents, Notifications, EmailDeliveryAttempts, AuditLogs |

For step-by-step verification instructions, refer to [`docs/MANUAL_SQL_EXECUTION_GUIDE.md`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/docs/MANUAL_SQL_EXECUTION_GUIDE.md).
