import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { HIRING_COMPANIES_SAMPLE } from '../../content/homeContent';

export const CompaniesHiringSection: React.FC = () => {
  return (
    <section className="s white" id="companies" aria-labelledby="companies-heading">
      <div className="container">
        <div className="head">
          <div>
            <h2 id="companies-heading">Companies hiring now</h2>
            <p>Every company here has been checked by our team.</p>
          </div>
          <Link to="/jobs" className="btn">
            <span>See all companies</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="logos">
          {HIRING_COMPANIES_SAMPLE.map((company, idx) => (
            <Link
              key={idx}
              to={`/jobs?search=${encodeURIComponent(company.name)}`}
              className="card co"
            >
              <span className={`mark ${company.colorClass}`}>
                {company.name.charAt(0)}
              </span>
              <span>
                <b>{company.name}</b>
                <small>{company.openJobs} open jobs</small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
