# HireSphere — Complete Data Dictionary & Database Schema Specification

**Document ID:** `HS-DAT-02`  
**Version:** 1.0  
**Phase:** Phase 1 Database Baseline  
**Status:** Approved Relational Model  

---

## 1. Multi-Tenant Architecture & Data Boundaries

HireSphere uses a **Shared Database, Shared Schema, Column-Discriminator Multi-Tenancy** model with strict application-level and database-level isolation guarantees.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              GLOBAL PLATFORM DATA (Cross-Tenant)                       │
│  • Users, Roles, UserRoles, RefreshTokens, AuditLogs, Notifications                    │
│  • CandidateProfiles, CandidateDocuments (Candidate-Owned)                            │
│  • SimulationScenarios, ScenarioVersions, SubscriptionPlans                            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Referenced By
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TENANT DATA (Company-Scoped)                              │
│  • Companies (Tenant Root)                                                             │
│  • CompanyMembers, CompanyInvitations                                                  │
│  • JobCategories, JobPostings, JobRequirements, JobDescriptionVersions                 │
│  • JobApplications, ApplicationStatusHistories, CandidateNotes, ScorecardReviews       │
│  • DocumentExtractionJobs, CvMatchReports, CvRequirementEvaluations                    │
│  • AssessmentAssignments, SimulationSessions, SimulationActionLogs, AssessmentResults   │
│  • CompanySubscriptions, TenantUsageRecords, BillingRecords, PaymentWebhookEvents      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Tenant Boundary Principles
1. **Candidate Global Identity:** A candidate user account and their uploaded CV documents are **globally candidate-owned**. A candidate can apply to 10 different companies. Company A has zero visibility into Company B's applications or the candidate's general profile unless the candidate explicitly submits an application to Company A.
2. **Application as Tenant Bridge:** Once a candidate applies to Company A's job, a `JobApplications` record is created with `CompanyId = CompanyA.Id`. This explicitly grants Company A authorized read access to the specific versioned snapshot of the candidate's CV.
3. **Defense-in-Depth Tenant Protection:**
   * **Database Foreign Keys:** All tenant records hold an explicit foreign key to `Companies(Id)`.
   * **Composite Foreign Keys & Constraints:** Critical child records enforce tenant scoping (e.g., a `JobApplication` references both `JobPostingId` and `CompanyId`; the referenced `JobPosting` must belong to the exact same `CompanyId`).
   * **EF Core Global Query Filters:** All tenant entities automatically append `WHERE CompanyId = @CurrentCompanyId` to queries unless explicitly bypassed by a Super-Admin context.
   * **Application-Layer Tenant Assertion:** Every command handler verifies that the targeted entity's `CompanyId` matches the authenticated tenant claim before any update, deletion, or read operation.

---

## 2. Identity, Role & Permission Model

HireSphere integrates ASP.NET Core Identity concepts with custom multi-tenant authorization.

### 2.1 User Categories & Roles

| Role Name | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **`Candidate`** | Global | Maintain candidate profile, upload CV documents, discover public jobs, submit applications, complete assigned WorkSim simulations, view candidate feedback. |
| **`CompanyOwner`** | Tenant | Full administrative control of their company organization. Manage company profile, invite/remove company members, assign roles, manage subscription plans, publish jobs, review all applications and assessments. |
| **`CompanyRecruiter`** | Tenant | Day-to-day hiring operations. Author and publish job postings, review applications, inspect CV match reports, assign and evaluate WorkSim simulations, advance pipeline stages, add candidate notes. Cannot manage billing or remove owners. |
| **`CompanyHiringManager`** | Tenant | Evaluation specialist. Review candidates for assigned vacancies, inspect CVs and WorkSim criterion scorecards, submit structured interview evaluation forms. Cannot publish/archive jobs or edit company profile. |
| **`SuperAdmin`** | Global | Platform governance. Review and approve/reject company verification submissions, suspend accounts, moderate flagged jobs, monitor platform operational queues, configure subscription plans, inspect system audit logs. |

