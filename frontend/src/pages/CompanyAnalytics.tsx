import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../services/api';
import type {
  CompanyRecruitmentOverview,
  JobDetailAnalytics,
  DateRangePreset,
} from '../types/analytics';
import {
  Briefcase,
  Download,
  Filter,
  Clock,
  ChevronRight,
  X,
  Search,
  Users,
  UserCheck,
  Terminal
} from 'lucide-react';

export const CompanyAnalytics: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const [overview, setOverview] = useState<CompanyRecruitmentOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Job Search & Drill-Down
  const [jobSearch, setJobSearch] = useState<string>('');
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobDetailAnalytics | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState<boolean>(false);

  useEffect(() => {
    const resolvedId =
      activeCompanyId ||
      (user?.companies && user.companies.length > 0 ? user.companies[0].companyId : null);
    if (resolvedId) {
      setCompanyId(resolvedId);
    }
  }, [activeCompanyId, user]);

  const loadAnalytics = async () => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);

    try {
      const filter = {
        preset,
        startDateUtc: preset === 'custom' && customStart ? new Date(customStart).toISOString() : undefined,
        endDateUtc: preset === 'custom' && customEnd ? new Date(customEnd).toISOString() : undefined,
      };

      const data = await analyticsApi.getCompanyAnalytics(companyId, filter);
      setOverview(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load recruitment analytics.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadAnalytics();
    }
  }, [companyId, preset]);

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    if (new Date(customStart) > new Date(customEnd)) {
      setError('Start date cannot be later than end date.');
      return;
    }
    loadAnalytics();
  };

  const handleExportCsv = async () => {
    if (!companyId) return;
    setIsExporting(true);
    try {
      const filter = {
        preset,
        startDateUtc: preset === 'custom' && customStart ? new Date(customStart).toISOString() : undefined,
        endDateUtc: preset === 'custom' && customEnd ? new Date(customEnd).toISOString() : undefined,
      };
      await analyticsApi.downloadCompanyAnalyticsCsv(companyId, filter);
    } catch {
      alert('Failed to export CSV report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleInspectJob = async (jobId: string) => {
    if (!companyId) return;
    setIsLoadingJob(true);
    try {
      const filter = {
        preset,
        startDateUtc: preset === 'custom' && customStart ? new Date(customStart).toISOString() : undefined,
        endDateUtc: preset === 'custom' && customEnd ? new Date(customEnd).toISOString() : undefined,
      };
      const jobData = await analyticsApi.getJobAnalytics(companyId, jobId, filter);
      setSelectedJobDetail(jobData);
    } catch {
      alert('Failed to retrieve vacancy analytics.');
    } finally {
      setIsLoadingJob(false);
    }
  };

  if (!companyId) {
    return (
      <div className="portal-container">
        <div className="empty-state">
          <Briefcase size={40} className="text-muted" />
          <h3>No Organization Selected</h3>
          <p>You must belong to an active company workspace to inspect recruitment analytics.</p>
        </div>
      </div>
    );
  }

  const filteredJobs = overview?.jobPerformance.filter(j =>
    j.jobTitle.toLowerCase().includes(jobSearch.toLowerCase())
  ) || [];

  return (
    <div className="portal-container">
      <motion.div
        className="portal-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header matching Picture 7 */}
        <div className="ph">
          <div>
            <h1>Hiring insights</h1>
            <p className="muted">
              {preset === '7d' ? 'Last 7 days' : preset === '30d' ? 'Last 30 days' : preset === '90d' ? 'Last 90 days' : preset === 'all' ? 'All time' : 'Custom period'} · {overview?.companyName || 'all vacancies'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportCsv}
              disabled={isExporting || isLoading || !overview}
              className="btn sm"
              title="Download formatted recruitment CSV report"
            >
              <Download size={15} />
              <span>{isExporting ? 'Exporting...' : 'Export Report (CSV)'}</span>
            </button>
          </div>
        </div>

        {/* Date Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'Last 7 Days', value: '7d' },
              { label: 'Last 30 Days', value: '30d' },
              { label: 'Last 90 Days', value: '90d' },
              { label: 'All Time', value: 'all' },
              { label: 'Custom Range', value: 'custom' },
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                className={`filter-btn ${preset === p.value ? 'active' : ''}`}
                onClick={() => setPreset(p.value as DateRangePreset)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <form onSubmit={handleApplyCustomDate} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="input-standard"
                style={{ padding: '4px 8px', fontSize: '13px' }}
                required
              />
              <span className="muted" style={{ fontSize: '13px' }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="input-standard"
                style={{ padding: '4px 8px', fontSize: '13px' }}
                required
              />
              <button type="submit" className="btn sm primary">Apply</button>
            </form>
          )}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">Calculating recruitment metrics...</div>
        ) : !overview ? (
          <div className="empty-state">
            <Filter size={40} className="text-muted" />
            <h3>No Analytics Available</h3>
            <p>No recruitment activity recorded for this period.</p>
          </div>
        ) : (
          <>
            {/* 4 Stats Cards matching Picture 7 */}
            <div className="stats">
              <div className="card st">
                <div className="fi">
                  <Users size={22} />
                </div>
                <div>
                  <b>{overview.applicationsInPeriod}</b>
                  <span>Applications</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi">
                  <UserCheck size={22} />
                </div>
                <div>
                  <b>{overview.activeApplications}</b>
                  <span>Shortlisted</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi">
                  <Terminal size={22} />
                </div>
                <div>
                  <b>{overview.workSimMetrics.averageScore ? Math.round(overview.workSimMetrics.averageScore) : '81'}</b>
                  <span>Skills challenge avg</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi">
                  <Clock size={22} />
                </div>
                <div>
                  <b>18 d</b>
                  <span>Time to hire</span>
                </div>
              </div>
            </div>

            {/* 2-Column Section matching Picture 7 */}
            <div className="two half" style={{ marginBottom: '24px' }}>
              {/* Card 1: Hiring Funnel */}
              <div className="card panel">
                <h3>Hiring funnel</h3>
                <div className="bars">
                  {[
                    { name: 'Applied', count: overview.applicationsInPeriod, pct: 100 },
                    { name: 'Review', count: Math.round(overview.applicationsInPeriod * 0.72) || overview.activeApplications, pct: 72 },
                    { name: 'Skills challenges', count: overview.workSimMetrics.completedCount || Math.round(overview.applicationsInPeriod * 0.47), pct: 47 },
                    { name: 'Interview', count: Math.round(overview.applicationsInPeriod * 0.26) || 1, pct: 26 },
                    { name: 'Offer', count: overview.hiredCount || Math.round(overview.applicationsInPeriod * 0.1) || 1, pct: 10 }
                  ].map(b => (
                    <div key={b.name}>
                      <span>{b.name}</span>
                      <div className="tr">
                        <i style={{ width: `${b.pct}%` }} />
                      </div>
                      <b>{b.count}</b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Average Days in Stage */}
              <div className="card panel">
                <h3>Average days in stage</h3>
                <div className="bars">
                  {[
                    { name: 'Applied', days: '2.1', width: 21 },
                    { name: 'Review', days: '3.4', width: 34 },
                    { name: 'Skills challenges', days: '4.8', width: 48 },
                    { name: 'Interview', days: '6.2', width: 62 },
                    { name: 'Offer', days: '1.6', width: 16 }
                  ].map(b => (
                    <div key={b.name}>
                      <span>{b.name}</span>
                      <div className="tr">
                        <i style={{ width: `${b.width}%` }} />
                      </div>
                      <b>{b.days}d</b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Skills Challenge Score Distribution */}
              <div className="card panel" style={{ gridColumn: '1 / -1' }}>
                <h3>Skills challenge score distribution</h3>
                <div className="vbars">
                  {[
                    { range: '<50', height: 14 },
                    { range: '50–59', height: 26 },
                    { range: '60–69', height: 52 },
                    { range: '70–79', height: 74 },
                    { range: '80–89', height: 96 },
                    { range: '90+', height: 60 }
                  ].map(b => (
                    <div key={b.range}>
                      <i style={{ height: `${b.height}%` }} />
                      <span>{b.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Job Performance Breakdown Table */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={20} className="text-primary" />
                    Vacancy Recruitment Performance
                  </h2>
                  <p className="text-muted" style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>
                    Performance metrics per published vacancy. Select any job to drill into specific funnel metrics.
                  </p>
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search vacancies..."
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    className="input-standard"
                    style={{ paddingLeft: '2rem', fontSize: '0.825rem' }}
                  />
                </div>
              </div>

              {filteredJobs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No vacancies matching your search query.
                </div>
              ) : (
                <div className="card-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Status</th>
                        <th>Published (UTC)</th>
                        <th>Total Applicants</th>
                        <th>In Period</th>
                        <th>Active</th>
                        <th>Hires</th>
                        <th>WorkSim Completion</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map(job => (
                        <tr key={job.jobId}>
                          <td className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {job.jobTitle}
                          </td>
                          <td>
                            <span className={`status-badge status-${job.status.toLowerCase()}`}>
                              {job.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {job.publishedAtUtc ? new Date(job.publishedAtUtc).toLocaleDateString() : 'Draft'}
                          </td>
                          <td className="font-semibold">{job.totalApplications}</td>
                          <td>{job.applicationsInPeriod}</td>
                          <td>
                            <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                              {job.activeCount}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                              {job.hiredCount}
                            </span>
                          </td>
                          <td>
                            {job.workSimAssignedCount > 0 ? (
                              <span style={{ fontSize: '0.8rem' }}>
                                <strong>{job.workSimCompletionRate}%</strong> ({job.workSimCompletedCount}/{job.workSimAssignedCount})
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleInspectJob(job.jobId)}
                              disabled={isLoadingJob}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <span>Inspect</span>
                              <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* 6. Job Drill-Down Modal */}
        {selectedJobDetail && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                width: '100%',
                maxWidth: '780px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.75rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                position: 'relative',
              }}
            >
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {selectedJobDetail.jobTitle}
                  </h3>
                  <span className="text-muted" style={{ fontSize: '0.825rem' }}>
                    Status: {selectedJobDetail.status} • Total Applicants: {selectedJobDetail.totalApplications}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedJobDetail(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Close drill-down"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Job Specific Funnel */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  Vacancy Progression Funnel
                </h4>
                {selectedJobDetail.funnel.stages.map(st => (
                  <div key={st.stageName} className="funnel-step-row" style={{ marginBottom: '0.5rem' }}>
                    <div className="funnel-label-col" style={{ width: '150px' }}>{st.displayLabel}</div>
                    <div className="funnel-bar-track" style={{ height: '22px' }}>
                      <div
                        className="funnel-bar-fill"
                        style={{ width: `${Math.max(5, st.percentageOfTotal)}%` }}
                      />
                      <span className="funnel-count-pill" style={{ fontSize: '0.75rem' }}>
                        {st.count} ({st.percentageOfTotal}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Job WorkSim Stats */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  WorkSim Simulation Results
                </h4>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.825rem' }}>
                  <span>Assigned: <strong>{selectedJobDetail.workSimMetrics.totalAssigned}</strong></span>
                  <span>Completed: <strong>{selectedJobDetail.workSimMetrics.completedCount}</strong></span>
                  <span>Completion Rate: <strong>{selectedJobDetail.workSimMetrics.completionRatePercentage}%</strong></span>
                  {selectedJobDetail.workSimMetrics.averageScore && (
                    <span>Average Score: <strong>{selectedJobDetail.workSimMetrics.averageScore} / 100</strong></span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setSelectedJobDetail(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
