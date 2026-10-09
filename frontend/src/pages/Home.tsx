import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserCheck, Building2, Shield, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="badge-pill">Evidence-Driven Talent Acquisition</div>
          <h1>HireSphere Recruitment SaaS</h1>
          <p className="hero-subtitle">
            Transform recruitment through transparent qualification matching, situational WorkSim problem-solving simulations, and auditable hiring pipelines.
          </p>

          <div className="hero-cta-group">
            <Link to="/register-candidate" className="btn btn-primary btn-lg">
              <span>Candidate Portal</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/register-company" className="btn btn-secondary btn-lg">
              <Building2 size={18} />
              <span>Employer Workspace</span>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="portals-overview">
        <div className="overview-grid">
          <div className="portal-card">
            <div className="portal-card-icon bg-primary-soft">
              <UserCheck size={28} className="text-primary" />
            </div>
            <h3>Candidate Experience</h3>
            <p>Maintain your professional identity, upload CV versions to a secure vault, apply to vacancies, and complete contextual problem-solving simulations with transparent feedback.</p>
            <Link to="/register-candidate" className="card-link">Sign Up as Candidate →</Link>
          </div>

          <div className="portal-card">
            <div className="portal-card-icon bg-success-soft">
              <Building2 size={28} className="text-success" />
            </div>
            <h3>Employer Workspace</h3>
            <p>Publish vacancies, review applicant pipelines with explainable CV match reports, assign versioned WorkSim assessments, and collaborate with structured interview scorecards.</p>
            <Link to="/register-company" className="card-link">Register Organization →</Link>
          </div>

          <div className="portal-card">
            <div className="portal-card-icon bg-warning-soft">
              <Shield size={28} className="text-warning" />
            </div>
            <h3>Platform Governance</h3>
            <p>Centralized platform control panel for reviewing employer verifications, enforcing compliance, monitoring processing queues, and auditing operational health.</p>
            <Link to="/login" className="card-link">Admin Sign In →</Link>
          </div>
        </div>
      </section>
    </div>
  );
};
