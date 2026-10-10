# HireSphere — CV Management, Secure Document Processing & Explainable Matching

**Document ID:** `HS-SPEC-04`  
**Version:** 1.0  
**Phase:** Prompt 4 Specification & Architecture Guide  
**Status:** Implemented & Verified  

---

## 1. Executive Architecture Summary

Prompt 4 establishes the secure candidate CV library, private file storage pipeline, real server-side document parsing, and the deterministic, explainable CV-to-job matching engine for **HireSphere**.

```
Candidate Upload (.pdf, .docx)
     │
     ▼
┌────────────────────────────────────────────────────────┐
│ 1. Security & Validation Gate                          │
│    - Size verification (<= 10 MB)                      │
│    - File signature / Magic bytes check                │
│      (%PDF for PDF, PK\x03\x04 for DOCX)               │
│    - SHA-256 digital integrity hash calculation        │
│    - IMalwareScanner static heuristic abstraction      │
└────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│ 2. Private Isolated Storage (ICvStorageService)        │
│    - Stored outside public web root (App_Data/cv_storage)
│    - Random unguessable storage key (GUID + extension) │
│    - Strict path traversal prevention barriers         │
│    - Zero exposed physical filesystem paths            │
└────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│ 3. Server-Side Document Parsing & Extraction Pipeline  │
│    - PdfPig for text-based PDF documents               │
│    - DocumentFormat.OpenXml for DOCX documents         │
│    - Scanned/image PDF detection (zero readable text)  │
│    - Deterministic entity identification (Skills,      │
│      Degrees, Certifications, Years of Experience)     │
└────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│ 4. Explainable Matching Engine (CvMatchingService)     │
│    - Multi-word synonym & technical normalization      │
│    - English stop-word filtering                       │
│    - Exact sentence-level excerpt evidence harvesting  │
│    - Transparent weighted formula:                     │
│        Mandatory (2.0x) vs Preferred (1.0x)            │
│    - Engine versioning (v1.0-deterministic)            │
└────────────────────────────────────────────────────────┘
```

---

## 2. Secure Candidate CV Library

### 2.1 Supported Document Operations
* **Upload:** Candidates upload `.pdf` or `.docx` files up to 10 MB.
* **Document Versioning:** When an updated resume is uploaded, it is chained to the root document (`RootDocumentId`) and increments the version counter (`v1` → `v2` → `v3`).
* **Content Integrity:** Every document calculates and persists a SHA-256 content hash (`ContentHash`) upon upload.
* **Primary / Default Designation:** The candidate's first uploaded document defaults to `IsDefault = true`. Candidates can toggle any document in their library as their primary CV at any time (`POST /candidate/documents/{id}/set-default`).
* **Deletion Safeguards:** Candidates can delete CVs (`DELETE /candidate/documents/{id}`). If a CV is currently linked to an active job application (`CurrentStage != Withdrawn`), deletion is blocked with a descriptive `ValidationException` to preserve employer recruitment audit trails.

### 2.2 Storage Security & Isolation
* **Storage Abstraction:** Handled by `ICvStorageService`.
* **Local Implementation:** `LocalCvStorageService` stores files in `App_Data/cv_storage` (configurable via `CvStorage:LocalStoragePath` in `appsettings.json`).
* **Path Traversal Protection:** Every key is validated using `Path.GetInvalidFileNameChars()` and enforced with `combinedPath.StartsWith(fullStorageRoot)`. Any violation throws a `SecurityException`.
* **Zero Public URLs:** Files are never directly accessible by HTTP URL. File retrieval is performed exclusively via authorized streaming endpoints:
  - Candidate: `GET /api/candidate/documents/{id}/download` (validates candidate profile ownership).
  - Employer: `GET /api/companies/{companyId}/applications/{applicationId}/cv` (validates recruiter company membership and application tenancy).

---

## 3. Server-Side Document Parsing Pipeline

### 3.1 PDF Extraction (`PdfPig`)
* Uses `UglyToad.PdfPig` (0.1.17-alpha) to parse text runs, word boundaries, and paragraphs across all pages.
* Preserves linebreaks and paragraph whitespace.
* **Scanned / Image PDF Detection:** If the document has pages but yields zero readable text characters, the job status transitions to `DocumentExtractionStatus.ScannedPdfDetected`.

> [!NOTE]
> **Honest OCR Limitation:** HireSphere does not bundle OCR binaries (such as Tesseract or AWS Textract) in the modular monolith core. When a scanned PDF is detected, the system honestly flags the document as `ScannedPdfDetected`, explains this limitation to recruiters, and flags all job criteria as `RequiresManualReview`.

### 3.2 DOCX Extraction (`DocumentFormat.OpenXml`)
* Uses `DocumentFormat.OpenXml` (3.5.1) to safely read WordprocessingML documents without executing macros or external scripts.
* Extracts readable text from body paragraphs and table rows.

### 3.3 Extraction Job States
* `Pending (0)`: Job queued.
* `Processing (1)`: Parser active.
* `Success (2)`: Full text and structured entities extracted.
* `Failed (3)`: Extraction error recorded with safe sanitized message.
* `ScannedPdfDetected (4)`: Document lacks embedded text layer.

---

## 4. Explainable CV-to-Job Matching Engine

### 4.1 Matching Architecture
* Implemented in `CvMatchingService` (`HireSphere.Application.Services`).
* **No black-box AI, no random percentages, and no external LLM dependencies.**
* Versioned algorithm: `v1.0-deterministic`.

