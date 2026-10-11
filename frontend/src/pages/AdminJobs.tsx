import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { adminJobsApi } from '../services/api';
import type { AdminJobSummary, AdminJobDetail } from '../types/admin';
import { AdminNavigation } from '../components/AdminNavigation';
import {
  Briefcase,
  Search,
  AlertCircle,
  Eye,
  Ban,
  RefreshCw,
  Building2,
  MapPin,
  Users,
} from 'lucide-react';
import { Modal, Pagination } from '../components/common';

export const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<AdminJobSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Job Detail Modal
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<AdminJobDetail | null>(null);

  // Moderation Suspension Modal
  const [suspendingJob, setSuspendingJob] = useState<AdminJobSummary | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadJobs();
  }, [statusFilter, page]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const res = await adminJobsApi.getJobs({
        search: searchQuery.trim() || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: 10,
      });
      setJobs(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to retrieve job vacancy listings.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const openJobDetails = async (id: string) => {
    try {
      setSelectedJobId(id);
      const detail = await adminJobsApi.getJob(id);
      setJobDetail(detail);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to fetch job vacancy detail.' });
      setSelectedJobId(null);
    }
  };

  const handleSuspendJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingJob || !suspensionReason.trim()) return;

    try {
      setIsSubmitting(true);
      await adminJobsApi.suspendJob(suspendingJob.id, suspensionReason.trim());
      setFeedback({
        type: 'success',
        text: `Job posting "${suspendingJob.title}" has been suspended from the public marketplace. The employer team has been notified.`,
      });
      setSuspendingJob(null);
      setSuspensionReason('');
      if (selectedJobId === suspendingJob.id) {
        setSelectedJobId(null);
      }
      loadJobs();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to moderate job posting.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreJob = async (job: AdminJobSummary) => {
    try {
      await adminJobsApi.restoreJob(job.id);
      setFeedback({
        type: 'success',
        text: `Job posting "${job.title}" has been restored to active published status.`,
      });
      if (selectedJobId === job.id) {
        openJobDetails(job.id);
      }
      loadJobs();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to restore job posting.',
      });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Published':
        return 'status-approved';
      case 'Suspended':
        return 'status-rejected';
      case 'Draft':
        return 'badge-muted';
      case 'Paused':
        return 'status-pendingapproval';
      case 'Closed':
      case 'Archived':
        return 'badge-outline';
      default:
        return 'badge-outline';
    }
  };

  return (
    <div className="portal-container">
      <motion.div
        className="portal-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="page-header flex-between">
          <div>
            <div className="flex-align-gap">
              <Briefcase size={28} className="text-primary" />
              <h1>Job Listings & Content Moderation</h1>
            </div>
            <p>Audit vacancy publications, enforce content safety, and intervene on deceptive listings</p>
          </div>
        </div>

        <AdminNavigation />

        {feedback && (
          <div className={`alert alert-${feedback.type}`}>
            <AlertCircle size={18} />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Toolbar: Search, Status filter */}
        <div className="admin-toolbar">
          <form onSubmit={handleSearchSubmit} className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-standard"
              placeholder="Search by job title, company, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="admin-toolbar-inputs" style={{ justifyContent: 'flex-end' }}>
            <select
              className="select-standard"
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Published">Published (Active)</option>
              <option value="Suspended">Suspended (Moderated)</option>
              <option value="Draft">Draft</option>
              <option value="Paused">Paused</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Jobs Table */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 0.75rem' }} />
            Loading job vacancies directory...
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={40} className="text-muted" />
            <h3>No Job Postings Found</h3>
            <p>No vacancy records matched the selected status or query criteria.</p>
          </div>
        ) : (
          <div className="card-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title & Organization</th>
                  <th>Category & Details</th>
                  <th>Applications</th>
                  <th>Status</th>
                  <th>Published Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <div className="font-medium">{j.title}</div>
                      <div className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building2 size={13} /> {j.companyName}
                      </div>
                      <div className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={12} /> {j.location} · {j.employmentType}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-sm">{j.categoryName}</div>
                      <span className="badge badge-outline text-xs">{j.workplaceType}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={14} className="text-muted" />
                        <span className="font-medium">{j.applicationsCount}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(j.status)}`}>
                        {j.status}
                      </span>
                      {j.moderationReason && (
                        <div className="text-danger text-xs mt-1" title={j.moderationReason}>
                          Reason: {j.moderationReason}
                        </div>
                      )}
                    </td>
                    <td className="text-xs text-muted">
                      {j.publishedAtUtc
                        ? new Date(j.publishedAtUtc).toLocaleDateString()
                        : 'Unpublished'}
                    </td>
                    <td>
                      <div className="action-button-group">
                        <button
                          onClick={() => openJobDetails(j.id)}
                          className="btn btn-sm btn-outline"
                          title="Inspect job description and requirements"
                        >
                          <Eye size={14} /> Review
                        </button>

                        {j.status === 'Published' && (
                          <button
                            onClick={() => {
                              setSuspendingJob(j);
                              setSuspensionReason('');
                            }}
                            className="btn btn-sm btn-warning"
                            title="Suspend violating job posting"
                          >
                            <Ban size={14} /> Moderate
                          </button>
                        )}

                        {j.status === 'Suspended' && (
                          <button
                            onClick={() => handleRestoreJob(j)}
                            className="btn btn-sm btn-outline"
                            title="Restore job to marketplace"
                          >
                            <RefreshCw size={14} /> Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* Job Detail Review Modal */}
        <Modal
          isOpen={!!selectedJobId && !!jobDetail}
          onClose={() => { setSelectedJobId(null); setJobDetail(null); }}
          title={jobDetail?.title || 'Job Listing Review'}
          size="lg"
        >
          {jobDetail && (
            <div>
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <div className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={14} /> {jobDetail.companyName}
                  <span>·</span>
                  <MapPin size={14} /> {jobDetail.location} ({jobDetail.workplaceType})
                </div>
                <span className={`status-badge ${getStatusBadgeClass(jobDetail.status)}`}>
                  {jobDetail.status}
                </span>
              </div>

              {jobDetail.moderationReason && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} />
                  <div>
                    <strong>Moderation Reason:</strong> {jobDetail.moderationReason}
                    {jobDetail.moderatedByName && (
                      <div className="text-xs mt-1">
                        Moderated by {jobDetail.moderatedByName} on{' '}
                        {jobDetail.moderatedAtUtc && new Date(jobDetail.moderatedAtUtc).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div className="text-xs text-muted">Category</div>
                  <div className="font-medium text-sm">{jobDetail.categoryName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Employment Type</div>
                  <div className="font-medium text-sm">{jobDetail.employmentType}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Applications Received</div>
                  <div className="font-medium text-sm">{jobDetail.applicationsCount} candidates</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Salary Range</div>
                  <div className="font-medium text-sm">
                    {jobDetail.salaryMin || jobDetail.salaryMax
                      ? `${jobDetail.salaryCurrency} ${jobDetail.salaryMin?.toLocaleString() || 0} - ${jobDetail.salaryMax?.toLocaleString() || 'Open'}`
                      : 'Not disclosed'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Created Timestamp</div>
                  <div className="font-medium text-xs text-muted">
                    {new Date(jobDetail.createdAtUtc).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Published Timestamp</div>
                  <div className="font-medium text-xs text-muted">
                    {jobDetail.publishedAtUtc ? new Date(jobDetail.publishedAtUtc).toLocaleDateString() : 'Draft'}
                  </div>
                </div>
              </div>

              {/* Summary & Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.35rem' }}>Summary</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{jobDetail.summary}</p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.35rem' }}>Description & Responsibilities</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{jobDetail.description}</p>
              </div>

              {/* Requirements */}
              {jobDetail.requirements.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Job Requirements</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {jobDetail.requirements.map((req) => (
                      <li key={req.id} style={{ marginBottom: '0.25rem' }}>
                        <span className="font-medium">{req.requirementText}</span>{' '}
                        <span className="badge badge-outline text-xs">
                          {req.type} · {req.category}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Moderation History */}
              {jobDetail.auditHistory.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Moderation History</h4>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Administrator</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobDetail.auditHistory.map((h) => (
                        <tr key={h.id}>
                          <td>{h.actionType}</td>
                          <td>{h.actorName || h.actorEmail || 'System'}</td>
                          <td>{new Date(h.timestampUtc).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => { setSelectedJobId(null); setJobDetail(null); }}
                  className="btn btn-outline"
                >
                  Close
                </button>

                {jobDetail.status === 'Published' && (
                  <button
                    type="button"
                    onClick={() => {
                      const j = {
                        id: jobDetail.id,
                        title: jobDetail.title,
                        slug: jobDetail.slug,
                        companyId: jobDetail.companyId,
                        companyName: jobDetail.companyName,
                        categoryName: jobDetail.categoryName,
                        location: jobDetail.location,
                        employmentType: jobDetail.employmentType,
                        workplaceType: jobDetail.workplaceType,
                        status: jobDetail.status,
                        applicationsCount: jobDetail.applicationsCount,
                        createdAtUtc: jobDetail.createdAtUtc,
                      };
                      setSelectedJobId(null);
                      setSuspendingJob(j);
                    }}
                    className="btn btn-warning"
                  >
                    Moderate & Suspend
                  </button>
                )}

                {jobDetail.status === 'Suspended' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleRestoreJob(jobDetail as any);
                    }}
                    className="btn btn-success"
                  >
                    Restore to Published
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Suspend Job Modal */}
        <Modal
          isOpen={!!suspendingJob}
          onClose={() => { setSuspendingJob(null); setSuspensionReason(''); }}
          title="Suspend Job Listing"
        >
          {suspendingJob && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Ban size={24} className="text-warning" />
                <p className="text-muted text-sm" style={{ margin: 0 }}>
                  Suspending <strong>"{suspendingJob.title}"</strong> ({suspendingJob.companyName}) will immediately remove it from public search and vacancy feeds. Existing applications and candidate submissions will be safely preserved.
                </p>
              </div>

              <form onSubmit={handleSuspendJob}>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="jobSuspendReason">Moderation Reason *</label>
                  <textarea
                    id="jobSuspendReason"
                    rows={3}
                    className="textarea-standard"
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="e.g. Inappropriate job description, fraudulent salary claims, or terms violation."
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setSuspendingJob(null);
                      setSuspensionReason('');
                    }}
                    className="btn btn-outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={isSubmitting || !suspensionReason.trim()}
                  >
                    {isSubmitting ? 'Suspending...' : 'Confirm Moderation'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      </motion.div>
    </div>
  );
};
