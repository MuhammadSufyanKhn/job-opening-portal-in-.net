import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const CtaBannerSection: React.FC = () => {
  return (
    <section className="s" aria-label="Call to action">
      <div className="container">
        <div className="cta2">
          {/* Card 1: Jobseeker CTA (Blue Accent) */}
          <div className="cta-card a">
            <h2>Ready to find your next job?</h2>
            <p>Create a free profile and start applying today.</p>
            <Link to="/register-candidate" className="btn white lg">
              <span>Create your free profile</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Card 2: Employer CTA (Navy) */}
          <div className="cta-card b">
            <h2>Ready to hire someone great?</h2>
            <p>Post your first job in minutes. It's free.</p>
            <Link to="/register-company" className="btn white lg">
              <span>Post a job for free</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
