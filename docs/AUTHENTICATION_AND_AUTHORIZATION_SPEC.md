# HireSphere — Authentication, Authorization & Identity Specification

**Document ID:** `HS-SPEC-02`  
**Version:** 2.0  
**Phase:** Phase 2 Implementation Baseline  
**Status:** Approved & Implemented  

---

## 1. Executive Summary

This document describes the identity, authentication, multi-tenant authorization, candidate profile management, company lifecycle, and platform administration foundation implemented in HireSphere Phase 2.

All identity boundaries, tenant isolation policies, cryptographic standards, manual SQL requirements, and API contracts established here serve as the security foundation for subsequent modules (Job Marketplace, Applications, CV Matching, WorkSim, Subscriptions, and Analytics).

---

## 2. Authentication Mechanism & Security Decisions

### 2.1 Tokens and Rotation Policy
* **Access Tokens:** Short-lived JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`).
  * Default lifespan: **60 minutes**.
  * Contains essential claims: `sub` (User ID), `email`, `jti`, `name`, `roles` (Platform roles), `tenant_id` (Active company ID), `company_role` (Active company role), `security_stamp`.
  * Avoids storing sensitive personal or confidential information in claims.
* **Refresh Tokens:**
  * Cryptographically secure 64-byte random values generated via `RandomNumberGenerator`.
  * **Database Storage:** Stored as SHA-256 cryptographic hashes (`TokenHash`). The plain refresh token is never stored in plaintext.
  * **Lifespan:** 7 days.
  * **Rotation & Reuse Detection:** Every refresh operation invalidates the submitted refresh token (`IsRevoked = true`), generates a fresh token pair, and preserves the replacement chain (`ReplacedByTokenHash`). If a revoked refresh token is presented, the system treats it as token theft and revokes all active tokens for that user.
* **Browser Security & Storage:**
  * In the React frontend, the short-lived access token is maintained in an in-memory client state (`AuthContext`) and automatically attached to outgoing HTTP requests via Axios request interceptors (`Authorization: Bearer <token>`).
  * Refresh token rotation is handled via the `/api/v1/auth/refresh-token` endpoint.
  * Upon logout or account suspension, tokens are explicitly revoked on the server and cleared from the browser session.

### 2.2 Password Security & Cryptography
* **Hashing Standard:** PBKDF2 (Password-Based Key Derivation Function 2) using `HMAC-SHA256`.
* **Iteration Count:** **100,000 iterations** (exceeding OWASP minimums).
* **Salt Size:** 128-bit (16 bytes) cryptographically secure salt.
* **Hash Output:** 256-bit (32 bytes) derived key.
* **Format:** `{Iterations}.{Base64Salt}.{Base64Hash}`.
* **Verification:** Constant-time comparison using `CryptographicOperations.FixedTimeEquals` to prevent side-channel timing attacks.
* Plaintext passwords or weak hashing algorithms (MD5, SHA1) are strictly prohibited.

---

## 3. Account Types & Role Model

HireSphere enforces a strict two-tier role hierarchy: **Platform Roles** and **Company Roles**.

```
┌──────────────────────────────────────────────────────────────┐
│                    PLATFORM ROLES                            │
│  • SuperAdmin      : Global platform governance & approval    │
│  • CompanyMember   : Employer organization team member       │
│  • Candidate       : Job seeker / applicant                  │
└──────────────────────────────┬───────────────────────────────┘
                               │ (When Platform Role = CompanyMember)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    COMPANY ROLES (Per-Tenant)                │
