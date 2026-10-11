import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Briefcase,
  FileText,
  Terminal,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Building2,
  MapPin,
  Trash2
} from 'lucide-react';
import { candidateDashboardApi, candidateSavedJobsApi } from '../services/api';
import type { CandidateDashboard as DashboardData } from '../types/candidate';
import { StageBadge, LoadingState } from '../components/common';

export const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isRemovingSaved, setIsRemovingSaved] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateDashboardApi.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load candidate dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemovingSaved(jobId);
    try {
      await candidateSavedJobsApi.unsaveJob(jobId);
      setActionMessage('Job removed from your saved bookmarks.');
      setData(prev => {
        if (!prev) return prev;
        const updatedSaved = prev.savedJobs.filter(s => s.jobId !== jobId);
        return {
          ...prev,
          totalSavedJobs: Math.max(0, prev.totalSavedJobs - 1),
          savedJobs: updatedSaved,
        };
      });
      setTimeout(() => setActionMessage(null), 3500);
    } catch {
      setActionMessage('Unable to remove saved bookmark.');
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setIsRemovingSaved(null);
    }
  };

  const getExtractionStatusLabel = (status: any) => {
    const s = String(status);
    if (s === '1' || s === 'Success') return { label: 'Indexed & Ready', color: 'text-emerald' };
    if (s === '2' || s === 'Failed') return { label: 'Extraction Failed', color: 'text-danger' };
    if (s === '3' || s === 'ScannedPdfDetected') return { label: 'Scanned Image (Text Limited)', color: 'text-amber' };
    return { label: 'Processing...', color: 'text-primary' };
  };

  if (loading) {
    return (
      <div className="portal-container" style={{ padding: '6rem 1.5rem' }}>
        <LoadingState message="Loading candidate workspace and application telemetry..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="portal-container" style={{ maxWidth: '800px', padding: '3rem 1.5rem' }}>
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load dashboard</strong>
            <p>{error || 'An error occurred while connecting to the candidate services.'}</p>
          </div>
        </div>
        <button onClick={loadDashboard} className="btn btn-primary">
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  const completion = data.profileCompletionPercentage;

  return (
    <div className="portal-container" style={{ maxWidth: '1180px', padding: '2rem 1.5rem 5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Candidate Portal
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0.25rem 0 0.5rem' }}>
            Welcome back, {data.fullName || 'Candidate'}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem' }}>
            Track application stages, monitor simulation deadlines, and discover active vacancies matching your skillset.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={loadDashboard} className="btn btn-outline btn-sm" title="Refresh metrics">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link to="/jobs" className="btn btn-primary btn-sm">
            <Briefcase size={15} /> Explore Jobs
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Profile Completion Card */}
      <motion.div
        className="card-form"
        style={{
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(238, 246, 255, 0.7) 0%, rgba(255, 255, 255, 1) 100%)',
          borderColor: 'rgba(186, 230, 253, 0.8)',
          boxShadow: '0 4px 16px rgba(14, 165, 233, 0.08)'
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: '1 1 320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <Sparkles size={20} className="text-primary" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Profile Completion: {completion}%
              </h3>
              <span className={`status-badge ${completion === 100 ? 'status-approved' : 'badge-role'}`} style={{ fontSize: '0.75rem' }}>
                {completion === 100 ? 'Verified Profile' : `${100 - completion}% Remaining`}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1rem', lineHeight: 1.5 }}>
              Transparent completion score based on your bio, experience, verified CV, and portfolio links. Completing your profile makes your qualifications clearer to hiring teams.
            </p>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '9px', backgroundColor: 'rgba(203, 213, 225, 0.5)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${completion}%`,
                  backgroundColor: completion === 100 ? '#10b981' : '#0284c7',
                  borderRadius: '999px',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/candidate/profile" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.6rem 1.25rem' }}>
              Edit Profile
            </Link>
            {!data.hasPrimaryCv && (
              <Link to="/candidate/documents" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.6rem 1.25rem' }}>
                Upload CV
              </Link>
            )}
          </div>
        </div>

        {/* Missing Fields Checklist */}
        {data.missingProfileFields.length > 0 && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
              Items needed for 100% completion:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.missingProfileFields.map((field, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.825rem',
                    padding: '0.3rem 0.75rem',
                    backgroundColor: 'rgba(241, 245, 249, 0.9)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <AlertCircle size={14} className="text-amber" />
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* 4 Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* Active Applications */}
        <div
          onClick={() => navigate('/candidate/applications')}
          className="card-form"
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderColor: 'var(--border-subtle)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Applications</span>
            <div style={{ padding: '0.45rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <Briefcase size={20} className="text-primary" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {data.activeApplications}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {data.totalApplications} total submitted
          </span>
        </div>

        {/* Pending WorkSim Simulations */}
        <div
          onClick={() => navigate('/candidate/simulations')}
          className="card-form"
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderColor: 'var(--border-subtle)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending WorkSim</span>
            <div style={{ padding: '0.45rem', backgroundColor: data.pendingAssessmentsCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <Terminal size={20} className={data.pendingAssessmentsCount > 0 ? 'text-amber' : 'text-emerald'} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {data.pendingAssessmentsCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: data.nextAssessmentDeadlineUtc ? 'var(--warning)' : 'var(--text-secondary)' }}>
            {data.nextAssessmentDeadlineUtc
              ? `Next deadline: ${new Date(data.nextAssessmentDeadlineUtc).toLocaleDateString()}`
              : 'No pending assessments'}
          </span>
        </div>

        {/* Saved Vacancies */}
        <div
          onClick={() => navigate('/jobs')}
          className="card-form"
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderColor: 'var(--border-subtle)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Saved Vacancies</span>
            <div style={{ padding: '0.45rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <Bookmark size={20} className="text-cyan" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {data.totalSavedJobs}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Bookmarked opportunities
          </span>
        </div>

        {/* Primary CV Library Status */}
        <div
          onClick={() => navigate('/candidate/documents')}
          className="card-form"
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderColor: 'var(--border-subtle)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Primary CV Document</span>
            <div style={{ padding: '0.45rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <FileText size={20} className="text-emerald" />
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.25rem' }}>
            {data.primaryCvFileName || 'No CV Uploaded'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {data.hasPrimaryCv ? `${data.extractedSkillsCount} extracted skills` : 'Upload in CV Library'}
            </span>
            {data.hasPrimaryCv && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }} className={getExtractionStatusLabel(data.primaryCvExtractionStatus).color}>
                {getExtractionStatusLabel(data.primaryCvExtractionStatus).label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pending WorkSim Simulations Alert (if any) */}
      {data.pendingAssessments.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Terminal size={20} className="text-amber" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Action Required: Pending WorkSim Assessments ({data.pendingAssessments.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.pendingAssessments.map((item) => (
              <div
                key={item.assignmentId}
                className="card-form"
                style={{
                  padding: '1.25rem 1.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderLeft: '4px solid #f59e0b'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span className="badge badge-amber">{item.category}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.companyName}</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
                    {item.scenarioTitle}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Role: <strong>{item.jobTitle}</strong></span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: item.isExpired ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                      <Clock size={15} /> Deadline: {new Date(item.deadlineUtc).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/candidate/simulations`}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                >
                  <Terminal size={16} /> Open WorkSim Assessment
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Recent Applications & Saved Jobs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Recent Applications */}
        <div className="card-form" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.2rem' }}>Recent Applications</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Latest recruitment stage transitions</p>
            </div>
            <Link to="/candidate/applications" className="link-subtle" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ChevronRight size={15} />
            </Link>
          </div>

          {data.recentApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Briefcase size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No submitted applications yet</p>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Explore verified openings and submit your first profile-first application.</p>
              <Link to="/jobs" className="btn btn-primary btn-sm">Browse Vacancies</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {data.recentApplications.map((app) => (
                <div
                  key={app.applicationId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.jobTitle}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span>{app.companyName}</span>
                      <span>•</span>
                      <span>{new Date(app.submittedAtUtc).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <StageBadge stage={app.currentStage} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Jobs Bookmark List */}
        <div className="card-form" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.2rem' }}>Saved Vacancies</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Roles bookmarked for later application</p>
            </div>
            <Link to="/jobs" className="link-subtle" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              Find More <ChevronRight size={15} />
            </Link>
          </div>

          {data.savedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Bookmark size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No bookmarked vacancies</p>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Bookmark interesting jobs while searching the marketplace to review them anytime.</p>
              <Link to="/jobs" className="btn btn-outline btn-sm">Search Marketplace</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {data.savedJobs.map((item) => (
                <div
                  key={item.savedJobId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '0.75rem' }}>
                    <Link
                      to={`/jobs/${item.jobId}`}
                      style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {item.title}
                    </Link>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building2 size={13} /> {item.companyName}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={13} /> {item.location}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link to={`/jobs/${item.jobId}`} className="btn btn-outline btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                      View
                    </Link>
                    <button
                      onClick={(e) => handleUnsaveJob(item.jobId, e)}
                      className="btn btn-outline btn-sm"
                      title="Remove from saved"
                      style={{ padding: '0.35rem 0.5rem', color: 'var(--text-muted)' }}
                      disabled={isRemovingSaved === item.jobId}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Action Shortcuts */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Candidate Quick Actions
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Link
            to="/jobs"
            className="card-form"
            style={{ padding: '1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}
          >
            <div style={{ padding: '0.6rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <Briefcase size={22} className="text-primary" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Job Marketplace</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Search open vacancies</span>
            </div>
          </Link>

          <Link
            to="/candidate/profile"
            className="card-form"
            style={{ padding: '1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}
          >
            <div style={{ padding: '0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={22} className="text-emerald" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Profile Credentials</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update verified info</span>
            </div>
          </Link>

          <Link
            to="/candidate/documents"
            className="card-form"
            style={{ padding: '1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}
          >
            <div style={{ padding: '0.6rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <FileText size={22} className="text-cyan" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>CV Library</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage PDF & DOCX</span>
            </div>
          </Link>

          <Link
            to="/candidate/simulations"
            className="card-form"
            style={{ padding: '1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}
          >
            <div style={{ padding: '0.6rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <Terminal size={22} className="text-amber" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>WorkSim Simulations</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scenario evaluations</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
