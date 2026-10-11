# HireSphere — Platform Admin Portal & Recruitment Operations Specification

## 1. Overview and Architecture

The **Platform Admin Portal & Recruitment Operations Management** module gives authorized platform administrators (`SuperAdmin`) comprehensive visibility and operational governance over the HireSphere SaaS ecosystem.

Key capabilities include:
- **Central Dashboard:** Real-time metrics calculated dynamically from active database entities (Users, Companies, Jobs, Applications, WorkSim assessments, recent activity audit logs).
- **Company Verification & Governance:** Review queue for newly registered companies, full inspection of business credentials, approval, rejection with reason recording, suspension with reason recording, and reactivation.
- **User & Account Management:** Directory of all registered accounts (candidates, employers, administrators), identity detail inspection, affiliation reviews, reversible suspension with reason, immediate server-side session invalidation, and self-lockout prevention for the last active SuperAdmin.
- **Job & Content Moderation:** Marketplace oversight, search and filter across vacancy statuses, full job detail and requirement inspection, unpublishing/suspension of violating job listings with mandatory justification, reactivation, and company notification.
- **Immutable Audit Trail:** Searchable, paginated event log tracking all consequential administrative actions, administrators responsible, target resources, timestamps, and structured JSON metadata.
- **Design System:** Consistent **white and light-blue theme** (`#ffffff`, `#f0f7ff`, `#2563eb`), responsive layouts, and accessible modals.

---

## 2. Security & Authorization Rules

### Role Enforcement
Every platform administration endpoint requires authentication with the `SuperAdmin` role:
```csharp
[Authorize(Roles = PlatformRoles.SuperAdmin)]
```
Unauthenticated or unauthorized callers (Candidates, Company Members) receive HTTP `401 Unauthorized` or `403 Forbidden`.

### Real-Time Server-Side Token Invalidation
In standard JWT architectures, an access token remains valid until its expiration timestamp even if an account is suspended. HireSphere implements a database validation check in `backend/src/HireSphere.Infrastructure/DependencyInjection.cs`:
```csharp
options.Events = new JwtBearerEvents
{
    OnTokenValidated = async context =>
    {
        var db = context.HttpContext.RequestServices.GetRequiredService<HireSphereDbContext>();
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.AccountStatus == AccountStatus.Disabled || user.IsDeleted)
        {
            context.Fail("User account is disabled or suspended.");
        }
    }
};
```
When an administrator suspends an account, all subsequent API requests with that user's token fail immediately without waiting for token expiration.

### Sole SuperAdmin Lockout Protection
In `AdminUserService.SuspendUserAsync`, if the user being suspended is in the `SuperAdmin` role:
```csharp
var activeSuperAdminsCount = await _db.UserRoles
    .Include(ur => ur.User)
    .Include(ur => ur.Role)
    .Where(ur => ur.Role.Name == PlatformRoles.SuperAdmin &&
                 ur.User.AccountStatus == AccountStatus.Active &&
                 !ur.User.IsDeleted)
    .CountAsync(cancellationToken);

if (activeSuperAdminsCount <= 1)
{
    throw new ConflictException("Cannot suspend the only remaining active SuperAdmin account to prevent system lockout.");
}
```
This guarantees that administrators cannot accidentally lock themselves out of platform management.

---

## 3. Manual Database Script Guide

As per HireSphere database guidelines, **no automatic migrations or seeders are executed**.

### Script 010: Add Job Moderation Support
- **File:** `database/scripts/010_AddJobModerationSupport.sql`
- **Purpose:** Adds moderation audit columns (`ModerationReason`, `ModeratedAtUtc`, `ModeratedByUserId`) and performance index `IX_JobPostings_ModeratedAtUtc` to `dbo.JobPostings`.
- **Safety:** Idempotent (safe to re-run multiple times).

#### Execution Steps in SSMS:
1. Open SQL Server Management Studio and connect to your instance.
2. Select database `HireSphereDb`.
3. Open and execute `database/scripts/010_AddJobModerationSupport.sql`.
4. Verification Query:
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'JobPostings' 
     AND COLUMN_NAME IN ('ModerationReason', 'ModeratedAtUtc', 'ModeratedByUserId');
   ```

---

## 4. Backend API Endpoints

All endpoints are prefixed with `/api/admin` and require `SuperAdmin` role authorization.

### Platform Dashboard
| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard/stats` | Returns real KPI aggregates (users, companies, jobs, applications, WorkSim stats, recent activity). |

