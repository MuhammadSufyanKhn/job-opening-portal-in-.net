# HireSphere Security Audit, Authorization Hardening, and Reliability Report

## 1. Executive Summary

This document details the comprehensive security audit, authorization hardening, input validation, and reliability improvements performed across the HireSphere platform (Prompt 12). HireSphere's architecture comprises an ASP.NET Core Web API backend (Clean Architecture, EF Core, SQL Server) and a React + Vite + TypeScript frontend.

The audit identified and fixed several genuine security gaps, including:
1. **Multi-Tenant Company Authorization Bypass Gaps:** Verification that the caller was an active member of the target company was missing in document downloads, CV match report calculations, and WorkSim scenario catalogs.
2. **Missing Anti-Sniffing & Sandbox Headers on CV Downloads:** Resumes could potentially trigger active content execution in browsers if malformed or misclassified.
3. **Delayed Token Invalidation for Suspended Accounts:** Suspended users could continue accessing APIs until their JWT expired.
4. **Exception Mapping Disparity:** `HireSphere.Domain.Exceptions.ValidationException` was unhandled by middleware, causing internal 500 errors instead of clean 400 Bad Request responses.
5. **Unbounded Query Pagination:** Certain list endpoints accepted unbounded `pageSize` values, posing denial-of-service risks.

All 128 backend unit tests pass, and frontend static analysis/build passed with zero errors. No database schema changes were required.

---

## 2. Authentication Model and Token Security

### 2.1 Token Generation & Validation
- **JWT Architecture:** Uses HMAC-SHA256 (`HmacSha256`) with a cryptographically secure symmetric secret (`JwtSettings:SecretKey`).
- **Signature & Claims Validation:** Validates issuer (`JwtSettings:Issuer`), audience (`JwtSettings:Audience`), lifetime (`ValidateLifetime = true`), and clock skew (30 seconds).
- **Claims Extracted:** `sub` (User ID), `email`, `name`, `roles` (System roles), and `security_stamp`.
- **Password Hashing:** Passwords are hashed using ASP.NET Core Identity's PBKDF2 with HMAC-SHA256 and unique cryptographic salt per user. Plaintext passwords are never stored or logged.

### 2.2 Immediate Session Invalidation on Suspension
- **Security Stamp Verification:** Added `JwtBearerEvents.OnTokenValidated` check in `HireSphere.Infrastructure/DependencyInjection.cs`.
- When an administrator suspends a user via `AdminUserService.SuspendUserAsync`:
  1. The user's `SecurityStamp` in `dbo.Users` is immediately rotated to a new GUID.
  2. All active refresh tokens in `dbo.RefreshTokens` for the user are revoked.
  3. Subsequent API calls using existing JWTs are rejected immediately with `401 Unauthorized` because the token's `security_stamp` claim no longer matches the database value.
  4. Inactive or suspended users (`IsActive == false`) are rejected at the authentication stage.

---

## 3. Role-Based and Resource-Based Authorization

### 3.1 Trust Boundaries
- User identity is always resolved from authenticated JWT claims (`ICurrentUserService.UserId`). Client-supplied `userId` or `companyId` in request bodies/query params are never accepted as proof of identity.
- System roles (`Candidate`, `Employer`, `PlatformAdmin`) govern platform-level access.
- Company membership (`dbo.CompanyMembers`) governs organization-level tenancy.

### 3.2 Tenant & Resource Isolation Rules

| Area | Isolation Mechanism | Hardened in Prompt 12 |
| :--- | :--- | :--- |
| **Candidate Documents / CVs** | Candidate can only view/download their own documents (`CandidateId == caller.CandidateId`). | **Yes.** In `CandidateDocumentService.GetDocumentFileForCompanyAsync`, verified that any company recruiter accessing an applicant's resume is an active member of `JobApplication.CompanyId`. |
| **CV Match Reports** | Recruiters can only access match reports for jobs posted by their company. | **Yes.** In `CvMatchingService.GetMatchReportForApplicationAsync` and `RecalculateMatchReportAsync`, enforced active company membership verification. |
| **WorkSim Assessment Scenarios** | Scenarios can be public or company-private. | **Yes.** In `WorkSimManagementService.GetCompanyAvailableScenariosAsync` and `CompanyAssessmentsController`, callers must be active members of the company to view company scenarios. |
| **WorkSim Candidate Runtime** | Candidates can only access their assigned simulations (`CandidateId == caller.CandidateId`). Scoring is completely deterministic on server side. | Verified; answers & rules are not sent to frontend before completion. |
| **Recruitment Management** | Interview schedules and recruiter notes are scoped strictly to the hiring company. | Verified; only company recruiters/admins can manage pipeline stages and notes. |
| **Platform-Admin Portal** | Restricted by `[Authorize(Roles = "PlatformAdmin")]`. Cannot be called by ordinary users even if client-side routes are tampered with. | Verified; admin endpoints strictly reject non-admins. |

---

## 4. CV Storage and File-Upload Security

### 4.1 Ingestion Hardening
- **Allowed Formats:** Only `.pdf` and `.docx`.
- **Max File Size:** Enforced at 10 MB on backend.
- **Magic Byte Signature Verification:** Checked using `IDocumentParsingService.ValidateFileSignature`:
  - PDF: `%PDF` header (`0x25, 0x50, 0x44, 0x46`).
  - DOCX: PK zip header (`0x50, 0x4B, 0x03, 0x04`).
