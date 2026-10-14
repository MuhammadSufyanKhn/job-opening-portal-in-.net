import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Lock, ArrowRight, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { EMPLOYER_CHECKLIST } from '../../content/homeContent';

export const EmployerSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="s navy" id="employers" aria-labelledby="emp-heading">
      <div className="container">
        <div className="emp">
          {/* Left Column: Benefits & Actions */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
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
          </motion.div>

          {/* Right Column (Pic 3 Replacement): HireSphere Verified Hiring Suite Showcase */}
          <motion.div 
            className="card dash" 
            style={{ padding: '28px', background: '#fff', borderRadius: 'var(--r)', color: 'var(--ink)', boxShadow: '0 24px 50px -12px rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--line)' }}>
              <div>
                <b style={{ fontSize: '18px', color: 'var(--ink)' }}>HireSphere Employer Suite</b>
                <div className="muted" style={{ fontSize: '13.5px', marginTop: '2px' }}>
                  Direct Moderation & Fast Talent Pipeline
                </div>
              </div>
              <span className="badge b-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                <ShieldCheck size={14} />
                <span>Verified Employer</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Feature 1: Instant Self-Moderation */}
              <div style={{ padding: '14px 16px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 700, fontSize: '14.5px', marginBottom: '4px' }}>
                  <Zap size={16} />
                  <span>Direct Vacancy Moderation</span>
                </div>
                <p className="muted" style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  Publish, edit, pause, and close job postings immediately. Full organizational control without platform delays.
                </p>
              </div>

              {/* Feature 2: WorkSim Assessments */}
              <div style={{ padding: '14px 16px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--pur)', fontWeight: 700, fontSize: '14.5px', marginBottom: '4px' }}>
                  <Sparkles size={16} />
                  <span>WorkSim Skills Challenges</span>
                </div>
                <p className="muted" style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  Attach realistic, timed scenario challenges to evaluate problem-solving ability with automated scoring.
                </p>
              </div>

              {/* Feature 3: Team Collaboration */}
              <div style={{ padding: '14px 16px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ok)', fontWeight: 700, fontSize: '14.5px', marginBottom: '4px' }}>
                  <Users size={16} />
                  <span>Multi-User Collaboration</span>
                </div>
                <p className="muted" style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  Invite teammates to interview panels, add private evaluations, and manage offers in PKR compensation.
                </p>
              </div>

              <div className="muted" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '6px' }}>
                <Lock size={14} />
                <span>Your team's internal evaluations are private and never shared with applicants.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EmployerSection;