### 2.2 Company Lifecycle States
* **`PendingApproval` (0):** Newly registered company awaiting business verification. Can configure internal profile and draft jobs, but cannot publish jobs publicly or invite candidates.
* **`Approved` (1):** Verified company in good standing. Full access to job publishing and candidate evaluation according to subscription entitlements.
* **`Rejected` (2):** Verification denied. Cannot publish jobs or access hiring tools.
* **`Suspended` (3):** Frozen by platform administrator due to policy violations. All published jobs are immediately hidden from the public marketplace.

### 2.3 Company Member Lifecycle
```
 [ Invited ] ──► [ Active ] ──► [ Suspended ]
      │               │                │
      ▼               ▼                ▼
  [ Expired ]    [ Removed ]      [ Removed ]
```

---

## 3. SQL Server Schema Conventions & Rules

1. **Table Naming:** Standard plural PascalCase (e.g., `Users`, `JobPostings`, `AssessmentAssignments`).
2. **Primary Keys:** `Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()` with constraint name `PK_TableName`. `NEWSEQUENTIALID()` ensures zero B-Tree index fragmentation while providing secure, non-guessable IDs.
3. **Foreign Keys:** Named explicitly as `FK_ChildTable_ParentTable_Column`. Cascade deletes are strictly disabled (`ON DELETE NO ACTION`) across tenant, application, and assessment data to prevent catastrophic cascading data loss.
4. **Data Types:**
   * Text: `NVARCHAR(n)` with realistic lengths (e.g., `NVARCHAR(100)` for titles, `NVARCHAR(256)` for emails, `NVARCHAR(MAX)` for long descriptions and JSON payloads).
   * Monetary: `DECIMAL(18, 2)` for salaries, prices, and billing totals.
   * Timestamps: `DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()` storing UTC offsets.
   * Booleans: `BIT NOT NULL DEFAULT 0`.
   * Enums: `INT NOT NULL` mapped to strongly-typed C# enums.
5. **Audit Columns:** Present on all primary business entities:
   * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
   * `UpdatedAtUtc DATETIMEOFFSET NULL`
   * `IsDeleted BIT NOT NULL DEFAULT 0`
   * `DeletedAtUtc DATETIMEOFFSET NULL`
6. **Optimistic Concurrency:** High-concurrency entities (`JobPostings`, `SimulationSessions`, `CompanySubscriptions`) include `RowVersion ROWVERSION NOT NULL` for optimistic concurrency token checks.

---

## 4. Complete Entity Inventory & Data Dictionary

---

### Module 1: Identity & Organizations (Core Schema)

#### Table: `Users`
* **Purpose:** Central authentication identity for candidates, company members, and platform administrators.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `Email NVARCHAR(256) NOT NULL` (Unique)
  * `NormalizedEmail NVARCHAR(256) NOT NULL` (Indexed)
  * `PasswordHash NVARCHAR(MAX) NOT NULL`
  * `SecurityStamp NVARCHAR(MAX) NOT NULL`
  * `PhoneNumber NVARCHAR(50) NULL`
  * `FirstName NVARCHAR(100) NOT NULL`
  * `LastName NVARCHAR(100) NOT NULL`
  * `AccountStatus INT NOT NULL DEFAULT 0` (0: Active, 1: Disabled, 2: PendingVerification)
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
  * `UpdatedAtUtc DATETIMEOFFSET NULL`
  * `IsDeleted BIT NOT NULL DEFAULT 0`
* **Indexes:** `IX_Users_NormalizedEmail` (Unique), `IX_Users_AccountStatus`.

#### Table: `Roles`
* **Purpose:** System-level authorization roles.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `Name NVARCHAR(50) NOT NULL` (Unique)
  * `NormalizedName NVARCHAR(50) NOT NULL` (Unique)
  * `Description NVARCHAR(255) NULL`

#### Table: `UserRoles`
* **Purpose:** User-to-Role many-to-many relationship.
* **Columns:**
  * `UserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)`
  * `RoleId UNIQUEIDENTIFIER NOT NULL FK -> Roles(Id)`
