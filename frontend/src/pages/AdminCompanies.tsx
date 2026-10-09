import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { adminApi } from '../services/api';
import type { CompanyReview } from '../types/auth';
import { ShieldCheck, Check, X, Ban, RefreshCw, AlertCircle, Building2, ExternalLink } from 'lucide-react';

export const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyReview[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('PendingApproval');
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingCompanyId, setRejectingCompanyId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCompanies();
  }, [filterStatus]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getAllCompanies(filterStatus === 'ALL' ? undefined : filterStatus);
      setCompanies(data);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to load company organizations.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (companyId: string) => {
    try {
      await adminApi.approveCompany(companyId);
      setFeedback({ type: 'success', text: 'Organization approved successfully.' });
      loadCompanies();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Approval failed.' });
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCompanyId) return;

    try {
      await adminApi.rejectCompany(rejectingCompanyId, rejectionReason);
      setFeedback({ type: 'success', text: 'Organization registration rejected.' });
      setRejectingCompanyId(null);
      setRejectionReason('');
      loadCompanies();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Rejection failed.' });
    }
  };

  const handleSuspend = async (companyId: string) => {
    const reason = window.prompt('Please provide the reason for suspension:');
    if (!reason) return;

    try {
      await adminApi.suspendCompany(companyId, reason);
      setFeedback({ type: 'success', text: 'Organization suspended.' });
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
              <h1>Platform Company Verification & Governance</h1>
            </div>
            <p>Review business registrations, enforce marketplace compliance, and audit tenant statuses</p>
          </div>

          <div className="filter-group">
            <button
              className={`filter-btn ${filterStatus === 'PendingApproval' ? 'active' : ''}`}
              onClick={() => setFilterStatus('PendingApproval')}
            >
              Pending Approval
            </button>
            <button
              className={`filter-btn ${filterStatus === 'Approved' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Approved')}
            >
              Approved
            </button>
            <button
              className={`filter-btn ${filterStatus === 'Suspended' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Suspended')}
            >
              Suspended
            </button>
            <button
              className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              All
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`alert alert-${feedback.type}`}>
            <AlertCircle size={18} />
            <span>{feedback.text}</span>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">Loading companies queue...</div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} className="text-muted" />
            <h3>No Organizations Found</h3>
            <p>There are no company records matching the selected status filter.</p>
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
                {companies.map(comp => (
                  <tr key={comp.id}>
                    <td>
                      <div className="font-medium">{comp.name}</div>
                      <div className="text-muted text-sm">{comp.contactEmail}</div>
                      {comp.websiteUrl && (
                        <a href={comp.websiteUrl} target="_blank" rel="noreferrer" className="link-external">
                          Website <ExternalLink size={12} />
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
                            onClick={() => handleSuspend(comp.id)}
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
          </div>
        )}

        {/* Rejection Modal */}
        {rejectingCompanyId && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <h3>Reject Company Registration</h3>
              <p className="text-muted">State the explicit compliance reason for rejecting this organization.</p>

              <form onSubmit={handleReject}>
                <div className="form-group">
                  <label htmlFor="rejectionReason">Reason for Rejection</label>
                  <textarea
                    id="rejectionReason"
                    rows={3}
                    className="textarea-standard"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Unverifiable business registration number or deceptive company details."
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
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
