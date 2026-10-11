import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Terminal, 
  FileText, 
  Clock, 
  Award, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  Sliders
} from 'lucide-react';

export const WorkSimSpotlightSection: React.FC = () => {
  const [selectedDemoAction, setSelectedDemoAction] = useState<number>(0);

  const demoActions = [
    {
      title: 'Roll Back to Last Stable Release (v2.4.0)',
      rationale: 'Mitigates live user impact immediately while root-cause analysis proceeds in staging.',
      rubricFeedback: 'Optimal incident containment choice: prioritizes uptime and prevents compounding errors.',
      scoreDelta: '+35 pts (Incident Severity Containment)'
    },
    {
      title: 'Scale Out Web Worker Nodes by 200%',
      rationale: 'Absorbs concurrent request spikes temporarily to prevent queue saturation.',
      rubricFeedback: 'Acceptable partial mitigation, but does not address underlying memory leak or socket exhaustion.',
      scoreDelta: '+20 pts (Operational Triage)'
    },
    {
      title: 'Restart Database Primary Node Without Failover',
      rationale: 'Attempts hard reset of saturated connection pools.',
      rubricFeedback: 'Sub-optimal: causes immediate service interruption and data write interruption without standby failover.',
      scoreDelta: '+5 pts (High Risk Maneuver)'
    }
  ];

  return (
    <section className="home-section bg-surface-elevated" id="worksim" aria-labelledby="worksim-heading">
      <div className="home-container">
        <div className="worksim-spotlight-grid">
          {/* Left Column: Explanatory Content */}
          <div className="worksim-content-col">
            <div className="section-eyebrow">
              <Terminal size={14} className="text-primary" />
              <span>Core Platform Differentiator</span>
            </div>

            <h2 id="worksim-heading" className="section-title">
              WorkSim: Practical Job Simulations Over Abstract Quizzes
            </h2>

            <p className="worksim-lead">
              Traditional hiring relies on polished resumes or high-stress whiteboard puzzles that rarely reflect 
              real-world day-to-day work. <strong>WorkSim</strong> places candidates inside realistic, contextual 
              operational scenarios where they analyze real evidence, take decisions, and explain their thinking.
            </p>

            <div className="worksim-features-list">
              <div className="worksim-feature-card">
                <div className="feature-card-icon">
                  <Layers size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="feature-card-title">Realistic Workplace Scenarios</h3>
                  <p className="feature-card-desc">
                    Evaluate incident management, architecture decisions, code triage, or project trade-offs based on genuine business contexts.
                  </p>
                </div>
              </div>

              <div className="worksim-feature-card">
                <div className="feature-card-icon">
                  <Sliders size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="feature-card-title">Explainable Decision Rationales</h3>
                  <p className="feature-card-desc">
                    Candidates explain the reasoning behind their choices. Hiring teams see both the chosen strategy and the judgment behind it.
                  </p>
                </div>
              </div>

              <div className="worksim-feature-card">
                <div className="feature-card-icon">
                  <ShieldCheck size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="feature-card-title">Deterministic Rubrics, Zero AI Bias</h3>
                  <p className="feature-card-desc">
                    Evaluations are computed against structured criteria defined by senior engineers and hiring leads—never opaque, uncontrolled AI models.
                  </p>
                </div>
              </div>
            </div>

            <div className="worksim-cta-row">
              <Link to="/register-candidate" className="btn btn-primary">
                <span>Experience Candidate Portal</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/jobs" className="btn btn-outline">
                <span>View Roles with WorkSim</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Realistic Interactive Simulation Preview */}
          <div className="worksim-interactive-col" aria-label="Interactive WorkSim assessment preview">
            <div className="simulation-preview-card">
              {/* Simulation Header */}
              <div className="sim-header">
                <div>
                  <div className="sim-badge-row">
                    <span className="sim-type-badge">Technical Simulation</span>
                    <span className="sim-status-badge">Active Session</span>
                  </div>
                  <h3 className="sim-title">Cloud Outage & Service Recovery</h3>
                  <div className="sim-meta">
                    <span><Clock size={12} /> 30 min duration</span>
                    <span>•</span>
                    <span>Systems & Infrastructure</span>
                  </div>
                </div>
                <div className="sim-timer-pill">24:15 Remaining</div>
              </div>

              {/* Task Scenario Context */}
              <div className="sim-task-container">
                <div className="sim-task-label">Task Context & Instructions:</div>
                <p className="sim-task-desc">
                  At 14:02 UTC, automated health monitors detected a surge in API 504 gateway timeouts. 
                  Memory usage on container cluster <code>prod-eu-west-1</code> reached 98% following release v2.4.1. 
                  Select the most appropriate immediate containment action and review the objective evaluation.
                </p>

                {/* Evidence Drawer */}
                <div className="sim-evidence-drawer">
                  <span className="drawer-label">Unlocked Evidence:</span>
                  <div className="drawer-items">
                    <span className="evidence-pill">
                      <FileText size={12} /> syslog_trace.txt
                    </span>
                    <span className="evidence-pill">
                      <FileText size={12} /> memory_profile.json
                    </span>
                    <span className="evidence-pill">
                      <FileText size={12} /> deploy_changelog_v2.4.1.md
                    </span>
                  </div>
                </div>

                {/* Interactive Action Selector */}
                <div className="sim-actions-selector">
                  <div className="selector-title">Select Candidate Decision (Interactive Demo):</div>
                  {demoActions.map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDemoAction(idx)}
                      className={`sim-action-option ${selectedDemoAction === idx ? 'selected' : ''}`}
                    >
                      <div className="option-radio">
                        {selectedDemoAction === idx && <div className="radio-dot" />}
                      </div>
                      <div className="option-details">
                        <div className="option-title">{action.title}</div>
                        <div className="option-rationale"><em>Sample Rationale:</em> {action.rationale}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Rubric Evaluation Feedback */}
                <div className="sim-evaluation-result">
                  <div className="eval-header">
                    <div className="eval-title">
                      <Award size={16} className="text-warning" />
                      <span>Deterministic Rubric Assessment</span>
                    </div>
                    <span className="eval-delta">{demoActions[selectedDemoAction].scoreDelta}</span>
                  </div>
                  <p className="eval-text">
                    {demoActions[selectedDemoAction].rubricFeedback}
                  </p>
                  <div className="eval-note">
                    *Illustrative demo reflecting HireSphere's server-side WorkSim scoring engine.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
