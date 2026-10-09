import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { companyApi } from '../services/api';
import type { CompanyMember } from '../types/auth';
import { Building2, Users, ShieldAlert, CheckCircle2, UserPlus, AlertCircle, Trash2 } from 'lucide-react';

export const CompanyDashboard: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Recruiter' | 'HiringManager'>('Recruiter');
  const [isInviting, setIsInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeCompanyId) {
      loadCompanyData(activeCompanyId);
    } else if (user?.companies && user.companies.length > 0) {
      loadCompanyData(user.companies[0].companyId);
    } else {
      setIsLoading(false);
    }
  }, [activeCompanyId, user]);

  const loadCompanyData = async (companyId: string) => {
    try {
      setIsLoading(true);
      const [compData, membersData] = await Promise.all([
        companyApi.getCompany(companyId),
        companyApi.getMembers(companyId),
      ]);
      setCompany(compData);
      setMembers(membersData);
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to load company workspace data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsInviting(true);
    setFeedback(null);

    try {
      await companyApi.inviteMember(company.id, {
        email: inviteEmail,
        companyRole: inviteRole,
      });
      setFeedback({ type: 'success', text: `Invitation sent to ${inviteEmail} as ${inviteRole}.` });
      setInviteEmail('');
      const updatedMembers = await companyApi.getMembers(company.id);
      setMembers(updatedMembers);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to issue invitation.';
      setFeedback({ type: 'error', text: detail });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!company) return;
    if (!window.confirm('Are you sure you want to remove this member from the organization?')) return;

    try {
      await companyApi.removeMember(company.id, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setFeedback({ type: 'success', text: 'Member removed.' });
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to remove member.';
      setFeedback({ type: 'error', text: detail });
    }
  };

  if (isLoading) {
    return <div className="loading-state">Loading company workspace...</div>;
  }

  if (!company) {
    return (
      <div className="portal-container">
        <div className="empty-state">
          <Building2 size={40} className="text-muted" />
          <h3>No Organization Selected</h3>
          <p>You are not currently linked to an active company workspace.</p>
        </div>
      </div>
    );
  }

  const isPending = company.approvalStatus === 'PendingApproval';
  const isApproved = company.approvalStatus === 'Approved';

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
              <h1>{company.name}</h1>
              <span className={`status-badge status-${company.approvalStatus.toLowerCase()}`}>
                {company.approvalStatus}
              </span>
            </div>
            <p>{company.industry} • {company.contactEmail}</p>
          </div>
        </div>

        {isPending && (
          <div className="alert alert-warning">
            <ShieldAlert size={20} />
            <div>
              <strong>Verification Pending:</strong> Your organization has been submitted for platform review. While pending, you can invite team members and configure your workspace, but job postings cannot be published to the public marketplace until verified by platform administrators.
            </div>
          </div>
        )}

        {feedback && (
          <div className={`alert alert-${feedback.type}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Team Members Section */}
        <div className="dashboard-section">
          <div className="section-header flex-between">
            <div className="flex-align-gap">
              <Users size={20} className="text-primary" />
              <h2>Team Members & Roles</h2>
            </div>
          </div>

          <div className="card-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id}>
                    <td className="font-medium">{member.fullName}</td>
                    <td>{member.email}</td>
                    <td>
                      <span className="badge badge-role">{member.companyRole}</span>
                    </td>
                    <td>
                      <span className="badge badge-status">{member.membershipStatus}</span>
                    </td>
                    <td>{new Date(member.joinedAtUtc).toLocaleDateString()}</td>
                    <td>
                      {member.companyRole !== 'Owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="btn-icon text-danger"
                          title="Remove member"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Member Invitation Form */}
          <div className="invite-box" style={{ marginTop: '2rem' }}>
            <h3>Invite Team Member</h3>
            <p className="text-muted">Grant access to hiring managers or recruiters to review candidate applications.</p>

            <form onSubmit={handleInvite} className="form-inline">
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="input-standard"
                required
                disabled={isInviting || !isApproved}
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="select-standard"
                disabled={isInviting || !isApproved}
              >
                <option value="Recruiter">Recruiter (Publish jobs, Review CVs)</option>
                <option value="HiringManager">Hiring Manager (Scorecards & Interviews)</option>
              </select>

              <button type="submit" className="btn btn-primary" disabled={isInviting || !isApproved}>
                <UserPlus size={18} />
                <span>{isInviting ? 'Sending...' : 'Send Invitation'}</span>
              </button>
            </form>

            {!isApproved && (
              <p className="text-warning-subtle" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                * Team invitations become available once your organization is approved by platform administrators.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
