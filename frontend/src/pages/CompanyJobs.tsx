import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Briefcase, 
  AlertCircle, 
  Building2,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { companyJobsApi, companyApi } from '../services/api';
import type { JobPostingSummary, JobPostingStatus } from '../types/recruitment';

export const CompanyJobs: React.FC = () => {
  const { user, activeCompanyId } = useAuth();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<JobPostingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter, Search & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action Confirmation Modal
  const [actionModal, setActionModal] = useState<{
    job: JobPostingSummary;
    action: 'publish' | 'pause' | 'reopen' | 'close' | 'archive';
    title: string;
    description: string;
  } | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const resolvedId = activeCompanyId || (user?.companies && user.companies.length > 0 ? user.companies[0].companyId : null);
    if (resolvedId) {
      setCompanyId(resolvedId);
      loadCompanyInfo(resolvedId);
    } else {
      setLoading(false);
    }
  }, [activeCompanyId, user]);

  useEffect(() => {
    if (companyId) {
      loadJobs(companyId);
    }
  }, [companyId, statusFilter, page]);

  const loadCompanyInfo = async (cId: string) => {
    try {
      const data = await companyApi.getCompany(cId);
      setCompany(data);
    } catch (err) {
      console.error('Failed to load company info', err);
    }
  };

  const loadJobs = async (cId: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        pageSize: 10,
      };
      if (statusFilter !== '') params.status = parseInt(statusFilter, 10);
      if (search.trim()) params.search = search.trim();

      const res = await companyJobsApi.getJobs(cId, params);
      setJobs(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load company vacancies.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal || !companyId) return;

    setIsPerformingAction(true);
    setActionError(null);

    const { job, action } = actionModal;

    try {
      if (action === 'publish') {
        await companyJobsApi.publishJob(companyId, job.id);
      } else if (action === 'pause') {
        await companyJobsApi.pauseJob(companyId, job.id);
      } else if (action === 'reopen') {
        await companyJobsApi.reopenJob(companyId, job.id);
      } else if (action === 'close') {
        await companyJobsApi.closeJob(companyId, job.id);
      } else if (action === 'archive') {
        await companyJobsApi.archiveJob(companyId, job.id);
      }

      setActionModal(null);
      await loadJobs(companyId);
      window.dispatchEvent(new CustomEvent('hiresphere:company-data-changed', {
        detail: { companyId, action },
      }));
    } catch (err: any) {
      setActionError(err.response?.data?.detail || `Failed to ${action} vacancy.`);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const getStatusBadge = (status: JobPostingStatus) => {
    const s = String(status);
    if (s === '1' || s === 'Published') return <span className="badge b-ok">Published</span>;
    if (s === '2' || s === 'Paused') return <span className="badge b-warn">Paused</span>;
    if (s === '3' || s === 'Closed') return <span className="badge b-bad">Closed</span>;
    if (s === '4' || s === 'Archived') return <span className="badge">Archived</span>;
    return <span className="badge">Draft</span>;
  };

  if (!companyId) {
    return (
      <div className="portal-container">
        <div className="empty-state">
          <Building2 size={40} className="text-muted" />
          <h3>No Organization Selected</h3>
          <p>Please select or join an approved company workspace to manage vacancies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-container employer-portal company-jobs-page" style={{ maxWidth: '1150px', padding: '2rem 1.5rem 5rem' }}>
      {/* Header matching Picture 4 */}
      <div className="ph workflow-hero">
        <div>
          <span className="eyebrow">Hiring pipeline</span>
          <h1>Vacancies</h1>
          <p className="muted">Create, publish and manage your job postings.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/company/applications" className="btn">
            All Applications
          </Link>
          <Link 
            to="/company/jobs/new" 
            className="btn lime"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Post a vacancy
          </Link>
        </div>
      </div>

      {/* Suspension Alert if applicable */}
      {company && company.approvalStatus === 'Suspended' && (
        <div className="alert alert-error" style={{ marginBottom: '1.75rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Organization Suspended</strong>
            <p style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
              Your organization account has been suspended by platform administration. Contact support to restore publishing capabilities.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'All Openings', value: '' },
            { label: 'Published', value: '1' },
            { label: 'Drafts', value: '0' },
            { label: 'Paused', value: '2' },
            { label: 'Closed', value: '3' },
            { label: 'Archived', value: '4' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`filter-btn ${statusFilter === tab.value ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-standard"
            style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.85rem' }}
            placeholder="Search role title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                if (companyId) loadJobs(companyId);
              }
            }}
          />
        </div>
      </div>

      {/* Jobs Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading vacancies...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load vacancies</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card-form" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
          <Briefcase size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Vacancies in this View</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.75rem' }}>
            {statusFilter 
              ? 'There are no vacancies matching the selected status filter.' 
              : 'You haven\'t created any job openings yet. Start by defining your first role and structured qualification criteria.'}
          </p>
          <Link to="/company/jobs/new" className="btn lime" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Post a vacancy
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{jobs.length}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong> vacancies
            </p>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                <button 
                  className="btn btn-outline btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="card tw table-desktop-view">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Skills challenge</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const statusStr = String(job.status);
                  const isDraft = statusStr === '0' || statusStr === 'Draft';
                  const isPublished = statusStr === '1' || statusStr === 'Published';
                  const isPaused = statusStr === '2' || statusStr === 'Paused';
                  const isClosed = statusStr === '3' || statusStr === 'Closed';
                  const isArchived = statusStr === '4' || statusStr === 'Archived';

                  return (
                    <tr key={job.id}>
                      <td>
                        <b>{job.title}</b>
                        <small className="muted" style={{ display: 'block', fontSize: '12px' }}>{job.categoryName}</small>
                      </td>
                      <td className="muted">{job.location || 'Remote'}</td>
                      <td>{getStatusBadge(job.status)}</td>
                      <td>
                        <Link 
                          to={`/company/applications?jobId=${job.id}`}
                          style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {job.applicationCount}
                        </Link>
                      </td>
                      <td className="muted">Optional</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {!isArchived && (
                            <Link 
                              to={`/company/jobs/${job.id}/edit`}
                              className="btn sm"
                            >
                              Edit
                            </Link>
                          )}

                          {isDraft && (
                            <button
                              onClick={() => setActionModal({
                                job,
                                action: 'publish',
                                title: 'Publish Vacancy to Marketplace',
                                description: 'Publishing will make this job publicly visible and allow eligible candidates to submit applications.',
                              })}
                              className="btn sm lime"
                              disabled={company?.approvalStatus === 'Suspended'}
                            >
                              Publish
                            </button>
                          )}

                          {isPublished && (
                            <>
                              <button
                                onClick={() => setActionModal({
                                  job,
                                  action: 'pause',
                                  title: 'Pause Vacancy',
                                  description: 'Pausing will temporarily stop accepting new applications from candidates.',
                                })}
                                className="btn sm"
                              >
                                Pause
                              </button>
                              <button
                                onClick={() => setActionModal({
                                  job,
                                  action: 'close',
                                  title: 'Close Vacancy',
                                  description: 'Closing will terminate application intake for this position.',
                                })}
                                className="btn sm danger"
                              >
                                Close
                              </button>
                            </>
                          )}

                          {isPaused && (
                            <button
                              onClick={() => setActionModal({
                                job,
                                action: 'reopen',
                                title: 'Reopen Vacancy',
                                description: 'Reopening will resume application intake on the public marketplace.',
                              })}
                              className="btn sm primary"
                            >
                              Reopen
                            </button>
                          )}

                          {isClosed && (
                            <button
                              onClick={() => setActionModal({
                                job,
                                action: 'archive',
                                title: 'Archive Vacancy',
                                description: 'Archiving removes this vacancy from active management lists.',
                              })}
                              className="btn sm"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="table-mobile-cards">
            {jobs.map((job) => {
              const statusStr = String(job.status);
              const isDraft = statusStr === '0' || statusStr === 'Draft';
              const isPublished = statusStr === '1' || statusStr === 'Published';
              const isPaused = statusStr === '2' || statusStr === 'Paused';
              const isClosed = statusStr === '3' || statusStr === 'Closed';
              const isArchived = statusStr === '4' || statusStr === 'Archived';

              return (
                <div key={job.id} className="table-mobile-card">
                  <div className="table-mobile-card-header">
                    <div>
                      <b style={{ fontSize: '16px' }}>{job.title}</b>
                      <small className="muted" style={{ display: 'block', marginTop: '2px', fontSize: '13px' }}>{job.categoryName}</small>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="table-mobile-card-row">
                    <span className="muted">Location</span>
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  <div className="table-mobile-card-row">
                    <span className="muted">Applicants</span>
                    <Link 
                      to={`/company/applications?jobId=${job.id}`}
                      style={{ fontWeight: 700, color: 'var(--navy)', textDecoration: 'underline' }}
                    >
                      {job.applicationCount} candidates
                    </Link>
                  </div>
                  <div className="table-mobile-card-actions">
                    {!isArchived && (
                      <Link 
                        to={`/company/jobs/${job.id}/edit`}
                        className="btn sm"
                      >
                        Edit
                      </Link>
                    )}
                    {isDraft && (
                      <button
                        onClick={() => setActionModal({
                          job,
                          action: 'publish',
                          title: 'Publish Vacancy to Marketplace',
                          description: 'Publishing will make this job publicly visible and allow eligible candidates to submit applications.',
                        })}
                        className="btn sm lime"
                        disabled={company?.approvalStatus === 'Suspended'}
                      >
                        Publish
                      </button>
                    )}
                    {isPublished && (
                      <>
                        <button
                          onClick={() => setActionModal({
                            job,
                            action: 'pause',
                            title: 'Pause Vacancy',
                            description: 'Pausing will temporarily stop accepting new applications from candidates.',
                          })}
                          className="btn sm"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => setActionModal({
                            job,
                            action: 'close',
                            title: 'Close Vacancy',
                            description: 'Closing will terminate application intake for this position.',
                          })}
                          className="btn sm danger"
                        >
                          Close
                        </button>
                      </>
                    )}
                    {isPaused && (
                      <button
                        onClick={() => setActionModal({
                          job,
                          action: 'reopen',
                          title: 'Reopen Vacancy',
                          description: 'Reopening will resume application intake on the public marketplace.',
                        })}
                        className="btn sm primary"
                      >
                        Reopen
                      </button>
                    )}
                    {isClosed && (
                      <button
                        onClick={() => setActionModal({
                          job,
                          action: 'archive',
                          title: 'Archive Vacancy',
                          description: 'Archiving removes this vacancy from active management lists.',
                        })}
                        className="btn sm"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {actionModal.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {actionModal.description}
            </p>

            {actionError && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.85rem' }}>{actionError}</span>
              </div>
            )}

            <div className="modal-actions">
              <button 
                onClick={() => setActionModal(null)} 
                className="btn btn-outline"
                disabled={isPerformingAction}
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteAction}
                className="btn btn-primary"
                disabled={isPerformingAction}
              >
                {isPerformingAction ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
