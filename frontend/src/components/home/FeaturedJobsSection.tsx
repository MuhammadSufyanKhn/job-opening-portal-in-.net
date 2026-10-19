import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Bookmark, Building2, Briefcase } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { jobsApi } from '../../services/api';
import type { PublicJobPostingSummary } from '../../types/recruitment';

export const FeaturedJobsSection: React.FC = () => {
  const [jobs, setJobs] = useState<PublicJobPostingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    const fetchFeaturedJobs = async () => {
      try {
        setLoading(true);
        const res = await jobsApi.searchJobs({ page: 1, pageSize: 6 });
        if (isMounted) {
          setJobs(res.items || []);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load openings right now. Please explore all jobs.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedJobs();
    return () => { isMounted = false; };
  }, []);

  const formatEmploymentType = (type: number | string) => {
    const map: Record<string, string> = {
      '0': 'Full-time',
      '1': 'Part-time',
      '2': 'Contract',
      '3': 'Internship',
      '4': 'Temporary',
      'FullTime': 'Full-time',
      'PartTime': 'Part-time',
      'Contract': 'Contract',
      'Internship': 'Internship'
    };
    return map[String(type)] || 'Full-time';
  };

  const formatSalary = (min?: number | null, max?: number | null, currency = 'PKR') => {
    if (!min && !max) return 'Competitive salary';
    const curr = currency || 'PKR';
    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;
    if (min && max) return `${curr} ${fmt(min)} – ${fmt(max)} / month`;
    if (min) return `From ${curr} ${fmt(min)} / month`;
    if (max) return `Up to ${curr} ${fmt(max)} / month`;
    return 'Competitive salary';
  };

  const colorClasses = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];

  return (
    <section className="featured-jobs-section" aria-labelledby="featured-jobs-title">
      <div className="home-container">
        {/* Section Header */}
        <div className="featured-jobs-header">
          <div>
            <h2 id="featured-jobs-title" className="featured-jobs-title">Featured Jobs</h2>
            <p className="featured-jobs-subtitle">Explore top roles from verified employers hiring right now.</p>
          </div>
          <Link to="/jobs" className="featured-view-all">
            <span>View all</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Loading State Skeletons */}
        {loading && (
          <div className="featured-jobs-grid" aria-label="Loading vacancies">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="featured-job-card skeleton-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--line)' }} />
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--line)' }} />
                </div>
                <div style={{ height: '20px', background: 'var(--line)', borderRadius: '6px', width: '70%', marginBottom: '8px' }} />
                <div style={{ height: '14px', background: 'var(--line)', borderRadius: '4px', width: '45%', marginBottom: '16px' }} />
                <div style={{ height: '28px', background: 'var(--line)', borderRadius: '999px', width: '50%', marginBottom: '14px' }} />
                <div style={{ height: '16px', background: 'var(--line)', borderRadius: '4px', width: '60%' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error Fallback */}
        {!loading && error && (
          <div className="empty-state-card" role="alert">
            <Briefcase size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
            <h3>Fresh Openings Await</h3>
            <p className="muted">{error}</p>
            <Link to="/jobs" className="btn btn-lime sm" style={{ marginTop: '14px' }}>
              Explore All Jobs
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && jobs.length === 0 && (
          <div className="empty-state-card">
            <Building2 size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
            <h3>No Active Openings Right Now</h3>
            <p className="muted">Check back soon or explore our comprehensive directory.</p>
            <Link to="/jobs" className="btn btn-lime sm" style={{ marginTop: '14px' }}>
              Browse Job Market
            </Link>
          </div>
        )}

        {/* Real Job Cards Grid */}
        {!loading && !error && jobs.length > 0 && (
          <div className="featured-jobs-grid">
            {jobs.map((job, idx) => {
              const avatarClass = colorClasses[idx % colorClasses.length];
              const initials = job.companyName?.slice(0, 2).toUpperCase() || 'HS';
              const salaryText = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
              const empType = formatEmploymentType(job.employmentType);

              return (
                <motion.article 
                  key={job.id} 
                  className="featured-job-card"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                >
                  {/* Top row: Avatar & Bookmark icon */}
                  <div className="card-top-row">
                    <span className={`mark ${avatarClass}`} title={job.companyName}>
                      {initials}
                    </span>
                    <button 
                      type="button" 
                      className="card-bookmark-btn" 
                      title="Save Job"
                      aria-label={`Save ${job.title}`}
                    >
                      <Bookmark size={17} />
                    </button>
                  </div>

                  {/* Title & Company */}
                  <h3 className="card-job-title">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>

                  <div className="card-company-meta">
                    <span className="card-company-name">{job.companyName}</span>
                    <span className="card-separator">·</span>
                    <span className="card-location">
                      <MapPin size={13} style={{ verticalAlign: 'text-top' }} /> {job.location || 'Remote'}
                    </span>
                  </div>

                  {/* Skill tags */}
                  <div className="card-tags-row">
                    <span className="job-tag-pill">{empType}</span>
                    {job.topSkills && job.topSkills.slice(0, 3).map((skill) => (
                      <span key={skill} className="job-tag-pill subtle">{skill}</span>
                    ))}
                    {!job.topSkills && (
                      <span className="job-tag-pill subtle">{job.categoryName || 'Engineering'}</span>
                    )}
                  </div>

                  {/* Bottom row: Salary & Apply Now button */}
                  <div className="card-bottom-row">
                    <span className="card-salary">{salaryText}</span>
                    <Link to={`/jobs/${job.id}`} className="card-apply-btn">
                      Apply Now
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedJobsSection;
