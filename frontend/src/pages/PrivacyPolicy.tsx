import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { PageTransition } from '../components/common/PageTransition';

export const PrivacyPolicy: React.FC = () => {
  return (
    <PageTransition>
      <div className="portal-container" style={{ padding: '48px 24px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--soft)', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', marginBottom: '14px' }}>
            <Shield size={15} />
            <span>Platform Governance</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', marginBottom: '12px', letterSpacing: '-0.03em' }}>
            Privacy Policy
          </h1>
          <p className="muted" style={{ fontSize: '16px', lineHeight: 1.6 }}>
            Effective date: October 2026. This policy describes how HireSphere handles data based strictly on current platform functionality.
          </p>
        </div>

        {/* Legal Review Notice */}
        <div style={{ padding: '20px', borderRadius: 'var(--r)', background: 'var(--warn-bg)', border: '1px solid var(--warn)', marginBottom: '36px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <AlertTriangle size={22} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: 'var(--warn)', lineHeight: 1.6 }}>
            <b>Legal & Policy Notice for System Administrator / Owner:</b>
            <p style={{ marginTop: '4px' }}>
              This document reflects the actual data workflows implemented in the HireSphere codebase. Specific retention periods, statutory compliance regimes (such as GDPR, CCPA, or UK DPA), and external sub-processor disclosures should be reviewed by legal counsel before public production deployment.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="card" style={{ padding: '36px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '32px', boxShadow: 'var(--sh)', lineHeight: 1.7, fontSize: '15px' }}>
          
          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>1. Information We Collect and Process</h2>
            <p className="muted" style={{ marginBottom: '12px' }}>
              HireSphere processes user information solely to facilitate recruitment interactions between candidates and authorized hiring organizations:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)' }}>
              <li>
                <b>Candidate Profiles:</b> Full name, email address, headline, personal summary, location, years of experience, target role categories, and self-reported skills.
              </li>
              <li>
                <b>Resumes & Documents:</b> Uploaded CV documents (PDF, DOCX, TXT) and automated text extractions generated for skills matching.
              </li>
              <li>
                <b>Applications & Tracking:</b> Application submissions, pipeline stage transitions (Submitted, UnderReview, Shortlisted, AssessmentPending, AssessmentCompleted, InterviewScheduled, Offered, Rejected, Withdrawn), and recruiter internal evaluation notes.
              </li>
              <li>
                <b>WorkSim Assessment Data:</b> Time-stamped simulation actions, duration records, rubric scores, and scenario outcome results.
              </li>
              <li>
                <b>Company Information:</b> Organization name, business registration number, industry, company size, official contact email, website, and authorized team members.
              </li>
              <li>
                <b>Authentication & Session Records:</b> Email credentials, salted and hashed passwords (ASP.NET Core Identity standards), and signed JWT bearer tokens stored in browser local storage.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>2. How Information Is Shared</h2>
            <p className="muted" style={{ marginBottom: '12px' }}>
              We enforce strict multi-tenant authorization boundaries across our application:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)' }}>
              <li>
                <b>Candidate CV Privacy:</b> Your uploaded CV and contact details are never made publicly searchable across the web. Only members of a company to which you have submitted an application can access your application documents.
              </li>
              <li>
                <b>Internal Recruiter Notes:</b> Notes added by company members during application review are private to that organization and never revealed to applicants.
              </li>
              <li>
                <b>Company Listings:</b> Only jobs belonging to companies with verified approval status from platform administrators are displayed in public searches.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>3. Storage, Security, and Session Management</h2>
            <p className="muted" style={{ marginBottom: '12px' }}>
              HireSphere relies on relational SQL Server persistence with Entity Framework Core isolation. Sessions are authorized via cryptographically signed JWT tokens passed via the standard HTTP Authorization header. When you sign out, the active token is purged from client storage.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>4. In-App Notifications and Communications</h2>
            <p className="muted" style={{ marginBottom: '12px' }}>
              HireSphere generates notifications for pipeline milestones (e.g. status changes, interview invitations, WorkSim scenario assignments). Users can mark notifications as read individually or collectively via the in-app notification center.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>5. Inquiries & Data Privacy Requests</h2>
            <p className="muted">
              If you have inquiries regarding how your data is handled or wish to request corrections to your stored profile information, please reach out via our dedicated <a href="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Contact Support page</a>.
            </p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default PrivacyPolicy;
