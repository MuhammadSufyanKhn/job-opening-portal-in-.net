# HireSphere — Engineering Rules, Architecture & Database Discipline

**Document ID:** `HS-ENG-02`  
**Version:** 1.0  
**Status:** Mandatory Engineering Contract  

---

## 1. Architectural Blueprint: The Modular Monolith

HireSphere is architected as a **Modular Monolith** using **Clean Architecture** principles. This structure maximizes developer velocity, provides clear bounded contexts, eliminates distributed systems latency and failure modes, and maintains a strict path toward microservices if scale ever demands it in the future.

```
                     ┌──────────────────────────────────────────────┐
                     │          HireSphere.Api (Web API)            │
                     │  • Controllers, Middleware, Auth, Swagger    │
                     └───────────────────────┬──────────────────────┘
                                             │
                     ┌───────────────────────▼──────────────────────┐
                     │          HireSphere.Application              │
                     │  • Use Cases, Services, DTOs, Validators     │
                     └───────────────┬──────────────┬───────────────┘
                                     │              │
        ┌────────────────────────────┘              └────────────────────────────┐
        ▼                                                                        ▼
┌─────────────────────────────────┐                                  ┌─────────────────────────────────┐
│     HireSphere.Domain           │                                  │   HireSphere.Infrastructure     │
│  • Entities, Enums, Exceptions  │◄─────────────────────────────────┤  • EF Core DbContext, Mappings  │
│  • Core Domain Logic (Pure C#)  │                                  │  • File Storage, Text Extractor │
└─────────────────────────────────┘                                  │  • Repositories, Email Service  │
                                                                     └─────────────────────────────────┘
```

### 1.1 Project Structure Specification

```
HireSphere/
├── backend/
│   ├── HireSphere.sln
│   ├── src/
│   │   ├── HireSphere.Domain/              # Zero external dependencies. Entities, Enums, Value Objects.
│   │   ├── HireSphere.Application/         # Business interfaces, DTOs, Services, FluentValidation, Mappings.
│   │   ├── HireSphere.Infrastructure/      # EF Core DbContext, Fluent API mappings, Repositories, External services.
│   │   └── HireSphere.Api/                 # ASP.NET Core Web API, Controllers, Middleware, Auth, Program.cs.
│   └── tests/
│       ├── HireSphere.Tests.Unit/          # Domain and application service unit tests (xUnit, FluentAssertions, Moq).
│       └── HireSphere.Tests.Integration/   # WebApplicationFactory integration tests with test database.
├── frontend/                               # Vite + React 19 + TypeScript SPA
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/                     # Reusable UI components (buttons, modals, inputs, badges)
│   │   ├── context/                        # AuthContext, NotificationContext
│   │   ├── hooks/                          # Custom React hooks
│   │   ├── layouts/                        # CandidateLayout, CompanyLayout, AdminLayout, PublicLayout
│   │   ├── pages/                          # Routed views divided by portal
│   │   │   ├── candidate/
│   │   │   ├── company/
│   │   │   ├── admin/
│   │   │   └── public/
│   │   ├── services/                       # Typed Axios HTTP API clients
│   │   ├── types/                          # TypeScript DTOs matching backend models
│   │   ├── utils/                          # Formatting, validation, date helpers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css                       # Design system CSS tokens & styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── database/                               # Manual SQL Execution Directory (SSMS)
│   ├── scripts/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_identity_and_roles.sql
│   │   ├── 003_job_marketplace.sql
│   │   ├── 004_cv_matching.sql
│   │   └── 005_worksim_engine.sql
│   ├── seeds/
│   │   ├── 001_seed_reference_data.sql
│   │   └── 002_seed_demo_scenarios.sql
│   └── README.md                           # Step-by-step SSMS execution guide
└── docs/                                   # Authoritative project documentation
```

---

## 2. Non-Negotiable Database Discipline

> [!CRITICAL]
> **MANDATORY DATABASE PROTOCOL: USER-CONTROLLED SQL EXECUTION**  
> All database creation, schema modifications, table definitions, foreign keys, indexes, and seed scripts are executed **exclusively by the user through SQL Server Management Studio (SSMS)**.
>
> 1. **Zero Automatic Migrations:** Never call `Database.Migrate()`, `Database.EnsureCreated()`, or any EF Core automated migration executor during application startup or within tests.
> 2. **Versioned SQL Scripts:** Every database alteration must be authored in a standalone, clearly numbered SQL script inside `database/scripts/`.
> 3. **Change Approval Protocol:** Before any database modification is applied:
>    - Prepare the SQL script with transactional safeguards (`BEGIN TRANSACTION ... COMMIT TRANSACTION`).
>    - Provide an explanation of changes, foreign key implications, and any data-loss risks.
>    - Await explicit user approval before assuming the database reflects the schema.
> 4. **Strict Dual Alignment:** The EF Core domain entities / Fluent API mappings and the manually maintained SQL scripts must remain 100% identical. Never add an EF Core property without a corresponding SQL column in a script.

