import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCircle, 
  Building2, 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  BarChart2, 
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

export const AudiencePillarsSection: React.FC = () => {
  const [activeAudienceView, setActiveAudienceView] = useState<'candidate' | 'employer'>('candidate');

  return (
    <section className="home-section" id="employers" aria-labelledby="pillars-heading">
      <div className="home-container">
        <div className="section-header-center">
          <div className="section-eyebrow">
            <span>Tailored Experiences</span>
          </div>
          <h2 id="pillars-heading" className="section-title">
            Purpose-Built Portals for Candidates and Hiring Teams
          </h2>
          <p className="section-subtitle">
            HireSphere provides dedicated workspaces optimized for the distinct needs of career seekers and talent leaders.
          </p>

          <div className="audience-toggle-bar" role="tablist">
            <button
              role="tab"
              aria-selected={activeAudienceView === 'candidate'}
              onClick={() => setActiveAudienceView('candidate')}
              className={`toggle-tab ${activeAudienceView === 'candidate' ? 'active' : ''}`}
            >
              <UserCircle size={16} />
              <span>Candidate Experience</span>
            </button>
            <button
              role="tab"
              aria-selected={activeAudienceView === 'employer'}
              onClick={() => setActiveAudienceView('employer')}
              className={`toggle-tab ${activeAudienceView === 'employer' ? 'active' : ''}`}
            >
              <Building2 size={16} />
              <span>Employer Workspace</span>
            </button>
          </div>
        </div>

        {/* Candidate Experience View */}
        {activeAudienceView === 'candidate' && (
          <div className="pillar-panel">
            <div className="pillar-grid">
              <div className="pillar-details">
                <span className="pillar-tag">For Jobseekers & Professionals</span>
                <h3 className="pillar-headline">
                  Manage Your Career Journey with Total Transparency
                </h3>
                <p className="pillar-description">
                  Take ownership of your professional credentials. From secure CV storage with version history 
                  to explainable match scores and real-time application status updates, HireSphere gives you 
                  respect and visibility at every stage.
                </p>

                <div className="pillar-feature-items">
                  <div className="pillar-feature">
                    <div className="feature-icon-circle bg-blue-subtle">
                      <FileText size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="feature-name">Secure CV Vault & Document Library</h4>
                      <p className="feature-sub">
                        Upload and manage multiple resume versions in isolated storage. Set defaults and inspect extracted skills and education.
                      </p>
                    </div>
                  </div>

                  <div className="pillar-feature">
                    <div className="feature-icon-circle bg-blue-subtle">
                      <Sparkles size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="feature-name">Explainable Qualification Match Reports</h4>
                      <p className="feature-sub">
                        Understand how your declared skills match role requirements before applying. No secret scoring or algorithmic black boxes.
                      </p>
                    </div>
                  </div>

                  <div className="pillar-feature">
                    <div className="feature-icon-circle bg-blue-subtle">
                      <TrendingUp size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="feature-name">Auditable Application Tracking</h4>
                      <p className="feature-sub">
                        Monitor pipeline progress, view assigned WorkSim assessments, access interview details, and withdraw applications easily.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pillar-actions">
                  <Link to="/register-candidate" className="btn btn-primary">
                    <span>Create Free Candidate Profile</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/jobs" className="btn btn-outline">
                    <span>Browse Open Roles</span>
                  </Link>
                </div>
              </div>

              {/* Realistic Candidate Portal Preview */}
              <div className="pillar-preview-card">
                <div className="portal-mockup-header">
                  <div className="mockup-brand">Candidate Portal</div>
                  <span className="mockup-status-badge">Active Session</span>
                </div>
                <div className="portal-mockup-body">
                  <div className="mockup-stat-row">
                    <div className="mockup-stat-box">
                      <div className="stat-label">Applications</div>
                      <div className="stat-val">4 Active</div>
                    </div>
                    <div className="mockup-stat-box">
                      <div className="stat-label">WorkSim Tasks</div>
                      <div className="stat-val text-primary">1 Pending</div>
                    </div>
                    <div className="mockup-stat-box">
                      <div className="stat-label">CV Match Avg</div>
                      <div className="stat-val text-success">89%</div>
                    </div>
                  </div>

                  <div className="mockup-list-title">Recent Submissions</div>
                  <div className="mockup-item">
                    <div>
                      <div className="item-title">Staff Infrastructure Engineer</div>
                      <div className="item-sub">Apex Cloud Systems • London, UK</div>
                    </div>
                    <span className="badge-pipeline badge-interview">Interview Scheduled</span>
                  </div>

                  <div className="mockup-item">
                    <div>
                      <div className="item-title">Backend Services Developer</div>
                      <div className="item-sub">NovaSphere Technologies • Remote</div>
                    </div>
                    <span className="badge-pipeline badge-worksim">WorkSim Ready</span>
                  </div>

                  <div className="mockup-cv-callout">
                    <div className="callout-top">
                      <FileText size={14} className="text-primary" />
                      <span>Default CV: <strong>Software_Engineer_2026.pdf</strong></span>
                    </div>
                    <span className="callout-skills">Skills: C#, ASP.NET Core, React, SQL Server, Docker</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employer Workspace View */}
        {activeAudienceView === 'employer' && (
          <div className="pillar-panel">
            <div className="pillar-grid">
              <div className="pillar-details">
                <span className="pillar-tag">For Hiring Teams & Organizations</span>
                <h3 className="pillar-headline">
                  Streamline Your Recruitment from Job Posting to Offer
                </h3>
                <p className="pillar-description">
                  Replace fragmented spreadsheets and disconnected tools with a structured recruitment workspace. 
                  Coordinate team evaluations, schedule interviews, track stage velocities, and verify candidate competency 
                  with WorkSim.
                </p>

                <div className="pillar-feature-items">
                  <div className="pillar-feature">
                    <div className="feature-icon-circle bg-blue-subtle">
                      <Layers size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="feature-name">Kanban Pipeline & Stage Velocity</h4>
                      <p className="feature-sub">
                        Move applicants through Applied, Review, WorkSim, Interview, and Offer stages with audit tracking and reason notes.
                      </p>
                    </div>
                  </div>

                  <div className="pillar-feature">
                    <div className="feature-icon-circle bg-blue-subtle">
                      <MessageSquare size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="feature-name">Private Recruiter Notes & Teammate Reviews</h4>
                      <p className="feature-sub">
                        Collaborate securely with internal hiring managers without exposing confidential evaluations to candidates.
                      </p>
                    </div>
                  </div>

                  <div className="pillar-feature">
                    <div className="feature-icon-circle bg-blue-subtle">
                      <BarChart2 size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="feature-name">Recruitment Analytics & Time-to-Hire</h4>
                      <p className="feature-sub">
                        Inspect funnel drop-offs, application velocity, WorkSim score distributions, and time-in-stage metrics.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pillar-actions">
                  <Link to="/register-company" className="btn btn-primary">
                    <span>Register Company Workspace</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/login" className="btn btn-outline">
                    <span>Sign In to Existing Organization</span>
                  </Link>
                </div>
              </div>

              {/* Realistic Employer Workspace Preview */}
              <div className="pillar-preview-card">
                <div className="portal-mockup-header">
                  <div className="mockup-brand">Employer Workspace</div>
                  <span className="mockup-status-badge bg-emerald">Apex Cloud Systems</span>
                </div>
                <div className="portal-mockup-body">
                  <div className="mockup-stat-row">
                    <div className="mockup-stat-box">
                      <div className="stat-label">Active Vacancies</div>
                      <div className="stat-val">3 Open</div>
                    </div>
                    <div className="mockup-stat-box">
                      <div className="stat-label">Total Applicants</div>
                      <div className="stat-val text-primary">28 Total</div>
                    </div>
                    <div className="mockup-stat-box">
                      <div className="stat-label">Avg Days to Hire</div>
                      <div className="stat-val text-success">18 Days</div>
                    </div>
                  </div>

                  <div className="mockup-list-title">Pipeline Summary: Senior Full Stack Engineer</div>
                  <div className="pipeline-mini-stages">
                    <div className="mini-stage">
                      <span className="stage-name">Applied</span>
                      <span className="stage-bubble">12</span>
                    </div>
                    <div className="mini-stage">
                      <span className="stage-name">Review</span>
                      <span className="stage-bubble">7</span>
                    </div>
                    <div className="mini-stage active-mini-stage">
                      <span className="stage-name">WorkSim</span>
                      <span className="stage-bubble text-primary font-bold">5</span>
                    </div>
                    <div className="mini-stage">
                      <span className="stage-name">Interview</span>
                      <span className="stage-bubble">3</span>
                    </div>
                    <div className="mini-stage">
                      <span className="stage-name">Offer</span>
                      <span className="stage-bubble">1</span>
                    </div>
                  </div>

                  <div className="mockup-candidate-callout">
                    <div className="cand-top">
                      <span className="cand-name">Elena Rostova</span>
                      <span className="cand-score">WorkSim: 92/100 (Proficient)</span>
                    </div>
                    <div className="cand-note">
                      "Demonstrated excellent root-cause triage during incident containment scenario. Recommended for team lead panel."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
