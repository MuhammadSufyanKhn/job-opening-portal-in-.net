# HireSphere — Product Requirements Document (PRD)

**Document ID:** `HS-PRD-01`  
**Version:** 1.0  
**Status:** Approved Specification  
**Author:** Software Architecture & Product Engineering Team  

---

## 1. Executive Product Vision

**HireSphere** is a next-generation, unified recruitment SaaS platform engineered to transform modern talent acquisition from passive, keyword-stuffed CV filtering into **evidence-driven, interactive competency discovery**. 

### 1.1 The Core Problem
Conventional applicant tracking systems (ATS) and job portals reduce recruitment to a two-step transaction:
1. Employers publish text vacancies and receive hundreds of unverified CVs.
2. Recruiters manually skim resumes or rely on opaque keyword search filters that favor candidates who optimize resume phrasing rather than those who can actually execute job-critical tasks.
3. Candidate assessments, when used, are typically disconnected third-party multiple-choice quizzes that test rote memorization rather than contextual problem-solving and situational judgment.

### 1.2 The HireSphere Solution
HireSphere integrates the complete recruitment lifecycle into a cohesive, multi-tenant ecosystem:
* **Evidence-Based CV Requirement Matching:** Transparent, explainable matching reports that compare candidate evidence against explicit job requirements with full human review guardrails.
* **WorkSim Problem-Solving Simulations:** An interactive, scenario-based simulation engine that places candidates inside realistic job situations (e.g., investigating an active production outage, balancing a distressed corporate cash flow, or resolving an e-commerce fulfillment crisis) to gather behavioral, diagnostic, and decision-making evidence.
* **Three Integrated Portals:** Candidate Portal, Company Portal, and Platform Super-Admin Portal sharing a unified identity, responsive design system, and multi-tenant domain boundary.

---

## 2. Portal Architecture & User Roles

HireSphere delivers three tailored experiences while maintaining a single unified design system, shared component library, and strict backend authorization model.

```
                              ┌────────────────────────────────────────┐
                              │            HIRESPHERE IDENTITY         │
                              │    (ASP.NET Core Identity + JWT / Auth)│
                              └───────────────────┬────────────────────┘
                                                  │
         ┌────────────────────────────────────────┼───────────────────────────────────────┐
         │                                        │                                       │
         ▼                                        ▼                                       ▼
┌───────────────────┐                  ┌──────────────────────┐               ┌───────────────────────┐
│ CANDIDATE PORTAL  │                  │    COMPANY PORTAL    │               │  SUPER-ADMIN PORTAL   │
│                   │                  │                      │               │                       │
│ • Profiles & CVs  │                  │ • Company Profile    │               │ • Company Approval    │
│ • Job Discovery   │                  │ • Member & RBAC      │               │ • User Management     │
│ • Applications    │                  │ • Job Vacancies      │               │ • Job Moderation      │
│ • WorkSim Session │                  │ • CV Match Reports   │               │ • Platform Analytics  │
│ • Traceable Score │                  │ • WorkSim Evaluator  │               │ • Tier & Plan Config  │
│ • Status Updates  │                  │ • Pipeline & Notes   │               │ • Audit Logs & Health │
└───────────────────┘                  └──────────────────────┘               └───────────────────────┘
```

### 2.1 User Roles & Responsibilities

#### Candidate
* Individual job seekers managing their personal identity, verified profile, uploaded CVs, application statuses, and assigned WorkSim simulations.

#### Company Users
* **Company Owner:** Highest privilege in the company tenant. Can manage organization profile, invite/remove team members, assign company roles, manage subscription tiers/limits, and view all jobs and candidate data.
* **Recruiter:** Operational hiring specialist. Can create and publish job postings, review applications, inspect CV-to-job match reports, assign and evaluate WorkSim simulations, update pipeline stages, and add candidate notes. Cannot manage billing or remove company owners.
* **Hiring Manager:** Departmental evaluator. Assigned to specific job postings. Can view shortlisted candidates, inspect candidate CVs, review WorkSim criterion scores, and submit structured interview scorecards. Cannot publish or archive jobs or alter billing settings.

#### Platform Super-Admin
* Internal HireSphere platform operators with cross-tenant administrative authority. Responsible for reviewing new company verification requests, approving/suspending accounts, moderating reported job listings, inspecting system health and document-processing queues, and configuring subscription plans.

