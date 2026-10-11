import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserCheck, Building2, CheckCircle2 } from 'lucide-react';

export const CtaBannerSection: React.FC = () => {
  return (
    <section className="home-section home-cta-section" aria-labelledby="cta-heading">
      <div className="home-container">
        <div className="cta-banner-card">
          <div className="cta-banner-content">
            <h2 id="cta-heading" className="cta-headline">
              Ready to Upgrade Your Recruitment Experience?
            </h2>
            <p className="cta-description">
              Whether you are demonstrating your practical capabilities to top engineering teams or looking to build 
              an auditable, evidence-driven talent pipeline, HireSphere is built for you.
            </p>

            <div className="cta-buttons-row">
              <Link to="/register-candidate" className="btn btn-primary btn-lg">
                <UserCheck size={18} />
                <span>Join as a Candidate</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/register-company" className="btn btn-outline-white btn-lg">
                <Building2 size={18} />
                <span>Register Your Organization</span>
              </Link>
            </div>

            <div className="cta-reassurances">
              <span className="reassurance-item">
                <CheckCircle2 size={14} className="text-success" />
                <span>Free for all jobseekers</span>
              </span>
              <span className="reassurance-separator">•</span>
              <span className="reassurance-item">
                <CheckCircle2 size={14} className="text-success" />
                <span>Verified employer profiles</span>
              </span>
              <span className="reassurance-separator">•</span>
              <span className="reassurance-item">
                <CheckCircle2 size={14} className="text-success" />
                <span>Human-driven hiring decisions</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
