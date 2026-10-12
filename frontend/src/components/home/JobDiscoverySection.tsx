import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { jobsApi } from '../../services/api';
import type { PublicJobPostingSummary } from '../../types/recruitment';

export const JobDiscoverySection: React.FC = () => {
  const [jobs, setJobs] = useState<PublicJobPostingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('All');

  useEffect(() => {
    let isMounted = true;
    const fetchRecentJobs = async () => {
      try {
        setLoading(true);
        const res = await jobsApi.searchJobs({ page: 1, pageSize: 6 });
        if (isMounted) {
          setJobs(res.items || []);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load openings right now.');
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

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Competitive';
    const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;
    if (min && max) return `$${formatNum(min)} – $${formatNum(max)}`;
    if (min) return `From $${formatNum(min)}`;
    if (max) return `Up to $${formatNum(max)}`;
    return 'Competitive';
  };

  const isRecent = (publishedAt?: string | null) => {
    if (!publishedAt) return false;
    const diffDays = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 3;
  };

  const colorClasses = ['m3', 'm4', 'm1', 'm2', 'm5', 'm6'];

  const filteredJobs = jobs.filter((j) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Remote') {
      const mode = formatWorkplaceType(j.workplaceType);
      return mode === 'Remote' || (j.location && j.location.toLowerCase().includes('remote'));
    }
    const emp = formatEmploymentType(j.employmentType);
    return emp.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <section className="s white" id="jobs" aria-labelledby="latest-jobs-heading">
      <div className="container">
        <div className="head">
          <div>
            <h2 id="latest-jobs-heading">Latest jobs</h2>
            <p>Fresh openings from companies that are hiring now.</p>
          </div>

          <div className="seg" role="tablist" aria-label="Job filter tabs">
            {['All', 'Remote', 'Full-time', 'Part-time', 'Internship'].map((tab) => (
              <button
                key={tab}
                type="button"
                className="chip"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="jobs">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card job" style={{ opacity: 0.7 }}>
                <div className="row" style={{ gap: '12px', flexWrap: 'nowrap' }}>
                  <span className="mark m1" style={{ opacity: 0.3 }}>·</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '16px', background: 'var(--line)', borderRadius: '4px', width: '60%' }} />
                    <div style={{ height: '12px', background: 'var(--line)', borderRadius: '4px', width: '40%', marginTop: '6px' }} />
                  </div>
                </div>
                <div style={{ height: '20px', background: 'var(--line)', borderRadius: '4px', width: '80%', margin: '10px 0' }} />
                <div className="foot">
                  <div style={{ height: '16px', background: 'var(--line)', borderRadius: '4px', width: '30%' }} />
                  <div style={{ height: '28px', background: 'var(--line)', borderRadius: '6px', width: '70px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Jobs List */}
        {!loading && filteredJobs.length > 0 && (
          <div className="jobs">
            {filteredJobs.map((job, idx) => {
              const colorClass = colorClasses[idx % colorClasses.length];
              const mode = formatWorkplaceType(job.workplaceType);
              const type = formatEmploymentType(job.employmentType);
              const salary = formatSalary(job.salaryMin, job.salaryMax);
              const newBadge = isRecent(job.publishedAtUtc);

              return (
                <article key={job.id} className="card job">
                  <div className="row" style={{ gap: '12px', flexWrap: 'nowrap' }}>
                    <span className={`mark ${colorClass}`}>
                      {job.companyName ? job.companyName.charAt(0) : 'H'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.companyName}
                      </b>
                      <div className="muted" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="ic"><MapPin size={14} /></span>
                        <span>{job.location || 'Remote'}</span>
                      </div>
                    </div>
                    {newBadge && <span className="badge b-ok">New</span>}
                  </div>

                  <h3>
                    <Link to={`/jobs/${job.id}`}>
                      {job.title}
                    </Link>
                  </h3>

                  <div className="tags">
                    <span className="tag o">{type}</span>
                    <span className="tag o">{mode === 'Remote' ? 'Work from anywhere' : mode}</span>
                  </div>

                  <div className="foot">
                    <span className="pay">{salary}</span>
                    <div className="row" style={{ gap: '8px' }}>
                      <span className="muted" style={{ fontSize: '13px' }}>
                        {job.publishedAtUtc ? new Date(job.publishedAtUtc).toLocaleDateString() : 'Recent'}
                      </span>
                      <Link to={`/jobs/${job.id}`} className="btn sm primary">
                        Apply
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Empty / Error state */}
        {!loading && filteredJobs.length === 0 && (
          <div className="card panel" style={{ textAlign: 'center', margin: '20px 0' }}>
            <p className="muted">
              {error || 'No jobs in this group right now.'}
            </p>
          </div>
        )}

        <div className="center">
          <Link to="/jobs" className="btn lg">
            <span>Browse all jobs</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};