### 2.2 Company Lifecycle States
Every company organization moves through an explicit administrative state machine:
* **`PendingApproval`:** Newly registered company awaiting business verification by a Platform Super-Admin. The company can configure its profile and draft jobs, but **cannot publish jobs publicly** or contact candidates.
* **`Approved`:** Active organization in good standing with full access to their subscription entitlements.
* **`Rejected`:** Registration denied due to fraudulent information, spam, or failure to meet platform standards. Members cannot publish jobs or access candidate features.
* **`Suspended`:** Organization frozen by Platform Super-Admin due to policy violations, chargebacks, or misuse. All active job postings are immediately delisted from the public marketplace.

### 2.3 Account Status Rules
* **`Active`:** Normal operation.
* **`Disabled`:** Individual user locked out. Login is rejected immediately at the authentication barrier; active JWT tokens are invalidated via token revocation or user security stamp checking.
* **`PendingVerification`:** Account requires email confirmation before accessing sensitive workflows.

---

## 3. Core Functional Modules

---

### Module A: Identity & Access Management (IAM)

1. **Authentication & Token Architecture:**
   * Secure credential hashing via ASP.NET Core Identity password hasher.
   * JWT-based authentication with cryptographically signed tokens containing `sub`, `email`, `role`, and `tenant_id` (for company users).
   * Refresh token rotation with IP/User-Agent fingerprinting and revokable tokens stored in SQL Server.
   * Rate-limiting on authentication endpoints to prevent credential stuffing.
2. **Authorization Enforcement:**
   * Backend policy-based authorization handlers for all endpoints. Frontend route guards exist only for user navigation experience, never as security boundaries.
   * Tenant isolation verification enforced via global query filters and mandatory repository-level tenant checks.
3. **Company Membership Management:**
   * Owners can issue time-limited invitation links with designated roles (`Recruiter` or `HiringManager`).
   * Members can accept invitations, bind to their user account, and switch between company profiles if they represent multiple entities.

---

### Module B: Candidate Portal

1. **Profile Management:**
   * Comprehensive candidate profiles: Headline, career summary, work history, education, skills, location, work preferences (Remote, Hybrid, On-site), and external links (GitHub, LinkedIn, Portfolio).
2. **CV Document Vault:**
   * Multi-file management: candidates can store multiple CV versions (e.g., "Full-Stack Engineer CV", "DevOps Specialist CV").
   * Candidate designates a "Default CV" for quick-apply workflows.
   * Private document storage: Raw files are stored outside the web root with non-guessable GUID storage keys.
3. **Job Discovery & Search:**
   * High-performance search by title, keyword, industry, and skills.
   * Faceted filters: Employment type (Full-time, Part-time, Contract, Internship), Workplace type (Remote, Hybrid, On-site), Location/Country, Salary range, Experience level.
   * Detailed Job View displaying structured responsibilities, mandatory requirements, nice-to-have qualifications, company summary, and estimated WorkSim requirements.
4. **Application Submission & Versioned Freeze:**
   * **Crucial Historical Preservation Rule:** When applying, the candidate selects a specific CV document. The platform creates an immutable historical application record snapshot linking:
     - The exact CV document version at submission time.
     - The exact job posting description and requirements version at submission time.
     - Later edits to the candidate's active profile or the employer's job post do not alter the historical application record.
5. **Application Status Tracking:**
   * Visual application progression timeline: `Submitted` ➔ `In Review` ➔ `Shortlisted` ➔ `Assessment Assigned` ➔ `Assessment Completed` ➔ `Interview` ➔ `Offer` / `Unsuccessful` / `Withdrawn`.
6. **WorkSim Assessment Experience:**
   * Interactive dashboard showing assigned simulations with instructions, time allocations, and deadlines.
   * Full simulation workspace with responsive controls, state inspection, action dispatching, and auto-save session resumption.
   * Candidate-facing feedback: Criterion-level strengths, areas for development, and task-specific takeaways upon evaluation completion.

---

### Module C: Company Portal

1. **Organization Profile & Employer Branding:**
   * Company name, registration details, logo, hero banner, mission, company size, industry classification, website, and office locations.
2. **Job Vacancy Lifecycle Management:**
   * Rich-text description editor with structured requirement breakdown:
     - *Mandatory Requirements* (Must-have skills, years of experience, certifications).
     - *Preferred Requirements* (Nice-to-have skills, industry background).
   * Status lifecycle controls: `Draft` ➔ `Published` ➔ `Paused` ➔ `Closed` ➔ `Archived`.
3. **Application Pipeline (Kanban & Table Views):**
   * Multi-stage pipeline board enabling drag-and-drop or status-driven candidate progression.
   * Candidate drawer/modal displaying:
     - Applied CV preview (rendered via secure, authenticated streaming endpoint).
     - Candidate profile summary.
     - CV-to-Job Requirement Match report.
     - WorkSim assessment scores, detailed action timeline, and criterion breakdown.
     - Internal collaborative notes and structured interview feedback scorecards.
