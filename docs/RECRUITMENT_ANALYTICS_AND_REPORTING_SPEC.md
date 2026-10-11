# HireSphere Recruitment Analytics, Hiring Pipeline, and Reporting Specification

## 1. Executive Summary

This document specifies the recruitment analytics, pipeline funnel, and reporting capabilities implemented for **Prompt 9: HireSphere Recruitment Analytics, Hiring Pipeline, and Reporting**.

HireSphere now provides authorized employers and platform administrators with actionable, data-driven recruitment insights. All metrics are calculated directly from active database records, with strict company tenant isolation, safe handling of zero denominators, formula-injection-safe CSV export, and responsible assessment evaluation disclosures.

---

## 2. Analytics Architecture & Tenant Isolation

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      HireSphere Frontend (React)                       │
 │  • /company/analytics (Company Recruitment Dashboard & Pipeline)       │
 │  • /admin/dashboard (Platform Overview & Activity Trend)               │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP JWT Bearer
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      Backend API Controllers                           │
 │  • CompanyAnalyticsController (/api/companies/{companyId}/analytics)   │
 │  • AdminDashboardController   (/api/admin/dashboard/analytics)        │
 │  [Validates authenticated user identity & company membership]          │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                 AnalyticsService (Application Layer)                   │
 │  • Validates tenant membership: User must be active CompanyMember     │
 │  • Applies inclusive UTC date range filtering                          │
 │  • Calculates recruitment funnel conversions with zero-divide safety   │
 │  • Aggregates WorkSim assessment metrics, score buckets & rubrics      │
 │  • Generates formula-injection-safe UTF-8 CSV exports                  │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    SQL Server Database (EF Core)                       │
 │  • JobPostings, JobApplications, ApplicationStatusHistories            │
 │  • AssessmentAssignments, SimulationSessions, AssessmentResults        │
 │  • Companies, CompanyMembers, CandidateProfiles                        │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implemented API Endpoints

All endpoints require JWT Bearer authentication:

### `GET /api/companies/{companyId}/analytics`
* **Authorization:** Authenticated user must be an active `CompanyMember` of `{companyId}` (`Owner`, `Recruiter`, `HiringManager`).
* **Query Parameters:**
  * `preset`: `"7d"`, `"30d"`, `"90d"`, `"all"`, or `"custom"` (default: `"30d"`).
  * `startDateUtc`: ISO 8601 UTC date string (required if `preset = "custom"`).
  * `endDateUtc`: ISO 8601 UTC date string (required if `preset = "custom"`).
* **Response:** Returns `CompanyRecruitmentOverviewDto`:
  * Overall job and application summary metrics.
  * Progressive recruitment funnel with conversion and drop-off rates.
  * Current application status snapshot.
  * Daily application inflow timeline.
  * WorkSim simulation statistics (completion rate, average score, score buckets, rubric competencies).
  * Per-vacancy recruitment performance table.

### `GET /api/companies/{companyId}/analytics/jobs/{jobId}`
* **Authorization:** Requires active membership in `{companyId}`, and verifies `{jobId}` belongs to `{companyId}`.
* **Query Parameters:** Same date filtering parameters as company overview.
* **Response:** Returns `JobDetailAnalyticsDto` with vacancy-specific funnel, status distribution, and WorkSim metrics.

### `GET /api/companies/{companyId}/analytics/export-csv`
* **Authorization:** Requires active membership in `{companyId}`.
* **Query Parameters:** Same date filtering parameters.
* **Response:** Streams formatted `text/csv; charset=utf-8` file attachment (`Content-Disposition: attachment; filename="hiresphere_recruitment_report_{companySlug}_{yyyyMMdd}.csv"`).

### `GET /api/admin/dashboard/analytics`
* **Authorization:** Restricted to `SuperAdmin` platform administrators.
* **Query Parameters:** `preset`, `startDateUtc`, `endDateUtc`.
* **Response:** Returns `PlatformAnalyticsOverviewDto` with platform-wide totals, growth inflow trend, and active hiring organizations leaderboard.

---

## 4. Metric Definitions and Mathematical Formulas