│  • Owner           : Organization management, billing, team   │
│  • Recruiter       : Vacancies, candidate applications, CVs  │
│  • HiringManager   : Assigned interviews, scorecards, notes  │
└──────────────────────────────────────────────────────────────┘
```

### 3.1 Platform Roles
1. **Candidate:**
   * Automatically assigned during candidate registration (`POST /api/v1/auth/register-candidate`).
   * Associated 1:1 with a `CandidateProfile` record.
   * Can only view and update their own profile; isolated from other candidates and company data.
2. **CompanyMember:**
   * Assigned to users registered as employers or invited to an employer organization.
   * Grants access to employer portals; permissions are evaluated strictly within an active company membership context.
3. **SuperAdmin:**
   * Platform-level administrator with authority to review company registrations, approve/reject/suspend companies, and inspect audit logs.
   * **Never accessible via public registration.** Provisioned strictly through administrative database procedures.

### 3.2 Company Roles & Permissions
* **Owner:** Full organizational authority. Can update company profile, invite team members, assign company roles, manage subscriptions, and oversee recruitment.
* **Recruiter:** Can author vacancies, manage applications, view candidate CVs, review match reports, and manage pipeline stages once the company is `Approved`.
* **HiringManager:** Read-only access to assigned job candidates, scorecards, and interview scheduling notes.

---

## 4. Multi-Tenant Isolation & Company Lifecycle

### 4.1 Server-Authoritative Tenant Enforcement
* A user's company-specific permissions are **never inferred from frontend-supplied headers alone**.
* The server verifies that:
  1. The user has an active membership (`CompanyMembers` table with `MembershipStatus = Active`) for the exact `CompanyId`.
  2. The company itself is in an allowable status (`Approved` for recruitment operations; `PendingApproval` allows only profile completion and status viewing).
* Any attempt to access a company without an active membership returns `403 Forbidden`.

### 4.2 Company Approval Lifecycle
```
[Company Registration]
          │
          ▼
   PendingApproval ──────────► [SuperAdmin Rejects] ──► Rejected
          │
          ├──────────────────► [SuperAdmin Approves] ──► Approved
          │                                                 │
          ▼                                                 ▼
[Limited Operations:                                   [Full Access:
 Profile Edit, Status Check]                            Jobs, CVs, WorkSim]
                                                            │
                                                            ▼
                                                       [Violation/Default]
                                                            │
                                                            ▼
                                                        Suspended
```

* **PendingApproval:** Default state on registration. The initial Owner cannot publish vacancies or browse public recruitment features until approved by a platform administrator.
* **Approved:** Full access to recruitment features according to company role permissions.
* **Rejected:** Blocked from all operational recruiting workflows. Reason for rejection recorded in the audit trail.
* **Suspended:** Administrative block placed on the organization.

---

## 5. Audit Logging Architecture

Security-critical and state-altering actions are recorded synchronously in the `AuditLogs` table.

### 5.1 Audited Events
* User account registration (Candidate, Company Owner).
* User authentication failures (invalid credentials, locked accounts).
* Company registration (`CompanyRegistered`).
* Company approval status transitions (`CompanyApproved`, `CompanyRejected`, `CompanySuspended`).
* Team invitations and role assignments.
* Candidate profile updates.

### 5.2 Privacy & Security Protections
* Passwords, plain tokens, security stamps, or private personal data are **never recorded** in audit logs.
* Audit records capture `ActorUserId`, `CompanyId`, `ActionType`, `TargetResource`, `TargetResourceId`, `IpAddress`, `UserAgent`, `MetadataJson`, and `TimestampUtc`.
* Ordinary authenticated users cannot modify or purge audit records.

---

## 6. Complete API Endpoint Catalog

All routes are prefixed with `/api/v1`.

| HTTP Method | Route | Authentication | Required Role / Permission | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register-candidate` | Public | None | Register a candidate account and create initial `CandidateProfile`. |
| `POST` | `/api/v1/auth/register-company` | Public | None | Register an employer company and assign the user as `Owner` with `PendingApproval` status. |
| `POST` | `/api/v1/auth/login` | Public | None | Authenticate credentials and return JWT access token, refresh token, and user info. |
| `POST` | `/api/v1/auth/refresh-token` | Public (Token-guarded) | Valid Refresh Token | Rotate refresh token and issue a fresh access token. |
| `POST` | `/api/v1/auth/revoke-token` | Authenticated | Valid Access Token | Explicitly revoke active refresh tokens and log out. |
| `GET` | `/api/v1/auth/me` | Authenticated | Any active user | Retrieve current authenticated user profile, roles, and memberships. |
| `GET` | `/api/v1/candidate/profile` | Authenticated | `Candidate` | Retrieve current candidate's personal profile. |
| `PUT` | `/api/v1/candidate/profile` | Authenticated | `Candidate` | Update current candidate's profile details. |
| `GET` | `/api/v1/companies/my-companies` | Authenticated | `CompanyMember` | Retrieve all company organizations where the user has active membership. |
| `GET` | `/api/v1/companies/{id}` | Authenticated | `CompanyMember` (Tenant member) | Retrieve company details and membership status. |
| `PUT` | `/api/v1/companies/{id}` | Authenticated | `CompanyMember` (`Owner` role) | Update company name, description, industry, or website. |
| `POST` | `/api/v1/companies/{id}/invite` | Authenticated | `CompanyMember` (`Owner` role) | Invite a new team member (`Recruiter` or `HiringManager`). |
| `GET` | `/api/v1/admin/companies/pending` | Authenticated | `SuperAdmin` | List all companies awaiting administrative approval. |
| `POST` | `/api/v1/admin/companies/{id}/approve` | Authenticated | `SuperAdmin` | Approve a pending company registration. |
| `POST` | `/api/v1/admin/companies/{id}/reject` | Authenticated | `SuperAdmin` | Reject a pending company registration with a reason. |
| `POST` | `/api/v1/admin/companies/{id}/suspend` | Authenticated | `SuperAdmin` | Suspend an active company with a reason. |

