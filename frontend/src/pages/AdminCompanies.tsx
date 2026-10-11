import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { adminApi } from '../services/api';
import type { CompanyReview } from '../types/auth';
import { AdminNavigation } from '../components/AdminNavigation';
import {
  ShieldCheck,
  Check,
  X,
  Ban,
  RefreshCw,
  AlertCircle,
  Building2,
  ExternalLink,
  Search,
  Eye,
} from 'lucide-react';
import { Modal, Pagination } from '../components/common';

export const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyReview[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('PendingApproval');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [inspectingCompany, setInspectingCompany] = useState<CompanyReview | null>(null);
  const [rejectingCompanyId, setRejectingCompanyId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendingCompanyId, setSuspendingCompanyId] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCompanies();
  }, [filterStatus, page]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getCompaniesPaged({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        search: searchQuery.trim() || undefined,
        page,
        pageSize: 10,
      });
      setCompanies(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to load company organizations.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCompanies();
  };

  const handleApprove = async (companyId: string) => {
    try {
      await adminApi.approveCompany(companyId);
      setFeedback({ type: 'success', text: 'Organization approved successfully and notification delivered to owner.' });
      loadCompanies();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Approval failed.' });
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCompanyId || !rejectionReason.trim()) return;

    try {
      await adminApi.rejectCompany(rejectingCompanyId, rejectionReason.trim());
      setFeedback({ type: 'success', text: 'Organization registration rejected and reason recorded.' });
      setRejectingCompanyId(null);
      setRejectionReason('');
      loadCompanies();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Rejection failed.' });
    }
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingCompanyId || !suspensionReason.trim()) return;

    try {
      await adminApi.suspendCompany(suspendingCompanyId, suspensionReason.trim());
      setFeedback({ type: 'success', text: 'Organization suspended and team members notified.' });
      setSuspendingCompanyId(null);
      setSuspensionReason('');
      loadCompanies();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Suspension failed.' });
    }
  };

  const handleRestore = async (companyId: string) => {
    try {
      await adminApi.restoreCompany(companyId);
      setFeedback({ type: 'success', text: 'Organization restored to active approved status.' });
      loadCompanies();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Restoration failed.' });
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
              <ShieldCheck size={28} className="text-primary" />
              <h1>Company Verification & Governance</h1>
            </div>
            <p>Review business registrations, enforce marketplace compliance, and audit tenant statuses</p>
          </div>
        </div>

        <AdminNavigation />

        {feedback && (
          <div className={`alert alert-${feedback.type}`}>
            <AlertCircle size={18} />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Toolbar with Search and Status Filter */}
        <div className="admin-toolbar">
          <form onSubmit={handleSearchSubmit} className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-standard"
              placeholder="Search by company or owner name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="filter-group">
            <button
              className={`filter-btn ${filterStatus === 'PendingApproval' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('PendingApproval'); setPage(1); }}
            >
              Pending Approval
            </button>
            <button
              className={`filter-btn ${filterStatus === 'Approved' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('Approved'); setPage(1); }}
            >
              Approved
            </button>
            <button
              className={`filter-btn ${filterStatus === 'Suspended' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('Suspended'); setPage(1); }}
            >
              Suspended
            </button>
            <button
              className={`filter-btn ${filterStatus === 'Rejected' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('Rejected'); setPage(1); }}
            >
              Rejected
            </button>
            <button
              className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('ALL'); setPage(1); }}
            >
              All
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 0.75rem' }} />
            Loading companies queue...
          </div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} className="text-muted" />
            <h3>No Organizations Found</h3>
            <p>There are no company records matching the selected status and search criteria.</p>
          </div>
        ) : (
          <div className="card-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Industry</th>
                  <th>Owner Contact</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((comp) => (
                  <tr key={comp.id}>
                    <td>
                      <div className="font-medium">{comp.name}</div>
                      <div className="text-muted text-sm">{comp.contactEmail}</div>
                      {comp.websiteUrl && (
                        <a
                          href={comp.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="link-external"
                          style={{ fontSize: '0.8rem', color: 'var(--primary)' }}
                        >
                          Website <ExternalLink size={11} />
                        </a>
                      )}
                    </td>
                    <td>{comp.industry}</td>
                    <td>
                      <div>{comp.ownerName}</div>
                      <div className="text-muted text-sm">{comp.ownerEmail}</div>
                    </td>
                    <td>
                      <span className={`status-badge status-${comp.approvalStatus.toLowerCase()}`}>
                        {comp.approvalStatus}
                      </span>
                      {comp.rejectionReason && (
                        <div className="text-danger text-xs mt-1" title={comp.rejectionReason}>
                          Reason: {comp.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>{new Date(comp.createdAtUtc).toLocaleDateString()}</td>
                    <td>
                      <div className="action-button-group">
                        <button
                          onClick={() => setInspectingCompany(comp)}
                          className="btn btn-sm btn-outline"
                          title="Inspect company details"
                        >
                          <Eye size={14} /> Details
                        </button>

                        {comp.approvalStatus === 'PendingApproval' && (
                          <>
                            <button
                              onClick={() => handleApprove(comp.id)}
                              className="btn btn-sm btn-success"
                              title="Approve organization"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingCompanyId(comp.id)}
                              className="btn btn-sm btn-danger"
                              title="Reject registration"
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}

                        {comp.approvalStatus === 'Approved' && (
                          <button
                            onClick={() => {
                              setSuspendingCompanyId(comp.id);
                              setSuspensionReason('');
                            }}
                            className="btn btn-sm btn-warning"
                            title="Suspend organization"
                          >
                            <Ban size={14} /> Suspend
                          </button>
                        )}

                        {(comp.approvalStatus === 'Suspended' || comp.approvalStatus === 'Rejected') && (
                          <button
                            onClick={() => handleRestore(comp.id)}
                            className="btn btn-sm btn-outline"
                            title="Restore to approved"
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

            {/* Pagination Controls */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* Company Details Inspection Modal */}
        <Modal
          isOpen={!!inspectingCompany}
          onClose={() => setInspectingCompany(null)}
          title={inspectingCompany?.name || 'Company Details'}
          size="lg"
        >
          {inspectingCompany && (
            <div>
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <span className="text-muted text-sm">Organization Verification Review</span>
                <span className={`status-badge status-${inspectingCompany.approvalStatus.toLowerCase()}`}>
                  {inspectingCompany.approvalStatus}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div className="text-xs text-muted">Industry</div>
                  <div className="font-medium">{inspectingCompany.industry}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Business Registration / Tax Number</div>
                  <div className="font-medium">{inspectingCompany.businessRegistrationNumber || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Official Contact Email</div>
                  <div className="font-medium">{inspectingCompany.contactEmail}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Corporate Website</div>
                  <div className="font-medium">
                    {inspectingCompany.websiteUrl ? (
                      <a href={inspectingCompany.websiteUrl} target="_blank" rel="noreferrer" className="link-subtle">
                        {inspectingCompany.websiteUrl} <ExternalLink size={12} />
                      </a>
                    ) : (
                      'None'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Primary Administrator (Owner)</div>
                  <div className="font-medium">{inspectingCompany.ownerName} ({inspectingCompany.ownerEmail})</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Registration Submitted</div>
                  <div className="font-medium">{new Date(inspectingCompany.createdAtUtc).toLocaleString()}</div>
                </div>
              </div>

              {inspectingCompany.rejectionReason && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} />
                  <div>
                    <strong>Recorded Reason:</strong> {inspectingCompany.rejectionReason}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setInspectingCompany(null)}
                  className="btn btn-outline"
                >
                  Close
                </button>

                {inspectingCompany.approvalStatus === 'PendingApproval' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const id = inspectingCompany.id;
                        setInspectingCompany(null);
                        setRejectingCompanyId(id);
                      }}
                      className="btn btn-danger"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(inspectingCompany.id);
                        setInspectingCompany(null);
                      }}
                      className="btn btn-success"
                    >
                      Approve Organization
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Rejection Modal */}
        <Modal
          isOpen={!!rejectingCompanyId}
          onClose={() => { setRejectingCompanyId(null); setRejectionReason(''); }}
          title="Reject Company Registration"
        >
          <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
            State the explicit compliance reason for rejecting this organization. This will be stored in the audit trail and sent to the applicant.
          </p>

          <form onSubmit={handleReject}>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="rejectionReason">Reason for Rejection *</label>
              <textarea
                id="rejectionReason"
                rows={3}
                className="textarea-standard"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Unverifiable business tax registration or non-compliant recruitment profile."
                required
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => { setRejectingCompanyId(null); setRejectionReason(''); }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-danger">
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>

        {/* Suspension Modal */}
        <Modal
          isOpen={!!suspendingCompanyId}
          onClose={() => { setSuspendingCompanyId(null); setSuspensionReason(''); }}
          title="Suspend Company Account"
        >
          <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
            Provide an operational or compliance justification for suspending this organization. Active job postings and membership access will be placed on hold.
          </p>

          <form onSubmit={handleSuspend}>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="suspensionReason">Reason for Suspension *</label>
              <textarea
                id="suspensionReason"
                rows={3}
                className="textarea-standard"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g. Reported fraudulent recruitment practices or regulatory breach."
                required
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => { setSuspendingCompanyId(null); setSuspensionReason(''); }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-warning">
                Confirm Suspension
              </button>
            </div>
          </form>
        </Modal>
      </motion.div>
    </div>
  );
};