4. **Assessment Assignment & Configuration:**
   * Select suitable WorkSim scenarios from the library for a given vacancy.
   * Mark simulation as `Required` or `Optional`.
   * Configure assessment deadline (e.g., 5 days from assignment).
5. **Recruitment Analytics:**
   * Real aggregate metrics: Total views, application volume, candidate drop-off rate by pipeline stage, time-to-hire, and simulation completion rate.
6. **Strict Tenant Isolation:**
   * All company queries must enforce `Where(x => x.CompanyId == currentCompanyId)`.
   * Company A cannot inspect, search, or view candidates of Company B unless the candidate explicitly submitted an application to Company A.

---

### Module D: Platform Super-Admin Portal

1. **Company Verification & Approval Queue:**
   * Review submitted business information, registration IDs, corporate email domains, and submitted jobs.
   * Action buttons: `Approve`, `Reject` (with structured reason), `Request Information`, or `Suspend`.
2. **User & Access Moderation:**
   * Global user directory with search by email/name.
   * Ability to view account status, reset MFA/passwords, or suspend bad actors.
3. **Job Moderation & Compliance:**
   * Monitor newly published jobs for spam, illegal content, discrimination, or deceptive listings.
   * Delist and take down flagged postings with audit logging.
4. **Platform-Wide Operational Health:**
   * Monitor document extraction processing queues, error rates, and failed jobs.
   * View WorkSim session completion statistics and unhandled runtime exceptions.
5. **Subscription Tier Management:**
   * Configure subscription plan limits: Starter, Growth, Enterprise.
   * Adjust quotas for active postings, member seats, CV extraction operations, and simulation tokens.
6. **Immutable Audit Trail:**
   * Centralized audit viewer capturing: Actor ID, IP Address, Timestamp, Action Type, Target Entity, and Result.

---

### Module E: Job Marketplace & Application Lifecycle State Machines

#### 1. Job Vacancy State Machine
```
   [ Draft ] ──────────────► [ Published ] ◄─────────────┐
       │                            │                     │
       ▼                            ▼                     │
   [ Deleted ]                   [ Paused ] ──────────────┘
                                    │
                                    ▼
                                [ Closed ] ──────────────► [ Archived ]
```
* `Draft`: Visible only to company members. Requirements and descriptions freely editable.
* `Published`: Publicly visible in candidate marketplace. Generates immutable version snapshot upon first application receipt.
* `Paused`: Temporarily hidden from search/discovery. Existing applicants can still be reviewed.
* `Closed`: Vacancy filled or expired. No new applications accepted.
* `Archived`: Historical storage. Immutable and read-only.

#### 2. Job Application State Machine
```
 [ Submitted ] ──► [ UnderReview ] ──► [ Shortlisted ] ──► [ AssessmentPending ]
       │                 │                   │                     │
       │                 │                   │                     ▼
       │                 │                   │            [ AssessmentCompleted ]
       │                 │                   │                     │
       ▼                 ▼                   ▼                     ▼
 [ Withdrawn ]     [ Rejected ]        [ Rejected ]       [ InterviewScheduled ]
                                                                   │
                                                                   ▼
                                                            [ Offered ]
                                                                   │
                                                                   ▼
                                                              [ Hired ]
```
* **Auditability:** Every transition records `PreviousStatus`, `NewStatus`, `ChangedByUserId`, `TimestampUtc`, and an optional `ReasonOrNote`.

---

### Module F: CV Processing & Job Requirement Matching

1. **Document Ingestion & Validation:**
   * Supported formats: PDF (`.pdf`), Microsoft Word (`.docx`).
   * Strict validation: File size cap (5MB), MIME type check, and header magic-byte verification (e.g., `%PDF-` for PDFs, `PK\x03\x04` for DOCX).
   * Sanitized filenames with randomized server-side storage identifiers.
2. **Text Extraction Engine:**
   * Resilient parsing service with clean fallback handling.
   * Corrupt or unreadable files flagged with `ExtractionFailed` status and explanatory message.
   * Scanned PDFs (containing only images without selectable text) are detected and flagged as `ScannedDocumentRequiresManualReview`, explicitly documenting the absence of an OCR pipeline rather than failing silently.
