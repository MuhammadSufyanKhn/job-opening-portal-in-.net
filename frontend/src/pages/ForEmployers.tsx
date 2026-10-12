import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Sparkles 
} from 'lucide-react';
import { PageTransition } from '../components/common/PageTransition';
import { useAuth } from '../context/AuthContext';

export const ForEmployers: React.FC = () => {
  const { isAuthenticated, isCompanyMember } = useAuth();

  const workflowSteps = [
    {
      num: '01',
      title: 'Company Registration & Verification',
      description: 'Register your organization with business verification credentials. Platform administrators review each application to establish verified credibility.',
    },
    {
      num: '02',
      title: 'Structured Vacancy Publishing',
      description: 'Draft listings with comprehensive role requirements, categorized skills, location workplace modes, and optional WorkSim assessment challenges.',
    },
    {
      num: '03',
      title: 'Evidence-Based Applicant Review',
      description: 'Review applicants through an automated skill-match index comparing profile capabilities against mandatory and preferred qualifications.',
    },
    {
      num: '04',
      title: 'WorkSim Candidate Assessments',
      description: 'Evaluate candidates with interactive, timed role simulation scenarios covering technical troubleshooting, customer resolution, and critical reasoning.',
    },
    {
      num: '05',
      title: 'Collaborative Pipeline Management',
      description: 'Progress candidates across stages (Reviewing, Shortlisted, Assessment, Interview, Offer) with private team evaluation notes and interview scheduling.',
    },
  ];

  return (
    <PageTransition>
      <div className="portal-container" style={{ padding: '48px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--amber-soft)', color: 'var(--amber-text)', fontWeight: 600, fontSize: '13px', marginBottom: '18px' }}>
            <Building2 size={15} />
            <span>Modern Recruitment SaaS</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 4.2vw, 52px)', marginBottom: '18px', letterSpacing: '-0.035em' }}>
            Attract top talent with verified credibility and practical skill trials
          </h1>

          <p className="muted" style={{ fontSize: '18px', lineHeight: 1.6, marginBottom: '32px' }}>
            HireSphere provides hiring teams with end-to-end recruitment pipelines, verifiable candidate skills challenges, and structured candidate evaluation tools.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '14px' }}>
            {isAuthenticated && isCompanyMember ? (
              <Link 
                to="/company/jobs/new" 
                className="btn primary lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--r-sm)', fontWeight: 600 }}
              >
                <span>Create a new job posting</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link 
                  to="/register-company" 
                  className="btn primary lg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--r-sm)', fontWeight: 600 }}
                >
                  <span>Register your company</span>
                  <ArrowRight size={18} />
                </Link>
                <Link 
                  to="/login" 
                  className="btn lg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--line)', fontWeight: 600 }}
                >
                  <span>Employer sign in</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '64px' }}>
          <div className="card" style={{ padding: '32px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '19px', marginBottom: '8px' }}>Verified Company Credibility</h3>
            <p className="muted" style={{ fontSize: '15px', lineHeight: 1.6 }}>
              Jobseekers trust HireSphere because every hiring organization is audited by platform administrators. Display your verified status to attract qualified talent.
            </p>
          </div>

          <div className="card" style={{ padding: '32px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '19px', marginBottom: '8px' }}>WorkSim Practical Evaluations</h3>
            <p className="muted" style={{ fontSize: '15px', lineHeight: 1.6 }}>
              Attach realistic job simulation scenarios directly to your vacancies. Candidates solve actual role tasks, providing objective proof of practical competency.
            </p>
          </div>

          <div className="card" style={{ padding: '32px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '19px', marginBottom: '8px' }}>Team Hiring Collaboration</h3>
            <p className="muted" style={{ fontSize: '15px', lineHeight: 1.6 }}>
              Invite hiring managers and recruiters to your workspace. Leave internal candidate notes, rate applications, and coordinate interview schedules seamlessly.
            </p>
          </div>
        </div>

        {/* Recruitment Workflow Walkthrough */}
        <div className="card" style={{ padding: '40px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', marginBottom: '64px', boxShadow: 'var(--sh)' }}>
          <div style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 700 }}>
              Recruitment Lifecycle
            </span>
            <h2 style={{ fontSize: '26px', marginTop: '4px' }}>How your team hires on HireSphere</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {workflowSteps.map((step) => (
              <div key={step.num} style={{ padding: '20px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                  {step.num}
                </span>
                <b style={{ fontSize: '16px', color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
                  {step.title}
                </b>
                <p className="muted" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Banner */}
        <div style={{ textAlign: 'center', padding: '48px', borderRadius: 'var(--r)', background: 'var(--navy)', color: '#fff' }}>
          <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '12px' }}>
            Ready to streamline your recruitment pipeline?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', maxWidth: '540px', margin: '0 auto 28px' }}>
            Join forward-thinking companies using verified profiles and skills simulations to make confident hires.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            <Link 
              to="/register-company" 
              className="btn white lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--r-sm)', background: '#fff', color: 'var(--ink)', fontWeight: 600 }}
            >
              <span>Get started today</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ForEmployers;