* **Primary Key:** Composite `(UserId, RoleId)`.

#### Table: `RefreshTokens`
* **Purpose:** Secure rotating refresh tokens for JWT renewal.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `UserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)`
  * `TokenHash NVARCHAR(256) NOT NULL` (SHA-256 hash)
  * `ExpiresAtUtc DATETIMEOFFSET NOT NULL`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
  * `RevokedAtUtc DATETIMEOFFSET NULL`
  * `ReplacedByTokenHash NVARCHAR(256) NULL`
* **Indexes:** `IX_RefreshTokens_UserId_TokenHash`.

#### Table: `Companies`
* **Purpose:** Multi-tenant organization entity.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `Name NVARCHAR(200) NOT NULL`
  * `Slug NVARCHAR(220) NOT NULL` (Unique, URL-safe)
  * `BusinessRegistrationNumber NVARCHAR(100) NULL`
  * `WebsiteUrl NVARCHAR(500) NULL`
  * `LogoUrl NVARCHAR(500) NULL`
  * `Industry NVARCHAR(100) NOT NULL`
  * `CompanySize NVARCHAR(50) NULL`
  * `Description NVARCHAR(MAX) NULL`
  * `ContactEmail NVARCHAR(256) NOT NULL`
  * `ApprovalStatus INT NOT NULL DEFAULT 0` (0: PendingApproval, 1: Approved, 2: Rejected, 3: Suspended)
  * `RejectionReason NVARCHAR(1000) NULL`
  * `ApprovedAtUtc DATETIMEOFFSET NULL`
  * `ApprovedByUserId UNIQUEIDENTIFIER NULL FK -> Users(Id)`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
  * `UpdatedAtUtc DATETIMEOFFSET NULL`
  * `IsDeleted BIT NOT NULL DEFAULT 0`
* **Indexes:** `UQ_Companies_Slug` (Unique), `IX_Companies_ApprovalStatus`.

#### Table: `CompanyMembers`
* **Purpose:** Links a User to a Company with a tenant-scoped role.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `UserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)`
  * `CompanyRole INT NOT NULL DEFAULT 1` (0: Owner, 1: Recruiter, 2: HiringManager)
  * `MembershipStatus INT NOT NULL DEFAULT 0` (0: Active, 1: Suspended, 2: Left)
  * `JoinedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
* **Indexes:** `UQ_CompanyMembers_CompanyId_UserId` (Unique composite).

#### Table: `CompanyInvitations`
* **Purpose:** Time-limited invitation tokens to join a company.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `InvitedEmail NVARCHAR(256) NOT NULL`
  * `CompanyRole INT NOT NULL DEFAULT 1`
  * `InvitationToken NVARCHAR(256) NOT NULL` (Unique)
  * `ExpiresAtUtc DATETIMEOFFSET NOT NULL`
  * `IsAccepted BIT NOT NULL DEFAULT 0`
  * `AcceptedAtUtc DATETIMEOFFSET NULL`
  * `InvitedByUserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

---

### Module 2: Recruitment & Applications Schema

#### Table: `JobCategories`
* **Purpose:** Global reference categories for job postings.
* **Columns:**
  * `Id INT IDENTITY(1,1) PK`
  * `Name NVARCHAR(100) NOT NULL` (Unique)
  * `Slug NVARCHAR(120) NOT NULL` (Unique)

