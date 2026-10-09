# HireSphere — System Architecture Specification

**Document ID:** `HS-ARC-01`  
**Version:** 1.0  
**Phase:** Phase 1 Architecture Baseline  
**Status:** Approved Technical Architecture  

---

## 1. Architectural Style: The Modular Monolith

HireSphere is designed as a **Modular Monolith** using **Clean Architecture** patterns within an ASP.NET Core Web API backend. 

### 1.1 Why Modular Monolith?
* **High Velocity, Low Overhead:** Avoids distributed tracing, network serialization overhead, message broker maintenance, and Kubernetes cluster orchestration at early-to-mid scale.
* **Strict In-Process Bounded Contexts:** Code is partitioned into distinct business modules. Modules communicate via strongly typed interfaces, C# records, or MediatR commands/notifications, preventing spaghetti dependencies.
* **Prepared for Extraction:** If a specific module (e.g., WorkSim simulation execution or CV document extraction) requires independent autoscaling under enterprise loads, its boundaries are already strictly defined for extraction into a separate microservice with minimal refactoring.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRESENTATION LAYER                                     │
│  React 19 + TypeScript SPA (Vite) ──[HTTPS/JSON REST]──► ASP.NET Core Web API (Controllers)│
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ DTOs / Commands
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER (Mediator/Services)                     │
│  • Use Case Orchestration     • FluentValidation Pipelines    • Tenant Boundary Checks │
│  • Domain Event Dispatchers   • Authorization Policy Handlers • DTO / ViewModel Mapping│
└─────────────────────┬───────────────────────────────────────────────┬──────────────────┘
                      │ Domain Entities / Logic                       │ Interfaces
                      ▼                                               ▼
