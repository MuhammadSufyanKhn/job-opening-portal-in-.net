# HireSphere — Database Scripts Directory

This directory contains versioned, idempotent T-SQL scripts for manual execution via **Microsoft SQL Server Management Studio (SSMS)**.

## Mandatory Execution Rules
1. **Never run automated migrations:** The backend application is intentionally configured without `Database.Migrate()` or `Database.EnsureCreated()`.
2. **Execute scripts sequentially:** Execute scripts in strict numerical order against the `HireSphereDb` database.
3. **Transactional Safety:** Every script wraps its DDL inside a transaction (`BEGIN TRANSACTION ... COMMIT TRANSACTION`) with structured `TRY...CATCH` error handling.
4. **Idempotency:** Every script is defensive and checks `IF NOT EXISTS` on all tables, columns, indexes, and constraints.

## Script Inventory

### Foundation Schema Scripts

| Order | Script File | Description |
| :--- | :--- | :--- |
| **0** | `CREATE DATABASE HireSphereDb;` | Database initialization (UTF-8 collation recommended) |
| **1** | [`001_CreateCoreIdentityAndTenantSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/001_CreateCoreIdentityAndTenantSchema.sql) | Users, Roles, UserRoles, RefreshTokens, Companies, CompanyMembers, CompanyInvitations |
| **2** | [`002_CreateRecruitmentAndApplicationsSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/002_CreateRecruitmentAndApplicationsSchema.sql) | JobCategories, JobPostings, JobRequirements, JobDescriptionVersions, CandidateProfiles, CandidateDocuments, JobApplications, ApplicationStatusHistories, CandidateNotes, InterviewSchedules, ScorecardReviews |
| **3** | [`003_CreateDocumentsAndMatchingSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/003_CreateDocumentsAndMatchingSchema.sql) | DocumentExtractionJobs, CvMatchReports, CvRequirementEvaluations |
| **4** | [`004_CreateWorkSimAssessmentSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/004_CreateWorkSimAssessmentSchema.sql) | SimulationScenarios, ScenarioVersions, JobAssessmentConfigurations, AssessmentAssignments, SimulationSessions, SimulationActionLogs, AssessmentResults, CriterionScores |
| **5** | [`005_CreateSubscriptionsAndOperationsSchema.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/005_CreateSubscriptionsAndOperationsSchema.sql) | SubscriptionPlans, CompanySubscriptions, TenantUsageRecords, BillingRecords, PaymentWebhookEvents, Notifications, EmailDeliveryAttempts, AuditLogs |

### Incremental Feature & Hardening Scripts

| Order | Script File | Description |
| :--- | :--- | :--- |
| **6** | [`006_MakeCandidateDocumentOptionalInApplications.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/006_MakeCandidateDocumentOptionalInApplications.sql) | Makes `CandidateDocumentId` in `JobApplications` nullable to support applications without attached CV |
| **7** | [`007_EnhanceCandidateDocumentsWithVersioning.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/007_EnhanceCandidateDocumentsWithVersioning.sql) | Adds `VersionNumber`, `RootDocumentId`, `ContentHash`, and `IsDefault` to `CandidateDocuments` |
| **8** | [`008_SeedWorkSimIncidentScenario.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/008_SeedWorkSimIncidentScenario.sql) | Seeds exemplar incident simulation scenario and rubric criteria |
| **9** | [`009_EnhanceAssessmentInvitationsAndNotifications.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/009_EnhanceAssessmentInvitationsAndNotifications.sql) | Enhances `AssessmentAssignments` with deadline and mandatory flags |
| **10** | [`010_AddJobModerationSupport.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/010_AddJobModerationSupport.sql) | Adds admin job moderation fields (`ModerationStatus`, `ModerationReason`, etc.) |
| **11** | [`011_AddCandidateSavedJobs.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/011_AddCandidateSavedJobs.sql) | Creates `CandidateSavedJobs` table for job bookmarking |
| **12** | [`012_EnsureRecruiterNotesAndInterviewSchedules.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/scripts/012_EnsureRecruiterNotesAndInterviewSchedules.sql) | Verifies tables and constraints for notes, interviews, and scorecards |

### Seed Scripts

| Order | Script File | Description |
| :--- | :--- | :--- |
| **S1** | [`001_SeedInitialRolesAndAdmin.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/seeds/001_SeedInitialRolesAndAdmin.sql) | Seeds platform roles and creates initial SuperAdmin user |
| **S2** | [`002_SeedJobCategories.sql`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/database/seeds/002_SeedJobCategories.sql) | Seeds default industry job categories |

For step-by-step SSMS verification and backup instructions, refer to [`docs/MANUAL_SQL_EXECUTION_GUIDE.md`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/docs/MANUAL_SQL_EXECUTION_GUIDE.md).
