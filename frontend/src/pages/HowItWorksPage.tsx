import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Building2, 
  ArrowRight, 
  FileText, 
  Search, 
  Sparkles, 
  Calendar, 
  Award,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { PageTransition } from '../components/common/PageTransition';

export const HowItWorksPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'candidate' | 'employer'>('candidate');

  const candidateMilestones = [
    {
      icon: User,
      title: '1. Create Your Profile & Upload Resume',
      detail: 'Register with your name, contact details, and career objectives. Upload your CV in PDF, DOCX, or TXT format. Our parser extracts your core competencies and experience so you do not have to retype them.',
    },
    {
      icon: Search,
      title: '2. Discover Verified Opportunities & Assess Fit',
      detail: 'Search published openings filtered by role title, workplace mode (Remote, Hybrid, On-site), category, and salary. View objective skill alignment indicators comparing your profile with job requirements.',
    },
    {
      icon: Sparkles,
      title: '3. Complete WorkSim Skills Challenges',
      detail: 'When applying to roles with practical evaluations, you are invited to a timed, interactive simulation in our workspace. Solve realistic scenarios that prove your hands-on ability beyond resume text.',
    },
    {
      icon: Calendar,
      title: '4. Track Application Milestones & Interview',
      detail: 'Monitor status in real time across Reviewing, Shortlisted, Assessment, Interview, and Offer stages. Receive instant notifications when hiring teams schedule interviews or share updates.',
    },
  ];

  const employerMilestones = [
    {
      icon: ShieldCheck,
      title: '1. Organization Onboarding & Platform Verification',
      detail: 'Submit company profile information including business registration and official contact channels. HireSphere administrators audit and verify your organization before any vacancies can go live.',
    },
    {
      icon: FileText,
      title: '2. Define Structured Job Postings',
      detail: 'Publish vacancies with categorized requirements (Skills, Experience, Education) designated as mandatory or preferred. Attach relevant WorkSim simulation scenarios from our scenario library.',
    },
    {
      icon: Layers,
      title: '3. Review Applicants with Evidence-Based Scoring',
      detail: 'Sort incoming candidates by objective skill-match percentages and WorkSim performance scores. Read parsed resume summaries and collaborate with team members using private evaluation notes.',
    },
    {
      icon: Award,
      title: '4. Coordinate Interviews & Extend Offers',
      detail: 'Schedule interviews directly through the platform, manage candidates across custom Kanban pipeline stages, and export compliant CSV hiring metrics for company leadership.',
    },
  ];

  const milestones = activeTab === 'candidate' ? candidateMilestones : employerMilestones;

  return (
    <PageTransition>
      <div className="portal-container" style={{ padding: '48px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
            Transparent Recruitment Process
          </span>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: '16px', letterSpacing: '-0.035em' }}>
            How HireSphere works from start to finish
          </h1>
          <p className="muted" style={{ fontSize: '17px', lineHeight: 1.6 }}>
            Understand the step-by-step lifecycle for jobseekers and hiring organizations on our platform.
          </p>

          {/* Toggle */}
          <div style={{ display: 'inline-flex', padding: '4px', background: 'var(--surface)', borderRadius: '100px', border: '1px solid var(--line)', marginTop: '28px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('candidate')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '100px',
                border: 'none',
                background: activeTab === 'candidate' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'candidate' ? '#fff' : 'var(--muted)',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <User size={16} />
              <span>Jobseeker Journey</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('employer')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '100px',
                border: 'none',
                background: activeTab === 'employer' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'employer' ? '#fff' : 'var(--muted)',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Building2 size={16} />
              <span>Employer Journey</span>
            </button>
          </div>
        </div>

        {/* Milestone Cards */}
        <div style={{ maxWidth: '860px', margin: '0 auto 64px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              {milestones.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      padding: '32px',
                      background: 'var(--surface)',
                      borderRadius: 'var(--r)',
                      border: '1px solid var(--line)',
                      boxShadow: 'var(--sh)',
                      display: 'flex',
                      gap: '24px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'var(--soft)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '20px', color: 'var(--ink)', marginBottom: '8px' }}>
                        {item.title}
                      </h3>
                      <p className="muted" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Callout */}
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', maxWidth: '860px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>
            {activeTab === 'candidate' ? 'Ready to find your next opportunity?' : 'Ready to start hiring verified talent?'}
          </h3>
          <p className="muted" style={{ fontSize: '15px', marginBottom: '24px' }}>
            {activeTab === 'candidate' 
              ? 'Join thousands of professionals finding roles based on verifiable skill performance.'
              : 'Set up your employer profile in minutes and post your first role with customized requirements.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            <Link
              to={activeTab === 'candidate' ? '/register-candidate' : '/register-company'}
              className="btn primary lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--r-sm)', fontWeight: 600 }}
            >
              <span>{activeTab === 'candidate' ? 'Sign up as a jobseeker' : 'Register your company'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default HowItWorksPage;
