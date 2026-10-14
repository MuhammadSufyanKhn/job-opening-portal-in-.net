import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { adminDashboardApi, analyticsApi } from '../services/api';
import type { PlatformDashboardStats } from '../types/admin';
import type { PlatformAnalyticsOverview } from '../types/analytics';
import { AdminNavigation } from '../components/AdminNavigation';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Activity,
  Clock,
  Ban,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Terminal,
  Award,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformDashboardStats | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [data, analyticsData] = await Promise.all([
        adminDashboardApi.getStats(),
        analyticsApi.getPlatformAnalytics({ preset: '30d' }).catch(() => null),
      ]);
      setStats(data);
      setPlatformAnalytics(analyticsData);
    } catch {
      setError('Unable to fetch live platform statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="portal-container">
      <motion.div
        className="portal-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="page-header flex-between">
          <div>
            <h1>Platform Administration & Operations</h1>
            <p>Real-time metrics, system health, and operational oversight across HireSphere</p>
          </div>

          <button
            onClick={loadStats}
            className="btn btn-outline btn-sm"
            disabled={isLoading}
            title="Refresh metrics"
          >
            <RefreshCw size={15} className={isLoading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <AdminNavigation />

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }} />
            <p>Gathering platform metrics across services...</p>
          </div>
        ) : stats ? (
          <>
            {/* Primary KPI Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Total Registered Users</span>
                  <span className="stat-value">{stats.totalUsers}</span>
                  <span className="stat-subtext">
                    {stats.totalCandidates} candidates · {stats.totalCompanyMembers} employers
                  </span>
                </div>
                <div className="stat-icon-wrapper bg-primary-soft text-primary">
                  <Users size={24} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Registered Organizations</span>
                  <span className="stat-value">{stats.totalCompanies}</span>
                  <span className="stat-subtext">
                    {stats.pendingCompanies > 0 ? (
                      <span className="text-warning font-medium">
                        {stats.pendingCompanies} pending approval
                      </span>
                    ) : (
                      'All organizations verified'
                    )}
                  </span>
                </div>
                <div className="stat-icon-wrapper bg-warning-soft text-warning">
                  <Building2 size={24} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Job Postings</span>
                  <span className="stat-value">{stats.totalJobs}</span>
                  <span className="stat-subtext">
                    {stats.publishedJobs} active · {stats.suspendedJobs} suspended
                  </span>
                </div>
                <div className="stat-icon-wrapper bg-success-soft text-emerald">
                  <Briefcase size={24} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Candidate Applications</span>
                  <span className="stat-value">{stats.totalApplications}</span>
                  <span className="stat-subtext">Processed across platform</span>
                </div>
                <div className="stat-icon-wrapper bg-primary-soft text-primary">
                  <FileText size={24} />
                </div>
              </div>
            </div>

            {/* Secondary Highlights: WorkSim & Company Pipeline */}
            <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Skills Challenge Invitations</span>
                  <span className="stat-value">{stats.workSimTotalAssignments}</span>
                  <span className="stat-subtext">
                    {stats.workSimCompletedAssessments} completed challenges
                  </span>
                </div>
                <div className="stat-icon-wrapper bg-primary-soft text-primary">
                  <Terminal size={24} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Skills Challenge Average</span>
                  <span className="stat-value">
                    {stats.workSimAverageScore !== null
                      ? `${Math.round(stats.workSimAverageScore)}%`
                      : 'N/A'}
                  </span>
                  <span className="stat-subtext">
                    Based on completed challenge submissions
                  </span>
                </div>
                <div className="stat-icon-wrapper bg-success-soft text-emerald">
                  <Award size={24} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Companies Awaiting Review</span>
                  <span className="stat-value text-amber">{stats.pendingCompanies}</span>
                  <span className="stat-subtext">
                    {stats.pendingCompanies > 0 ? (
                      <Link to="/admin/companies" className="link-subtle">
                        Review pending queue &rarr;
                      </Link>
                    ) : (
                      'Queue is clear'
                    )}
                  </span>
                </div>
                <div className="stat-icon-wrapper bg-warning-soft text-warning">
                  <Clock size={24} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Governance Interventions</span>
                  <span className="stat-value text-danger">
                    {stats.suspendedCompanies + stats.suspendedJobs + stats.totalDisabledUsers}
                  </span>
                  <span className="stat-subtext">
                    {stats.suspendedCompanies} comp · {stats.suspendedJobs} jobs · {stats.totalDisabledUsers} users
                  </span>
                </div>
                <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <Ban size={24} />
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Platform Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
              {/* Quick Navigation Panels */}
              <div className="card-form" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Operations Portals
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link
                    to="/admin/companies"
                    className="btn btn-outline"
                    style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} />
                      Verify Organizations
                    </span>
                    {stats.pendingCompanies > 0 && (
                      <span className="badge badge-amber">{stats.pendingCompanies}</span>
                    )}
                  </Link>

                  <Link
                    to="/admin/users"
                    className="btn btn-outline"
                    style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} />
                      Manage Accounts
                    </span>
                    <ArrowRight size={14} />
                  </Link>

                  <Link
                    to="/admin/jobs"
                    className="btn btn-outline"
                    style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={16} />
                      Job Moderation
                    </span>
                    {stats.suspendedJobs > 0 && (
                      <span className="badge badge-danger">{stats.suspendedJobs}</span>
                    )}
                  </Link>

                  <Link
                    to="/admin/audit"
                    className="btn btn-outline"
                    style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={16} />
                      Full Audit History
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Platform Recruitment Inflow & Active Employers Overview */}
              {platformAnalytics && (
                <div className="analytics-two-col" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                      <div className="flex-align-gap">
                        <TrendingUp size={18} className="text-primary" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Platform Application Inflow</h3>
                      </div>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                        Last 30 Days: {platformAnalytics.applicationsInPeriod}
                      </span>
                    </div>
                    {platformAnalytics.platformActivityTrend.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '0.825rem', padding: '2rem 0', textAlign: 'center' }}>
                        No platform application activity in the last 30 days.
                      </p>
                    ) : (
                      <div className="trend-chart" style={{ height: '120px' }}>
                        {(() => {
                          const maxCount = Math.max(...platformAnalytics.platformActivityTrend.map(t => t.applicationsCount), 1);
                          return platformAnalytics.platformActivityTrend.map(point => {
                            const heightPct = Math.max(10, (point.applicationsCount / maxCount) * 100);
                            return (
                              <div key={point.date} className="trend-bar-column">
                                <div
                                  className="trend-bar-rect"
                                  style={{ height: `${heightPct}%` }}
                                  title={`${point.date}: ${point.applicationsCount} candidate applications`}
                                />
                                <span className="trend-bar-label">{point.date.slice(5)}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                      <div className="flex-align-gap">
                        <Building2 size={18} className="text-warning" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Top Hiring Organizations</h3>
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>By Candidate Volume</span>
                    </div>
                    {platformAnalytics.activeCompanies.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '0.825rem', padding: '2rem 0', textAlign: 'center' }}>
                        No verified organizations active yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {platformAnalytics.activeCompanies.slice(0, 5).map(co => (
                          <div key={co.companyId} className="flex-between" style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                            <span className="font-medium">{co.companyName}</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span className="badge badge-status" style={{ fontSize: '0.7rem' }}>
                                {co.activeJobsCount} active jobs
                              </span>
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                {co.totalApplicationsCount} applicants
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Platform Administrative Activity */}
              <div className="card-table-wrapper">
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Recent Administrative Activity</h3>
                  <Link to="/admin/audit" className="link-subtle" style={{ fontSize: '0.85rem' }}>
                    View all &rarr;
                  </Link>
                </div>

                {stats.recentActivity.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem' }}>
                    <Activity size={32} className="text-muted" />
                    <p style={{ marginTop: '0.5rem' }}>No recent administrative actions recorded yet.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>Administrator</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentActivity.map((act) => (
                        <tr key={act.id}>
                          <td>
                            <span className="badge badge-purple font-medium">
                              {formatActionName(act.actionType)}
                            </span>
                          </td>
                          <td>
                            <div className="font-medium text-sm">{act.targetResource}</div>
                            {act.companyName && (
                              <div className="text-muted text-xs">{act.companyName}</div>
                            )}
                          </td>
                          <td>
                            <div className="text-sm">{act.actorName || 'System'}</div>
                            <div className="text-muted text-xs">{act.actorEmail}</div>
                          </td>
                          <td className="text-xs text-muted">
                            {new Date(act.timestampUtc).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : null}
      </motion.div>
    </div>
  );
};
