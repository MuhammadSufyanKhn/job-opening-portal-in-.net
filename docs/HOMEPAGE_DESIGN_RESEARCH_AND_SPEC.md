# HireSphere Homepage Design Research & Specification

## 1. Executive Summary

This document establishes the design direction and architecture for the redesigned public homepage of HireSphere (Prompt 13). HireSphere is an evidence-driven recruitment technology platform uniting candidate job discovery, employer recruitment pipelines, explainable qualification matching, and the **WorkSim** job-simulation engine.

---

## 2. Research Analysis of Global Platforms

### 2.1 Job Discovery Platforms

| Platform | Strengths & Patterns Observed | HireSphere Adoption Decisions |
| :--- | :--- | :--- |
| **LinkedIn Jobs** | Professional credibility, clear navigation, structured job card information hierarchy (Company, Location, Badge, Date). | Adopt clean job card layout with company name, workplace type, category chip, and direct "View Role" CTA. |
| **Indeed** | Immediate hero search (Title/Keyword + Location), accessible search controls, fast path to discovery. | Integrated dual-input search form in hero and discovery preview sections connecting directly to `/jobs`. |
| **Glassdoor** | Employer credibility, role transparency, clear salary and requirement visibility. | Prominently display verified company indicators, transparent salary bounds (when configured), and structured skills. |
| **Wellfound** | Modern tech/startup aesthetic, role badges, crisp typography, transparent expectations. | Clean, restrained badge styling, modern Inter font typography, and clear skill tags. |

### 2.2 Recruitment & Hiring SaaS Platforms

| Platform | Strengths & Patterns Observed | HireSphere Adoption Decisions |
| :--- | :--- | :--- |
| **Ashby** | Clean typography, generous spacing, high-fidelity interactive product previews, focus on data-driven workflows. | Tabbed product showcase highlighting both Candidate Journey and Employer Workspace with realistic UI mockups. |
| **Greenhouse** | Structured hiring stages, focus on fair evaluation and evidence-based candidate assessment. | Dedicated **WorkSim Spotlight** showing realistic work scenarios, candidate decision rationales, and objective rubrics. |
| **Lever** | Visual candidate pipelines, collaboration cards, approachable and clean SaaS tone. | Feature the Kanban pipeline board and structured candidate notes in the employer experience section. |

---

## 3. Product Positioning

- **What is HireSphere?** A unified recruitment technology platform that combines job discovery, applicant tracking, and practical job simulations.
- **Who is it for?** Candidates seeking verified opportunities and employers seeking evidence-based candidate evaluation.
- **Why is it different?** Unlike conventional job boards that rely solely on static resumes, HireSphere incorporates **WorkSim**—allowing candidates to demonstrate real-world problem-solving through contextual work scenarios, and employers to evaluate genuine competence without automated algorithmic bias.

---

## 4. Visual Design System

- **Palette**:
  - Primary Theme: Clean white (`#ffffff`), slate neutrals (`#f8fafc`, `#f1f5f9`), and light blue tints (`#f0f9ff`, `#e0f2fe`).
  - Primary Accent: Brand blue (`#0284c7`, `#0369a1`).
  - Supporting Accent: Soft warm yellow (`#fef08a`, `#ca8a04`), used sparingly for highlights and active badges.
  - Text: Dark navy/charcoal (`#0f172a`, `#334155`) for WCAG AAA contrast on white backgrounds.
  - Borders: Crisp, subtle borders (`#e2e8f0`).
- **Typography**: Inter / system sans-serif with clear typographic scale (Display 2.5rem/3rem, H2 2rem, H3 1.25rem, Body 1rem, Small 0.875rem).
- **Icons**: `lucide-react` (installed), ensuring visual consistency across buttons, badges, and features.
- **Micro-Interactions**: Restrained transitions (`150ms-250ms ease`), subtle hover elevations, zero disorienting scroll-jacking or excessive animations.

---

## 5. Homepage Information Architecture

1. **Responsive Header / Navbar**:
   - HireSphere Brand & Logo
   - Links: Find Jobs (`/jobs`), How It Works (`#how-it-works`), WorkSim (`#worksim`), For Employers (`#employers`), Sign In (`/login`)
   - Primary CTA: "Get Started" / "Candidate Sign Up" (`/register-candidate`) and "For Employers" (`/register-company`)
   - Accessible Mobile Hamburger Menu Drawer
2. **Hero Section**:
   - Badge: *Evidence-Driven Recruitment Platform*
   - Headline: "Where Real Capability Meets Great Careers"
   - Subtitle: "HireSphere connects jobseekers and employers through verified opportunities, explainable qualification matching, and realistic WorkSim job simulations."
   - Dual Search Inputs: Job title / keyword and Location with instant navigation to `/jobs`
   - Primary Actions: "Explore Jobs" and "Employer Workspace"
   - Interactive Product Preview: Realistic interface showcasing Job Discovery and WorkSim simulation in action
3. **Live Job Discovery Preview**:
   - Real published vacancies pulled dynamically via `/api/jobs?pageSize=4`
   - Clean card display: Title, Company, Location, Workplace type, Salary, Top skills, "View Job" CTA
   - Seamless empty/loading state handling
   - Direct link to full marketplace `/jobs`
4. **How HireSphere Works (Dual-Audience Stepped Flow)**:
   - Toggleable or synchronized Candidate & Employer journeys
   - Candidate: 1. Discover Roles -> 2. Apply with Structured CV -> 3. Demonstrate Skills in WorkSim -> 4. Transparent Progress
   - Employer: 1. Post Vacancies -> 2. Review Applications & Evidence -> 3. Evaluate WorkSim Decisions -> 4. Structured Collaboration & Hire
5. **WorkSim Spotlight (Core Differentiator)**:
   - Deep dive into situational problem-solving simulations
   - Visual mock preview: Real task scenario, unlocked evidence files, candidate action choice with rationale, and deterministic rubric evaluation
   - Key attributes: Contextual scenarios, objective scoring, candidate feedback
6. **Feature Matrix / Deep Dives**:
   - For Candidates: Secure CV Vault, Explainable Matching, Simulation Records, Direct Application Tracking
   - For Employers: Kanban Pipeline Board, Recruiter Notes, Interview Scheduling, Analytics & Time-to-Hire
7. **Trust & Responsible Hiring**:
   - Human-in-the-loop hiring decisions
   - Transparent, explainable matching criteria
   - Strict candidate privacy and document protection
8. **Frequently Asked Questions (Interactive Accordion)**:
   - Answers to common candidate and employer inquiries
9. **Final Call-to-Action**:
   - Dual portal access cards (Candidate vs Employer)
10. **Comprehensive Footer**:
    - Product links, Portal links, Legal & Trust links, Copyright notice

---

## 6. Accessibility & Responsiveness Strategy

- **Semantic Landmarks**: `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`
- **Focus Management**: Explicit visible focus rings (`focus-visible: ring-2 ring-primary`)
- **Contrast Ratios**: Verified text contrast exceeding 4.5:1 for body and 3:1 for large headers
- **Responsive Breakpoints**:
  - Mobile (< 640px): Single-column, collapsible mobile drawer, full-width touch targets
  - Tablet (640px - 1024px): 2-column grids, optimized card padding
  - Desktop (> 1024px): Generous whitespace, multi-column feature comparisons, rich preview sidecars
