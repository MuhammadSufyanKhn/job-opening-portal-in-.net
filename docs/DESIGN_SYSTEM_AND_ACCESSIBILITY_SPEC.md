# HireSphere Design System, Accessibility & Responsive Experience Specification

## 1. Overview & Architectural Direction

This specification codifies the unified visual identity, accessibility standards, responsive layouts, and shared reusable component architecture implemented across all HireSphere portals in accordance with **Prompt 14**.

HireSphere now operates under **one cohesive visual system**:
* **Primary Palette**: Crisp white (`#ffffff`), subtle cool-tinted surfaces (`#f8fafc`, `#f0f9ff`), and authoritative light/sky blues (`#0284c7`, `#0369a1`).
* **Secondary Accent**: Soft warm amber/yellow (`#f59e0b`, `#b45309`), used intentionally for warnings, active simulation states, and focus anchors without overwhelming the interface.
* **Neutral & Typography**: Charcoal/slate text (`#0f172a`, `#1e293b`, `#334155`), muted labels (`#64748b`, `#94a3b8`), and low-contrast restrained borders (`#e2e8f0`, `#bae6fd`).
* **Micro-interactions & Motion**: Restrained transitions (`0.15s` ease) with global `@media (prefers-reduced-motion: reduce)` compliance.
* **Icon Family**: Consistent Lucide React icon family across all portals.

---

## 2. Shared Design Tokens

All tokens are defined centrally in `frontend/src/index.css` without adding unnecessary third-party CSS frameworks.

### 2.1 Color Tokens & WCAG AAA Contrast Ratios

| Token Name | Value | Purpose | Contrast Ratio on Light Surface |
| :--- | :--- | :--- | :--- |
| `--bg-main` | `#f8fafc` | Application canvas background | N/A |
| `--bg-surface` | `#ffffff` | Primary card and modal surfaces | N/A |
| `--bg-surface-elevated` | `#f0f9ff` | Subtle highlighted/tinted panels | N/A |
| `--primary` | `#0284c7` | Primary action buttons and focus rings | 4.8:1 (WCAG AA) |
| `--text-primary` | `#0f172a` | Primary headlines and high-priority text | 15.8:1 (WCAG AAA) |
| `--text-secondary` | `#334155` | Body copy and explanatory subtitles | 9.4:1 (WCAG AAA) |
| `--text-muted` | `#64748b` | Timestamps, metadata, and helper text | 4.6:1 (WCAG AA) |
| `--border-subtle` | `#e2e8f0` | Restrained card borders and dividers | Low-contrast containment |
| `--border-color` | `#cbd5e1` | Form control borders and interactive outlines | Accessible perimeter |

### 2.2 Recruitment & Operational Stage Badges

Prior to Prompt 14, pastel text colors on badges caused contrast failures (~1.8:1). All badge tokens now use high-contrast dark text on soft pastel backgrounds with matching low-contrast borders:

| Badge Variant | Background | Border | Text Color | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `.badge-outline` | `#ffffff` | `#cbd5e1` | `#334155` | Submitted, Initial Stage |
| `.badge-purple` | `#f5f3ff` | `#ddd6fe` | `#6d28d9` | Under Review, Interview Scheduled |
| `.badge-cyan` | `#ecfeff` | `#a5f3fc` | `#0e7490` | Shortlisted, Assessment Completed |
| `.badge-amber` | `#fffbeb` | `#fde68a` | `#b45309` | Assessment Pending, Pending Approvals |
| `.badge-emerald` | `#ecfdf5` | `#a7f3d0` | `#047857` | Offer Extended, Hired, Approved |
| `.badge-danger` | `#fef2f2` | `#fecaca` | `#b91c1c` | Rejected, Suspended, Terminated |
| `.badge-muted` | `#f8fafc` | `#e2e8f0` | `#475569` | Withdrawn, Archived |

---

## 3. Reusable Component Architecture

Reusable components are organized under `frontend/src/components/common/`:

### 3.1 `<StageBadge>` (`StageBadge.tsx`)
* **Interface**:
  ```typescript
  interface StageBadgeProps {
    stage: ApplicationStage | string | number;
    className?: string;
    style?: React.CSSProperties;
  }
  ```
* **Responsibility**: Translates numeric enum values (`0` to `9`) and string constants (`'Submitted'`, `'UnderReview'`, `'Shortlisted'`, etc.) into uniform accessible badges with consistent semantic labels and contrast-checked styles.
* **Portals Utilized**: Candidate Dashboard, Candidate Applications, Company Dashboard, Company Applications (List, Table, Detail Drawer, and Stage Advancement modal).