#### Table: `JobPostings`
* **Purpose:** Vacancy listings owned by a company.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `JobCategoryId INT NOT NULL FK -> JobCategories(Id)`
  * `Title NVARCHAR(200) NOT NULL`
  * `Slug NVARCHAR(220) NOT NULL`
  * `Summary NVARCHAR(500) NOT NULL`
  * `Description NVARCHAR(MAX) NOT NULL`
  * `Responsibilities NVARCHAR(MAX) NOT NULL`
  * `EmploymentType INT NOT NULL` (0: FullTime, 1: PartTime, 2: Contract, 3: Internship)
  * `WorkplaceType INT NOT NULL` (0: OnSite, 1: Hybrid, 2: Remote)
  * `Location NVARCHAR(200) NOT NULL`
  * `SalaryMin DECIMAL(18,2) NULL`
  * `SalaryMax DECIMAL(18,2) NULL`
  * `SalaryCurrency NVARCHAR(10) NULL DEFAULT 'USD'`
  * `Status INT NOT NULL DEFAULT 0` (0: Draft, 1: Published, 2: Paused, 3: Closed, 4: Archived)
  * `PublishedAtUtc DATETIMEOFFSET NULL`
  * `ExpiresAtUtc DATETIMEOFFSET NULL`
  * `ActiveVersionNumber INT NOT NULL DEFAULT 1`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
  * `UpdatedAtUtc DATETIMEOFFSET NULL`
  * `RowVersion ROWVERSION NOT NULL`
  * `IsDeleted BIT NOT NULL DEFAULT 0`
* **Indexes:** `IX_JobPostings_CompanyId_Status`, `IX_JobPostings_Status_PublishedAtUtc` (Filtered index for marketplace search).

#### Table: `JobRequirements`
* **Purpose:** Structured requirements attached to a job posting.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `JobPostingId UNIQUEIDENTIFIER NOT NULL FK -> JobPostings(Id)`
  * `RequirementText NVARCHAR(500) NOT NULL`
  * `RequirementCategory INT NOT NULL` (0: Skill, 1: Experience, 2: Education, 3: Certification)
  * `RequirementType INT NOT NULL` (0: Mandatory, 1: Preferred)
  * `DisplayOrder INT NOT NULL DEFAULT 0`

#### Table: `JobDescriptionVersions`
* **Purpose:** Preserves historical snapshots of job descriptions when jobs are modified.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `JobPostingId UNIQUEIDENTIFIER NOT NULL FK -> JobPostings(Id)`
  * `VersionNumber INT NOT NULL`
  * `SnapshotJson NVARCHAR(MAX) NOT NULL` (Contains full title, description, and requirements list)
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
* **Indexes:** `UQ_JobDescriptionVersions_JobPostingId_VersionNumber` (Unique).

#### Table: `CandidateProfiles`
* **Purpose:** Global profile for candidate job seekers.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `UserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)` (Unique)
  * `Headline NVARCHAR(200) NULL`
  * `Summary NVARCHAR(MAX) NULL`
  * `Location NVARCHAR(200) NULL`
  * `YearsOfExperience INT NULL`
  * `LinkedInUrl NVARCHAR(500) NULL`
  * `GitHubUrl NVARCHAR(500) NULL`
  * `PortfolioUrl NVARCHAR(500) NULL`
  * `UpdatedAtUtc DATETIMEOFFSET NULL`

#### Table: `CandidateDocuments`
* **Purpose:** Candidate uploaded CV documents.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CandidateProfileId UNIQUEIDENTIFIER NOT NULL FK -> CandidateProfiles(Id)`
  * `OriginalFileName NVARCHAR(255) NOT NULL`
  * `StorageKey NVARCHAR(255) NOT NULL` (Unique randomized identifier)
  * `FileExtension NVARCHAR(10) NOT NULL`
  * `MimeType NVARCHAR(100) NOT NULL`
  * `FileSizeBytes BIGINT NOT NULL`
  * `IsDefault BIT NOT NULL DEFAULT 0`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
  * `IsDeleted BIT NOT NULL DEFAULT 0`
* **Indexes:** `IX_CandidateDocuments_CandidateProfileId_IsDefault`.

#### Table: `JobApplications`
* **Purpose:** Candidate application to a job posting.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `JobPostingId UNIQUEIDENTIFIER NOT NULL FK -> JobPostings(Id)`
  * `JobDescriptionVersionId UNIQUEIDENTIFIER NOT NULL FK -> JobDescriptionVersions(Id)`
  * `CandidateProfileId UNIQUEIDENTIFIER NOT NULL FK -> CandidateProfiles(Id)`
  * `CandidateDocumentId UNIQUEIDENTIFIER NOT NULL FK -> CandidateDocuments(Id)`
  * `CurrentStage INT NOT NULL DEFAULT 0` (0: Submitted, 1: UnderReview, 2: Shortlisted, 3: AssessmentPending, 4: AssessmentCompleted, 5: InterviewScheduled, 6: Offered, 7: Hired, 8: Rejected, 9: Withdrawn)
  * `SubmittedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
  * `StageUpdatedAtUtc DATETIMEOFFSET NULL`
  * `CandidateCoverNote NVARCHAR(2000) NULL`
