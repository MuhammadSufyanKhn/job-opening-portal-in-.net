import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Users, Briefcase } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export const EmployerSuiteShowcase: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const metrics = [
    { label: 'Active Vacancies', val: '12', icon: <Briefcase size={16} /> },
    { label: 'Total Applicants', val: '48', icon: <Users size={16} /> },
    { label: 'Interviews Scheduled', val: '6', icon: <TrendingUp size={16} /> },
    { label: 'Offers Accepted', val: '3', icon: <CheckCircle2 size={16} /> }
  ];

  return (
    <section className="employer-showcase-section" aria-labelledby="employer-showcase-title">
      <div className="home-container">
        <div className="employer-showcase-card">
          {/* Left Column: Value Proposition & CTAs */}
          <motion.div 
            className="employer-content-col"
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="employer-badge-tag">
              <ShieldCheck size={14} />
              <span>EMPLOYER WORKSPACE</span>
            </div>

            <h2 id="employer-showcase-title" className="employer-showcase-heading">
              Build your <span className="text-lime">winning team</span> with precision.
            </h2>

            <p className="employer-showcase-desc">
              Manage your job postings, review qualified applicants, and accelerate your time-to-hire with structured evaluation pipelines.
            </p>

            <ul className="employer-feature-list">
              <li>
                <CheckCircle2 size={18} className="text-lime" />
                <span>Instant job publishing with automated candidate matching</span>
              </li>
              <li>
                <CheckCircle2 size={18} className="text-lime" />
                <span>WorkSim real-world scenario challenges to verify technical problem-solving</span>
              </li>
              <li>
                <CheckCircle2 size={18} className="text-lime" />
                <span>Collaborative recruiter notes and interview scheduling</span>
              </li>
            </ul>

            <div className="employer-actions-row">
              <Link to="/register-company" className="btn btn-lime">
                <PlusCircle size={18} />
                <span>Start Hiring Today</span>
              </Link>
              <Link to="/for-employers" className="btn-outline-white">
                <span>Explore Employer Suite</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Visual Dashboard Snapshot (Image 2 style) */}
          <motion.div 
            className="employer-visual-col"
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* Metric counters */}
            <div className="mock-metrics-grid">
              {metrics.map((m) => (
                <div key={m.label} className="mock-metric-pill">
                  <div className="mock-metric-icon">{m.icon}</div>
                  <div>
                    <strong className="mock-metric-val">{m.val}</strong>
                    <span className="mock-metric-label">{m.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Hiring Pipeline Funnel Mini-Card */}
            <div className="mock-pipeline-card">
              <div className="mock-pipeline-header">
                <strong>Hiring Funnel</strong>
                <span className="badge b-ok nodot">Active</span>
              </div>
              <div className="funnel-step">
                <span>Applied</span>
                <div className="funnel-bar" style={{ width: '100%', background: 'var(--cobalt)' }} />
                <strong>482</strong>
              </div>
              <div className="funnel-step">
                <span>Screened</span>
                <div className="funnel-bar" style={{ width: '70%', background: 'var(--pur)' }} />
                <strong>215</strong>
              </div>
              <div className="funnel-step">
                <span>Interviewed</span>
                <div className="funnel-bar" style={{ width: '45%', background: 'var(--amber)' }} />
                <strong>58</strong>
              </div>
              <div className="funnel-step">
                <span>Hired</span>
                <div className="funnel-bar" style={{ width: '25%', background: 'var(--lime-hover)' }} />
                <strong>12</strong>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EmployerSuiteShowcase;
