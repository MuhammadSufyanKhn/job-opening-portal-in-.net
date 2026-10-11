import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  Eye, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { candidateApplicationsApi } from '../services/api';
import type { 
  CandidateApplicationSummary, 
  CandidateApplicationDetail, 
  ApplicationStage 
} from '../types/recruitment';
import { StageBadge, Modal, LoadingState } from '../components/common';

export const CandidateApplications: React.FC = () => {
  const [applications, setApplications] = useState<CandidateApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected application for detail modal
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<CandidateApplicationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Withdraw action
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await candidateApplicationsApi.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to retrieve submitted applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    setSelectedAppId(id);
    setLoadingDetail(true);
    try {
      const detail = await candidateApplicationsApi.getApplication(id);
      setSelectedAppDetail(detail);
    } catch (err: any) {
      console.error('Failed to load application detail', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawingAppId) return;
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      const updated = await candidateApplicationsApi.withdrawApplication(withdrawingAppId);
      // Update in list
      setApplications(prev => prev.map(a => a.id === withdrawingAppId ? { ...a, currentStage: updated.currentStage, stageUpdatedAtUtc: updated.stageUpdatedAtUtc } : a));
      if (selectedAppDetail && selectedAppDetail.id === withdrawingAppId) {
        setSelectedAppDetail(updated);
      }
      setWithdrawingAppId(null);
    } catch (err: any) {
      setWithdrawError(err.response?.data?.detail || 'Unable to withdraw application.');
    } finally {
      setIsWithdrawing(false);
    }
  };


  const canWithdraw = (stage: ApplicationStage) => {
    const stageStr = String(stage);
    return stageStr !== '7' && stageStr !== 'Hired' &&
           stageStr !== '8' && stageStr !== 'Rejected' &&
           stageStr !== '9' && stageStr !== 'Withdrawn';
  };

  return (
    <div className="portal-container" style={{ maxWidth: '1050px', padding: '2.5rem 1.5rem 5rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            My Job Applications
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Track recruitment progress, status timelines, and employer decisions in real time.
          </p>
        </div>
        <Link to="/jobs" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Briefcase size={16} /> Explore Open Vacancies
        </Link>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingState message="Loading your applications..." />
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>
            <strong>Error loading applications</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="card-form" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
          <Briefcase size={50} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Applications Submitted Yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
            You haven't submitted any applications. Discover verified vacancies matched to your skills on the public marketplace.
          </p>
          <Link to="/jobs" className="btn btn-primary btn-lg">
            Browse Job Marketplace <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => (
            <div 
              key={app.id} 
              className="card-table-wrapper"
              style={{ 
                padding: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '1.25rem',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div style={{ minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <Link 
                    to={`/jobs/${app.jobPostingId}`}
                    style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                    className="hover-underline"
                  >
                    {app.jobTitle}
                  </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
                    <Building2 size={15} className="text-primary" /> {app.companyName}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={14} /> Applied {new Date(app.submittedAtUtc).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <StageBadge stage={app.currentStage} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button 
                    onClick={() => handleOpenDetail(app.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Eye size={15} /> View Progress
                  </button>

                  {canWithdraw(app.currentStage) && (
                    <button 
                      onClick={() => { setWithdrawingAppId(app.id); setWithdrawError(null); }}
                      className="btn btn-outline btn-sm text-danger"
                      title="Withdraw application from recruiter consideration"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Detail Modal with Status Timeline */}
      <Modal 
        isOpen={!!selectedAppId} 
        onClose={() => { setSelectedAppId(null); setSelectedAppDetail(null); }}
        title={selectedAppDetail?.jobTitle || 'Application Details'}
        size="lg"
      >
        {loadingDetail || !selectedAppDetail ? (
          <LoadingState message="Loading recruitment history..." />
        ) : (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {selectedAppDetail.companyName} • Applied {new Date(selectedAppDetail.submittedAtUtc).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </p>

            {/* Current Stage Highlight */}
            <div style={{ 
              backgroundColor: 'var(--bg-surface-elevated)', 
              padding: '1.25rem', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                  Current Recruitment Stage
                </span>
                <div><StageBadge stage={selectedAppDetail.currentStage} /></div>
              </div>

              <Link 
                to={`/jobs/${selectedAppDetail.jobPostingId}`}
                className="link-subtle" 
                style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                View Original Vacancy <ChevronRight size={14} />
              </Link>
            </div>

            {/* Candidate Cover Note */}
            {selectedAppDetail.candidateCoverNote && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Submitted Cover Note
                </h4>
                <div style={{ 
                  backgroundColor: 'var(--bg-input)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '0.9rem', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  whiteSpace: 'pre-line'
                }}>
                  {selectedAppDetail.candidateCoverNote}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Application Stage History
              </h4>

              {selectedAppDetail.statusTimeline.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No status transitions recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-color)' }}>
                  {selectedAppDetail.statusTimeline.map((history, idx) => (
                    <div key={history.id || idx} style={{ position: 'relative' }}>
                      {/* Dot marker */}
                      <div style={{ 
                        position: 'absolute', 
                        left: '-1.85rem', 
                        top: '0.2rem', 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        backgroundColor: idx === 0 ? 'var(--primary)' : 'var(--text-muted)',
                        boxShadow: idx === 0 ? '0 0 0 4px rgba(2, 132, 199, 0.25)' : 'none'
                      }} />
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          Stage updated to {String(history.newStage)}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(history.createdAtUtc).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      {history.reasonNote && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                          Note: {history.reasonNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              {canWithdraw(selectedAppDetail.currentStage) && (
                <button 
                  onClick={() => { setWithdrawingAppId(selectedAppDetail.id); setWithdrawError(null); }}
                  className="btn btn-outline text-danger"
                >
                  Withdraw Application
                </button>
              )}
              <button 
                onClick={() => { setSelectedAppId(null); setSelectedAppDetail(null); }}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Withdraw Confirmation Modal */}
      <Modal 
        isOpen={!!withdrawingAppId} 
        onClose={() => setWithdrawingAppId(null)}
        title="Confirm Application Withdrawal"
      >
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <ShieldAlert size={48} className="text-warning" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Are you sure you want to withdraw this application? The employer will be notified that you are no longer participating in this recruitment cycle.
          </p>
        </div>

        {withdrawError && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.85rem' }}>{withdrawError}</span>
          </div>
        )}

        <div className="modal-actions">
          <button 
            onClick={() => setWithdrawingAppId(null)}
            className="btn btn-outline"
            disabled={isWithdrawing}
          >
            Keep Active
          </button>
          <button 
            onClick={handleWithdraw}
            className="btn btn-danger"
            disabled={isWithdrawing}
          >
            {isWithdrawing ? 'Withdrawing...' : 'Yes, Withdraw Application'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
