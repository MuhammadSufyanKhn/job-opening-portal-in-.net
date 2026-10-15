import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyApi } from '../services/api';
import type { CompanyMember } from '../types/auth';
import type { CompanyWorkspaceDashboard } from '../types/recruitment';
import {
  Building2,
  Users,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  AlertCircle,
  Trash2,
  Briefcase,
  Clock,
  Terminal,
  PlusCircle
} from 'lucide-react';
import { LoadingState } from '../components/common';

export const CompanyDashboard: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [dashboard, setDashboard] = useState<CompanyWorkspaceDashboard | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workspace' | 'team'>('workspace');

  // Invitation state
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
      const [compData, membersData, dashData] = await Promise.all([
        companyApi.getCompany(companyId),
        companyApi.getMembers(companyId),
        companyApi.getWorkspaceDashboard(companyId).catch(() => null),
      ]);
      setCompany(compData);
      setMembers(membersData);
      setDashboard(dashData);
    } catch {
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
    return (
      <div className="portal-container" style={{ padding: '6rem 1.5rem' }}>
        <LoadingState message="Loading company recruitment workspace..." />
      </div>
    );
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
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header matching Picture 1 */}
        <div className="ph">
          <div>
            <h1>{company.name}</h1>
            <p className="muted">
              {isApproved ? 'Verified organisation' : 'Pending verification'} · {members.length} team {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/company/applications" className="btn">
              View applicants
            </Link>
            <Link to="/company/jobs/new" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PlusCircle size={16} /> Post a vacancy
            </Link>
          </div>
        </div>

        {isPending && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
            <ShieldAlert size={20} />
            <div>
              <strong>Verification Pending:</strong> Your organization has been submitted for platform review. While pending, you can configure your workspace and draft vacancies.
            </div>
          </div>
        )}

        {feedback && (
          <div className={`alert alert-${feedback.type}`} style={{ marginBottom: '1.5rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`btn btn-sm ${activeTab === 'workspace' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Briefcase size={15} /> Recruitment Workspace
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`btn btn-sm ${activeTab === 'team' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Users size={15} /> Team Access & Roles ({members.length})
          </button>
        </div>

        {activeTab === 'workspace' && (
          <>
            {/* 4 Stats Cards matching Picture 1 */}
            <div className="stats">
              <div className="card st">
                <div className="fi">
                  <Briefcase size={22} />
                </div>
                <div>
                  <b>{dashboard?.activeJobsCount ?? 0}</b>
                  <span>Open vacancies</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi">
                  <Users size={22} />
                </div>
                <div>
                  <b>{dashboard ? (dashboard.pendingReviewCount + dashboard.shortlistedCount + dashboard.activeJobListings.reduce((acc, j) => acc + (j.applicationCount || 0), 0)) : 0}</b>
                  <span>Total applicants</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi">
                  <Clock size={22} />
                </div>
                <div>
                  <b>18</b>
                  <span>Avg days to hire</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi">
                  <Terminal size={22} />
                </div>
                <div>
                  <b>{dashboard?.pendingAssessmentsCount ?? 0}</b>
                  <span>Skills challenges to review</span>
                </div>
              </div>
            </div>

            {/* Two-Column Layout matching Picture 1 */}
            <div className="two">
              {/* Left Column: Active Vacancies Panel */}
              <div className="card panel">
                <div className="ph2">
                  <h3>Active vacancies</h3>
                  <Link to="/company/jobs" className="btn sm">Manage</Link>
                </div>

                {(!dashboard || dashboard.activeJobListings.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
                    <Briefcase size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '14.5px' }}>No active vacancies published.</p>
                    <Link to="/company/jobs/new" className="btn sm primary" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <PlusCircle size={14} /> Post a vacancy
                    </Link>
                  </div>
                ) : (
                  <div>
                    {dashboard.activeJobListings.map(v => (
                      <div className="arow" key={v.id}>
                        <div>
                          <b>{v.title}</b>
                          <small>{v.applicationCount} {v.applicationCount === 1 ? 'applicant' : 'applicants'}</small>
                        </div>
                        <span className="badge b-ok">
                          {String(v.status) === '1' || String(v.status) === 'Published' ? 'Published' : String(v.status)}
                        </span>
                        <Link to={`/company/applications?jobId=${v.id}`} className="btn sm">
                          Open
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Stacked Panels (Interviews + Recent Activity) */}
              <div className="stack">
                <div className="card panel">
                  <h3>Upcoming interviews</h3>
                  {(!dashboard || dashboard.upcomingInterviews.length === 0) ? (
                    <div style={{ padding: '12px 0', color: 'var(--muted)', fontSize: '14px' }}>
                      <p style={{ margin: 0 }}>No upcoming interviews scheduled.</p>
                      <Link to="/company/applications" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-block', marginTop: '6px' }}>
                        Schedule from applicants pipeline →
                      </Link>
                    </div>
                  ) : (
                    <div>
                      {dashboard.upcomingInterviews.slice(0, 3).map(interview => (
                        <div className="arow" key={interview.id} style={{ gridTemplateColumns: '1fr auto', padding: '10px 0' }}>
                          <div>
                            <b>{interview.candidateName}</b>
                            <small>
                              {new Date(interview.scheduledStartUtc).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {new Date(interview.scheduledStartUtc).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            </small>
                          </div>
                          <span className="badge b-ok">Confirmed</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card panel">
                  <h3>Recent activity</h3>
                  <ul className="tl">
                    {dashboard && dashboard.recentApplications && dashboard.recentApplications.length > 0 ? (
                      dashboard.recentApplications.slice(0, 3).map(app => (
                        <li key={app.id}>
                          <b>{app.candidateName} applied</b>
                          <small>{app.jobTitle} · {new Date(app.submittedAtUtc).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
                        </li>
                      ))
                    ) : (
                      <>
                        <li>
                          <b>Recruitment workspace ready</b>
                          <small>Configure vacancies and invite your team</small>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Team Collaboration Tab */}
        {activeTab === 'team' && (
          <div className="dashboard-section">
            <div className="section-header flex-between" style={{ marginBottom: '1rem' }}>
              <div className="flex-align-gap" style={{ alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} className="text-primary" />
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Team Members & Role-Based Permissions</h2>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Collaborate securely across your recruitment pipeline. <strong>Recruiters</strong> can update stages, schedule interviews, and evaluate WorkSim results. <strong>Hiring Managers</strong> can view candidates and add internal review comments.
            </p>

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
                  <option value="Recruiter">Recruiter (Publish jobs, Manage pipeline, Schedule interviews)</option>
                  <option value="HiringManager">Hiring Manager (Review candidates, Private recruiter notes)</option>
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
        )}
      </motion.div>
    </div>
  );
};
