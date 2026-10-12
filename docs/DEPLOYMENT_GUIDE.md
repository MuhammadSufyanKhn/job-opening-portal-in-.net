# HireSphere — Production Deployment & Operations Runbook

**Document ID:** `HS-OPS-01`  
**Version:** 1.0  
**Target Environment:** Production & Production-Like Staging  
**Architecture:** React 19 + Vite (Frontend) | ASP.NET Core (.NET 10) Web API (Backend) | EF Core 10 | Microsoft SQL Server  

---

## 1. Prerequisites

### Runtime & System Requirements
| Component | Minimum Version | Recommended Version | Notes |
| :--- | :--- | :--- | :--- |
| **.NET Runtime** | .NET 10.0 ASP.NET Core Runtime | .NET 10.0.12+ | Required for hosting `HireSphere.Api.dll` on bare-metal or VMs. |
| **Node.js** | Node 20.x LTS | Node 22.x LTS | Required at build time for compiling the frontend Vite bundle. |
| **SQL Server** | SQL Server 2019 (v15.0) | SQL Server 2022 or Azure SQL DB | Must use collation `Latin1_General_100_CI_AS_SC_UTF8`. |
| **Docker Engine** | Docker 24.0+ | Docker 27.0+ with Compose v2 | Optional, recommended for containerized hosting. |
| **Reverse Proxy** | Nginx 1.24+ / IIS 10.0+ | Nginx 1.27+ Alpine | Required for SSL termination, SPA routing fallback, and proxying. |

### Required Configuration Secrets
| Configuration Key | Env Variable Override | Description | Security Requirement |
| :--- | :--- | :--- | :--- |
| `Jwt:SecretKey` | `Jwt__SecretKey` | HMAC-SHA256 signing key for JWT tokens. | **Strictly required.** Minimum 32 characters (256 bits). Application fails startup in Production if missing or if development default key is detected. |
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings__DefaultConnection` | SQL Server connection string. | **Strictly required.** Must point to reachable SQL Server with valid credentials and database name `HireSphereDb`. |
| `Cors:AllowedOrigins` | `Cors__AllowedOrigins__0`, `...__1` | Allowed browser origins for CORS requests. | **Strictly required.** Must match the public production frontend URL (e.g., `https://hiresphere.example.com`). Wildcards (`*`) are prohibited. |
| `CvStorage:LocalStoragePath` | `CvStorage__LocalStoragePath` | Filesystem path for private CV documents. | Configurable persistent directory (e.g. `/app/cv_storage` or `C:\HireSphere\Storage\cvs`). Must be outside ephemeral container layers. |
| `Email:SmtpHost` | `Email__SmtpHost` | Outbound SMTP server hostname. | Optional. If empty, the backend runs in dev-logging mode, recording delivery attempts into `dbo.EmailDeliveryAttempts`. |

---

## 2. Local Production-Like Verification

Before deploying to a server, verify the builds and configuration locally:

### Step 1: Verify the Frontend Production Build
```bash
cd frontend
npm ci
npm run build
```
* **Expected Output:**
  - `dist/index.html`
  - `dist/assets/index-[hash].css`
  - `dist/assets/index-[hash].js`
  - Exit code `0` with zero build errors.

### Step 2: Verify the Backend Release Build & Test Suite
```bash
cd backend
dotnet build -c Release HireSphere.slnx
dotnet test -c Release HireSphere.slnx
```
* **Expected Output:**
  - Build succeeds with 0 errors.
  - All unit tests (137 tests) pass.
  - All integration tests (25 tests) pass.
  - Total test pass count: **162 passed, 0 failed**.

### Step 3: Verify Fail-Fast Production Startup
To test that production startup correctly validates missing or default keys:
```bash
cd backend/src/HireSphere.Api
# Running with Production environment and default keys will deliberately abort startup:
dotnet run --configuration Release --launch-profile "" --environment Production
```
* **Expected Outcome:** The application throws `InvalidOperationException`:
  `CRITICAL SECURITY CONFIGURATION ERROR: Production startup aborted. A secure, non-default Jwt:SecretKey (minimum 32 characters) must be configured...`

---

## 3. Database Deployment Procedure (Manual SSMS Execution)