3. **Requirement Matching Analysis:**
   * Evaluates explicit requirements defined in the job posting against the extracted candidate CV text.
   * Every evaluated requirement is assigned one of four distinct statuses:
     - **`SupportedByEvidence`:** Concrete textual evidence found in candidate CV (accompanied by extracted text excerpt and section reference).
     - **`PartiallySupported`:** Related experience or adjacent skills detected, but missing full tenure, level, or certification requirements.
     - **`NotFound`:** No verifiable mention in the provided CV document.
     - **`RequiresManualReview`:** Ambiguous phrasing, non-standard terminology, or contradictory information requiring human recruiter judgment.
4. **Responsible Matching Guardrails:**
   * **No Automated Rejection:** The system explicitly states that CV match scores reflect *documented textual evidence*, not candidate potential or worth.
   * **Explainable Breakdown:** Recruiter UI presents itemized criteria side-by-side with CV excerpts so recruiters verify the underlying data rather than blindly trusting an overall percentage.

---

### Module G: WorkSim Assessment System (Core Differentiator)

*Detailed in Section 4 below.*

---

### Module H: SaaS Subscriptions & Usage Limits

1. **Configurable Subscription Tiers:**
   * **Starter / Free:** 1 active job posting, 1 company member, 20 CV extractions/month, 5 WorkSim candidate assessments/month.
   * **Growth / Professional:** 5 active job postings, 5 team members, 200 CV extractions/month, 50 WorkSim assessments/month, advanced analytics.
   * **Enterprise:** Unlimited active job postings, 25 team members, 1,000+ CV extractions/month, custom WorkSim simulations, dedicated audit logs.
2. **Centralized Entitlement Service:**
   * Application-layer entitlement verification injected before every quota-restricted operation (`CanPublishJob()`, `CanInviteMember()`, `CanAssignAssessment()`).
   * Friendly UI warnings when approaching limits and hard backend blocking when limits are exceeded.
3. **Decoupled Billing Design:**
   * Subscription state and feature flags are stored and tracked locally in SQL Server.
   * Payment provider integration (e.g., Stripe) is isolated behind an `IBillingService` interface, allowing smooth future integration without contaminating business logic now.

---

### Module I: Analytics, Notifications & Auditing

1. **Platform & Company Analytics:**
   * Real, query-backed analytics:
     - Candidate: Profile views, applications submitted, assessments completed, response rate.
     - Company: Total applicants, conversion through pipeline stages, average time-to-hire, simulation score distributions.
     - Super-Admin: Active tenant count, total platform applications, document queue throughput, server health.
   * Absolute ban on fabricated or hardcoded metrics in all production dashboards.
2. **Event-Driven Notifications:**
   * Core notification events: Application received, application status changed, WorkSim simulation assigned, WorkSim simulation completed, company verification approved/rejected.
   * Multi-channel abstraction: In-app notification center with read/unread tracking and decoupled email dispatching.
3. **Security Audit Logging:**
   * Dedicated `AuditLogs` table tracking all high-impact actions:
     - User login, logout, failed login attempts.
     - Company approval, suspension, role changes.
     - Job status changes.
     - CV access / download operations.
     - WorkSim session initiation and completion.
   * Zero sensitive data in logs (passwords, tokens, CV file contents are never written to audit records).

---

## 4. The WorkSim Differentiator & Responsible Assessment Engine

WorkSim is the core technological differentiator of HireSphere. It transforms assessment from artificial multiple-choice questionnaires into **situated, contextual decision-making simulations**.

```
Candidate Browser                       HireSphere Backend                          Database / State Store
      │                                         │                                            │
      │ 1. Start Assessment                     │                                            │
      ├────────────────────────────────────────►│                                            │
      │                                         │ 2. Create Session (Initial State)          │
      │                                         ├───────────────────────────────────────────►│
      │ 3. Render Scenario Workspace            │                                            │
      │◄────────────────────────────────────────┤                                            │
      │                                         │                                            │
      │ 4. Candidate Action (e.g., Check Logs)  │                                            │
      ├────────────────────────────────────────►│                                            │
      │                                         │ 5. Validate Action & Eligibility           │
      │                                         │ 6. Execute State Transition                │
      │                                         │ 7. Record Action Event + Timestamp         │
      │                                         ├───────────────────────────────────────────►│
      │ 8. Return Updated State & New Clues     │                                            │
      │◄────────────────────────────────────────┤                                            │
      │                                         │                                            │
      │ 9. Final Submission / Time Expired      │                                            │
      ├────────────────────────────────────────►│                                            │
      │                                         │ 10. Run Server-Side Rubric Evaluation      │
      │                                         │ 11. Calculate Criterion Scores + Evidence  │
      │                                         ├───────────────────────────────────────────►│
      │ 12. Return Candidate Feedback           │                                            │
      │◄────────────────────────────────────────┤                                            │
```

