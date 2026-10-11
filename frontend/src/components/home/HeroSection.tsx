import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Terminal, 
  Briefcase, 
  FileCheck, 
  Users,
  Sparkles
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'jobs' | 'worksim' | 'pipeline'>('jobs');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.append('search', keyword.trim());
    if (location.trim()) params.append('location', location.trim());
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleQuickKeyword = (term: string) => {
    setKeyword(term);
    navigate(`/jobs?search=${encodeURIComponent(term)}`);
  };

  return (
    <section className="home-hero" aria-labelledby="hero-heading">
      <div className="home-container">
        <div className="hero-grid">
          {/* Left Column: Messaging & Search */}
          <div className="hero-text-col">
            <div className="hero-badge">
              <Sparkles size={14} className="hero-badge-icon" />
              <span>Evidence-Driven Recruitment Technology</span>
            </div>

            <h1 id="hero-heading" className="hero-headline">
              Where Real Capability Meets <span className="hero-headline-highlight">Great Careers</span>
            </h1>

            <p className="hero-description">
              HireSphere unites job discovery, transparent qualification matching, and realistic 
              <strong> WorkSim</strong> job simulations in one platform—empowering candidates to prove 
              practical skill and employers to hire with confidence.
            </p>

            {/* Public Job Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hero-search-box" role="search">
              <div className="hero-search-input-group">
                <Search size={18} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Job title, skill, or keyword..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="hero-search-field"
                  aria-label="Job title, skill, or keyword"
                />
              </div>

              <div className="hero-search-divider" aria-hidden="true" />

              <div className="hero-search-input-group">
                <MapPin size={18} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="City, state, or 'Remote'..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="hero-search-field"
                  aria-label="Location or remote"
                />
              </div>

              <button type="submit" className="hero-search-btn">
                <span>Find Jobs</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>

            {/* Quick Keyword Chips */}
            <div className="hero-quick-searches" aria-label="Popular searches">
              <span className="quick-label">Trending:</span>
              {['Full Stack', '.NET Core', 'React', 'DevOps', 'Data Engineer'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQuickKeyword(term)}
                  className="quick-chip"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="hero-actions">
              <Link to="/register-candidate" className="btn btn-primary btn-lg">
                <span>Join as Candidate</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/register-company" className="btn btn-outline btn-lg">
                <Building2 size={18} aria-hidden="true" />
                <span>For Employers</span>
              </Link>
            </div>

            {/* Value Trust Bullets */}
            <div className="hero-trust-row">
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
                <span>Verified Employers</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
                <span>No Black-Box Automated Disqualification</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
                <span>Practical WorkSim Simulations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Product Demonstration Mockup */}
          <div className="hero-preview-col" aria-label="Interactive HireSphere platform demonstration">
            <div className="preview-card-window">
              {/* Window Header / Tabs */}
              <div className="preview-window-header">
                <div className="preview-window-dots" aria-hidden="true">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="preview-tab-pills" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activePreviewTab === 'jobs'}
                    onClick={() => setActivePreviewTab('jobs')}
                    className={`preview-tab-btn ${activePreviewTab === 'jobs' ? 'active' : ''}`}
                  >
                    <Briefcase size={14} aria-hidden="true" />
                    <span>Job Marketplace</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={activePreviewTab === 'worksim'}
                    onClick={() => setActivePreviewTab('worksim')}
                    className={`preview-tab-btn ${activePreviewTab === 'worksim' ? 'active' : ''}`}
                  >
                    <Terminal size={14} aria-hidden="true" />
                    <span>WorkSim Engine</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={activePreviewTab === 'pipeline'}
                    onClick={() => setActivePreviewTab('pipeline')}
                    className={`preview-tab-btn ${activePreviewTab === 'pipeline' ? 'active' : ''}`}
                  >
                    <Users size={14} aria-hidden="true" />
                    <span>Hiring Pipeline</span>
                  </button>
                </div>
              </div>

              {/* Window Content */}
              <div className="preview-window-body">
                {activePreviewTab === 'jobs' && (
                  <div className="preview-view-jobs">
                    <div className="preview-job-item active-item">
                      <div className="preview-job-top">
                        <div className="preview-job-company">
                          <div className="preview-company-badge">AC</div>
                          <div>
                            <div className="preview-job-title">Senior Full Stack Engineer</div>
                            <div className="preview-company-name">Apex Cloud Systems • London, UK (Hybrid)</div>
                          </div>
                        </div>
                        <span className="preview-tag-match">92% Requirement Match</span>
                      </div>
                      <p className="preview-job-desc">
                        Lead resilient cloud backend services in C#/.NET 10 with interactive React dashboards. Transparent compensation and structured recruitment.
                      </p>
                      <div className="preview-job-meta">
                        <span className="preview-pill">Full-Time</span>
                        <span className="preview-pill">$110,000 - $135,000 USD</span>
                        <span className="preview-pill">WorkSim Assigned</span>
                      </div>
                    </div>

                    <div className="preview-job-item">
                      <div className="preview-job-top">
                        <div className="preview-job-company">
                          <div className="preview-company-badge bg-emerald">NV</div>
                          <div>
                            <div className="preview-job-title">DevOps & Site Reliability Engineer</div>
                            <div className="preview-company-name">NovaSphere Technologies • Remote</div>
                          </div>
                        </div>
                        <span className="preview-tag-secondary">Verified Role</span>
                      </div>
                      <div className="preview-job-meta">
                        <span className="preview-pill">Remote</span>
                        <span className="preview-pill">$120,000 - $145,000 USD</span>
                        <span className="preview-pill">Docker & K8s</span>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'worksim' && (
                  <div className="preview-view-worksim">
                    <div className="preview-worksim-header">
                      <div className="preview-sim-badge">Scenario: Live Incident Response</div>
                      <span className="preview-sim-timer">Time Remaining: 24:18</span>
                    </div>
                    <div className="preview-sim-task">
                      <strong>Current Task:</strong> Unexpected database connection pool saturation causing 504 gateway timeouts on payment endpoints.
                    </div>
                    <div className="preview-sim-evidence">
                      <span className="evidence-chip"><FileCheck size={12} /> app_metrics.log</span>
                      <span className="evidence-chip"><FileCheck size={12} /> connection_pool.json</span>
                    </div>
                    <div className="preview-sim-action-box">
                      <div className="sim-action-label">Candidate Selected Action:</div>
                      <div className="sim-action-text">
                        "Increase pool timeout grace threshold to 15s and recycle idle worker instances."
                      </div>
                      <div className="sim-rationale-note">
                        <em>Rationale:</em> Preserves active inflight transactions while shedding orphaned connections safely.
                      </div>
                    </div>
                    <div className="preview-sim-score-bar">
                      <span>Objective Rubric Evaluation: <strong>88/100 (Proficient)</strong></span>
                      <span className="score-pill">Deterministic</span>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'pipeline' && (
                  <div className="preview-view-pipeline">
                    <div className="pipeline-preview-header">
                      <span className="pipeline-title">Active Vacancy: Senior Full Stack Engineer</span>
                      <span className="pipeline-count">14 Applicants</span>
                    </div>
                    <div className="pipeline-columns">
                      <div className="pipeline-col">
                        <div className="pipeline-col-header">Applied (5)</div>
                        <div className="pipeline-card">
                          <div className="candidate-name">David S.</div>
                          <div className="candidate-sub">CV Match: 88%</div>
                        </div>
                      </div>
                      <div className="pipeline-col">
                        <div className="pipeline-col-header">WorkSim (3)</div>
                        <div className="pipeline-card active-card">
                          <div className="candidate-name">Elena R.</div>
                          <div className="candidate-sub text-success">Score: 92/100</div>
                        </div>
                      </div>
                      <div className="pipeline-col">
                        <div className="pipeline-col-header">Interview (2)</div>
                        <div className="pipeline-card">
                          <div className="candidate-name">Marcus T.</div>
                          <div className="candidate-sub">Oct 14, 2:00 PM</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Window Footer */}
              <div className="preview-window-footer">
                <span className="footer-label">Live Platform Architecture</span>
                <span className="footer-note">Clean Architecture • ASP.NET Core • SQL Server • React</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
