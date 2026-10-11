import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="platform-footer" role="contentinfo">
      <div className="home-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand">
              <div className="brand-icon">
                <Briefcase size={20} className="text-primary" />
              </div>
              <span className="brand-text">Hire<span className="text-gradient">Sphere</span></span>
            </Link>
            <p className="footer-brand-desc">
              Evidence-driven recruitment SaaS uniting job discovery, transparent qualification matching, 
              and practical WorkSim job simulations in one platform.
            </p>
            <div className="footer-built-with">
              <span className="tech-badge">ASP.NET Core</span>
              <span className="tech-badge">SQL Server</span>
              <span className="tech-badge">React & TypeScript</span>
            </div>
          </div>

          {/* Column 2: Candidate Tools */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">For Candidates</h4>
            <ul className="footer-links-list">
              <li><Link to="/jobs">Explore All Vacancies</Link></li>
              <li><Link to="/register-candidate">Candidate Sign Up</Link></li>
              <li><Link to="/login">Candidate Sign In</Link></li>
              <li><Link to="/candidate/simulations">WorkSim Overview</Link></li>
              <li><Link to="/candidate/documents">CV Vault & Verification</Link></li>
            </ul>
          </div>

          {/* Column 3: Employer Solutions */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">For Employers</h4>
            <ul className="footer-links-list">
              <li><Link to="/register-company">Employer Registration</Link></li>
              <li><Link to="/login">Company Sign In</Link></li>
              <li><Link to="/company/jobs">Publish Vacancies</Link></li>
              <li><Link to="/company/applications">Applicant Pipeline</Link></li>
              <li><Link to="/company/analytics">Recruitment Analytics</Link></li>
            </ul>
          </div>

          {/* Column 4: Platform & Governance */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Platform & Trust</h4>
            <ul className="footer-links-list">
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#worksim">WorkSim Methodology</a></li>
              <li><a href="#trust">Responsible Hiring Principles</a></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
              <li><Link to="/login">Administrative Sign In</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            © {new Date().getFullYear()} HireSphere. All rights reserved. Evidence-based recruitment technology.
          </p>
          <div className="footer-bottom-tags">
            <span>Human-in-the-Loop</span>
            <span>•</span>
            <span>Isolated Tenant Storage</span>
            <span>•</span>
            <span>Deterministic Scoring</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
