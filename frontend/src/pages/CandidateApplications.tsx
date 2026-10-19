import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { candidateApplicationsApi } from '../services/api';
import type { 
  CandidateApplicationSummary, 
  CandidateApplicationDetail, 
  ApplicationStage 
} from '../types/recruitment';
import { StageBadge } from '../components/common';

export const CandidateApplications: React.FC = () => {
  const [applications, setApplications] = useState<CandidateApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter: All, Active, Closed
  const [appFilter, setAppFilter] = useState<'All' | 'Active' | 'Closed'>('All');

  // Selected application for timeline detail
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<CandidateApplicationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Withdraw action
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await candidateApplicationsApi.getMyApplications();
      setApplications(data || []);
      if (data && data.length > 0) {
        setSelectedAppId(data[0].id);
        loadDetail(data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to retrieve applications.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await candidateApplicationsApi.getApplication(id);
      setSelectedAppDetail(detail);
    } catch {
      // Gracefully handle detail load failure
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectApp = (id: string) => {
    setSelectedAppId(id);
    loadDetail(id);
  };

  const handleWithdraw = async (id: string) => {
    setIsWithdrawing(true);
    try {
      const updated = await candidateApplicationsApi.withdrawApplication(id);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, currentStage: updated.currentStage } : a));
      if (selectedAppDetail && selectedAppDetail.id === id) {
        setSelectedAppDetail(updated);
      }
      setToastMsg('Application withdrawn.');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      setToastMsg(err.response?.data?.detail || 'Unable to withdraw application.');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const isClosed = (stage: ApplicationStage | string | number) => {
    const s = String(stage);
    return s === '7' || s === 'Hired' || s === '8' || s === 'Rejected' || s === '9' || s === 'Withdrawn';
  };

  const canWithdraw = (stage: ApplicationStage | string | number) => {
    return !isClosed(stage);
  };

  const filteredApps = applications.filter(a => {
    if (appFilter === 'All') return true;
    if (appFilter === 'Active') return !isClosed(a.currentStage);
    if (appFilter === 'Closed') return isClosed(a.currentStage);
    return true;
  });

  const colorClasses = ['m1', 'm2', 'm4', 'm3', 'm5'];

  return (
    <div className="page candidate-portal candidate-applications-page">
      <div className="container">
        {/* Page Header */}
        <div className="ph workflow-hero">
          <div>
            <span className="eyebrow">Application tracker</span>
            <h1>My applications</h1>
            <p>Every stage change is recorded so you always know where you stand.</p>
          </div>
          <div className="row">
            <Link to="/jobs" className="btn primary">
              <span>Find jobs</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {toastMsg && (
          <div className="toast" role="status">
            {toastMsg}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Filter Chips */}
        <div className="row" style={{ marginBottom: '16px' }} role="tablist">
          {(['All', 'Active', 'Closed'] as const).map(f => (
            <button
              key={f}
              type="button"
              className="chip"
              role="tab"
              aria-selected={appFilter === f}
              onClick={() => setAppFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p className="loading-message">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="card panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h3>No applications yet</h3>
            <p className="muted" style={{ margin: '8px 0 20px' }}>
              When you apply to jobs on HireSphere, track your progress right here.
            </p>
            <Link to="/jobs" className="btn primary">
              Browse open jobs
            </Link>
          </div>
        ) : (
          <div className="two">
            {/* Left Desktop: Applications Table */}
            <div className="card tw table-desktop-view">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Stage</th>
                    <th>Match</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((a, idx) => {
                    const isSelected = a.id === selectedAppId;
                    const colorClass = colorClasses[idx % colorClasses.length];
                    const initials = a.companyName ? a.companyName.charAt(0) : 'H';

                    return (
                      <tr 
                        key={a.id} 
                        className={isSelected ? 'sel' : ''} 
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectApp(a.id)}
                      >
                        <td>
                          <div className="cell">
                            <span className={`mark ${colorClass}`}>
                              {initials}
                            </span>
                            <div>
                              <b>{a.jobTitle}</b>
                              <small>{a.companyName}</small>
                            </div>
                          </div>
                        </td>
                        <td><StageBadge stage={a.currentStage} /></td>
                        <td>
                          <b>{(a as any).matchScore != null ? `${(a as any).matchScore}%` : '—'}</b>
                        </td>
                        <td className="muted">
                          {new Date(a.submittedAtUtc).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Left Mobile: Responsive Application Cards */}
            <div className="table-mobile-cards">
              {filteredApps.map((a, idx) => {
                const isSelected = a.id === selectedAppId;
                const colorClass = colorClasses[idx % colorClasses.length];
                const initials = a.companyName ? a.companyName.charAt(0) : 'H';

                return (
                  <div 
                    key={a.id} 
                    className={`table-mobile-card ${isSelected ? 'selected' : ''}`}
                    style={{ border: isSelected ? '1.5px solid var(--navy)' : undefined }}
                  >
                    <div className="table-mobile-card-header">
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className={`mark ${colorClass}`} style={{ width: '36px', height: '36px', fontSize: '15px' }}>
                          {initials}
                        </span>
                        <div>
                          <b style={{ fontSize: '15.5px' }}>{a.jobTitle}</b>
                          <small className="muted" style={{ display: 'block' }}>{a.companyName}</small>
                        </div>
                      </div>
                      <StageBadge stage={a.currentStage} />
                    </div>

                    <div className="table-mobile-card-row">
                      <span className="muted">Applied Date</span>
                      <span>{new Date(a.submittedAtUtc).toLocaleDateString()}</span>
                    </div>

                    {(a as any).matchScore != null && (
                      <div className="table-mobile-card-row">
                        <span className="muted">Match Assessment</span>
                        <span className="badge b-ok nodot">{(a as any).matchScore}% Fit</span>
                      </div>
                    )}

                    <div className="table-mobile-card-actions">
                      <button
                        type="button"
                        onClick={() => handleSelectApp(a.id)}
                        className={`btn sm ${isSelected ? 'lime' : ''}`}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {isSelected ? '✓ Showing Timeline Below' : 'Inspect Timeline & Progress →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Selected Application Timeline Detail */}
            <div className="card panel">
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <p className="muted" style={{ fontSize: '14px' }}>Loading timeline...</p>
                </div>
              ) : selectedAppDetail ? (
                <>
                  <div className="ph2">
                    <h3>{selectedAppDetail.jobTitle}</h3>
                  </div>
                  <p className="muted" style={{ margin: '-8px 0 16px' }}>
                    {selectedAppDetail.companyName}
                  </p>

                  <ul className="tl">
                    {selectedAppDetail.statusTimeline && selectedAppDetail.statusTimeline.length > 0 ? (
                      selectedAppDetail.statusTimeline.map((item, i) => (
                        <li key={item.id || i}>
                          <b>{String(item.newStage)}</b>
                          <small>
                            {new Date(item.createdAtUtc).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            {item.reasonNote ? ` · ${item.reasonNote}` : ''}
                          </small>
                        </li>
                      ))
                    ) : (
                      <li>
                        <b>Submitted</b>
                        <small>{new Date(selectedAppDetail.submittedAtUtc).toLocaleDateString()} · Application received</small>
                      </li>
                    )}
                  </ul>

                  {canWithdraw(selectedAppDetail.currentStage) && (
                    <div className="row" style={{ marginTop: '16px' }}>
                      <button
                        type="button"
                        className="btn danger sm"
                        disabled={isWithdrawing}
                        onClick={() => handleWithdraw(selectedAppDetail.id)}
                      >
                        {isWithdrawing ? 'Withdrawing...' : 'Withdraw application'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>
                  Select an application to view its timeline.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateApplications;
