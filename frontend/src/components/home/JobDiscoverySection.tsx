import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Building2, 
  ArrowRight
} from 'lucide-react';
import { jobsApi } from '../../services/api';
import type { PublicJobPostingSummary } from '../../types/recruitment';

export const JobDiscoverySection: React.FC = () => {
  const [jobs, setJobs] = useState<PublicJobPostingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRecentJobs = async () => {
      try {
        setLoading(true);
        const res = await jobsApi.searchJobs({ page: 1, pageSize: 4 });
        if (isMounted) {
          setJobs(res.items || []);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Unable to load live vacancies at this moment.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecentJobs();
    return () => { isMounted = false; };
  }, []);

  const formatEmploymentType = (type: number | string) => {
    const map: Record<string, string> = {
      '0': 'Full-Time',
      '1': 'Part-Time',
      '2': 'Contract',
      '3': 'Internship',
      '4': 'Temporary',
      'FullTime': 'Full-Time',
      'PartTime': 'Part-Time',
      'Contract': 'Contract',
      'Internship': 'Internship'
    };
    return map[String(type)] || 'Full-Time';
  };

  const formatWorkplaceType = (type: number | string) => {
    const map: Record<string, string> = {
      '0': 'On-site',
      '1': 'Hybrid',
      '2': 'Remote',
      'OnSite': 'On-site',
      'Hybrid': 'Hybrid',
      'Remote': 'Remote'
    };
    return map[String(type)] || 'Flexible';
  };

  const formatSalary = (min?: number | null, max?: number | null, currency = 'USD') => {
    if (!min && !max) return null;
    const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;
    if (min && max) return `$${formatNum(min)} - $${formatNum(max)} ${currency}`;
    if (min) return `From $${formatNum(min)} ${currency}`;
    if (max) return `Up to $${formatNum(max)} ${currency}`;
    return null;
  };

  return (
    <section className="home-section bg-surface-subtle" id="jobs-preview" aria-labelledby="jobs-heading">
      <div className="home-container">
        <div className="section-header-row">
          <div>
            <div className="section-eyebrow">
              <Briefcase size={14} className="text-primary" />
              <span>Job Discovery Marketplace</span>
            </div>
            <h2 id="jobs-heading" className="section-title">
              Featured Opportunities from Verified Employers
            </h2>
            <p className="section-subtitle">
              Every opening includes transparent qualification criteria and structured hiring expectations.
            </p>
          </div>
          <Link to="/jobs" className="btn btn-outline btn-sm desktop-only-flex">
            <span>Explore All Vacancies</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="jobs-preview-grid" aria-label="Loading opportunities">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="job-card-skeleton">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-sub" />
                <div className="skeleton-line skeleton-chips" />
                <div className="skeleton-line skeleton-btn" />
              </div>
            ))}
          </div>
        )}

        {/* Loaded Jobs List */}
        {!loading && jobs.length > 0 && (
          <div className="jobs-preview-grid">
            {jobs.map((job) => {
              const salaryText = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
              return (
                <div key={job.id} className="job-preview-card">
                  <div className="job-card-header">
                    <div className="job-company-icon">
                      {job.companyLogoUrl ? (
                        <img src={job.companyLogoUrl} alt={job.companyName} className="company-logo-img" />
                      ) : (
                        <Building2 size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="job-header-meta">
                      <span className="job-company-name">{job.companyName}</span>
                      <span className="job-category-tag">{job.categoryName || 'Engineering'}</span>
                    </div>
                  </div>

                  <h3 className="job-card-title">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>

                  <div className="job-card-tags">
                    <span className="job-tag">
                      <MapPin size={12} />
                      <span>{job.location || 'Remote'}</span>
                    </span>
                    <span className="job-tag">{formatWorkplaceType(job.workplaceType)}</span>
                    <span className="job-tag">{formatEmploymentType(job.employmentType)}</span>
                    {salaryText && (
                      <span className="job-tag job-tag-salary">
                        <DollarSign size={12} />
                        <span>{salaryText}</span>
                      </span>
                    )}
                  </div>

                  {job.topSkills && job.topSkills.length > 0 && (
                    <div className="job-skills-row">
                      {job.topSkills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="skill-pill">{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="job-card-footer">
                    <Link to={`/jobs/${job.id}`} className="job-view-link">
                      <span>View Role Details</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty / Fallback State */}
        {!loading && jobs.length === 0 && (
          <div className="jobs-empty-state-card">
            <div className="empty-icon-box">
              <Briefcase size={28} className="text-primary" />
            </div>
            <h3>Discover Verified Roles on HireSphere</h3>
            <p>
              {error || 'Explore our comprehensive marketplace of technical, operational, and leadership vacancies. Each position includes clear job requirements and structured review stages.'}
            </p>
            <div className="empty-actions">
              <Link to="/jobs" className="btn btn-primary">
                <span>Browse All Jobs</span>
                <ArrowRight size={14} />
              </Link>
              <Link to="/register-company" className="btn btn-outline">
                <Building2 size={16} />
                <span>Post an Opening</span>
              </Link>
            </div>
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="section-footer-mobile">
          <Link to="/jobs" className="btn btn-outline btn-block">
            <span>Explore All Vacancies in Marketplace</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};
