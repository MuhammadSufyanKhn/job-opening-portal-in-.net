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
  Calendar,
  Clock,
  Terminal,
  ArrowRight,
  UserCheck,
  Eye,
  PlusCircle,
  Sparkles,
  MapPin
} from 'lucide-react';
import { StageBadge, LoadingState } from '../components/common';

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
        {/* Header Ribbon */}
        <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div className="flex-align-gap" style={{ alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{company.name}</h1>
              <span className={`status-badge status-${company.approvalStatus.toLowerCase()}`}>
                {company.approvalStatus}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {company.industry} • {company.contactEmail}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/company/jobs/new" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <PlusCircle size={15} /> Post New Vacancy
            </Link>
            <Link to="/company/applications" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={15} /> Applications Pipeline
            </Link>
            <Link to="/company/analytics" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={15} /> Analytics
            </Link>
          </div>
        </div>

        {isPending && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
            <ShieldAlert size={20} />
            <div>
              <strong>Verification Pending:</strong> Your organization has been submitted for platform review. While pending, you can invite team members and configure your workspace, but job postings cannot be published to the public marketplace until verified by platform administrators.
            </div>
          </div>
        )}

        {feedback && (
          <div className={`alert alert-${feedback.type}`} style={{ marginBottom: '1.5rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Primary Workspace Metrics Ribbon */}
        {dashboard && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            <Link to="/company/jobs" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ padding: '1.15rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Jobs</span>
                  <Briefcase size={18} style={{ color: 'var(--primary-color)' }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {dashboard.activeJobsCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Manage listings <ArrowRight size={12} />
                </div>
              </div>
            </Link>

            <Link to="/company/applications?stage=0" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ padding: '1.15rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Needs Review</span>
                  <Clock size={18} style={{ color: '#0284c7' }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>
                  {dashboard.pendingReviewCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Review candidates <ArrowRight size={12} />
                </div>
              </div>
            </Link>

            <Link to="/company/applications?stage=2" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ padding: '1.15rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Shortlisted</span>
                  <UserCheck size={18} style={{ color: '#6366f1' }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1' }}>
                  {dashboard.shortlistedCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  View shortlisted <ArrowRight size={12} />
                </div>
              </div>
            </Link>

            <Link to="/company/applications?stage=5" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ padding: '1.15rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Interviews</span>
                  <Calendar size={18} style={{ color: '#0ea5e9' }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0ea5e9' }}>
                  {dashboard.upcomingInterviewsCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0ea5e9', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Interview schedule <ArrowRight size={12} />
                </div>
              </div>
            </Link>

            <Link to="/company/applications?stage=3" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ padding: '1.15rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>WorkSim™ Active</span>
                  <Terminal size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>
                  {dashboard.pendingAssessmentsCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Track simulations <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Action Items / Recruitment Tasks */}
        {dashboard && dashboard.actionItems && dashboard.actionItems.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(2, 132, 199, 0.04)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.75rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)' }}>
              <Clock size={16} /> Recruitment Tasks Requiring Attention
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dashboard.actionItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    backgroundColor: 'var(--bg-surface)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.title}</strong>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {item.description}
                    </p>
                  </div>
                  <Link to={item.actionUrl} className="btn btn-outline btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    Take Action <ArrowRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Workspace Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
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

        {activeTab === 'workspace' && dashboard && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Left Column: Upcoming Interviews & Active Jobs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Upcoming Interviews Card */}
              <div className="card-form" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Upcoming Interviews</h3>
                  </div>
                  <Link to="/company/applications?stage=5" style={{ fontSize: '0.8rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
                    View all
                  </Link>
                </div>

                {dashboard.upcomingInterviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    <Calendar size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No interviews currently scheduled.</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Schedule candidate interviews directly from the application review workspace.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {dashboard.upcomingInterviews.map(interview => (
                      <div
                        key={interview.id}
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {interview.candidateName}
                          </strong>
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                            {interview.interviewType}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Vacancy: <em>{interview.jobTitle}</em>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {new Date(interview.scheduledStartUtc).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          {interview.meetingLocation && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={12} /> {interview.meetingLocation}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Vacancies Card */}
              <div className="card-form" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Briefcase size={18} style={{ color: 'var(--primary-color)' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Active Vacancies</h3>
                  </div>
                  <Link to="/company/jobs" style={{ fontSize: '0.8rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
                    Manage Jobs
                  </Link>
                </div>

                {dashboard.activeJobListings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    <Briefcase size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No published vacancies.</p>
                    <Link to="/company/jobs/new" className="btn btn-outline btn-xs" style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <PlusCircle size={12} /> Create First Job
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {dashboard.activeJobListings.map(job => (
                      <div
                        key={job.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                            {job.title}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Published {new Date(job.createdAtUtc).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                            {job.applicationCount} Applicants
                          </span>
                          <Link to={`/company/applications?jobId=${job.id}`} className="btn btn-outline btn-xs" title="View applications for this job">
                            <Eye size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Applications Activity */}
            <div className="card-form" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Users size={18} style={{ color: 'var(--primary-color)' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Recent Application Activity</h3>
                </div>
                <Link to="/company/applications" style={{ fontSize: '0.8rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
                  Open Pipeline
                </Link>
              </div>

              {dashboard.recentApplications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Users size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No Applications Received Yet</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Once candidates apply for your published jobs, their submissions will appear here for review.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dashboard.recentApplications.map(app => (
                    <div
                      key={app.id}
                      style={{
                        padding: '0.85rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {app.candidateName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Applied for <em>{app.jobTitle}</em>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Submitted {new Date(app.submittedAtUtc).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <StageBadge stage={app.currentStage} style={{ fontSize: '0.72rem' }} />
                        <Link to="/company/applications" className="btn btn-outline btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          Review <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
