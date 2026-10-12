import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { PageTransition } from '../components/common/PageTransition';

export const TermsOfService: React.FC = () => {
  return (
    <PageTransition>
      <div className="portal-container" style={{ padding: '48px 24px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--soft)', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', marginBottom: '14px' }}>
            <FileText size={15} />
            <span>User Agreement</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', marginBottom: '12px', letterSpacing: '-0.03em' }}>
            Terms of Service
          </h1>
          <p className="muted" style={{ fontSize: '16px', lineHeight: 1.6 }}>
            Last updated: October 2026. Please review these terms governing use of the HireSphere recruitment SaaS platform.
          </p>
        </div>

        {/* Legal Review Notice */}
        <div style={{ padding: '20px', borderRadius: 'var(--r)', background: 'var(--warn-bg)', border: '1px solid var(--warn)', marginBottom: '36px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <AlertTriangle size={22} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: 'var(--warn)', lineHeight: 1.6 }}>
            <b>Notice for Platform Owner:</b>
            <p style={{ marginTop: '4px' }}>
              These terms outline functional commitments matching existing authorization policies, company vetting workflows, and WorkSim assessment guidelines. Governing jurisdiction, dispute resolution clauses, and formal liability limitations should be formally established with qualified legal counsel.
            </p>
          </div>
        </div>

        {/* Terms Body */}
        <div className="card" style={{ padding: '36px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '32px', boxShadow: 'var(--sh)', lineHeight: 1.7, fontSize: '15px' }}>
          
          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>1. Account Eligibility and Registration</h2>
            <p className="muted" style={{ marginBottom: '12px' }}>
              Users may register under one of two primary account types:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)' }}>
              <li>
                <b>Candidate Accounts:</b> Created by individuals seeking employment. You agree that all information provided in your profile, CV, and assessment responses is true and accurate.
              </li>
              <li>
                <b>Company Accounts:</b> Created by representatives of hiring organizations. You must provide valid business details and business registration identification. Company accounts remain subject to administrative review before job publishing privileges are enabled.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>2. Job Postings & Company Verification</h2>
            <p className="muted" style={{ marginBottom: '12px' }}>
              Hiring organizations must adhere to truthful recruitment practices:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)' }}>
              <li>Postings must reflect genuine, currently available positions with clear compensation expectations and requirements.</li>
              <li>HireSphere reserves the right to suspend or reject any company or vacancy that violates platform standards, appears fraudulent, or misrepresents employment conditions.</li>
              <li>Companies unapproved or flagged by platform administrators are immediately hidden from public search indices.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>3. WorkSim Assessment Integrity</h2>
            <p className="muted" style={{ marginBottom: '12px' }}>
              When engaging in interactive WorkSim simulations:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)' }}>
              <li>Candidates agree to complete scenarios independently without unauthorized third-party intervention.</li>
              <li>All simulation timers, action traces, and submitted responses are recorded accurately for objective scoring.</li>
              <li>Simulation scenarios and evaluation rubrics are proprietary to HireSphere and participating employers; unauthorized distribution is prohibited.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>4. Prohibited Platform Activities</h2>
            <p className="muted" style={{ marginBottom: '12px' }}>
              Users agree not to:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)' }}>
              <li>Attempt to bypass tenant authorization boundaries or access applicant records belonging to other companies.</li>
              <li>Upload malicious files, scripts, or content intended to disrupt service operations.</li>
              <li>Post deceptive job listings or scrape contact details for unsolicited marketing.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--ink)' }}>5. Termination & Suspension</h2>
            <p className="muted">
              HireSphere administrators reserve the authority to deactivate accounts or remove job postings that violate these terms or compromise platform integrity. Users may request account closure by contacting support.
            </p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default TermsOfService;