### 2.1 SQL Script Authoring Standards
Every SQL script must follow these engineering conventions:
* **Idempotency:** Include defensive checks (e.g., `IF NOT EXISTS (...)` or checking `sys.tables` / `sys.columns`).
* **Explicit Naming:** Primary keys as `PK_TableName`, Foreign keys as `FK_ChildTable_ParentTable_Column`, Indexes as `IX_TableName_ColumnName`, Unique constraints as `UQ_TableName_ColumnName`.
* **Explicit Data Types:** Use `NVARCHAR` for text supporting international character sets, `DATETIMEOFFSET` or `DATETIME2` for timestamps in UTC, `DECIMAL(18,2)` for financial fields, `UNIQUEIDENTIFIER` or `INT IDENTITY(1,1)` consistently for IDs.
* **Audit Columns:** Every domain table must include:
  - `CreatedAtUtc DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()`
  - `UpdatedAtUtc DATETIMEOFFSET NULL`
  - `IsDeleted BIT NOT NULL DEFAULT 0` (for soft-deletable records)

---

## 3. Security, Privacy & Multi-Tenant Isolation

### 3.1 Multi-Tenant Isolation Model
HireSphere implements a **Single-Database, Shared-Schema, Discriminator-Isolated Multi-Tenancy** model:
* Every tenant-owned entity inherits a `CompanyId` foreign key.
* **Global Query Filters:** The EF Core `DbContext` configures global query filters for company-scoped entities:
  ```csharp
  modelBuilder.Entity<JobPosting>().HasQueryFilter(j => j.CompanyId == _currentTenantService.CompanyId);
  ```
* **Application Layer Defense-in-Depth:** Application services must explicitly assert tenant ownership before updating or deleting resources:
  ```csharp
  if (job.CompanyId != currentTenantId)
      throw new ForbiddenAccessException("Cross-tenant access prohibited.");
  ```
* **Candidate Document Privacy:** Candidate CVs and profile records are strictly candidate-owned until an application is submitted to a specific company, granting that company read-only access to that specific application version.

### 3.2 Secure File Storage Architecture
* Raw CV files (PDF/DOCX) must **never** be placed inside the `wwwroot` or publicly accessible web directories.
* Files are stored in a private directory configured via `appsettings.json` (or external blob storage abstraction).
* Stored files receive randomized cryptographic storage identifiers (e.g., `8f7b3c2e-4b1a-4e89-a5c2-6f81e3a10b99.pdf`), stripping original user file paths.
* Downloads are served strictly through an authenticated controller action (`GET /api/candidates/documents/{id}/download`) that validates user authorization and streams the file with appropriate MIME headers.

### 3.3 Authorization & Credentials
* **JWT Security:** Cryptographic signing with strong HMAC-SHA256 or RSA secret stored in environment variables / user secrets (never committed to Git).
* **Token Lifetime:** Short-lived access tokens (15-60 minutes) combined with sliding, revokable refresh tokens.
* **Audit Logging:** Security-sensitive operations (login, role change, company status change, CV download) are recorded without storing passwords, tokens, or personal identifiers.

---

## 4. WorkSim Assessment Integrity & Responsible AI Rules

### 4.1 Server-Authoritative Execution
* The frontend WorkSim client is purely a presentation layer. It displays the current scenario state and dispatches user actions.
* The backend validates action legality against the active session's state machine.
* Scoring is calculated server-side using versioned rubric algorithms upon session submission. Client-side scoring is strictly disallowed.
* All candidate actions, timestamps, and investigation queries are recorded into an append-only `SimulationActionLogs` table.

### 4.2 Responsible Assessment Principles
* **Evidence Traceability:** Every score must be accompanied by the scenario actions and rubric criteria that produced it.
* **No Autonomous Rejection:** Candidate match scores and WorkSim simulation outcomes are **decision-support indicators for human hiring teams**. The system must never trigger automated rejection rules based purely on an algorithmic score.
* **Fairness & Accommodations:** Simulation scenarios test job-relevant problem-solving actions. The platform provides configurable time extensions and full accessibility compliance (WCAG 2.1 AA) for candidates with accommodation requests.

---

## 5. Backend Code Standards & Clean Conventions

1. **Thin Controllers:** Controllers only accept requests, invoke application services / MediatR commands, and return appropriate HTTP status codes (`200 OK`, `201 Created`, `400 BadRequest`, `401 Unauthorized`, `403 Forbidden`, `404 NotFound`).
2. **Strong Typing & Validation:** All incoming requests use dedicated DTOs validated via FluentValidation.
3. **Centralized Exception Handling:** Custom middleware catches domain exceptions and transforms them into RFC 7807 Problem Details JSON responses.
4. **Asynchronous I/O:** All database and file I/O operations must use `async/await` with `CancellationToken` propagation.
5. **Pagination & Query Optimization:** All list endpoints must support page and pageSize parameters; unbounded collection queries (`ToList()` without filters or limits) are strictly prohibited.
6. **No Phantom Tests:** Every unit and integration test must be executed against the actual test runner and verified green before being documented as passed.

---

## 6. Frontend Engineering & UX Standards

1. **TypeScript Strict Mode:** Enabled across the entire frontend application. No implicit `any`.
2. **Component Reusability:** Core UI elements (Button, Input, Modal, Badge, Table, Card, Spinner, Dropdown) built as modular, accessible components in `components/ui/`.
3. **Animation Discipline (Motion for React):** Purposeful micro-animations for page transitions, drawer disclosures, state changes, and feedback. No distracting, continuous motion loops. Full respect for `prefers-reduced-motion`.
4. **State Management:** React Context + custom hooks for authentication and global notifications; local component state or lightweight stores for UI state; Axios interceptors for automatic JWT injection and 401 token refresh handling.
5. **Responsive Layouts:** Mobile-first responsive grids supporting desktop (1440px+), tablet (768px-1024px), and mobile (375px-767px).
