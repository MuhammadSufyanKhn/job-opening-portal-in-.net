# HireSphere Candidate Experience, Profile Completion, CV Library, and Job Discovery Specification

**Phase / Prompt:** Prompt 10  
**Status:** Completed & Verified  
**Theme:** White and Light-Blue Professional Theme  
**Target Platform:** ASP.NET Core 10 Web API + React 19 (Vite + TypeScript)  

---

## 1. Executive Summary

This phase enhances the **HireSphere Candidate Portal**, establishing a frictionless, profile-first experience for job seekers to:
1. **Monitor Recruitment Journeys:** View a unified candidate dashboard aggregating active applications, upcoming WorkSim simulation deadlines, CV status, and bookmarked opportunities.
2. **Complete & Verify Profiles:** Track a transparent 0–100% profile completion score with actionable missing-item guidance without confusing completion with candidate quality.
3. **Review CV Extraction Suggestions:** Inspect skills, education credentials, and certifications parsed from their primary CV, allowing candidates to review and selectively copy suggestions into their confirmed profile.
4. **Discover Verified Vacancies:** Search jobs by keywords, title, company, or specific required technical skills, with workplace, employment type, and location filters.
5. **Bookmark Opportunities:** Save and unsave published vacancies with server-side ownership enforcement and duplicate prevention.
6. **Understand Match Reports Transparently:** Review match scores with clear disclaimers that scores are advisory indicators rather than automated gating or rejection mechanisms.

---

## 2. Candidate Dashboard Architecture

### Frontend Route: `/candidate/dashboard` (and `/candidate` redirect)

The dashboard provides candidates with an immediate bird's-eye view of their recruitment journey:

| Dashboard Component | Data Source | Behavior & Actions |
|---|---|---|
| **Welcome Banner** | User JWT / Profile | Displays greeting and quick access buttons to explore jobs or refresh telemetry. |
| **Profile Completion Card** | `CandidateProfileService` | Displays completion % progress bar, verified status badge, itemized missing items checklist, and quick links to edit profile or upload CV. |
| **Active Applications KPI** | `JobApplications` count | Shows active vs total applications submitted. Clicking opens `/candidate/applications`. |
| **Pending WorkSim KPI** | `AssessmentAssignments` | Shows count of pending simulations and nearest deadline countdown. Clicking opens `/candidate/simulations`. |
| **Saved Vacancies KPI** | `CandidateSavedJobs` count | Shows total bookmarked vacancies. Clicking opens `/jobs` with saved vacancies active. |
| **Primary CV Document KPI** | `CandidateDocuments` | Shows primary CV filename, upload timestamp, and text extraction status. Clicking opens `/candidate/documents`. |
| **Pending WorkSim Alert Banner** | `AssessmentAssignments` | Highlighted amber alert card showing scenario title, company, job title, and direct "Open WorkSim Assessment" button when simulations are pending. |
| **Recent Applications List** | `JobApplications` top 5 | Displays job title, company, applied date, and colored stage badge (`Submitted`, `UnderReview`, `Shortlisted`, etc.). |
| **Saved Vacancies Quick Preview** | `CandidateSavedJobs` | Shows bookmarked jobs with company, location, "View Details", and "Remove Bookmark" buttons. |
| **Quick Action Shortcuts** | Direct links | Fast navigation cards to Job Marketplace, Profile Credentials, CV Library, and WorkSim Simulations. |

---

## 3. Profile Completion Formula

To avoid ambiguous or opaque ratings, HireSphere uses a transparent, itemized calculation:

$$\text{Total Completion} = \sum \text{Weights} = 100\%$$

| Profile Element | Weight | Evaluation Criteria |
|---|---|---|
| **Full Name** | **15%** | Candidate `FirstName` and `LastName` are present and non-empty. |
| **Professional Headline** | **15%** | `Headline` is provided (e.g., "Senior Software Architect"). |
| **Geographic Location** | **10%** | `Location` is provided (e.g., "London, UK" or "Remote"). |
| **Years of Experience** | **10%** | `YearsOfExperience` is specified ($\ge 0$). |
| **Career Summary** | **20%** | `Summary` is provided and contains $\ge 20$ characters. |
| **Portfolio / Social Link** | **10%** | At least one external link (`LinkedInUrl`, `GitHubUrl`, or `PortfolioUrl`) is provided. |
| **Primary Verified CV** | **20%** | Candidate has an active, non-deleted primary CV (`IsDefault = true`) stored in the CV library. |

### Responsible Representation Rule
* Profile completion is **explicitly labeled** as an indicator of profile completeness to assist recruiters in evaluating applications.
* It is **never** presented as an evaluation of candidate intelligence, quality, or employability.

