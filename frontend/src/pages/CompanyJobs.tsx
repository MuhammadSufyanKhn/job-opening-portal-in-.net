import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Briefcase, 
  Users, 
  Edit3, 
  Play, 
  Pause, 
  Archive, 
  XCircle, 
  AlertCircle, 
  Building2,
  Layers,
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
      loadJobs(companyId);
    } catch (err: any) {
      setActionError(err.response?.data?.detail || `Failed to ${action} vacancy.`);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const getStatusBadge = (status: JobPostingStatus) => {
    const statusStr = String(status);
    const map: Record<string, { label: string; className: string }> = {
      '0': { label: 'Draft', className: 'status-suspended' },
      '1': { label: 'Published', className: 'status-approved' },
      '2': { label: 'Paused', className: 'status-pendingapproval' },
      '3': { label: 'Closed', className: 'status-rejected' },
      '4': { label: 'Archived', className: 'status-suspended' },
      'Draft': { label: 'Draft', className: 'status-suspended' },
      'Published': { label: 'Published', className: 'status-approved' },
      'Paused': { label: 'Paused', className: 'status-pendingapproval' },
      'Closed': { label: 'Closed', className: 'status-rejected' },
      'Archived': { label: 'Archived', className: 'status-suspended' },
    };
    const item = map[statusStr] || { label: statusStr, className: 'status-suspended' };
    return <span className={`status-badge ${item.className}`}>{item.label}</span>;
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
    <div className="portal-container" style={{ maxWidth: '1150px', padding: '2.5rem 1.5rem 5rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Vacancy Management
            </h1>
            {company && (
              <span className="badge badge-purple" style={{ fontSize: '0.8rem' }}>
                {company.name}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Create, publish, and govern structured job openings and recruitment pipelines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/company/applications" className="btn btn-outline">
            <Users size={16} /> All Applications
          </Link>
          <Link 
            to="/company/jobs/new" 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={18} /> Create New Vacancy
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
          <Link to="/company/jobs/new" className="btn btn-primary">
            <Plus size={18} /> Create Your First Vacancy
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

          <div className="card-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title & Category</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Applications</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
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
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {job.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {job.categoryName} • {job.location}
                          </div>
                        </div>
                      </td>

                      <td>{getStatusBadge(job.status)}</td>

                      <td>
                        <span className="badge badge-outline" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Layers size={12} /> v{job.activeVersionNumber}
                        </span>
                      </td>

                      <td>
                        <Link 
                          to={`/company/applications?jobId=${job.id}`}
                          className="link-subtle"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem' }}
                        >
                          <Users size={15} /> {job.applicationCount} Applicants
                        </Link>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {new Date(job.createdAtUtc).toLocaleDateString(undefined, { dateStyle: 'short' })}
                        </span>
                      </td>

                      <td>
                        <div className="action-button-group" style={{ justifyContent: 'flex-end' }}>
                          {/* Edit Button */}
                          {!isArchived && (
                            <Link 
                              to={`/company/jobs/${job.id}/edit`}
                              className="btn btn-outline btn-sm"
                              title="Edit vacancy specifications & requirements"
                            >
                              <Edit3 size={14} /> Edit
                            </Link>
                          )}

                          {/* Lifecycle Actions */}
                          {isDraft && (
                            <button
                              onClick={() => setActionModal({
                                job,
                                action: 'publish',
                                title: 'Publish Vacancy to Marketplace',
                                description: 'Publishing will make this job publicly visible and allow eligible candidates to submit applications. An immutable version snapshot (v1) will be locked.',
                              })}
                              className="btn btn-primary btn-sm"
                              disabled={company?.approvalStatus === 'Suspended'}
                              title={company?.approvalStatus === 'Suspended' ? 'Company is suspended' : 'Publish opening to marketplace'}
                            >
                              <Play size={14} /> Publish
                            </button>
                          )}

                          {isPublished && (
                            <>
                              <button
                                onClick={() => setActionModal({
                                  job,
                                  action: 'pause',
                                  title: 'Pause Vacancy',
                                  description: 'Pausing will temporarily stop accepting new applications from candidates while keeping existing applications accessible.',
                                })}
                                className="btn btn-outline btn-sm text-warning"
                                title="Pause applications"
                              >
                                <Pause size={14} /> Pause
                              </button>
                              <button
                                onClick={() => setActionModal({
                                  job,
                                  action: 'close',
                                  title: 'Close Vacancy',
                                  description: 'Closing will permanently terminate application intake for this position. Existing applications will remain available for review.',
                                })}
                                className="btn btn-outline btn-sm text-danger"
                                title="Close vacancy"
                              >
                                <XCircle size={14} /> Close
                              </button>
                            </>
                          )}

                          {isPaused && (
                            <>
                              <button
                                onClick={() => setActionModal({
                                  job,
                                  action: 'reopen',
                                  title: 'Reopen Vacancy',
                                  description: 'Reopening will resume application intake on the public marketplace.',
                                })}
                                className="btn btn-primary btn-sm"
                              >
                                <Play size={14} /> Reopen
                              </button>
                              <button
                                onClick={() => setActionModal({
                                  job,
                                  action: 'close',
                                  title: 'Close Vacancy',
                                  description: 'Permanently close application intake for this position.',
                                })}
                                className="btn btn-outline btn-sm text-danger"
                              >
                                Close
                              </button>
                            </>
                          )}

                          {isClosed && (
                            <button
                              onClick={() => setActionModal({
                                job,
                                action: 'archive',
                                title: 'Archive Vacancy',
                                description: 'Archiving removes this vacancy from active management lists while preserving historical recruitment data.',
                              })}
                              className="btn btn-outline btn-sm"
                            >
                              <Archive size={14} /> Archive
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
