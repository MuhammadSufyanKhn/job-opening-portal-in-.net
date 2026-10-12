import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
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
              Post a job in minutes and spend your time on the people who fit, not on sorting through piles of CVs.
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
                <span>Post a job for free</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn onnavy lg">
                <span>Sign in to your company</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Applicant Summary Mock Card */}
          <div className="card dash" aria-hidden="true">
            <div className="dash-h">
              <div>
                <b>Customer Support Lead</b>
                <div className="muted" style={{ fontSize: '14px' }}>
                  Harbor Logistics · 14 applicants
                </div>
              </div>
              <span className="badge b-ok">Verified company</span>
            </div>

            <div className="dash-b">
              <div className="prog">
                <div>New<b>5</b></div>
                <div className="on">Reviewing<b>4</b></div>
                <div>Interview<b>3</b></div>
                <div>Offer<b>2</b></div>
              </div>

              <b>Top matches</b>

              <div className="app">
                <span className="av">ER</span>
                <div>
                  <b>Elena Rostova</b>
                  <small>Skills challenge passed</small>
                </div>
                <span className="badge b-ok">93% fit</span>
              </div>

              <div className="app">
                <span className="av">NK</span>
                <div>
                  <b>Nadia Khan</b>
                  <small>Interview booked</small>
                </div>
                <span className="badge b-ok">91% fit</span>
              </div>

              <div className="app">
                <span className="av">OF</span>
                <div>
                  <b>Omar Farooq</b>
                  <small>Ready to review</small>
                </div>
                <span className="badge b-ok">90% fit</span>
              </div>

              <div className="muted" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="ic"><Lock size={14} /></span>
                <span>Your team's notes are private and never shown to candidates.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