* **Constraints:** `UQ_JobApplications_JobPostingId_CandidateProfileId` (Prevents duplicate applications to the same vacancy).
* **Indexes:** `IX_JobApplications_CompanyId_CurrentStage`, `IX_JobApplications_CandidateProfileId`.

#### Table: `ApplicationStatusHistories`
* **Purpose:** Immutable audit trail of application pipeline movements.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `JobApplicationId UNIQUEIDENTIFIER NOT NULL FK -> JobApplications(Id)`
  * `PreviousStage INT NOT NULL`
  * `NewStage INT NOT NULL`
  * `ChangedByUserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)`
  * `ReasonNote NVARCHAR(1000) NULL`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `CandidateNotes`
* **Purpose:** Private collaborative recruiter notes on an application.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `JobApplicationId UNIQUEIDENTIFIER NOT NULL FK -> JobApplications(Id)`
  * `AuthorUserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)`
  * `NoteText NVARCHAR(MAX) NOT NULL`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `InterviewSchedules`
* **Purpose:** Scheduled interviews for candidates.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `JobApplicationId UNIQUEIDENTIFIER NOT NULL FK -> JobApplications(Id)`
  * `InterviewType INT NOT NULL` (0: Screening, 1: Technical, 2: Cultural, 3: Final)
  * `ScheduledStartUtc DATETIMEOFFSET NOT NULL`
  * `ScheduledEndUtc DATETIMEOFFSET NOT NULL`
  * `MeetingLocation NVARCHAR(500) NULL`
  * `Status INT NOT NULL DEFAULT 0` (0: Scheduled, 1: Completed, 2: Rescheduled, 3: Canceled)
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `ScorecardReviews`
* **Purpose:** Structured hiring manager interview evaluations.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `InterviewScheduleId UNIQUEIDENTIFIER NOT NULL FK -> InterviewSchedules(Id)`
  * `ReviewerUserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)`
  * `Recommendation INT NOT NULL` (0: StrongNo, 1: No, 2: Neutral, 3: Yes, 4: StrongYes)
  * `EvaluationJson NVARCHAR(MAX) NOT NULL` (Contains criteria ratings & feedback)
  * `SubmittedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

---

### Module 3: CV Documents & Matching Schema

#### Table: `DocumentExtractionJobs`
* **Purpose:** Tracking background CV text extraction operations.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CandidateDocumentId UNIQUEIDENTIFIER NOT NULL FK -> CandidateDocuments(Id)`
  * `Status INT NOT NULL DEFAULT 0` (0: Pending, 1: Processing, 2: Success, 3: Failed, 4: ScannedPdfDetected)
  * `ExtractedText NVARCHAR(MAX) NULL`
  * `ParserVersion NVARCHAR(50) NOT NULL DEFAULT '1.0'`
  * `ErrorMessage NVARCHAR(2000) NULL`
  * `AttemptCount INT NOT NULL DEFAULT 0`
  * `StartedAtUtc DATETIMEOFFSET NULL`
  * `CompletedAtUtc DATETIMEOFFSET NULL`
* **Indexes:** `IX_DocumentExtractionJobs_Status_CandidateDocumentId`.

