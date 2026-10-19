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
  PlusCircle,
  Calendar,
  Award
} from 'lucide-react';
import { LoadingState } from '../components/common';
import heroWomanImg from '../assets/hero_woman.jpg';

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

  useEffect(() => {
    const handleCompanyDataChanged = (event: Event) => {
      const companyId = (event as CustomEvent<{ companyId?: string }>).detail?.companyId;
      if (companyId && companyId === (activeCompanyId || user?.companies?.[0]?.companyId)) {
        loadCompanyData(companyId);
      }
    };

    window.addEventListener('hiresphere:company-data-changed', handleCompanyDataChanged);
    return () => window.removeEventListener('hiresphere:company-data-changed', handleCompanyDataChanged);
  }, [activeCompanyId, user]);

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
      <div className="portal-container employer-portal">
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
        {/* Editorial Hero Banner matching Image 2: Employer Workspace */}
        <div className="editorial-hero-banner">
          <div>
            <span className="landing-eyebrow-badge" style={{ color: 'var(--muted)', marginBottom: '8px' }}>
              Good morning, {user?.fullName ? user.fullName.split(' ')[0] : 'Alex'}
            </span>
            <h1 className="editorial-headline-large" style={{ margin: '4px 0 10px 0' }}>
              Build your winning team.
            </h1>
            <p style={{ fontSize: '15.5px', color: 'var(--muted)', maxWidth: '480px', marginBottom: '24px', lineHeight: 1.5 }}>
              Manage your job postings, review applicants and find the right talent, faster.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link 
                to="/company/jobs/new" 
                className="btn btn-lime sm" 
                style={{ fontWeight: 800, padding: '10px 22px', borderRadius: '999px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <PlusCircle size={16} />
                <span>Post a new vacancy</span>
              </Link>
              <Link 
                to="/company/jobs" 
                style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '14.5px', textDecoration: 'none' }}
              >
                View all vacancies
              </Link>
            </div>
          </div>

          <div className="editorial-artwork-container">
            <img 
              src={heroWomanImg} 
              alt="Build your team" 
              className="editorial-artwork-img"
            />
            <div className="artistic-script-tag">
              Great People Build Great Companies
            </div>
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
            {/* 4 Stats Cards (Image 2: Active Vacancies, Total Applicants, Interviews Scheduled, Hires) */}
            <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div className="card st">
                <div className="fi" style={{ background: '#EAF5E8', color: '#0F7A55' }}>
                  <Briefcase size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <b>{dashboard?.activeJobsCount ?? 0}</b>
                    <span className="badge b-ok" style={{ fontSize: '11px', padding: '1px 6px' }}>+2 this week</span>
                  </div>
                  <span>Active Vacancies</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi" style={{ background: 'var(--soft)', color: 'var(--accent-d)' }}>
                  <Users size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <b>{dashboard ? (dashboard.pendingReviewCount + dashboard.shortlistedCount) : 0}</b>
                    <span className="badge b-ok" style={{ fontSize: '11px', padding: '1px 6px' }}>+12%</span>
                  </div>
                  <span>Total Applicants</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi" style={{ background: '#FFEFCF', color: '#8A5300' }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <b>{dashboard?.upcomingInterviewsCount ?? 0}</b>
                    <span className="badge b-ok" style={{ fontSize: '11px', padding: '1px 6px' }}>+20%</span>
                  </div>
                  <span>Interviews Scheduled</span>
                </div>
              </div>

              <div className="card st">
                <div className="fi" style={{ background: '#ECE8FF', color: '#5B3FD0' }}>
                  <Award size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <b>{dashboard?.pendingAssessmentsCount ?? 0}</b>
                    <span className="badge b-ok" style={{ fontSize: '11px', padding: '1px 6px' }}>+50%</span>
                  </div>
                  <span>Offers & Hires</span>
                </div>
              </div>
            </div>

            {/* Two-Column Layout */}
            <div className="two employer-dashboard-grid">
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
                    <Link to="/company/jobs/new" className="btn sm lime" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
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

            {/* Desktop Table View */}
            <div className="card-table-wrapper table-desktop-view">
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

            {/* Mobile Cards View */}
            <div className="table-mobile-cards">
              {members.map(member => (
                <div key={member.id} className="table-mobile-card">
                  <div className="table-mobile-card-header">
                    <div>
                      <b style={{ fontSize: '15px' }}>{member.fullName}</b>
                      <small className="muted" style={{ display: 'block', marginTop: '2px' }}>{member.email}</small>
                    </div>
                    <span className="badge badge-role">{member.companyRole}</span>
                  </div>
                  <div className="table-mobile-card-row">
                    <span className="muted">Status</span>
                    <span className="badge badge-status">{member.membershipStatus}</span>
                  </div>
                  <div className="table-mobile-card-row">
                    <span className="muted">Joined</span>
                    <span>{new Date(member.joinedAtUtc).toLocaleDateString()}</span>
                  </div>
                  {member.companyRole !== 'Owner' && (
                    <div className="table-mobile-card-actions">
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="btn sm danger"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Trash2 size={14} /> Remove Member
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