### 4.2 Technical Term Normalization & Synonyms
Normalizes terminology variations without overly broad substring matching:
* `C#` ↔ `csharp`, `c-sharp`, `c sharp`
* `.NET` ↔ `dotnet`, `.net core`, `netcore`, `.net framework`
* `ASP.NET Core` ↔ `aspnetcore`, `asp.net`, `web api`
* `React` ↔ `react.js`, `reactjs`
* `TypeScript` ↔ `ts`
* `SQL Server` ↔ `mssql`, `ms sql`, `t-sql`, `tsql`
* `PostgreSQL` ↔ `postgres`, `psql`
* `Docker` ↔ `container`, `containers`, `containerization`
* `Kubernetes` ↔ `k8s`
* `Clean Architecture` ↔ `onion architecture`, `hexagonal architecture`, `ddd`

### 4.3 Stop-Word Filtering
Requirements are filtered against a domain stop-word vocabulary (`with`, `experience`, `hands-on`, `years`, `knowledge`, etc.) ensuring only actual qualifications and technical skills are evaluated against document sentences.

### 4.4 Criterion Evaluation Statuses
Each requirement in the job description receives one of four transparent statuses:
1. **`SupportedByEvidence`:** Matching technical term or multiple requirement keywords found directly in a CV sentence or structured skills inventory. Sentence excerpt is quoted.
2. **`PartiallySupported`:** Contextual keyword presence identified in text, but sentence context is partial. Recruiter review recommended.
3. **`NotFound`:** No matching text evidence identified in the processed CV.  
   *Clear UI Notice:* "Not found in CV text indicates an absence of text evidence in the processed document, not proof that the candidate lacks this qualification."
4. **`RequiresManualReview`:** Ambiguous extraction or document was detected as a scanned PDF.

### 4.5 Weighted Overall Evidence Index Formula
$$\text{Overall Evidence Index} = \left( \frac{\sum (\text{Earned Status Weight} \times \text{Importance Multiplier})}{\sum (\text{Total Possible Weight})} \right) \times 100$$

* **Importance Multipliers:**
  - Mandatory requirement: `2.0`
  - Preferred requirement: `1.0`
* **Status Multipliers:**
  - `SupportedByEvidence`: `1.0`
  - `PartiallySupported`: `0.5`
  - `RequiresManualReview`: `0.25`
  - `NotFound`: `0.0`

### 4.6 Matching Report Immutability & Recalculation
* Reports are stored in `dbo.CvMatchReports` and `dbo.CvRequirementEvaluations`.
* Each report is linked to `JobApplicationId`, `JobDescriptionVersionId`, and `DocumentExtractionJobId`.
* Recalculating (`POST /api/companies/{companyId}/applications/{applicationId}/match-report/recalculate`) computes an updated report without deleting historical audit logs.

---

## 5. API Endpoints Reference

### Candidate CV Endpoints (`/api/candidate/documents`)
| Method | Route | Description | Authorization |
|---|---|---|---|
| `POST` | `/api/candidate/documents` | Upload new CV (`multipart/form-data`) | Role: `Candidate` |
| `POST` | `/api/candidate/documents/{id}/versions` | Upload new version for existing CV | Role: `Candidate` |
| `GET` | `/api/candidate/documents` | List authenticated candidate's CVs | Role: `Candidate` |
| `GET` | `/api/candidate/documents/{id}` | Get detail, extraction status & skills | Role: `Candidate` |
| `POST` | `/api/candidate/documents/{id}/set-default` | Set CV as primary/default | Role: `Candidate` |
| `DELETE` | `/api/candidate/documents/{id}` | Delete CV (blocked if active in job app) | Role: `Candidate` |
| `GET` | `/api/candidate/documents/{id}/download` | Securely stream candidate's own file | Role: `Candidate` |

### Recruiter & Matching Endpoints (`/api/companies/{companyId}/applications`)
| Method | Route | Description | Authorization |
|---|---|---|---|
| `GET` | `.../{id}/cv` | Download applicant's attached CV | Company Member |
| `GET` | `.../{id}/match-report` | Get explainable CV-to-Job match report | Company Member |
| `POST` | `.../{id}/match-report/recalculate` | Recompute match report | Company Member |

---

## 6. Manual SQL Execution Guide

> [!CRITICAL]
> All SQL scripts must be executed manually in SQL Server Management Studio (SSMS).
> Antigravity never executes migrations or schema modifications automatically.

### Script Execution Order for Prompt 4:

1. **`001_CreateCoreIdentityAndTenancySchema.sql`** (Prompt 1/2)
2. **`002_CreateRecruitmentAndApplicationsSchema.sql`** (Prompt 3)
3. **`006_MakeCandidateDocumentOptionalInApplications.sql`** (Prompt 3 migration)
4. **`007_EnhanceCandidateDocumentsWithVersioning.sql`** (Prompt 4: adds `VersionNumber`, `RootDocumentId`, `ContentHash` to `CandidateDocuments`)
5. **`003_CreateDocumentsAndMatchingSchema.sql`** (Prompt 4: creates `DocumentExtractionJobs`, `CvMatchReports`, `CvRequirementEvaluations`)

### Verification Query:
```sql
USE HireSphereDb;
GO

-- 1. Check versioning columns on CandidateDocuments
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CandidateDocuments'
  AND COLUMN_NAME IN ('VersionNumber', 'RootDocumentId', 'ContentHash');

-- 2. Check matching tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('DocumentExtractionJobs', 'CvMatchReports', 'CvRequirementEvaluations');
```