| Metric Name | Formula / Query Definition | Zero Denominator Safety |
| :--- | :--- | :--- |
| **Total Applications** | `COUNT(JobApplications)` where `CompanyId == companyId` | Always integer >= 0 |
| **Applications In Period** | Applications submitted within `[StartDateUtc, EndDateUtc]` | Always integer >= 0 |
| **Active Applications** | Applications where `CurrentStage NOT IN (Hired, Rejected, Withdrawn)` | Count of candidates in active pipeline |
| **Overall Hire Rate %** | `(HiredCount / ApplicationsInPeriod) * 100` | Returns `0.0%` if `ApplicationsInPeriod == 0` |
| **Funnel Stage Volume** | Number of applications that reached or passed the stage rank | Monotonic progression: count <= previous stage |
| **Stage Conversion Rate %** | `(CurrentStageCount / PreviousStageCount) * 100` | Returns `0.0%` if `PreviousStageCount == 0` |
| **Stage Drop-Off Count** | `MAX(0, PreviousStageCount - CurrentStageCount)` | Number of candidates that did not advance |
| **WorkSim Completion Rate %** | `(CompletedAssignments / TotalAssignments) * 100` | Returns `0.0%` if `TotalAssignments == 0` |
| **Average Score** | `AVG(AssessmentResults.TotalScore)` | Rounded to 1 decimal place; `null` if 0 completed |
| **Average Completion Time** | `AVG(CompletedAtUtc - AssignedAtUtc)` in minutes | Filters out outliers (> 7 days) |

### Recruitment Funnel Progression Sequence
1. **Applied:** All candidate applications submitted (`ApplicationStage.Submitted` or higher).
2. **Under Review:** Candidate reviewed by recruiter (`ApplicationStage.UnderReview` or higher).
3. **Shortlisted:** Candidate shortlisted (`ApplicationStage.Shortlisted` or higher).
4. **WorkSim Assessment:** Candidate invited to or completed simulation (`AssessmentPending`, `AssessmentCompleted`, or higher).
5. **Interview:** Interview scheduled (`InterviewScheduled` or higher).
6. **Job Offered:** Official offer extended (`Offered` or higher).
7. **Hired:** Candidate hired (`ApplicationStage.Hired`).
8. **Terminal Outcomes:**
   - `Rejected`: Applications whose terminal stage is `Rejected`.
   - `Withdrawn`: Applications whose terminal stage is `Withdrawn`.

---

## 5. CSV Export and Security Safeguards

To prevent spreadsheet formula injection attacks (CSV Injection / CWE-1236), all exported fields undergo strict sanitization before serialization:

1. **Formula Symbol Guard:** If any string field begins with `=`, `+`, `-`, or `@`, it is immediately prefixed with a single quote (`'`), ensuring spreadsheet software (e.g., Microsoft Excel, Google Sheets, LibreOffice Calc) treats the field as inert text rather than an executable macro or command.
2. **Character Escaping:** Values containing commas, line breaks, or double quotes are wrapped in quotation marks, and internal quotes are doubled (`""`).
3. **Confidentiality:** Exports omit raw CV content, private interview scorecards, candidate notes, and sensitive personal data.

---

## 6. WorkSim Assessment Analytics & Responsible AI Usage

The WorkSim assessment subsystem evaluates simulation exercise outputs against predefined rubric criteria. To uphold responsible evaluation practices:
* Scores are grouped into transparent competency tiers:
  - **Foundational:** `0.0 - 50.0`
  - **Developing:** `50.1 - 70.0`
  - **Proficient:** `70.1 - 85.0`
  - **Advanced:** `85.1 - 100.0`
* **Explicit Disclaimers:** WorkSim results do not represent psychometric claims, personality inferences, or automated hiring decisions.

---

## 7. Database Status & Execution Rules

> [!NOTE]
> **Strict SQL Server Rule Adhered To:**
> * **Zero SQL commands were executed against the database.**
> * **No migrations were run (`Database.Migrate()` was never invoked).**
> * **No schema modifications were required.**
>
> All required entities (`JobPostings`, `JobApplications`, `ApplicationStatusHistories`, `AssessmentAssignments`, `AssessmentResults`, `CriterionScores`) already exist and were reused directly.