---

## 7. Configuration & Environment Variables

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `ConnectionStrings:DefaultConnection` | SQL Server connection string | `Server=localhost;Database=HireSphereDb;Trusted_Connection=True;TrustServerCertificate=True;` |
| `Jwt:Issuer` | JWT token issuer | `HireSphere` |
| `Jwt:Audience` | JWT audience claim | `HireSphereApp` |
| `Jwt:SecretKey` | HMAC-SHA256 signing key (min 32 bytes) | *Secure 256-bit environment secret* |
| `Jwt:AccessTokenExpirationMinutes` | Access token lifespan | `60` |
| `Jwt:RefreshTokenExpirationDays` | Refresh token lifespan | `7` |
| `FrontendUrl` | Permitted CORS origin for React SPA | `http://localhost:5173` |

---

## 8. Development Setup & Execution Guide

### 8.1 Database Setup (Manual Execution in SSMS)
1. Open SQL Server Management Studio (SSMS).
2. Execute the database creation script:
   ```sql
   IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'HireSphereDb')
   BEGIN
       CREATE DATABASE HireSphereDb COLLATE Latin1_General_100_CI_AS_SC_UTF8;
   END;
   ```
3. Execute schema scripts in sequence from `database/scripts/`:
   * `001_CreateCoreIdentityAndTenantSchema.sql`
   * `002_CreateRecruitmentAndApplicationsSchema.sql`
   * `003_CreateDocumentsAndMatchingSchema.sql`
   * `004_CreateWorkSimAssessmentSchema.sql`
   * `005_CreateSubscriptionsAndOperationsSchema.sql`
4. Execute seed script `database/seeds/001_SeedInitialRolesAndAdmin.sql` to populate foundational platform roles (`Candidate`, `CompanyMember`, `SuperAdmin`).
   * *Optional:* To bootstrap a local development SuperAdmin (`admin@hiresphere.local`), uncomment the development provisioning block in `001_SeedInitialRolesAndAdmin.sql` before execution.

### 8.2 Running the Backend (.NET 10 API)
```powershell
cd "d:\.NET PROJECTS\Job portal openings\backend\src\HireSphere.Api"
dotnet run
```
* API starts on: `https://localhost:7087` and `http://localhost:5115`
* OpenAPI JSON specification available at `/openapi/v1.json`

### 8.3 Running the Frontend (React 19 + Vite)
```powershell
cd "d:\.NET PROJECTS\Job portal openings\frontend"
npm run dev
```
* Vite SPA starts on: `http://localhost:5173`

### 8.4 Running Automated Tests
```powershell
cd "d:\.NET PROJECTS\Job portal openings\backend"
dotnet test
```
* Executes 22 automated xUnit tests validating authentication, tenant authorization, password hashing, JWT claims, candidate isolation, and admin approval workflows.