#### Table: `CvMatchReports`
* **Purpose:** Explainable match evaluation between an application's CV and job requirements.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `JobApplicationId UNIQUEIDENTIFIER NOT NULL FK -> JobApplications(Id)` (Unique)
  * `JobDescriptionVersionId UNIQUEIDENTIFIER NOT NULL FK -> JobDescriptionVersions(Id)`
  * `DocumentExtractionJobId UNIQUEIDENTIFIER NOT NULL FK -> DocumentExtractionJobs(Id)`
  * `OverallEvidenceIndex DECIMAL(5, 2) NOT NULL` (Summary index, e.g., 78.50%)
  * `EngineVersion NVARCHAR(50) NOT NULL DEFAULT '1.0-deterministic'`
  * `CalculationSummary NVARCHAR(MAX) NOT NULL`
  * `CalculatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `CvRequirementEvaluations`
* **Purpose:** Itemized requirement-level match evidence.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CvMatchReportId UNIQUEIDENTIFIER NOT NULL FK -> CvMatchReports(Id)`
  * `JobRequirementId UNIQUEIDENTIFIER NOT NULL FK -> JobRequirements(Id)`
  * `Status INT NOT NULL` (0: SupportedByEvidence, 1: PartiallySupported, 2: NotFound, 3: RequiresManualReview)
  * `ConfidenceLevel DECIMAL(5, 2) NOT NULL`
  * `ExtractedExcerpt NVARCHAR(2000) NULL`
  * `ReviewerNote NVARCHAR(1000) NULL`
  * `ReviewerOverriddenStatus INT NULL`
* **Indexes:** `IX_CvRequirementEvaluations_CvMatchReportId`.

---

### Module 4: WorkSim Assessment Schema

*(Summarized here; complete schema and state vector specification detailed in Section 9).*

#### Table: `SimulationScenarios`
* **Purpose:** Catalog of interactive simulation templates.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `Title NVARCHAR(200) NOT NULL`
  * `Category NVARCHAR(100) NOT NULL`
  * `Description NVARCHAR(MAX) NOT NULL`
  * `EstimatedDurationMinutes INT NOT NULL`
  * `IsActive BIT NOT NULL DEFAULT 1`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `ScenarioVersions`
* **Purpose:** Immutable version of a scenario definition and rubric.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `SimulationScenarioId UNIQUEIDENTIFIER NOT NULL FK -> SimulationScenarios(Id)`
  * `VersionNumber INT NOT NULL`
  * `DefinitionJson NVARCHAR(MAX) NOT NULL` (Initial state, allowed actions, state transition rules)
  * `RubricJson NVARCHAR(MAX) NOT NULL` (Scoring criteria, weights, evidence rules)
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
* **Indexes:** `UQ_ScenarioVersions_SimulationScenarioId_VersionNumber` (Unique).

#### Table: `JobAssessmentConfigurations`
* **Purpose:** Links a scenario version to a job posting.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `JobPostingId UNIQUEIDENTIFIER NOT NULL FK -> JobPostings(Id)`
  * `ScenarioVersionId UNIQUEIDENTIFIER NOT NULL FK -> ScenarioVersions(Id)`
  * `IsRequired BIT NOT NULL DEFAULT 1`
  * `MaxAllowedAttempts INT NOT NULL DEFAULT 1`
  * `DeadlineDaysAfterAssignment INT NOT NULL DEFAULT 7`