---

## 8. Files Created and Modified

| Area | File Path | Action | Description |
| :--- | :--- | :--- | :--- |
| **Backend DTOs** | [`AnalyticsDtos.cs`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/backend/src/HireSphere.Application/DTOs/Analytics/AnalyticsDtos.cs) | Created | DTOs for company overview, recruitment funnel, stage distribution, WorkSim metrics, and CSV export. |
| **Backend Service** | [`AnalyticsService.cs`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/backend/src/HireSphere.Application/Services/AnalyticsService.cs) | Created | Core calculation engine, tenant authorization, funnel conversion logic, and CSV generator. |
| **Backend DI** | [`DependencyInjection.cs`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/backend/src/HireSphere.Application/DependencyInjection.cs) | Modified | Registered `IAnalyticsService` in DI container. |
| **Backend Controller** | [`CompanyAnalyticsController.cs`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/backend/src/HireSphere.Api/Controllers/CompanyAnalyticsController.cs) | Created | Endpoints for company recruitment analytics, job drill-down, and CSV export. |
| **Backend Controller** | [`AdminDashboardController.cs`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/backend/src/HireSphere.Api/Controllers/AdminDashboardController.cs) | Modified | Added `GET /api/admin/dashboard/analytics` for platform analytics. |
| **Backend Tests** | [`AnalyticsServiceTests.cs`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/backend/tests/HireSphere.Tests.Unit/AnalyticsServiceTests.cs) | Created | Comprehensive xUnit tests covering metrics, tenant isolation, zero-divide safety, and CSV formula escaping. |
| **Frontend Types** | [`frontend/src/types/analytics.ts`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/frontend/src/types/analytics.ts) | Created | TypeScript interfaces for recruitment analytics and pipeline data. |
| **Frontend API** | [`frontend/src/services/api.ts`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/frontend/src/services/api.ts) | Modified | Added `analyticsApi` client methods. |
| **Frontend Page** | [`frontend/src/pages/CompanyAnalytics.tsx`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/frontend/src/pages/CompanyAnalytics.tsx) | Created | Full-featured Recruitment Analytics & Hiring Pipeline dashboard with funnel, charts, and drill-down modal. |
| **Frontend Page** | [`frontend/src/pages/AdminDashboard.tsx`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/frontend/src/pages/AdminDashboard.tsx) | Modified | Added platform application inflow sparkline and top hiring organizations leaderboard. |
| **Frontend Nav** | [`frontend/src/components/Navbar.tsx`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/frontend/src/components/Navbar.tsx) | Modified | Added `Analytics` navigation link for `CompanyMember` users. |
| **Frontend Routes** | [`frontend/src/App.tsx`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/frontend/src/App.tsx) | Modified | Registered protected route `/company/analytics`. |
| **Frontend Styles** | [`frontend/src/index.css`](file:///d:/.NET%20PROJECTS/Job%20portal%20openings/frontend/src/index.css) | Modified | Added CSS rules for KPI cards, funnel progression bars, and score distribution buckets. |

---

## 9. Verification & Test Results

### Backend Unit Tests (`dotnet test backend/HireSphere.slnx`)
```
Passed!  - Failed: 0, Passed: 99, Skipped: 0, Total: 99, Duration: 8 s - HireSphere.Tests.Unit.dll
```
All **99 unit tests** pass across the solution.

### Frontend Production Build (`npm run build`)
```
vite v8.3.4 building client environment for production...
✓ 2398 modules transformed.
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-DK1Cocw3.css   22.07 kB │ gzip:   4.74 kB
dist/assets/index-Bxyhdj2S.js   743.75 kB │ gzip: 200.63 kB
✓ built in 563ms
```
TypeScript compilation and Vite production build succeeded with **0 errors**.

### Frontend Lint (`npm run lint`)
```
Found 47 warnings and 0 errors.
Finished in 93ms on 37 files.
```
Completed with **0 errors**.
