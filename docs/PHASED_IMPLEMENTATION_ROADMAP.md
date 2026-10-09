# HireSphere — Phased Implementation Roadmap & Execution Strategy

**Document ID:** `HS-PLN-04`  
**Version:** 1.0  
**Status:** Approved Roadmap  

---

## 1. Phased Development Roadmap

HireSphere is developed in an incremental, reviewable, and test-driven sequence. Each phase requires successful execution and review before advancing to the subsequent phase.

```
 Phase 0: Project Foundation (Current)
    │
    ▼
 Phase 1: Architecture, Scaffolding & Database Design (SSMS Manual SQL)
    │
    ▼
 Phase 2: Identity, RBAC & Multi-Tenant Organization Management
    │
    ▼
 Phase 3: Job Marketplace & Application Lifecycle State Machines
    │
    ▼
 Phase 4: CV Document Vault & Requirement Matching Engine
    │
    ▼
 Phase 5: WorkSim Assessment Engine & Exemplar Scenarios
    │
    ▼
 Phase 6: Recruitment Analytics, Moderation & Audit Trails
    │
    ▼
 Phase 7: SaaS Subscription Tiers & Entitlement Enforcement
    │
    ▼
 Phase 8: Frontend Portal Refinement & Motion Animations
    │
    ▼
 Phase 9: Background Processing & Supporting Infrastructure
    │
    ▼
 Phase 10: Security Hardening, Verification & Test Coverage
    │
    ▼
 Phase 11: Deployment Configuration & Production Documentation
```

---

### Detailed Phase Specifications

#### Phase 0: Product Foundation (Current Phase)
* **Goal:** Inspect workspace, document requirements, define architectural contracts, establish database discipline, and plan the roadmap.
* **Deliverables:** Complete product documentation suite in `docs/`.
* **Acceptance Criteria:** Full inspection report, PRD, engineering rules, domain entity catalog, risk analysis, and Phase 1 roadmap approved.

#### Phase 1: Architecture, Scaffolding & Database Design
* **Goal:** Initialize Git repository, scaffold .NET Clean Architecture solution and Vite/React/TS frontend, define core database entities, and generate Phase 1 SQL DDL scripts for manual SSMS execution.
* **Dependencies:** Phase 0 approval.
* **Deliverables:**
  - `backend/` solution structure with `Domain`, `Application`, `Infrastructure`, `Api`, `Tests.Unit`, and `Tests.Integration`.
  - `frontend/` initialized with Vite, React 19, TypeScript, and styling foundation.
  - `database/scripts/001_initial_schema.sql` authored with idempotent DDL, constraints, and audit columns.
  - EF Core Fluent API mappings perfectly aligned with `001_initial_schema.sql`.
* **Acceptance Criteria:** Solution builds cleanly (`dotnet build`); frontend compiles (`npm run build`); user executes `001_initial_schema.sql` in SSMS with zero errors; no automatic migration calls exist in code.

#### Phase 2: Identity, RBAC & Multi-Tenant Access
* **Goal:** Implement secure authentication, user roles, company approval lifecycle, and multi-tenant isolation.
* **Dependencies:** Phase 1 database schema applied.
* **Deliverables:**
  - JWT generation, password hashing, and token refresh mechanisms.
  - Tenant resolution middleware and EF Core global query filters.
  - Company registration and approval state machine (`PendingApproval`, `Approved`, `Rejected`, `Suspended`).
  - Company member invitation and RBAC (`Owner`, `Recruiter`, `HiringManager`).
  - Unit and integration tests for authentication and tenant isolation.
* **Acceptance Criteria:** Users can register/login; Company A users cannot read Company B data; non-approved companies cannot perform restricted actions; all tests pass.

#### Phase 3: Job Marketplace & Application Lifecycle
* **Goal:** Implement job vacancy authoring, structured requirements, public discovery, candidate application submission, and historical version freeze.
* **Dependencies:** Phase 2 identity and tenant foundations.
* **Deliverables:**
  - Job posting CRUD with status machine (`Draft`, `Published`, `Paused`, `Closed`, `Archived`).
  - Structured requirements data model (Mandatory vs Preferred).
  - Public search with faceted filters (employment type, workplace type, location).
  - Candidate application submission capturing frozen snapshot of job requirements and selected CV.
  - Application progression state machine with audit history.
