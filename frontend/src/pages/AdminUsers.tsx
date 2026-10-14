import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { adminUsersApi } from '../services/api';
import type { AdminUserSummary, AdminUserDetail } from '../types/admin';
import { AdminNavigation } from '../components/AdminNavigation';
import {
  Users,
  Search,
  AlertCircle,
  Eye,
  Ban,
  RefreshCw,
  ShieldAlert,
  Briefcase,
} from 'lucide-react';
import { Modal, Pagination } from '../components/common';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);

  // Suspension Modal
  const [suspendingUser, setSuspendingUser] = useState<AdminUserSummary | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, page]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await adminUsersApi.getUsers({
        search: searchQuery.trim() || undefined,
        role: roleFilter || undefined,
        accountStatus: statusFilter || undefined,
        page,
        pageSize: 10,
      });
      setUsers(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to retrieve platform user accounts.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const openUserDetails = async (id: string) => {
    try {
      setSelectedUserId(id);
      const detail = await adminUsersApi.getUser(id);
      setUserDetail(detail);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to load user account details.' });
      setSelectedUserId(null);
    }
  };

  const handleSuspendUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser || !suspensionReason.trim()) return;

    try {
      setIsSubmittingSuspension(true);
      await adminUsersApi.suspendUser(suspendingUser.id, suspensionReason.trim());
      setFeedback({
        type: 'success',
        text: `Account for ${suspendingUser.fullName} (${suspendingUser.email}) suspended successfully. Access tokens have been revoked.`,
      });
      setSuspendingUser(null);
      setSuspensionReason('');
      if (selectedUserId === suspendingUser.id) {
        setSelectedUserId(null);
      }
      loadUsers();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Account suspension failed. Please check permissions.',
      });
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  const handleReactivateUser = async (user: AdminUserSummary) => {
    try {
      await adminUsersApi.reactivateUser(user.id);
      setFeedback({
        type: 'success',
        text: `Account for ${user.fullName} (${user.email}) reactivated to Active standing.`,
      });
      if (selectedUserId === user.id) {
        openUserDetails(user.id);
      }
      loadUsers();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to reactivate user account.',
      });
    }
  };

  return (
    <div className="portal-container page">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="ph">
          <div>
            <div className="ph-title-wrap">
              <Users size={28} style={{ color: 'var(--accent)' }} />
              <h1>User Accounts & Identity Administration</h1>
            </div>
            <p>Audit registered identities, enforce security standing, and safeguard tenant access</p>
          </div>
        </div>

        <AdminNavigation />

        {feedback && (
          <div className={`alert alert-${feedback.type}`}>
            <AlertCircle size={18} />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Toolbar: Search, Role filter, Status filter */}
        <div className="admin-toolbar">
          <form onSubmit={handleSearchSubmit} className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-standard"
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="admin-toolbar-inputs" style={{ justifyContent: 'flex-end' }}>
            <select
              className="select-standard"
              style={{ width: '160px' }}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="Candidate">Candidate</option>
              <option value="CompanyMember">Company Member</option>
              <option value="SuperAdmin">Super Admin</option>
            </select>

            <select
              className="select-standard"
              style={{ width: '160px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled / Suspended</option>
              <option value="PendingVerification">Pending Verification</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 0.75rem' }} />
            Loading accounts directory...
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <Users size={40} className="text-muted" />
            <h3>No Users Found</h3>
            <p>No account records matched the specified search and filter criteria.</p>
          </div>
        ) : (
          <div className="card-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Identity</th>
                  <th>Roles</th>
                  <th>Affiliations</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div><b>{u.fullName}</b></div>
                      <small className="muted">{u.email}</small>
                      {u.phoneNumber && (
                        <small className="muted" style={{ display: 'block' }}>{u.phoneNumber}</small>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`badge ${
                              r === 'SuperAdmin' || r === 'Admin'
                                ? 'b-pur'
                                : r === 'CompanyMember'
                                ? 'b-blue'
                                : 'b-ok'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {u.isCandidate && (
                        <span className="badge nodot" style={{ marginRight: '4px' }}>
                          Candidate
                        </span>
                      )}
                      {u.companyNames.length > 0 && (
                        <small className="muted">
                          {u.companyNames.join(', ')}
                        </small>
                      )}
                      {!u.isCandidate && u.companyNames.length === 0 && (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          u.accountStatus === 'Active'
                            ? 'status-approved'
                            : u.accountStatus === 'Disabled'
                            ? 'status-rejected'
                            : 'status-pendingapproval'
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="muted">{new Date(u.createdAtUtc).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-button-group" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openUserDetails(u.id)}
                          className="btn btn-sm btn-outline"
                          title="View account overview"
                        >
                          <Eye size={14} /> Details
                        </button>

                        {u.accountStatus === 'Active' ? (
                          <button
                            onClick={() => {
                              setSuspendingUser(u);
                              setSuspensionReason('');
                            }}
                            className="btn btn-sm btn-warning"
                            title="Suspend user account"
                          >
                            <Ban size={14} /> Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateUser(u)}
                            className="btn btn-sm btn-outline"
                            title="Reactivate user account"
                          >
                            <RefreshCw size={14} /> Reactivate
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

        {/* User Account Details Modal */}
        <Modal
          isOpen={!!selectedUserId && !!userDetail}
          onClose={() => { setSelectedUserId(null); setUserDetail(null); }}
          title={userDetail?.fullName || 'User Account Details'}
          size="lg"
        >
          {userDetail && (
            <div>
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <span className="text-muted text-sm">{userDetail.email}</span>
                <span
                  className={`status-badge ${
                    userDetail.accountStatus === 'Active'
                      ? 'status-approved'
                      : 'status-rejected'
                  }`}
                >
                  {userDetail.accountStatus}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div className="text-xs text-muted">Account ID</div>
                  <div className="font-medium text-xs text-muted" style={{ fontFamily: 'monospace' }}>
                    {userDetail.id}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Phone Number</div>
                  <div className="font-medium">{userDetail.phoneNumber || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Assigned Platform Roles</div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                    {userDetail.roles.map((r) => (
                      <span key={r} className="badge badge-purple">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Created Timestamp</div>
                  <div className="font-medium text-sm">
                    {new Date(userDetail.createdAtUtc).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Candidate Info if Applicable */}
              {userDetail.isCandidate && (
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <Briefcase size={16} className="text-primary" />
                    <span>Candidate Profile Information</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <span className="text-muted">Headline: </span>
                      <span className="font-medium">{userDetail.candidateHeadline || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-muted">Location: </span>
                      <span className="font-medium">{userDetail.candidateLocation || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-muted">Experience: </span>
                      <span className="font-medium">
                        {userDetail.yearsOfExperience !== null ? `${userDetail.yearsOfExperience} yrs` : 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Job Applications: </span>
                      <span className="font-medium">{userDetail.applicationsCount} submitted</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Memberships if Applicable */}
              {userDetail.companyMemberships.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Company Organization Memberships
                  </h4>
                  <table className="data-table" style={{ fontSize: '0.825rem' }}>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetail.companyMemberships.map((m) => (
                        <tr key={m.companyId}>
                          <td className="font-medium">{m.companyName}</td>
                          <td>{m.role}</td>
                          <td>{m.status}</td>
                          <td>{new Date(m.joinedAtUtc).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Recent Audit Trail targeting this user */}
              {userDetail.recentAuditLogs.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Recent Account Governance Logs
                  </h4>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Admin</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetail.recentAuditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.actionType}</td>
                          <td>{log.actorName || log.actorEmail || 'System'}</td>
                          <td>{new Date(log.timestampUtc).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => { setSelectedUserId(null); setUserDetail(null); }}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Suspend User Modal */}
        <Modal
          isOpen={!!suspendingUser}
          onClose={() => { setSuspendingUser(null); setSuspensionReason(''); }}
          title="Suspend User Account"
        >
          {suspendingUser && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <ShieldAlert size={24} className="text-warning" />
                <p className="text-muted text-sm" style={{ margin: 0 }}>
                  Suspending <strong>{suspendingUser.fullName}</strong> ({suspendingUser.email}) will immediately revoke active sessions and block account access until reactivated.
                </p>
              </div>

              <form onSubmit={handleSuspendUser}>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="userSuspendReason">Reason for Suspension *</label>
                  <textarea
                    id="userSuspendReason"
                    rows={3}
                    className="textarea-standard"
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="e.g. Terms of service violation, suspicious activity, or identity dispute."
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setSuspendingUser(null);
                      setSuspensionReason('');
                    }}
                    className="btn btn-outline"
                    disabled={isSubmittingSuspension}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={isSubmittingSuspension || !suspensionReason.trim()}
                  >
                    {isSubmittingSuspension ? 'Suspending...' : 'Confirm Suspension'}
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