### 4.1 Reusable Scenario Engine Architecture
The WorkSim engine is built around a generic, data-driven state machine rather than hardcoded games:
1. **Scenario Definition (Versioned JSON / Schema):**
   * **Context & Objective:** Clear briefing defining candidate's role, situation, and goal.
   * **Initial State Vector:** Variables representing system status, resource levels (time, budget, downtime, sentiment), and available tools.
   * **Permitted Action Catalog:** Explicit list of actions available at each state (e.g., `InspectLogs`, `QueryDatabase`, `ContactSupplier`, `RollbackService`).
   * **State Transition Rules:** Deterministic transition matrix defining how state variables update, what new evidence is unlocked, and what side-effects occur.
   * **Constraint Envelope:** Max session duration, action limits, or critical failure thresholds.
2. **Server-Side Integrity & Anti-Cheat Enforcement:**
   * The client application is purely a view layer; it cannot calculate scores or modify session state.
   * Every candidate action is submitted via API, validated against the current session state, and executed server-side.
   * Action logs are recorded immutably with precise UTC timestamps, elapsed time, and optional candidate rationale.
   * Automatic session termination upon expiration of the allocated time window.
3. **Explainable Rubric Scoring:**
   * Scores are calculated server-side against an immutable `RubricDefinitionVersion`.
   * Evaluated across structured competencies:
     - Evidence Gathering & Investigation Quality
     - Root-Cause Reasoning & Diagnostics
     - Prioritization Under Resource Constraints
     - Risk Awareness & Mitigation
     - Recovery Verification & Outcome Quality

### 4.2 Three Initial Exemplar Scenarios

#### Scenario 1: Software Engineering — "The Midnight Checkout Outage"
* **Context:** The candidate is an on-call engineer at an e-commerce platform. At 00:15 UTC, checkout latency spikes to 12 seconds and error rates jump to 45%.
* **Investigation Tools:**
  - Application Telemetry (Grafana dashboard showing CPU, memory, and database connection pools).
  - Centralized Logs (Elasticsearch logs showing timeout exceptions in `PaymentGatewayAdapter`).
  - Deployment History (Git commit log showing a deployment of `v2.4.1` 20 minutes prior).
* **Decisions & Actions:**
  - Diagnostic branch: Investigate database vs payment microservice vs recent deployment.
  - Mitigation options: Restart service pods (ineffective), increase database connection limit (partial mitigation), or roll back `v2.4.1` deployment (root cause fix).
  - Verification: Run synthetic checkout test to confirm 200 OK responses and reduced latency.

#### Scenario 2: Finance — "Cash Flow Crunch"
* **Context:** The candidate acts as Finance Manager for a mid-sized manufacturing firm facing a 30-day liquidity squeeze.
* **Investigation Tools:**
  - Accounts Receivable Aging Report (identifying delayed customer payments).
  - Accounts Payable Schedule (upcoming supplier invoices, rent, and payroll).
  - Revolving Credit Facility status and covenants.
* **Decisions & Actions:**
  - Prioritize statutory payroll and critical component supplier payments over non-essential expenses.
  - Negotiate 15-day payment extensions with secondary vendors.
  - Offer 2% early-payment discount to accelerate overdue receivables.
  - Manage cash buffer without violating debt covenants.

#### Scenario 3: E-Commerce Operations — "Black Friday Logistics Breakdown"
* **Context:** The candidate is Head of Fulfillment. During peak Black Friday sales, primary distribution warehouse encounters conveyor belt failure while winter storm delays carrier pickups.
* **Investigation Tools:**
  - Warehouse Inventory Management System (stock levels across 3 regional hubs).
  - Carrier Status Feed (weather disruptions and route delays).
  - Order Priority Queue (Express shipping vs standard orders).
* **Decisions & Actions:**
  - Re-route pending express shipments to secondary regional fulfillment center.
  - Re-negotiate carrier dispatch windows to avoid weekend backlog.
  - Proactively notify affected customers with delivery updates and store credit.
  - Balance fulfillment SLA compliance against expedited shipping surcharges.

### 4.3 Responsible Assessment & Accessibility Standards
* **Human Oversight Guarantee:** WorkSim results are advisory evidence for human hiring teams. Automatic rejection based solely on WorkSim scores is strictly prohibited by platform policy.
* **Traceable Evidence:** Company reviewers see the exact action sequence and evidence that justified the score.
* **Accessibility & Accommodations:** 
  - Full keyboard accessibility and screen-reader navigable investigation tabs.
  - Employer-configurable time extension accommodations for neurodivergent candidates or individuals with documented accessibility requirements.
  - High-contrast, reduced-motion friendly simulation UI.