---

## 4. CV Library & Text Extraction Integration

### Private Storage & Integrity
* CV documents are stored privately in non-public storage with SHA-256 content hashing.
* Deletion is blocked from destroying historical application documents: if a CV is linked to an active job application, the system retains the physical file and marks the document reference safely.

### Extracted Suggestions Workflow
* Candidates can review skills, education, and certifications parsed by `DocumentExtractionJob` from their primary CV.
* **Separation of Concerns:** Extracted data is presented as **unconfirmed suggestions**.
* Candidates can click **"Add to Summary"** to incorporate extracted skills directly into their career summary without manual retyping.
* Overwriting of confirmed profile data is strictly prohibited without explicit user action.

---

## 5. Job Discovery & Search Enhancements

### Search Capabilities
* **Keyword & Skill Matching:** The search input matches against `Title`, `Summary`, `Description`, `Company.Name`, and **`Requirements.Any(r => r.RequirementText.Contains(search))`**. Searching for "Docker", "React", or "Kubernetes" surfaces all jobs requiring that skill even if absent from the title.
* **Skill Filter Parameter:** `request.Skill` enables precise filtering by required skill qualifications.
* **Top Skills Tags:** Each job card displays up to 4 top required skills chips for quick discovery.
* **Arrangement & Type Filters:** Filter by workplace (`Remote`, `Hybrid`, `On-Site`) and employment type (`Full-Time`, `Part-Time`, `Contract`, `Internship`).
* **Active Status Verification:** Only published, unexpired vacancies from approved companies are returned.

---

## 6. Saved Jobs (Bookmarks)

### Schema & Database Rule
To adhere strictly to manual database management in SSMS:
* Standalone idempotent script created: `database/scripts/011_AddCandidateSavedJobs.sql`.
* Creates `dbo.CandidateSavedJobs` table with `PK_CandidateSavedJobs`, foreign keys to `CandidateProfiles` and `JobPostings`, unique index `UQ_CandidateSavedJobs_Candidate_Job` to prevent duplicate bookmarks, and index `IX_CandidateSavedJobs_CandidateProfileId_SavedAtUtc`.
* Graceful fallback implemented in `CandidateSavedJobsService`: if table 011 has not yet been executed in SSMS, queries handle the exception safely and log instructions to run the script.

### Endpoints
* `GET /api/candidate/saved-jobs` — Retrieves the authenticated candidate's saved vacancies.
* `POST /api/candidate/saved-jobs/{jobId}` — Saves a vacancy (idempotent, prevents duplicate records).
* `DELETE /api/candidate/saved-jobs/{jobId}` — Unsaved a bookmarked vacancy.
* `GET /api/candidate/saved-jobs/{jobId}/status` — Returns `{ jobId, isSaved }` status for UI toggle.

---

## 7. CV-to-Job Matching Presentation & Application Tracking

### Match Report Presentation
* The application modal and detail view display the evidence match score as an advisory estimate.
* Prominently displays the responsible AI disclaimer:
  > *"Match scores are advisory estimates based on CV parsing and vacancy requirements to guide interview preparation. They do not cause automated candidate rejection. Hiring managers review all applications regardless of the score."*
* Displays matching qualifications in green and unmatched criteria in amber to help candidates prepare.

### Duplicate Application Prevention
* In `JobDetail.tsx`, the system verifies whether the authenticated candidate has already submitted an application for the job.
* If already applied, the "Apply" CTA is replaced with an informative status badge (e.g., *"Already Applied • Status: Under Review"*), preventing duplicate submissions.

---

## 8. Backend Verification & Test Results

### Test Suite Execution
* Framework: xUnit (.NET 10.0)
* Command: `dotnet test backend/HireSphere.slnx`
* Test Classes: `CandidateExperienceTests.cs`, `CandidateProfileServiceTests.cs`, `CandidateDocumentServiceTests.cs`, `ApplicationServiceTests.cs`, `JobServiceTests.cs`, `NotificationServiceTests.cs`, `WorkSimScoringServiceTests.cs`, etc.
* **Result:** **105 Passed, 0 Failed, 0 Skipped** (Duration: 3s).

### Frontend Verification
* Framework: Vite 8.3 + TypeScript + React 19
* Build Command: `npm run build`
  * **Result:** Built successfully in 372ms (Exit code 0).
* Linter Command: `npm run lint`
  * **Result:** **0 errors**.

---

## 9. Manual SQL Server Execution Instructions

For the database administrator to execute in SQL Server Management Studio (SSMS):

```sql
-- Execute in HireSphere database:
-- database/scripts/011_AddCandidateSavedJobs.sql
```

Verification in SSMS:
```sql
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CandidateSavedJobs';
```