* **Acceptance Criteria:** Candidates can find and apply for jobs; applied jobs preserve historical requirement snapshots even when employer edits the post; recruiters manage applications via stage progression.

#### Phase 4: CV Document Vault & Requirement Matching Engine
* **Goal:** Implement secure private document storage, resilient text extraction, and explainable requirement matching.
* **Dependencies:** Phase 3 application submissions.
* **Deliverables:**
  - Document upload endpoint with magic-byte validation and private filesystem/blob storage.
  - Resilient text extraction service with failure handling and scanned document detection.
  - Requirement matching algorithm classifying items as `SupportedByEvidence`, `PartiallySupported`, `NotFound`, or `RequiresManualReview`.
  - Recruiter CV match report with itemized criteria and source text excerpts.
* **Acceptance Criteria:** Supported documents upload securely; non-PDF/DOCX rejected; extraction failures handle gracefully without crashing; matching report displays clear evidence without automated rejections.

#### Phase 5: WorkSim Assessment Engine & Exemplar Scenarios
* **Goal:** Implement the reusable simulation engine, state machine, server-authoritative scoring, and three exemplar scenarios.
* **Dependencies:** Phase 3 applications and Phase 4 candidate records.
* **Deliverables:**
  - Generic scenario engine supporting state vectors, allowed action catalogs, and transition rules.
  - Server-side action validation and immutable action logging (`SimulationActionLogs`).
  - Server-authoritative rubric scoring generating criterion scores and candidate feedback.
  - Three fully functional scenarios: Software Engineering Outage, Finance Cash Flow, E-Commerce Logistics.
  - Candidate interactive simulation workspace with auto-save and resumption.
* **Acceptance Criteria:** Candidate actions execute and log server-side; frontend cannot fabricate scores; timer expiration triggers auto-submit; scoring report links directly to evidence logs.

#### Phase 6: Recruitment Analytics, Moderation & Audit Trails
* **Goal:** Build operational dashboards, moderation queues, and centralized audit logging.
* **Dependencies:** Phases 2-5 functional data flows.
* **Deliverables:**
  - Real, query-backed analytics for Candidate, Company, and Super-Admin portals.
  - Super-Admin company verification and job moderation interfaces.
  - Centralized security audit log tracking actor, tenant, action, resource, and timestamp.
* **Acceptance Criteria:** All dashboard metrics derived from real database queries (zero hardcoded values); audit logs record high-impact events without leaking sensitive data.

#### Phase 7: SaaS Subscription Tiers & Entitlement Enforcement
* **Goal:** Implement subscription tiers, centralized entitlement checks, and usage limits.
* **Dependencies:** Core features operational across company workflows.
* **Deliverables:**
  - Subscription plan definitions (`Starter`, `Growth`, `Enterprise`).
  - Centralized `IEntitlementService` validating active job counts, member seats, and assessment allocations.
  - Monthly usage accumulation and quota enforcement middleware.
* **Acceptance Criteria:** Companies cannot exceed plan quotas; friendly UI warnings precede limit breaches; feature gates enforce tier boundaries.

#### Phase 8: Frontend Portal Refinement & Motion Animations
* **Goal:** Complete polished, responsive UI across all three portals with purposeful Motion for React animations.
* **Dependencies:** Backend APIs stable.
* **Deliverables:**
  - Unified design system: typography, accessible color tokens, glassmorphic elements, cards, modals.
  - Purposeful micro-animations for page transitions, tab switches, drawers, and feedback toasts.
  - Full responsive layout verification across desktop, tablet, and mobile.
  - Accessibility audit (WCAG 2.1 AA, keyboard navigation, reduced-motion compliance).
* **Acceptance Criteria:** Seamless, visually stunning user experience; zero UI layout bugs; zero animation jank; passes accessibility checks.

#### Phase 9: Background Processing & Supporting Infrastructure
* **Goal:** Introduce asynchronous background workers for document extraction, notifications, and maintenance.
* **Dependencies:** Phases 4-7.
* **Deliverables:**
  - Background queue abstraction (e.g., hosted background services / Hangfire / Channel-based queues) for decoupled CV parsing and email dispatching.
  - Resilient email service abstraction with mockable development provider.
* **Acceptance Criteria:** Heavy document processing does not block HTTP request threads; failed background tasks retry defensively.

