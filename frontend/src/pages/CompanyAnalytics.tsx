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
  Award,
  Download,
  Calendar,
  Filter,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  X,
  Search,
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
        {/* Page Header */}
        <div className="page-header flex-between">
          <div>
            <h1>Recruitment Analytics & Hiring Pipeline</h1>
            <p className="text-muted">
              {overview?.companyName ? `${overview.companyName} • ` : ''}
              Track recruitment conversion, candidate funnel progress, and WorkSim assessment outcomes.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={isExporting || isLoading || !overview}
            className="btn btn-secondary"
            title="Download formatted recruitment CSV report"
          >
            <Download size={16} />
            <span>{isExporting ? 'Exporting...' : 'Export Report (CSV)'}</span>
          </button>
        </div>

        {/* Date Filter Toolbar */}
        <div className="analytics-header-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={15} className="text-primary" /> Filter Period:
            </span>

            <div className="date-preset-group">
              <button
                type="button"
                className={`date-preset-btn ${preset === '7d' ? 'active' : ''}`}
                onClick={() => setPreset('7d')}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className={`date-preset-btn ${preset === '30d' ? 'active' : ''}`}
                onClick={() => setPreset('30d')}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className={`date-preset-btn ${preset === '90d' ? 'active' : ''}`}
                onClick={() => setPreset('90d')}
              >
                Last 90 Days
              </button>
              <button
                type="button"
                className={`date-preset-btn ${preset === 'all' ? 'active' : ''}`}
                onClick={() => setPreset('all')}
              >
                All Time
              </button>
              <button
                type="button"
                className={`date-preset-btn ${preset === 'custom' ? 'active' : ''}`}
                onClick={() => setPreset('custom')}
              >
                Custom Range
              </button>
            </div>
          </div>

          {preset === 'custom' && (
            <form onSubmit={handleApplyCustomDate} className="custom-date-box">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="input-standard"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                required
              />
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="input-standard"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Apply
              </button>
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
            {/* 1. Summary KPI Cards */}
            <div className="analytics-kpi-grid">
              <div className="analytics-kpi-card">
                <span className="kpi-title">Applications Received</span>
                <span className="kpi-value">{overview.applicationsInPeriod}</span>
                <span className="kpi-subtitle">
                  {overview.totalApplications} all-time across all vacancies
                </span>
              </div>

              <div className="analytics-kpi-card">
                <span className="kpi-title">Active Candidates</span>
                <span className="kpi-value">{overview.activeApplications}</span>
                <span className="kpi-subtitle">Currently advancing in pipeline</span>
              </div>

              <div className="analytics-kpi-card">
                <span className="kpi-title">Offers & Hires</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span className="kpi-value">{overview.hiredCount}</span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                    {overview.overallHireRatePercentage}% Hire Rate
                  </span>
                </div>
                <span className="kpi-subtitle">{overview.rejectedCount} rejected • {overview.withdrawnCount} withdrawn</span>
              </div>

              <div className="analytics-kpi-card">
                <span className="kpi-title">Open Vacancies</span>
                <span className="kpi-value">{overview.publishedJobs}</span>
                <span className="kpi-subtitle">
                  {overview.totalJobs} total ({overview.draftJobs} draft, {overview.closedJobs} closed)
                </span>
              </div>

              <div className="analytics-kpi-card">
                <span className="kpi-title">WorkSim Completion</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span className="kpi-value">{overview.workSimMetrics.completionRatePercentage}%</span>
                </div>
                <span className="kpi-subtitle">
                  {overview.workSimMetrics.completedCount} completed of {overview.workSimMetrics.totalAssigned} assigned
                </span>
              </div>
            </div>

            {/* 2. Recruitment Funnel Visualization */}
            <div className="funnel-container">
              <div className="flex-between">
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={20} className="text-primary" />
                    Recruitment Funnel & Conversion Rates
                  </h2>
                  <p className="text-muted" style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>
                    Progression tracks candidate volume advancing through recruitment milestones based on recorded status history.
                  </p>
                </div>
                <span className="badge badge-primary">
                  {overview.applicationsInPeriod} Candidates in Scope
                </span>
              </div>

              {overview.funnel.stages.length === 0 || overview.applicationsInPeriod === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No application activity recorded in this date range.
                </div>
              ) : (
                <>
                  <div className="funnel-step-list">
                    {overview.funnel.stages.map((stage, idx) => {
                      const maxCount = overview.funnel.stages[0]?.count || 1;
                      const widthPercent = maxCount > 0 ? Math.max(6, (stage.count / maxCount) * 100) : 0;

                      return (
                        <div key={stage.stageName} className="funnel-step-row">
                          <div className="funnel-label-col">
                            <span>{stage.displayLabel}</span>
                          </div>

                          <div className="funnel-bar-track">
                            <div
                              className="funnel-bar-fill"
                              style={{ width: `${widthPercent}%` }}
                            />
                            <span className="funnel-count-pill">
                              {stage.count} ({stage.percentageOfTotal}%)
                            </span>
                          </div>

                          <div className="funnel-rate-col">
                            {idx === 0 ? (
                              <span>Baseline</span>
                            ) : (
                              <span>
                                <strong>{stage.conversionRateFromPrevious}%</strong> conv.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="funnel-terminals">
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Terminal Outcomes:
                    </span>
                    {overview.funnel.terminalOutcomes.map(term => (
                      <div key={term.outcomeName} className="terminal-badge">
                        {term.outcomeName === 'Rejected' ? (
                          <XCircle size={14} className="text-danger" />
                        ) : (
                          <HelpCircle size={14} className="text-warning" />
                        )}
                        <span>
                          {term.displayLabel}: <strong>{term.count}</strong> ({term.percentageOfTotal}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 3. Two-Column Analytics: Stage Distribution & Activity Trend */}
            <div className="analytics-two-col">
              {/* Left Column: Current Status Distribution */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Current Application Status Snapshot
                </h3>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Distribution of candidate applications by their present stage.
                </p>

                {overview.stageDistribution.length === 0 ? (
                  <p className="text-muted">No applications found.</p>
                ) : (
                  overview.stageDistribution.map(item => (
                    <div key={item.stageName} className="distribution-item">
                      <div className="distribution-meta">
                        <span>{item.displayLabel}</span>
                        <span>
                          <strong>{item.count}</strong> ({item.percentage}%)
                        </span>
                      </div>
                      <div className="distribution-track">
                        <div
                          className="distribution-fill"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor:
                              item.stageName === 'Hired'
                                ? '#059669'
                                : item.stageName === 'Rejected'
                                ? '#dc2626'
                                : item.stageName === 'Withdrawn'
                                ? '#64748b'
                                : 'var(--primary)',
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Application Activity Timeline */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Application Inflow Trend
                </h3>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Daily submissions recorded during the selected period.
                </p>

                {overview.activityTrend.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No daily application submissions recorded in this date range.
                  </div>
                ) : (
                  <div>
                    <div className="trend-chart">
                      {(() => {
                        const maxCount = Math.max(...overview.activityTrend.map(t => t.applicationsCount), 1);
                        return overview.activityTrend.map(point => {
                          const heightPct = Math.max(8, (point.applicationsCount / maxCount) * 100);
                          return (
                            <div key={point.date} className="trend-bar-column">
                              <div
                                className="trend-bar-rect"
                                style={{ height: `${heightPct}%` }}
                                title={`${point.date}: ${point.applicationsCount} applications`}
                              />
                              <span className="trend-bar-label">
                                {point.date.slice(5)}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Total in range: <strong>{overview.applicationsInPeriod}</strong> submissions
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. WorkSim Assessment Analytics */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="flex-between">
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={20} className="text-primary" />
                    WorkSim Assessment Metrics & Competency Insights
                  </h2>
                  <p className="text-muted" style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>
                    Performance aggregate across assigned interactive simulations for your vacancies.
                  </p>
                </div>
                {overview.workSimMetrics.averageScore && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {overview.workSimMetrics.averageScore} / 100
                    </span>
                    <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Average Simulation Score
                    </span>
                  </div>
                )}
              </div>

              {/* Status Counters */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <span className="badge badge-status">
                  Assigned: <strong>{overview.workSimMetrics.totalAssigned}</strong>
                </span>
                <span className="badge badge-emerald">
                  Completed: <strong>{overview.workSimMetrics.completedCount}</strong>
                </span>
                <span className="badge badge-purple">
                  In Progress: <strong>{overview.workSimMetrics.inProgressCount}</strong>
                </span>
                <span className="badge badge-status">
                  Pending: <strong>{overview.workSimMetrics.pendingCount}</strong>
                </span>
                <span className="badge badge-status">
                  Expired: <strong>{overview.workSimMetrics.expiredCount}</strong>
                </span>
                {overview.workSimMetrics.averageCompletionMinutes && (
                  <span className="badge badge-status" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> Avg Time: <strong>{overview.workSimMetrics.averageCompletionMinutes} min</strong>
                  </span>
                )}
              </div>

              {/* Score Buckets */}
              {overview.workSimMetrics.scoreBuckets.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Score Distribution
                  </h4>
                  <div className="score-bucket-grid">
                    {overview.workSimMetrics.scoreBuckets.map(bucket => (
                      <div key={bucket.bucketLabel} className="score-bucket-card">
                        <div className="score-bucket-label">{bucket.bucketLabel}</div>
                        <div className="score-bucket-count">{bucket.count}</div>
                        <div className="score-bucket-pct">{bucket.percentage}% of candidates</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Criteria Performance */}
              {overview.workSimMetrics.criteriaPerformance.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Evaluated Skills Challenge Competencies
                  </h4>
                  {overview.workSimMetrics.criteriaPerformance.map(crit => (
                    <div key={crit.criterionName} style={{ marginBottom: '0.65rem' }}>
                      <div className="distribution-meta">
                        <span>{crit.criterionName}</span>
                        <span>
                          <strong>{crit.averageScore}</strong> / {crit.maxScore} ({crit.averagePercentage}%)
                        </span>
                      </div>
                      <div className="distribution-track">
                        <div className="distribution-fill" style={{ width: `${crit.averagePercentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Responsible assessment disclaimer */}
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg)',
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: '0.775rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}
              >
                <strong>Skills Challenge Notice:</strong> Skills challenges measure task execution on realistic job scenarios. Scores serve as a helpful guide for your hiring team, and real people always make the final decisions.
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