> [!CRITICAL]
> **DATABASE SAFETY MANDATE:**  
> The HireSphere backend **never** modifies the database automatically. `Database.Migrate()` and `Database.EnsureCreated()` are deliberately absent from the codebase.  
> All schema modifications and seed data must be executed **manually in Microsoft SQL Server Management Studio (SSMS)**.

### Step 3.1: Create the Database
In SSMS, connect to your production SQL Server and execute:
```sql
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'HireSphereDb')
BEGIN
    CREATE DATABASE HireSphereDb COLLATE Latin1_General_100_CI_AS_SC_UTF8;
END
GO
USE HireSphereDb;
GO
```

### Step 3.2: Execute Schema Scripts in Strict Sequence
Execute the versioned scripts in `database/scripts/` in numerical order:
1. `001_CreateCoreIdentityAndTenantSchema.sql`
2. `002_CreateRecruitmentAndApplicationsSchema.sql`
3. `003_CreateDocumentsAndMatchingSchema.sql`
4. `004_CreateWorkSimAssessmentSchema.sql`
5. `005_CreateSubscriptionsAndOperationsSchema.sql`
6. `006_MakeCandidateDocumentOptionalInApplications.sql`
7. `007_EnhanceCandidateDocumentsWithVersioning.sql`
8. `008_SeedWorkSimIncidentScenario.sql`
9. `009_EnhanceAssessmentInvitationsAndNotifications.sql`
10. `010_AddJobModerationSupport.sql`
11. `011_AddCandidateSavedJobs.sql`
12. `012_EnsureRecruiterNotesAndInterviewSchedules.sql`

### Step 3.3: Execute Reference Seed Scripts
In `database/seeds/`:
1. `001_SeedInitialRolesAndAdmin.sql` — Creates system roles (`Candidate`, `CompanyMember`, `SuperAdmin`) and initial administrator account.
2. `002_SeedJobCategories.sql` — Populates standard industry job categories.

### Step 3.4: Verify Database Schema
Run this verification query in SSMS to verify the full set of 38 tables:
```sql
USE HireSphereDb;
GO
SELECT COUNT(*) AS TotalTables FROM sys.tables;
-- TotalTables must equal 38
```

---

## 4. Deployment Architectures

### Architecture Option A: Containerized Deployment via Docker Compose (Recommended)

This approach runs the frontend and backend in isolated, production-hardened containers while connecting to your existing SQL Server instance.

```
                      ┌────────────────────────────────────────┐
                      │             User Browser               │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS (:443 / :80)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │      hiresphere-frontend (Nginx)       │
                      │  - Serves compiled React 19 SPA        │
                      │  - Handles SPA client route fallbacks  │
                      │  - Proxies /api/* to backend           │
                      └──────────────────┬─────────────────────┘
                                         │ HTTP (:5000)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    hiresphere-backend (.NET 10 API)    │
                      │  - Production JWT Auth & Validation    │
                      │  - WorkSim Simulation Engine           │
                      │  - Explainable CV Matching Engine      │
                      │  - Stores private CVs to volume:       │
                      │    /app/cv_storage (hiresphere_cv_data)│
                      └──────────────────┬─────────────────────┘
                                         │ TCP (:1433)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │      SQL Server (SSMS Managed)         │
                      │   - Host machine / Azure SQL / VM      │
                      │   - Database: HireSphereDb (38 tables) │
                      └────────────────────────────────────────┘
```

#### Steps to Deploy via Docker Compose:
1. Clone repository to server.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and set:
   - `DATABASE_CONNECTION_STRING` (e.g., `Server=host.docker.internal,1433;Database=HireSphereDb;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True;`)
   - `JWT_SECRET_KEY` (Generate 64+ random characters)
4. Start the stack:
   ```bash
   docker compose up -d --build
   ```
5. Check health:
   ```bash
   docker compose ps
   curl http://localhost:5000/api/health
   ```

---

### Architecture Option B: Bare-Metal / Virtual Machine Deployment

#### Backend Deployment (Windows Server / IIS or Linux systemd)
1. Publish the release build:
   ```bash
   dotnet publish backend/src/HireSphere.Api/HireSphere.Api.csproj -c Release -o /var/www/hiresphere-api
   ```