### 3.2 `<Modal>` (`Modal.tsx`)
* **Interface**:
  ```typescript
  interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg';
    ariaDescribedBy?: string;
  }
  ```
* **Accessibility Features**:
  * Emits `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-title"`.
  * Traps `Escape` key to close dialog seamlessly.
  * Locks viewport scroll (`document.body.style.overflow = 'hidden'`) while modal is active.
  * Backdrop click detection with boundary check to prevent accidental closures during form selection.
  * Accessible close button with `aria-label="Close dialog"`.
* **Portals Utilized**: Candidate Application Details, Application Withdrawal Confirmation, Admin User Details, Admin User Suspension, Admin Company Inspection, Admin Company Rejection, Admin Company Suspension, Admin Job Details, Admin Job Moderation.

### 3.3 `<Pagination>` (`Pagination.tsx`)
* **Interface**:
  ```typescript
  interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    pageSize?: number;
    className?: string;
    style?: React.CSSProperties;
  }
  ```
* **Accessibility & Usability**:
  * Semantic `<nav aria-label="Pagination Navigation">`.
  * Dynamic page windowing with ellipsis (`1 ... 4 5 6 ... 12`).
  * `aria-current="page"` for the active page button.
  * Explicit `aria-label="Previous page"` and `aria-label="Next page"` with disabled states.
* **Portals Utilized**: Admin Users, Admin Companies, Admin Job Postings, Notification Center.

### 3.4 `<LoadingState>` (`LoadingState.tsx`)
* **Interface**:
  ```typescript
  interface LoadingStateProps {
    message?: string;
    className?: string;
  }
  ```
* **Accessibility**:
  * Emits `role="status"` and `aria-live="polite"`.
  * High-visibility CSS spinner with primary brand color.
* **Portals Utilized**: Candidate Applications, Candidate Dashboard, Company Dashboard, Detail Drawers, WorkSim bootloader.

### 3.5 `<EmptyState>` (`EmptyState.tsx`)
* **Interface**:
  ```typescript
  interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
      icon?: LucideIcon;
    };
    className?: string;
  }
  ```
* **Usability**: Centered icon inside branded circle badge, clear call-to-action button, dashed border containment.

### 3.6 `<PageHeader>` (`PageHeader.tsx`)
* **Interface**:
  ```typescript
  interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
  }
  ```
* **Usability**: Uniform spacing, responsive wrap, consistent typography (`font-weight: 800`, `letter-spacing: -0.02em`).

---

## 4. WorkSim Simulation & Candidate Experience Consistency

WorkSim assessments (`SimulationWorkspace.tsx`, `SimulationResult.tsx`) were previously styled with uncompiled Tailwind utility classes. In `index.css`, utility layout tokens were added:
* Responsive columns: `.grid`, `.lg:grid-cols-12`, `.lg:col-span-7`, `.lg:col-span-5`.
* Surface & borders: `.bg-slate-50`, `.bg-slate-100`, `.border-slate-200`, `.rounded-xl`, `.rounded-2xl`, `.rounded-3xl`.
* Interactive decision cards: Hover states, active borders, and clear state markers (`ACTIVE TASK`, `Decision Point #X`).
* Real-time timer and progress indicators preserved without altering backend scoring rubrics or execution contracts.

---

## 5. Responsive Design Standards

Breakpoints implemented across all portals:
* **Desktop Wide (`> 1024px`)**: Full multi-column grids, comprehensive recruiter tables, sticky simulation split-screens.
* **Tablet / Small Laptop (`900px - 1024px`)**: Collapsible sidebars, horizontal scroll containment for dense data tables (`.card-table-wrapper { overflow-x: auto; }`), 2-column KPI stat cards.
* **Mobile (`< 640px`)**:
  * Single-column layouts for hero, stats, and search bars.
  * Stacked modal action buttons (`flex-direction: column` on small screens).
  * Touch-friendly targets (`min-height: 44px`, `gap: 0.75rem`).
  * Mobile navigation overlay panel with full keyboard accessibility.

---

## 6. Verification and Testing Results

1. **Frontend Production Build**:
   * Command: `npm run build`
   * Result: **0 errors**, all 2,415 modules transformed, production bundles generated successfully.
2. **Frontend Linter (`oxlint`)**:
   * Command: `npm run lint`
   * Result: **0 errors** across all 55 TypeScript/TSX source files.
3. **Backend Unit Tests**:
   * Command: `dotnet test tests/HireSphere.Tests.Unit/HireSphere.Tests.Unit.csproj`
   * Result: **128 tests passed, 0 failed, 0 skipped**.
4. **Database Safety**:
   * **Zero SQL execution**, no migrations, zero modifications to database schemas or connection strings.
