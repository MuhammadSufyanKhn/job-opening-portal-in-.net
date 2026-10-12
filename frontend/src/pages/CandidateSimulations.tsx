import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';
import { workSimApi } from '../services/api';
import type { AssessmentAssignment } from '../types/worksim';
import { LABELS } from '../content/labels';

export const CandidateSimulations: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workSimApi.getMyAssignments();
      setAssignments(data || []);
      if (data && data.length > 0) {
        setSelectedAssignmentId(data[0].assignmentId);
      }
    } catch {
      setError('Unable to load skills challenges at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (assignment: AssessmentAssignment) => {
    setStartingId(assignment.assignmentId);
    try {
      if (assignment.activeSessionId && assignment.status === 'InProgress') {
        navigate(`/candidate/simulations/session/${assignment.activeSessionId}`);
        return;
      }
      const newSession = await workSimApi.startSession(assignment.assignmentId);
      navigate(`/candidate/simulations/session/${newSession.sessionId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to start challenge session.');
    } finally {
      setStartingId(null);
    }
  };

  const selected = assignments.find(a => a.assignmentId === selectedAssignmentId) || assignments[0];

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="ph">
          <div>
            <h1>{LABELS.SKILLS_CHALLENGES}</h1>
            <p>Realistic work tasks assigned by employers to see what you can do.</p>
          </div>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--bad-bg)', borderRadius: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p className="loading-message">Loading challenges...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="card panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h3>No challenges assigned yet</h3>
            <p className="muted" style={{ margin: '8px 0 20px', maxWidth: '48ch', marginLeft: 'auto', marginRight: 'auto' }}>
              When a company invites you to complete a short skills challenge, it will appear here.
            </p>
            <button type="button" onClick={() => navigate('/jobs')} className="btn primary">
              Browse open jobs
            </button>
          </div>
        ) : (
          <div className="sims">
            {/* Left Column: Assigned List */}
            <div className="sl">
              {assignments.map((item) => {
                const isSelected = item.assignmentId === selected?.assignmentId;
                const isPending = item.status === 'Assigned' || item.status === 'InProgress';

                return (
                  <button
                    key={item.assignmentId}
                    type="button"
                    className="sli"
                    aria-selected={isSelected}
                    onClick={() => setSelectedAssignmentId(item.assignmentId)}
                  >
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <b>{item.scenarioTitle}</b>
                    </div>
                    <small>{item.companyName} · {item.estimatedDurationMinutes || 30} min</small>
                    <div className="row" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
                      <span className={`badge ${isPending ? 'b-warn' : 'b-ok'}`}>
                        {isPending ? 'To do' : 'Completed'}
                      </span>
                      {item.completedAtUtc && (
                        <small className="muted">
                          {new Date(item.completedAtUtc).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </small>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Selected Task Preview */}
            {selected && (
              selected.status === 'Completed' ? (
                <div className="card panel">
                  <h3>{selected.scenarioTitle}</h3>
                  <p className="muted" style={{ margin: '-4px 0 16px' }}>{selected.companyName}</p>
                  <div className="scorebar">
                    <span>Task completed</span>
                    <b>Submitted to employer</b>
                  </div>
                  <p className="muted" style={{ marginTop: '16px' }}>
                    Your response has been saved and shared with the hiring team for this vacancy.
                  </p>
                  {selected.activeSessionId && (
                    <div style={{ marginTop: '16px' }}>
                      <button 
                        type="button" 
                        className="btn sm"
                        onClick={() => navigate(`/candidate/simulations/session/${selected.activeSessionId}/results`)}
                      >
                        View submission summary
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card sim" style={{ boxShadow: 'var(--sh)' }}>
                  <div className="sim-h">
                    <div>
                      <span className="badge b-pur nodot" style={{ marginBottom: '6px' }}>Work task</span>
                      <h3>{selected.scenarioTitle}</h3>
                      <small>{selected.companyName} · {selected.estimatedDurationMinutes || 30} min · autosaves</small>
                    </div>
                    <span className="timer">
                      <Clock size={16} /> {selected.estimatedDurationMinutes || 30} mins
                    </span>
                  </div>

                  <div className="sim-b">
                    <p>
                      {selected.scenarioDescription || 'This short task lets you demonstrate how you would address a practical challenge typical for this role.'}
                    </p>

                    <div className="box" style={{ background: 'var(--soft)', borderColor: '#C9D8FF' }}>
                      <b>What to expect:</b>
                      <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '14.5px', color: 'var(--muted)' }}>
                        <li>Asynchronous, self-paced workspace with a suggested time guide.</li>
                        <li>Review scenario notes, choose an action, and explain your reasoning.</li>
                        <li>Reviewed by a real person on the company's hiring team.</li>
                      </ul>
                    </div>

                    <div className="row" style={{ justifyContent: 'space-between', marginTop: '10px' }}>
                      <small className="muted">You can review the prompt and submit when ready.</small>
                      <button
                        type="button"
                        className="btn primary"
                        disabled={startingId === selected.assignmentId}
                        onClick={() => handleStartSession(selected)}
                      >
                        <span>{startingId === selected.assignmentId ? 'Starting...' : 'Start challenge'}</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateSimulations;