┌───────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│             DOMAIN LAYER                  │   │         INFRASTRUCTURE LAYER           │
│  • Core Entities, Value Objects, Enums    │   │  • EF Core DbContext & Fluent API      │
│  • Domain Exceptions & Invariants         │   │  • SQL Server Persistence (Strict SSMS)│
│  • WorkSim State Machine Engine Rules     │   │  • Local/Blob Private File Storage     │
│  • Pure C# (Zero External Dependencies)   │   │  • Background Workers & System Clock   │
└───────────────────────────────────────────┘   └────────────────────────────────────────┘
```

---

## 2. The 16 Functional Modules

The platform is partitioned into 16 coherent modules across the backend and database.

| # | Module | Core Responsibilities | Key Entities Owned | Synchronous vs. Asynchronous |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Identity & Access Management (IAM)** | User authentication, password hashing, JWT issue/refresh, platform roles, account statuses. | `User`, `Role`, `UserRole`, `RefreshToken` | Synchronous (HTTP API) |
| **2** | **Company & Tenant Management** | Organization profile, registration approvals, team memberships, role assignments (`Owner`, `Recruiter`, `HiringManager`), invitations. | `Company`, `CompanyMember`, `CompanyInvitation` | Synchronous |
| **3** | **Job Marketplace & Publishing** | Vacancy authoring, requirement definitions, versioned job snapshots, public search with faceted filters, lifecycle states. | `JobCategory`, `JobPosting`, `JobRequirement`, `JobDescriptionVersion` | Synchronous |
| **4** | **Applications & Pipeline** | Candidate application submission, historical freeze of job+CV versions, pipeline stage progressions, withdrawal. | `JobApplication`, `ApplicationStatusHistory` | Synchronous |
| **5** | **CV Documents & Storage** | Private file upload, header magic-byte validation, secure storage, authenticated download streaming. | `CandidateProfile`, `CandidateDocument` | File Upload: Sync; Extraction: Async worker |
| **6** | **CV Text Extraction & Parsing** | Text extraction from PDF/DOCX, error recovery, detection of scanned non-selectable PDFs requiring manual review. | `DocumentExtractionJob` | Asynchronous Background Task (retryable) |
| **7** | **CV-to-Job Requirement Matching** | Deterministic requirement evaluation (`Supported`, `PartiallySupported`, `NotFound`, `RequiresReview`), evidence extraction. | `CvMatchReport`, `CvRequirementEvaluation` | Asynchronous trigger upon extraction success |
| **8** | **WorkSim Scenario Catalog** | Authoring and versioning of simulation templates, initial states, tool definitions, and rubric versions. | `SimulationScenario`, `ScenarioVersion` | Synchronous (Admin / Setup) |
| **9** | **WorkSim Assessment Engine** | Job assessment assignments, interactive candidate sessions, action validation, server-side state transitions, append-only logs. | `AssessmentAssignment`, `SimulationSession`, `SimulationActionLog` | Synchronous user actions; Server-authoritative |
| **10**| **WorkSim Rubric & Scoring** | Server-side evaluation of recorded actions against rubric criteria, explainable criterion breakdown, candidate feedback. | `AssessmentResult`, `CriterionScore` | Synchronous on session submission |
| **11**| **Interviews & Collaboration** | Interview scheduling, private internal notes, structured scorecard evaluations for hiring managers. | `InterviewSchedule`, `CandidateNote`, `ScorecardReview` | Synchronous |
| **12**| **Notifications & Email Delivery**| In-app notification center, delivery attempts, email templates abstraction (`IEmailSender`). | `Notification`, `EmailDeliveryAttempt` | In-app: Sync; Email: Async background worker |
| **13**| **Subscriptions & Entitlements** | Plan tiers (`Starter`, `Growth`, `Enterprise`), feature limits, `IEntitlementService` quota enforcement. | `SubscriptionPlan`, `CompanySubscription` | Synchronous check on state changes |
| **14**| **Billing & Payments Interface** | Billing records, payment-provider abstraction (`IPaymentGateway`), webhook processing idempotency. | `BillingRecord`, `PaymentWebhookEvent` | Webhooks: Async verification & idempotency |
| **15**| **Analytics & Operational Reporting**| Real SQL aggregate queries for Candidate, Company, and Platform Super-Admin dashboards. Zero fabricated metrics. | Direct read queries on operational tables | Synchronous cached queries |
| **16**| **Auditing & System Diagnostics** | Immutable audit logs of high-impact security and business events without sensitive data leaks. | `AuditLog`, `SystemProcessingLog` | Synchronous logging via middleware/interceptors |

---

## 3. Dependency Rules & Architecture Boundaries

1. **Domain Isolation:** `HireSphere.Domain` contains enterprise domain entities, value objects, and business rules. It has **zero dependencies** on external libraries, Entity Framework Core, ASP.NET Core, or presentation packages.
2. **Application Decoupling:** `HireSphere.Application` defines use cases, DTOs, interfaces, and validation. It references `Domain` only. It must never reference `Infrastructure` or `Api`.
3. **Infrastructure Inversion:** `HireSphere.Infrastructure` implements interfaces defined in `Application` (e.g., `IApplicationDbContext`, `IFileStorageService`, `IEmailSender`, `ITextExtractor`).
4. **Presentation Boundary:** `HireSphere.Api` acts as the entry point, configuring dependency injection, middleware pipelines, and controllers. Controllers remain **thin**: they validate input via FluentValidation, call the application service/mediator, and return HTTP status codes.
5. **Frontend Decoupling:** The React frontend communicates strictly via versioned REST APIs (`/api/v1/...`). It maintains zero knowledge of SQL Server, database schemas, or backend implementation details. Scoring and authorization calculations are never delegated to the client.

---

## 4. Synchronous vs. Asynchronous Workflows

To maintain responsive sub-200ms API response times while handling heavy processing:

```
[Candidate Browser] ──(1) Upload CV [POST /documents]──► [API Controller]
                                                              │
                                                              ▼
                                                   Save file to storage &
                                                   Insert Job [Pending]
                                                              │
[Candidate Browser] ◄──(2) Return 202 Accepted ───────────────┘
                                                              │
                                                              ▼
                                                   [Background Worker]
                                                   (Channels / HostedService)
                                                              │
                                                   ├─ Extract text from PDF/DOCX
                                                   ├─ Save raw text / errors
                                                   └─ Trigger Match Calculation
```

* **Synchronous Operations:** Authentication, company onboarding, job publishing, application submission, WorkSim candidate actions (real-time interactive response required), note submissions, and dashboard queries.
* **Asynchronous Operations (Background Workers):**
  * Document text extraction (`DocumentExtractionJob`).
  * CV requirement matching report generation.
  * Email notification dispatching.
  * Periodic session expiration cleaner (for unsubmitted, timed-out WorkSim sessions).
  * Webhook event verification and consumption.

---

## 5. Technology Abstractions & Interfaces

To adhere strictly to dependency inversion and prevent vendor lock-in:

* **File Storage:** `IFileStorageService` with an initial implementation `LocalSecureFileStorageService` (storing files outside the web root with randomized GUID keys) and a cloud-ready contract for Azure Blob / Amazon S3.
* **Text Extraction:** `ITextExtractor` with an initial implementation supporting local OpenXML and PDF parsing libraries.
* **Email Delivery:** `IEmailSender` with a development logger / SMTP stub implementation.
* **Payment Gateway:** `IPaymentGateway` interface ready for future Stripe integration, ensuring no business logic couples directly to payment SDKs.
* **Tenant Context:** `ITenantContext` resolved per HTTP request from authenticated user JWT claims, ensuring clean injection into EF Core query filters.