#### Table: `AssessmentAssignments`
* **Purpose:** Assessment assigned to an applicant.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `JobApplicationId UNIQUEIDENTIFIER NOT NULL FK -> JobApplications(Id)`
  * `JobAssessmentConfigurationId UNIQUEIDENTIFIER NOT NULL FK -> JobAssessmentConfigurations(Id)`
  * `CandidateProfileId UNIQUEIDENTIFIER NOT NULL FK -> CandidateProfiles(Id)`
  * `DeadlineUtc DATETIMEOFFSET NOT NULL`
  * `Status INT NOT NULL DEFAULT 0` (0: Assigned, 1: InProgress, 2: Completed, 3: Expired)
  * `AssignedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
* **Indexes:** `IX_AssessmentAssignments_JobApplicationId`, `IX_AssessmentAssignments_CandidateProfileId`.

#### Table: `SimulationSessions`
* **Purpose:** Live interactive assessment instance.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `AssessmentAssignmentId UNIQUEIDENTIFIER NOT NULL FK -> AssessmentAssignments(Id)`
  * `CandidateProfileId UNIQUEIDENTIFIER NOT NULL FK -> CandidateProfiles(Id)`
  * `ScenarioVersionId UNIQUEIDENTIFIER NOT NULL FK -> ScenarioVersions(Id)`
  * `CurrentStateVectorJson NVARCHAR(MAX) NOT NULL`
  * `Status INT NOT NULL DEFAULT 0` (0: Active, 1: Submitted, 2: TimedOut, 3: Aborted)
  * `StartedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
  * `ExpiresAtUtc DATETIMEOFFSET NOT NULL`
  * `SubmittedAtUtc DATETIMEOFFSET NULL`
  * `TotalActionsTaken INT NOT NULL DEFAULT 0`
  * `RowVersion ROWVERSION NOT NULL`

#### Table: `SimulationActionLogs`
* **Purpose:** Append-only event stream of candidate decisions during assessment.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `SimulationSessionId UNIQUEIDENTIFIER NOT NULL FK -> SimulationSessions(Id)`
  * `SequenceNumber INT NOT NULL`
  * `ActionType NVARCHAR(100) NOT NULL`
  * `ActionPayloadJson NVARCHAR(MAX) NOT NULL`
  * `CandidateRationale NVARCHAR(1000) NULL`
  * `ElapsedMillisecondsFromStart BIGINT NOT NULL`
  * `TimestampUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
* **Indexes:** `IX_SimulationActionLogs_SessionId_Sequence` (Unique composite).

#### Table: `AssessmentResults`
* **Purpose:** Server-calculated assessment outcome.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `SimulationSessionId UNIQUEIDENTIFIER NOT NULL FK -> SimulationSessions(Id)` (Unique)
  * `ScenarioVersionId UNIQUEIDENTIFIER NOT NULL FK -> ScenarioVersions(Id)`
  * `TotalScore DECIMAL(5,2) NOT NULL`
  * `EvaluationSummary NVARCHAR(MAX) NOT NULL`
  * `CandidateFeedback NVARCHAR(MAX) NOT NULL`
  * `EvaluatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `CriterionScores`
* **Purpose:** Itemized competency breakdown.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `AssessmentResultId UNIQUEIDENTIFIER NOT NULL FK -> AssessmentResults(Id)`
  * `CriterionName NVARCHAR(100) NOT NULL`
  * `Score DECIMAL(5,2) NOT NULL`
  * `MaxScore DECIMAL(5,2) NOT NULL`
  * `SupportingEvidenceJson NVARCHAR(MAX) NOT NULL`

---

### Module 5: Subscriptions & Operations Schema

#### Table: `SubscriptionPlans`
* **Purpose:** Configurable platform tier plans.
* **Columns:**
  * `Id INT IDENTITY(1,1) PK`
  * `PlanName NVARCHAR(100) NOT NULL` (Unique)
  * `TierType INT NOT NULL` (0: Starter, 1: Growth, 2: Enterprise)
  * `MonthlyPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00`
  * `MaxActiveJobPostings INT NOT NULL`
  * `MaxCompanyMembers INT NOT NULL`
  * `MonthlyCvExtractionQuota INT NOT NULL`
  * `MonthlyAssessmentQuota INT NOT NULL`
  * `IsActive BIT NOT NULL DEFAULT 1`