#### Phase 10: Security Hardening, Verification & Test Coverage
* **Goal:** Comprehensive end-to-end security audit and automated test suite verification.
* **Dependencies:** Complete system implementation.
* **Deliverables:**
  - xUnit unit tests covering domain rules, matching algorithms, and WorkSim rubric calculations.
  - Integration tests verifying multi-tenant isolation, cross-company access blocking, and authentication boundaries.
  - Vitest + React Testing Library component tests for critical user flows.
* **Acceptance Criteria:** 100% of defined tests run and pass; zero critical security vulnerabilities identified; cross-tenant data leakage proven impossible.

#### Phase 11: Deployment Configuration & Production Documentation
* **Goal:** Prepare production deployment assets, database migration runbooks, and final project documentation.
* **Dependencies:** Hardened codebase.
* **Deliverables:**
  - Production `docker-compose.yml` or IIS/kestrel deployment scripts.
  - Complete `database/README.md` containing full SSMS manual execution runbook.
  - Comprehensive project `README.md` with architecture diagrams, setup instructions, and demonstration walkthrough script.
* **Acceptance Criteria:** Clean deployment from scratch on a clean system following only documentation; demonstration workflow verified end-to-end.

---

## 2. Technical Risks, Mitigations & Assumptions

| Risk | Impact | Probability | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Database Schema Drift** | High | Medium | All SQL scripts are versioned and executed strictly by the user in SSMS. EF Core Fluent API mappings are verified against scripts in unit tests. |
| **Multi-Tenant Data Leakage** | Critical | Low | EF Core global query filters applied on all company entities; secondary defensive tenant checks asserted in application services. |
| **Unreliable CV Text Extraction** | Medium | High | Resilient extraction architecture with fallback; detect scanned PDFs without text layers and flag as requiring manual review rather than failing silently. |
| **WorkSim Client-Side Manipulation** | High | Low | Client acts purely as view layer. All action validation, state progression, and scoring execute strictly on the server. |
| **Overly Complex Microservices Drift** | Medium | Medium | Strict adherence to Modular Monolith architecture within a single solution, preserving modularity through bounded context assemblies. |

---

## 3. Unresolved Decisions Requiring Confirmation

Before commencing Phase 1 implementation, the following architectural decisions require confirmation from the user:

1. **Target .NET Framework Version:**
   * *Recommendation:* Target **`.NET 8.0` (LTS)** for maximum enterprise stability, ecosystem package maturity, and long-term support, using the installed .NET 10 SDK for compilation. (Alternatively, `net9.0` or `net10.0` if cutting-edge C# features are explicitly desired).
2. **Local SQL Server Instance & Connection Details:**
   * What is your local SQL Server instance name in SSMS? (e.g., `localhost`, `.`, `(localdb)\mssqllocaldb`, or `SQLEXPRESS`)
   * Preferred database name: `HireSphereDb` (recommended).
   * Authentication method: Windows Authentication (`Integrated Security=True;TrustServerCertificate=True`) or SQL Server Authentication (`sa` user)?
3. **Private File Storage Location for Development:**
   * *Recommendation:* Store uploaded CV documents in a dedicated, secured folder outside the web root (e.g., `d:\.NET PROJECTS\Job portal openings\storage\cv_documents\`), abstracted behind an `IFileStorageService` for seamless cloud storage migration later.
4. **WorkSim Scenario Definition Storage:**
   * *Recommendation:* Hybrid model. Scenarios are defined via structured, strongly-typed JSON schema stored in the `ScenarioVersions` table, with C# engine handlers implementing domain-specific action validators and scoring calculators.

---

## 4. Immediate Next Step: Phase 1 Action Agenda

Upon approval of this Prompt 0 documentation, **Prompt 1 / Phase 1** will proceed with the following actions:
1. Initialize the Git repository and author a comprehensive `.gitignore`.
2. Scaffold the Clean Architecture .NET solution (`HireSphere.Domain`, `HireSphere.Application`, `HireSphere.Infrastructure`, `HireSphere.Api`, and tests).
3. Scaffold the modern Vite + React 19 + TypeScript frontend application.
4. Author `database/scripts/001_initial_schema.sql` containing the core Phase 1 DDL for Identity, Companies, and Marketplace entities.
5. Provide clear instructions and wait for user execution in SSMS before proceeding with data access code.
