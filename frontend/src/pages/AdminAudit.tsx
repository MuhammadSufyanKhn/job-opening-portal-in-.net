import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { adminAuditApi } from '../services/api';
import type { AdminAuditItem } from '../types/admin';
import { AdminNavigation } from '../components/AdminNavigation';
import {
  ShieldCheck,
  Search,
  AlertCircle,
  Eye,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Metadata Inspection Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditItem | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadLogs();
  }, [actionTypeFilter, resourceFilter, page]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await adminAuditApi.getAuditLogs({
        search: searchQuery.trim() || undefined,
        actionType: actionTypeFilter || undefined,
        targetResource: resourceFilter || undefined,
        page,
        pageSize: 15,
      });
      setLogs(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to retrieve administrative audit trail.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const formatActionName = (action: string) => {
    return action.replace(/([A-Z])/g, ' $1').trim();
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('Approve') || action.includes('Reactivate') || action.includes('Restore')) {
      return 'badge-emerald';
    }
    if (action.includes('Reject') || action.includes('Suspend')) {
      return 'badge-danger';
    }
    return 'badge-purple';
  };

  const parseMetadataJson = (json?: string | null) => {
    if (!json) return null;
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
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
            <div className="flex-align-gap">
              <ShieldCheck size={28} className="text-primary" />
              <h1>System Audit Trail & Governance Logs</h1>
            </div>
            <p>Immutable operational records of administrative decisions, reviews, and status transitions</p>
          </div>
        </div>

        <AdminNavigation />

        {feedback && (
          <div className={`alert alert-${feedback.type}`}>
            <AlertCircle size={18} />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Toolbar: Search, Action filter, Target Resource filter */}
        <div className="admin-toolbar">
          <form onSubmit={handleSearchSubmit} className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-standard"
              placeholder="Search by actor, target ID, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="admin-toolbar-inputs" style={{ justifyContent: 'flex-end' }}>
            <select
              className="select-standard"
              style={{ width: '200px' }}
              value={actionTypeFilter}
              onChange={(e) => {
                setActionTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Action Types</option>
              <option value="CompanyApproved">Company Approved</option>
              <option value="CompanyRejected">Company Rejected</option>
              <option value="CompanySuspended">Company Suspended</option>
              <option value="CompanyRestored">Company Restored</option>
              <option value="UserSuspended">User Suspended</option>
              <option value="UserReactivated">User Reactivated</option>
              <option value="JobSuspended">Job Moderated (Suspended)</option>
              <option value="JobRestored">Job Restored</option>
            </select>

            <select
              className="select-standard"
              style={{ width: '160px' }}
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Resources</option>
              <option value="Company">Company</option>
              <option value="User">User</option>
              <option value="JobPosting">Job Posting</option>
            </select>
          </div>
        </div>

        {/* Audit Table */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 0.75rem' }} />
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Activity size={40} className="text-muted" />
            <h3>No Audit Logs Found</h3>
            <p>No operational actions matched your specified filter criteria.</p>
          </div>
        ) : (
          <div className="card-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Target Resource</th>
                  <th>Administrator</th>
                  <th>Details & Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                      <div className="font-medium text-primary">
                        {new Date(log.timestampUtc).toLocaleDateString()}
                      </div>
                      <div>{new Date(log.timestampUtc).toLocaleTimeString()}</div>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeColor(log.actionType)} font-medium`}>
                        {formatActionName(log.actionType)}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-sm">{log.targetResource}</div>
                      <div className="text-muted text-xs" style={{ fontFamily: 'monospace' }}>
                        ID: {log.targetResourceId}
                      </div>
                      {log.companyName && (
                        <div className="text-xs text-muted">{log.companyName}</div>
                      )}
                    </td>
                    <td>
                      <div className="text-sm font-medium">{log.actorName || 'System'}</div>
                      <div className="text-muted text-xs">{log.actorEmail}</div>
                      {log.ipAddress && (
                        <div className="text-muted text-xs" style={{ fontFamily: 'monospace' }}>
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-sm btn-outline"
                        title="Inspect full audit record"
                      >
                        <Eye size={13} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <span className="text-sm text-muted">
                  Showing {logs.length} of {totalCount} audit logs
                </span>
                <div className="pagination-controls">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="text-sm font-medium px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit Record Inspection Modal */}
        {selectedLog && (
          <div className="modal-backdrop">
            <div className="modal-dialog modal-dialog-lg">
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {formatActionName(selectedLog.actionType)}
                  </h3>
                  <span className="text-muted text-sm">
                    Logged on {new Date(selectedLog.timestampUtc).toLocaleString()}
                  </span>
                </div>
                <span className={`badge ${getActionBadgeColor(selectedLog.actionType)}`}>
                  {selectedLog.actionType}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div className="text-xs text-muted">Target Entity</div>
                  <div className="font-medium">{selectedLog.targetResource}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Target Resource ID</div>
                  <div className="font-medium text-xs" style={{ fontFamily: 'monospace' }}>
                    {selectedLog.targetResourceId}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Responsible Administrator</div>
                  <div className="font-medium">{selectedLog.actorName || 'System'} ({selectedLog.actorEmail})</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Originating IP Address</div>
                  <div className="font-medium text-xs" style={{ fontFamily: 'monospace' }}>
                    {selectedLog.ipAddress || 'Unavailable'}
                  </div>
                </div>
              </div>

              {selectedLog.metadataJson ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Structured Audit Metadata
                  </h4>
                  <pre className="json-code-block">
                    {parseMetadataJson(selectedLog.metadataJson)}
                  </pre>
                </div>
              ) : (
                <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>
                  No extra metadata payload associated with this entry.
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="btn btn-outline"
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