2. Configure persistent CV storage:
   Create directory `/var/hiresphere/cv_storage` (Linux) or `C:\HireSphere\Storage\cvs` (Windows) and grant write permissions to the application user (`www-data` or `IIS_IUSRS`).
3. Set environment variables in systemd service or IIS configuration:
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `ConnectionStrings__DefaultConnection=Server=...;Database=HireSphereDb;...`
   - `Jwt__SecretKey=YourSecretKey...`
   - `Cors__AllowedOrigins__0=https://yourdomain.com`
   - `CvStorage__LocalStoragePath=/var/hiresphere/cv_storage`
4. Start or restart the service:
   ```bash
   sudo systemctl restart hiresphere-api
   ```

#### Frontend Deployment (Static Web Server / CDN)
1. Configure `.env.production` before building:
   ```bash
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```
2. Compile the production bundle:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```
3. Copy the contents of `frontend/dist/` to your web server root (`/var/www/hiresphere-web` or IIS website root).
4. **Configure SPA Fallback Routing:**
   - **Nginx:** `try_files $uri $uri/ /index.html;`
   - **IIS:** Install URL Rewrite Module and add rule in `web.config`:
     ```xml
     <configuration>
       <system.webServer>
         <rewrite>
           <rules>
             <rule name="SPA Fallback" stopProcessing="true">
               <match url=".*" />
               <conditions logicalGrouping="MatchAll">
                 <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                 <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
               </conditions>
               <action type="Rewrite" url="/index.html" />
             </rule>
           </rules>
         </rewrite>
       </system.webServer>
     </configuration>
     ```

---

## 5. Private CV & File Storage Architecture

### How CV Files are Handled:
1. **Upload & Storage Key Generation:**
   When a candidate uploads a CV (.pdf or .docx up to 10 MB), `LocalCvStorageService` generates an unguessable GUID-based storage key (e.g. `4b8c9d12e87a4192b6a2df830c2794c1.pdf`).
2. **Directory Isolation:**
   Files are stored in the directory configured by `CvStorage:LocalStoragePath`.
3. **No Direct Public Access:**
   Files are **never** placed in `wwwroot` or served via static file middleware. They cannot be accessed via direct URL.
4. **Authorized Retrieval:**
   Files can only be downloaded through authenticated, permission-checked endpoints:
   - `GET /api/candidates/documents/{id}/download` (candidate downloading their own CV).
   - `GET /api/companies/{companyId}/applications/{id}/download-cv` (recruiter reviewing candidate application).
   Both endpoints append security headers: `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'`.
5. **Persistence Across Deployments:**
   - In Docker: Stored in named volume `hiresphere_cv_data` mounted at `/app/cv_storage`.
   - On Bare-Metal/VM: Stored in an external directory outside application publish folders.
6. **Future Cloud Storage Migration:**
   `ICvStorageService` is a clean interface (`SaveFileAsync`, `GetFileStreamAsync`, `DeleteFileAsync`, `FileExistsAsync`). When switching to Azure Blob Storage or AWS S3 in the future, only an `AzureBlobCvStorageService : ICvStorageService` implementation is required, without modifying domain or application logic.

---

## 6. Email & Notification Delivery

HireSphere uses `DevLoggingEmailService`, which implements `IEmailService`:
* **When `Email:SmtpHost` is empty:** The application runs in offline/dev-safe mode. It renders and formats email invitations, logs the dispatch event, and persists the record into the database table `dbo.EmailDeliveryAttempts` with status `Sent`. This prevents the application from failing when SMTP is not configured.
* **When `Email:SmtpHost` is configured:** It dispatches emails via SMTP using TLS/SSL, sender address, and credentials supplied via environment variables (`Email__SmtpHost`, `Email__SmtpUser`, `Email__SmtpPassword`, `Email__SenderEmail`).
* **Failure Handling:** Transient SMTP failures are caught, logged, and recorded as `Failed` in `dbo.EmailDeliveryAttempts` without throwing unhandled exceptions to candidates or recruiters.

---

## 7. Security Hardening Checklist

