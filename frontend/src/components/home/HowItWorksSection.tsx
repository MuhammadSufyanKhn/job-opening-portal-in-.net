import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  FileUp, 
  Terminal, 
  CheckCircle, 
  Building2, 
  FileSearch, 
  BarChart3, 
  UserCheck, 
  ArrowRight
} from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const [activeAudience, setActiveAudience] = useState<'candidate' | 'employer'>('candidate');

  const candidateSteps = [
    {
      step: '01',
      title: 'Discover Verified Roles',
      description: 'Search transparent job listings featuring explicit technical requirements, authentic salary ranges, and verified employer profiles.',
      icon: Compass,
      highlight: 'No ghost postings or scraped vacancies'
    },
    {
      step: '02',
      title: 'Apply with Structured Evidence',
      description: 'Submit your resume from your private CV vault. HireSphere matches your declared qualifications against requirements transparently.',
      icon: FileUp,
      highlight: 'Explainable qualification matching'
    },
    {
      step: '03',
      title: 'Prove Skill in WorkSim',
      description: 'When assigned, complete realistic, asynchronous job simulations. Make contextual operational decisions and provide your rationale.',
      icon: Terminal,
      highlight: 'Practical problem solving, not trivia'
    },
    {
      step: '04',
      title: 'Track Transparent Progress',
      description: 'Follow every stage from review to interview scheduling in your personal candidate portal. Receive auditable status updates.',
      icon: CheckCircle,
      highlight: 'Zero opaque silent rejections'
    }
  ];

  const employerSteps = [
    {
      step: '01',
      title: 'Publish Role & Specifications',
      description: 'Define clear mandatory and preferred qualifications. Set up role versions and specify whether a practical WorkSim simulation is required.',
      icon: Building2,
      highlight: 'Structured job criteria'
    },
    {
      step: '02',
      title: 'Review Evidence-Based Matches',
      description: 'Inspect applicants alongside explainable CV match indices and excerpted evidence. Understand immediately why a candidate aligns with the role.',
      icon: FileSearch,
      highlight: 'Objective evidence index'
    },
    {
      step: '03',
      title: 'Evaluate Real WorkSim Performance',
      description: 'Review candidates’ situational decision-making, unlocked evidence triage, and objective rubric scores in simulated workplace scenarios.',
      icon: BarChart3,
      highlight: 'Deterministic rubric evaluation'
    },
    {
      step: '04',
      title: 'Coordinate Interviews & Hire',
      description: 'Collaborate with hiring teammates using private recruiter notes, schedule interviews with calendar links, and advance candidates through the Kanban pipeline.',
      icon: UserCheck,
      highlight: 'Complete recruitment workspace'
    }
  ];

  const currentSteps = activeAudience === 'candidate' ? candidateSteps : employerSteps;

  return (
    <section className="home-section" id="how-it-works" aria-labelledby="how-it-works-heading">
      <div className="home-container">
        <div className="section-header-center">
          <div className="section-eyebrow">
            <span>Structured Process</span>
          </div>
          <h2 id="how-it-works-heading" className="section-title">
            How HireSphere Modernizes Recruitment
          </h2>
          <p className="section-subtitle">
            A transparent, auditable process designed to respect candidates' time and give hiring teams reliable evidence.
          </p>

          {/* Audience Switcher Tabs */}
          <div className="how-it-works-switcher" role="tablist" aria-label="Target audience">
            <button
              role="tab"
              aria-selected={activeAudience === 'candidate'}
              onClick={() => setActiveAudience('candidate')}
              className={`switcher-pill ${activeAudience === 'candidate' ? 'active' : ''}`}
            >
              For Candidates & Jobseekers
            </button>
            <button
              role="tab"
              aria-selected={activeAudience === 'employer'}
              onClick={() => setActiveAudience('employer')}
              className={`switcher-pill ${activeAudience === 'employer' ? 'active' : ''}`}
            >
              For Employers & Hiring Teams
            </button>
          </div>
        </div>

        {/* Step Cards Grid */}
        <div className="steps-grid">
          {currentSteps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="step-card">
                <div className="step-card-top">
                  <span className="step-number">{s.step}</span>
                  <div className="step-icon-wrap">
                    <Icon size={20} className="text-primary" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.description}</p>
                <div className="step-badge">
                  <CheckCircle size={12} className="text-success" aria-hidden="true" />
                  <span>{s.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Banner below steps */}
        <div className="steps-cta-bar">
          <span className="cta-bar-text">
            {activeAudience === 'candidate'
              ? 'Ready to build your verified candidate profile and apply to open roles?'
              : 'Ready to build an evidence-driven hiring pipeline for your organization?'}
          </span>
          {activeAudience === 'candidate' ? (
            <Link to="/register-candidate" className="btn btn-primary btn-sm">
              <span>Create Candidate Profile</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link to="/register-company" className="btn btn-primary btn-sm">
              <span>Register Organization</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