- **Path Traversal Protection:** User-supplied file names are completely stripped. Storage keys are generated as `{candidateId}/{documentId}{ext}`, strictly isolated within `cv-storage/`.
- **Parser Robustness:** Malformed or password-protected PDFs and corrupted DOCX files return safe domain parsing failures without throwing unhandled exceptions or logging extracted contents to logs.

### 4.2 Secure Download & Preview Headers
In both `CandidateDocumentsController.DownloadCv` and `CompanyApplicationsController.DownloadApplicationCv`:
- `X-Content-Type-Options: nosniff` prevents MIME-type sniffing by browsers.
- `Content-Security-Policy: default-src 'none'` neutralizes any active payloads if a PDF or file is rendered inline by an embedded browser viewer.
- File names in `Content-Disposition` headers are sanitized to strip `\r` and `\n` to prevent HTTP response splitting.

---

## 5. Input Validation, API Safety, and Reliability

### 5.1 Exception Handling
- `ExceptionHandlingMiddleware` was updated to explicitly catch `HireSphere.Domain.Exceptions.ValidationException`, returning a standard `400 Bad Request` ProblemDetails payload rather than a `500 Internal Server Error`.
- Stack traces and database internals are suppressed in production mode.

### 5.2 Query Bounding & Anti-DoS Pagination
Bounded pagination was applied across all list endpoints:
- `ApplicationService.GetCompanyApplicationsAsync`: `pageSize` is clamped via `Math.Clamp(pageSize, 1, 100)` and `page = Math.Max(1, page)`.
- `JobService.GetCompanyJobsAsync`: `pageSize` is clamped via `Math.Clamp(pageSize, 1, 100)`.
- Existing endpoints in `AdminUserService`, `AdminJobService`, `AdminAuditService`, and `NotificationService` were verified to enforce similar 1–100 limits.

### 5.3 SQL Safety
- All database queries use EF Core parameterized queries or LINQ expressions.
- No user-controlled strings are concatenated into raw SQL queries.

---

## 6. WorkSim Security and Integrity

1. **Assessment Isolation:** A candidate cannot start, answer, or inspect a simulation unless `assignment.CandidateProfile.UserId == caller.UserId`.
2. **Tamper-Proof Scoring:** Assessment scores are calculated exclusively on the backend by evaluating candidates' decisions against deterministic simulation criteria. No client-supplied scores are accepted.
3. **Status Lockout:** Once an assessment is completed or expired, subsequent action submissions are rejected with a 400 Bad Request.

---

## 7. Frontend Security Verification

1. **No Untrusted HTML Rendering:** A repository-wide audit verified that `dangerouslySetInnerHTML` is not used anywhere in the React frontend.
2. **Theme Consistency:** All UI components adhere strictly to the HireSphere white and light-blue aesthetic (`#0284c7`, `#0ea5e9`, `#f0f9ff`, slate neutrals).
3. **Token Storage:** JWT tokens are maintained in `localStorage` under `hiresphere_token`, read via Axios interceptors, and wiped on 401 response or explicit logout.
4. **Environment Secrets:** Verified that `.env` and `.env.example` contain only public Vite environment variables (`VITE_API_URL`); no server secrets or connection strings are stored on the frontend.

---

## 8. Verification & Test Results

### 8.1 Backend Automated Tests
- Command: `dotnet test tests/HireSphere.Tests.Unit/HireSphere.Tests.Unit.csproj`
- Total Tests: **128**
- Passed: **128**
- Failed: **0**
- Duration: ~3 seconds

New unit tests in `SecurityHardeningTests.cs` cover:
- Cross-tenant CV access denial for unauthorized company members.
- Cross-tenant CV match report access denial.
- Rejection of expired simulation submissions.
- Tamper-proofing of candidate score submissions.
- Magic byte file signature validation (PDF and DOCX).
- Security stamp validation and immediate token invalidation on user suspension.
- Pagination parameter clamping (Anti-DoS).
- Domain validation exception mapping to 400 Bad Request.
- Candidate CV access isolation from other candidates.

### 8.2 Frontend Static Analysis & Build
- Build: `npm run build` (`tsc -b && vite build`) -> **Succeeded (0 errors)**.
- Lint: `npm run lint` (`oxlint`) -> **0 errors, 50 non-blocking stylistic warnings**.

---

## 9. Manual SQL Scripts

**No schema changes or migrations were required for Prompt 12.**
The existing SQL Server database schema already contained all necessary tables and columns (`dbo.CompanyMembers`, `dbo.Users.SecurityStamp`, `dbo.RefreshTokens`, `dbo.CandidateDocuments`, etc.). All access-control gaps were resolved at the application and query-filter layer without database mutation.

---

## 10. Known Security Limitations & Solo-Developer Recommendations

1. **Development OpenApi Dependency:**
   - Visual Studio / .NET SDK emits warning `NU1903` for `Microsoft.OpenApi 2.0.0` pulled transitively by `Microsoft.AspNetCore.OpenApi 10.0.1-preview`. When .NET 10 is officially released, updating to the stable SDK will eliminate this warning.
2. **File Storage Scaling:**
   - Currently, CV files are stored on local private disk (`cv-storage/`). For production cloud deployment (e.g., Azure Blob Storage or AWS S3), consider implementing signed, short-lived URLs (SAS tokens) with content disposition headers to offload file delivery from the API server while preserving strict authorization.
3. **Antivirus / Malware Scanning:**
   - The platform includes `IMalwareScanner` interface and magic-byte checks. For high-volume production with public uploads, an external scanner (such as ClamAV or Windows Defender API) can be hooked into `IMalwareScanner` without changing the application logic.