### Company Governance
| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/companies/pending` | Retrieves all companies in `PendingApproval` status. |
| `GET` | `/api/admin/companies` | Retrieves all companies with optional status filter. |
| `GET` | `/api/admin/companies/paged` | Searchable, paginated company list (`search`, `status`, `page`, `pageSize`). |
| `GET` | `/api/admin/companies/{id}` | Full review details of a specific company. |
| `POST` | `/api/admin/companies/{id}/approve` | Approves company, enables posting, records audit log, notifies owner. |
| `POST` | `/api/admin/companies/{id}/reject` | Rejects registration with reason, records audit log, notifies owner. |
| `POST` | `/api/admin/companies/{id}/suspend` | Suspends active company with reason, records audit log, notifies owner. |
| `POST` | `/api/admin/companies/{id}/restore` | Restores suspended company to Approved status. |

### User Accounts
| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/users` | Paged user list (`search`, `role`, `accountStatus`, `page`, `pageSize`). |
| `GET` | `/api/admin/users/{id}` | Detailed user account information, candidate profile, company memberships, audit history. |
| `POST` | `/api/admin/users/{id}/suspend` | Safely suspends user account with recorded reason and lockout check. |
| `POST` | `/api/admin/users/{id}/reactivate` | Reactivates suspended user account. |

### Job Moderation
| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/jobs` | Paged job directory (`search`, `companyId`, `status`, `page`, `pageSize`). |
| `GET` | `/api/admin/jobs/{id}` | Detailed job listing, requirements, compensation, moderation history. |
| `POST` | `/api/admin/jobs/{id}/suspend` | Suspends job posting from marketplace with moderation reason, notifies employer team. |
| `POST` | `/api/admin/jobs/{id}/restore` | Restores suspended job posting to Published status. |

### Audit Trail
| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/audit` | Searchable and filtered paginated audit history (`search`, `actionType`, `targetResource`, `page`, `pageSize`). |

---

## 5. Frontend Pages & Routes

All routes are protected by `<ProtectedRoute requiredRole="SuperAdmin">`:

| Route | Component | Key Features |
|---|---|---|
| `/admin` & `/admin/dashboard` | `AdminDashboard.tsx` | KPI stat cards, WorkSim metrics, quick links, recent activity audit feed. |
| `/admin/companies` | `AdminCompanies.tsx` | Paged organization list, status tabs, search box, details modal, approval/rejection/suspension dialogs. |
| `/admin/users` | `AdminUsers.tsx` | User directory, role filter, status filter, detail modal, reversible suspension modal, lockout protection. |
| `/admin/jobs` | `AdminJobs.tsx` | Vacancy directory, status filter, search, full job inspection modal, moderation suspension with reason. |
| `/admin/audit` | `AdminAudit.tsx` | Immutable audit log table, action type badges, date/time formatting, metadata JSON inspection modal. |

---

## 6. Test Suite & Verification Results

### Backend Unit Tests
- **Command:** `dotnet test backend/HireSphere.slnx`
- **Result:** **87 passed, 0 failed, 0 skipped**.
- **Coverage Highlights:**
  - `GetPlatformDashboardStatsAsync_ComputesAccurateCounts`
  - `SuspendUserAsync_ActiveUser_SetsAccountStatusDisabledAndLogsAudit`
  - `SuspendUserAsync_SoleActiveSuperAdmin_ThrowsConflictException`
  - `ReactivateUserAsync_DisabledUser_SetsAccountStatusActiveAndLogsAudit`
  - `SuspendJobAsync_PublishedJob_SetsStatusSuspendedAndNotifiesCompany`
  - `RestoreJobAsync_SuspendedJob_SetsStatusPublishedAndLogsAudit`
  - `GetAuditLogsPagedAsync_FiltersByActionTypeAndSearch`

### Frontend Build
- **Command:** `npm run build`
- **Result:** TypeScript check (`tsc -b`) passed with 0 errors; Vite bundled production assets cleanly.
