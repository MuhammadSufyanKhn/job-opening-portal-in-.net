import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Clock,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Circle
} from 'lucide-react';
import { candidateDashboardApi } from '../services/api';
import type { CandidateDashboard as DashboardData } from '../types/candidate';
import { StageBadge, LoadingState, AnimatedNumber } from '../components/common';
import { LABELS } from '../content/labels';

export const CandidateDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.response?.data?.detail || 'Unable to load dashboard information.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <LoadingState message="Loading your dashboard..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container" style={{ maxWidth: '800px', padding: '3rem 1rem' }}>
        <div className="card panel" style={{ textAlign: 'center' }}>
          <AlertCircle size={32} className="text-bad" style={{ margin: '0 auto 12px' }} />
          <h3>Unable to load dashboard</h3>
          <p className="muted" style={{ margin: '8px 0 16px' }}>{error || 'An error occurred while connecting to the server.'}</p>
          <button onClick={loadDashboard} className="btn primary">
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      </div>
    );
  }

  const completion = data.profileCompletionPercentage || 0;
  const recentApps = data.recentApplications || [];
  const pendingSims = data.pendingAssessments || [];
  const colorClasses = ['m1', 'm2', 'm4', 'm3', 'm5'];

  return (
    <div className="page">
      <div className="container">
        {/* Page Header */}
        <div className="ph">
          <div>
            <h1>Welcome back, {data.fullName?.split(' ')[0] || 'there'}</h1>
            <p>
              {pendingSims.length > 0 
                ? `You have ${pendingSims.length} ${LABELS.SKILLS_CHALLENGE.toLowerCase()} waiting.`
                : 'Follow your applications and explore open roles from verified companies.'}
            </p>
          </div>
          <div className="row">
            <Link to="/jobs" className="btn primary">
              <span>Browse jobs</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>


        {/* 4 Stats Cards */}
        <div className="stats" style={{ marginBottom: '24px' }}>
          <div className="card st">
            <div className="fi">
              <FileText size={20} />
            </div>
            <div>
              <b><AnimatedNumber value={data.totalApplications} /></b>
              <span>Applications sent</span>
            </div>
          </div>

          <div className="card st">
            <div className="fi">
              <Clock size={20} />
            </div>
            <div>
              <b><AnimatedNumber value={data.activeApplications} /></b>
              <span>In review</span>
            </div>
          </div>

          <div className="card st">
            <div className="fi">
              <Briefcase size={20} />
            </div>
            <div>
              <b><AnimatedNumber value={data.pendingAssessmentsCount || 0} /></b>
              <span>{LABELS.SKILLS_CHALLENGES}</span>
            </div>
          </div>

          <div className="card st">
            <div className="fi">
              <Bookmark size={20} />
            </div>
            <div>
              <b><AnimatedNumber value={data.totalSavedJobs || 0} /></b>
              <span>Saved jobs</span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="two">
          {/* Left Column: Recent Applications */}
          <div className="card panel">
            <div className="ph2">
              <h3>Recent applications</h3>
              <Link to="/candidate/applications" className="btn sm">
                View all
              </Link>
            </div>

            {recentApps.length === 0 ? (
              <p className="muted" style={{ padding: '20px 0' }}>
                You haven't submitted any applications yet. <Link to="/jobs" style={{ color: 'var(--accent)' }}>Browse open jobs</Link> to get started.
              </p>
            ) : (
              recentApps.slice(0, 5).map((app, idx) => {
                const colorClass = colorClasses[idx % colorClasses.length];
                const initials = app.companyName ? app.companyName.charAt(0) : 'H';

                return (
                  <div key={app.applicationId} className="arow">
                    <span className={`mark ${colorClass}`}>
                      {initials}
                    </span>
                    <div>
                      <b>{app.jobTitle}</b>
                      <small>
                        {app.companyName} · applied {new Date(app.submittedAtUtc).toLocaleDateString()}
                      </small>
                    </div>
                    <StageBadge stage={app.currentStage} />
                    {(app as any).matchScore != null && (
                      <span className="muted" style={{ fontSize: '14px', fontWeight: 600 }}>
                        {(app as any).matchScore}% fit
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Stack */}
          <div className="stack">
            {/* Pending Skills Challenge Callout */}
            {pendingSims.length > 0 ? (
              <div className="card panel callout">
                <div className="ph2">
                  <h3>{LABELS.SKILLS_CHALLENGE} waiting</h3>
                  <span className="badge b-warn">Action needed</span>
                </div>
                <b>{pendingSims[0].scenarioTitle || 'Practical task'}</b>
                <p className="muted" style={{ margin: '4px 0 14px' }}>
                  {pendingSims[0].companyName} · {(pendingSims[0] as any).estimatedTimeMinutes || 30} minutes
                </p>
                <Link to="/candidate/simulations" className="btn primary">
                  <span>Start challenge</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="card panel">
                <h3>{LABELS.SKILLS_CHALLENGES}</h3>
                <p className="muted" style={{ margin: '6px 0 14px' }}>
                  No challenges waiting right now. When an employer invites you to complete a practical task, you will see it here.
                </p>
                <Link to="/candidate/simulations" className="btn sm">
                  View past tasks
                </Link>
              </div>
            )}

            {/* Profile Progress */}
            <div className="card panel">
              <h3>Profile {completion}% complete</h3>
              <div className="bar" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${completion}%` }} />
              </div>
              <ul className="todo">
                {data.missingProfileFields && data.missingProfileFields.length > 0 ? (
                  data.missingProfileFields.slice(0, 3).map((item, idx) => (
                    <li key={idx}>
                      <span className="ic"><Circle size={16} /></span>
                      <span>Add your {item.toLowerCase()}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <span className="ic" style={{ color: 'var(--ok)' }}><CheckCircle2 size={16} /></span>
                    <span>Your profile is fully complete</span>
                  </li>
                )}
              </ul>
              <div style={{ marginTop: '16px' }}>
                <Link to="/candidate/profile" className="btn sm">
                  Update profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