- [x] **JWT Signing Key:** Rejects default dev keys; enforces 32+ character key in production.
- [x] **HTTPS Redirection:** Enforced via `app.UseHttpsRedirection()`.
- [x] **Forwarded Headers:** `UseForwardedHeaders` configured with `XForwardedFor` and `XForwardedProto` for reverse proxies.
- [x] **Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-XSS-Protection: 0`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [x] **CORS Origin Restriction:** Production rejects wildcard `*` origins and requires explicit frontend origin list.
- [x] **Zero Stack Trace Leaks:** `ExceptionHandlingMiddleware` returns safe RFC 7807 `ProblemDetails` with no stack traces or server paths.
- [x] **Zero Database/Server Leaks in Health Check:** In production, `/api/health` returns `{ status: "Healthy", database: "Connected" }` without database server hostnames or connection strings.
- [x] **Environment Secrets Protection:** Root `.gitignore` and `frontend/.gitignore` ignore all `.env` files while preserving `.env.example` templates.

---

## 8. Rollback & Troubleshooting Runbook

### Issue 1: Frontend Cannot Reach API (Network Error / CORS)
* **Symptom:** Browser console shows `net::ERR_CONNECTION_REFUSED` or `CORS header 'Access-Control-Allow-Origin' missing`.
* **Diagnostic Steps:**
  1. Verify backend container/process is running: `docker compose ps` or `curl http://localhost:5000/api/health`.
  2. Verify `Cors:AllowedOrigins` in backend configuration matches your frontend URL exactly (including protocol and port, e.g., `http://localhost` vs `http://localhost:80`).
  3. Verify `VITE_API_BASE_URL` in frontend: if reverse-proxied through Nginx, ensure it points to `/api`.

### Issue 2: Backend Fails Startup with Security Exception
* **Symptom:** Application exits immediately with `CRITICAL SECURITY CONFIGURATION ERROR: Production startup aborted.`
* **Root Cause:** In `Production` environment, `Jwt:SecretKey` is either missing, shorter than 32 characters, or set to a known development key.
* **Resolution:** Set environment variable `Jwt__SecretKey` to a cryptographically secure string with at least 32 characters.

### Issue 3: Database Connection Failure at Startup
* **Symptom:** Backend starts with warning: `Database connectivity check failed: unable to connect to database...`
* **Diagnostic Steps:**
  1. Confirm SQL Server instance is running and reachable.
  2. In SSMS, verify that database `HireSphereDb` exists.
  3. Check connection string: if running in Docker on Windows, use `Server=host.docker.internal,1433;Database=HireSphereDb;...` and ensure SQL Server TCP/IP is enabled in SQL Server Configuration Manager.
  4. Query `/api/health`: should return status `Healthy` once SQL Server is reachable.

### Issue 4: Client-Side Routes Return 404 After Page Refresh
* **Symptom:** Directly navigating or refreshing `/jobs/123` or `/candidate/profile` returns HTTP 404.
* **Root Cause:** Web server is attempting to find a physical file matching `/jobs/123` instead of falling back to `/index.html`.
* **Resolution:** Ensure Nginx has `try_files $uri $uri/ /index.html;` in `frontend/nginx.conf` or IIS has URL rewrite configured in `web.config`.

### Issue 5: Uploaded CVs Disappear After Container Restart
* **Symptom:** Candidate or recruiter receives 404 "File content missing from private storage" when clicking download.
* **Root Cause:** CV storage path was inside ephemeral container layer instead of a persistent volume.
* **Resolution:** Ensure `hiresphere_cv_data:/app/cv_storage` is declared in `docker-compose.yml` and `CvStorage:LocalStoragePath=/app/cv_storage`.

---

## 9. Rollback Procedure

If a deployed release introduces an operational issue:
1. **Containerized Rollback:**
   ```bash
   # Re-tag previous known-good image or checkout previous Git commit tag
   git checkout <previous-stable-tag>
   docker compose up -d --build
   ```
2. **Database Rollback:**
   - Because all schema scripts `001` through `012` are additive and idempotent, rolling back backend code to a previous commit generally does not break existing database tables.
   - If a full database restore is needed, follow the restore script in [`docs/MANUAL_SQL_EXECUTION_GUIDE.md`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/docs/MANUAL_SQL_EXECUTION_GUIDE.md#5-production-maintenance--operational-procedures).
