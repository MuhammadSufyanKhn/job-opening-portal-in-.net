import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Lock, ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { EMPLOYER_CHECKLIST } from '../../content/homeContent';

export const EmployerSection: React.FC = () => {
  return (
    <section className="s navy" id="employers" aria-labelledby="emp-heading">
      <div className="container">
        <div className="emp">
          {/* Left Column: Benefits & Actions */}
          <div>
            <span className="pill-label">
              <span className="ic"><Building2 size={16} /></span>
              <span>For employers</span>
            </span>

            <h2 id="emp-heading">
              Hire the right people, faster.
            </h2>

            <p className="lead">
              Publish structured vacancies, evaluate candidate practical competency with WorkSim, and collaborate across team members.
            </p>

            <ul className="checks">
              {EMPLOYER_CHECKLIST.map((item, idx) => (
                <li key={idx}>
                  <span className="ic"><CheckCircle2 size={20} /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="row">
              <Link to="/register-company" className="btn white lg">
                <span>Register company account</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn onnavy lg">
                <span>Sign in to your company</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Clean Feature Overview Card */}
          <div className="card dash" style={{ padding: '28px', background: '#fff', borderRadius: 'var(--r)', color: 'var(--ink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
              <div>
                <b style={{ fontSize: '17px' }}>Employer Workspace</b>
                <div className="muted" style={{ fontSize: '13px', marginTop: '2px' }}>
                  End-to-End Recruitment Management
                </div>
              </div>
              <span className="badge b-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} />
                <span>Verified Status</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  <Sparkles size={16} />
                  <span>WorkSim Assessments</span>
                </div>
                <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                  Attach hands-on simulation scenarios to test candidate problem solving before scheduling interviews.
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ok)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  <Users size={16} />
                  <span>Team Collaboration</span>
                </div>
                <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                  Invite recruiters and hiring managers. Share confidential candidate notes and scorecards.
                </p>
              </div>

              <div className="muted" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px' }}>
                <Lock size={14} />
                <span>Your team's internal evaluations are strictly confidential.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmployerSection;