#### Table: `CompanySubscriptions`
* **Purpose:** Active company plan subscription.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)` (Unique)
  * `SubscriptionPlanId INT NOT NULL FK -> SubscriptionPlans(Id)`
  * `Status INT NOT NULL DEFAULT 0` (0: Active, 1: PastDue, 2: Canceled, 3: Expired)
  * `BillingCycleStartUtc DATETIMEOFFSET NOT NULL`
  * `BillingCycleEndUtc DATETIMEOFFSET NOT NULL`
  * `RowVersion ROWVERSION NOT NULL`

#### Table: `TenantUsageRecords`
* **Purpose:** Monthly aggregated quota tracking.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `BillingPeriodMonth NVARCHAR(7) NOT NULL` (Format: 'YYYY-MM')
  * `ActiveJobCount INT NOT NULL DEFAULT 0`
  * `CompanyMemberCount INT NOT NULL DEFAULT 0`
  * `CvExtractionsUsed INT NOT NULL DEFAULT 0`
  * `AssessmentsCompleted INT NOT NULL DEFAULT 0`
* **Indexes:** `UQ_TenantUsageRecords_CompanyId_Period` (Unique composite).

#### Table: `BillingRecords`
* **Purpose:** Internal financial ledger records.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `CompanyId UNIQUEIDENTIFIER NOT NULL FK -> Companies(Id)`
  * `Amount DECIMAL(18,2) NOT NULL`
  * `Currency NVARCHAR(10) NOT NULL DEFAULT 'USD'`
  * `InvoiceNumber NVARCHAR(100) NOT NULL` (Unique)
  * `PaymentStatus INT NOT NULL` (0: Pending, 1: Paid, 2: Failed, 3: Refunded)
  * `PaidAtUtc DATETIMEOFFSET NULL`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `PaymentWebhookEvents`
* **Purpose:** Idempotent payment provider webhook processing.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `ProviderName NVARCHAR(50) NOT NULL DEFAULT 'Stripe'`
  * `ProviderEventId NVARCHAR(255) NOT NULL` (Unique)
  * `EventType NVARCHAR(100) NOT NULL`
  * `PayloadJson NVARCHAR(MAX) NOT NULL`
  * `IsProcessed BIT NOT NULL DEFAULT 0`
  * `ProcessedAtUtc DATETIMEOFFSET NULL`
  * `ReceivedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `Notifications`
* **Purpose:** In-app notification center.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `UserId UNIQUEIDENTIFIER NOT NULL FK -> Users(Id)`
  * `NotificationType NVARCHAR(100) NOT NULL`
  * `Title NVARCHAR(200) NOT NULL`
  * `Message NVARCHAR(1000) NOT NULL`
  * `ActionUrl NVARCHAR(500) NULL`
  * `IsRead BIT NOT NULL DEFAULT 0`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
* **Indexes:** `IX_Notifications_UserId_IsRead`.

#### Table: `EmailDeliveryAttempts`
* **Purpose:** Tracking email notification delivery.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `RecipientEmail NVARCHAR(256) NOT NULL`
  * `Subject NVARCHAR(300) NOT NULL`
  * `TemplateName NVARCHAR(100) NOT NULL`
  * `DeliveryStatus INT NOT NULL DEFAULT 0` (0: Pending, 1: Sent, 2: Failed)
  * `AttemptCount INT NOT NULL DEFAULT 0`
  * `ErrorMessage NVARCHAR(2000) NULL`
  * `SentAtUtc DATETIMEOFFSET NULL`
  * `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`

#### Table: `AuditLogs`
* **Purpose:** Immutable compliance and security audit log.
* **Columns:**
  * `Id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID()`
  * `ActorUserId UNIQUEIDENTIFIER NULL FK -> Users(Id)`
  * `CompanyId UNIQUEIDENTIFIER NULL FK -> Companies(Id)`
  * `ActionType NVARCHAR(100) NOT NULL`
  * `TargetResource NVARCHAR(100) NOT NULL`
  * `TargetResourceId NVARCHAR(100) NOT NULL`
  * `IpAddress NVARCHAR(50) NULL`
  * `UserAgent NVARCHAR(500) NULL`
  * `MetadataJson NVARCHAR(MAX) NULL` (Sanitized; no passwords or document bodies)
  * `TimestampUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
* **Indexes:** `IX_AuditLogs_CompanyId_TimestampUtc`, `IX_AuditLogs_ActorUserId_TimestampUtc`.
