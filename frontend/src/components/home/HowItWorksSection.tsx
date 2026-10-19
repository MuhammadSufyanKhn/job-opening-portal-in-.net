import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, CheckCircle2, User, Building2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { HOW_IT_WORKS_STEPS } from '../../content/homeContent';

export const HowItWorksSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [audience, setAudience] = useState<'seeker' | 'employer'>('seeker');
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  const steps = HOW_IT_WORKS_STEPS[audience];

  // Observe if section is in viewport to avoid running timers offscreen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);
    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);
    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => setIsPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Advance faster on mobile, while avoiding work when the section is not visible.
  useEffect(() => {
    if (shouldReduceMotion || isPaused || !isInViewport || !isPageVisible) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, isMobile ? 2000 : 4200);

    return () => clearInterval(interval);
  }, [shouldReduceMotion, isPaused, isInViewport, isPageVisible, isMobile, steps.length, audience]);

  const handleAudienceChange = (newAudience: 'seeker' | 'employer') => {
    setAudience(newAudience);
    setActiveStep(0);
  };

  const handlePrev = () => {
    setIsPaused(true);
    setActiveStep((prev) => (prev === 0 ? steps.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsPaused(true);
    setActiveStep((prev) => (prev + 1) % steps.length);
  };

  const handleStepClick = (index: number) => {
    setIsPaused(true);
    setActiveStep(index);
  };

  return (
    <motion.section 
      ref={sectionRef} 
      className="s" 
      id="how" 
      aria-labelledby="how-heading"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">
        <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 700 }}>
              The HireSphere Journey
            </span>
            <h2 id="how-heading" style={{ marginTop: '4px' }}>How it works</h2>
            <p className="muted">Three transparent stages whether you are seeking a career move or building a team.</p>
          </div>

          {/* Mode Selector Tabs */}
          <div 
            className="seg" 
            role="tablist" 
            aria-label="Workflow audience selector"
            style={{ display: 'inline-flex', padding: '4px', background: 'var(--surface)', borderRadius: '100px', border: '1px solid var(--line)' }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'seeker'}
              className={`chip ${audience === 'seeker' ? 'active' : ''}`}
              onClick={() => handleAudienceChange('seeker')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '100px',
                border: 'none',
                background: audience === 'seeker' ? 'var(--accent)' : 'transparent',
                color: audience === 'seeker' ? '#fff' : 'var(--muted)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <User size={15} />
              <span>Jobseekers</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'employer'}
              className={`chip ${audience === 'employer' ? 'active' : ''}`}
              onClick={() => handleAudienceChange('employer')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '100px',
                border: 'none',
                background: audience === 'employer' ? 'var(--accent)' : 'transparent',
                color: audience === 'employer' ? '#fff' : 'var(--muted)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Building2 size={15} />
              <span>Employers</span>
            </button>
          </div>
        </div>

        {/* Step Indicators Card */}
        <div 
          className="card how-it-works-card"
          style={{ 
            background: 'var(--surface)', 
            borderRadius: 'var(--r)', 
            border: '1px solid var(--line)', 
            padding: '32px',
            boxShadow: 'var(--sh)'
          }}
        >
          {/* Keep the three-step selector available on desktop only. Mobile uses the active card below. */}
          {!isMobile && (
            <div className="how-it-works-step-nav" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px', position: 'relative' }}>
              {steps.map((_step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStepClick(idx)}
                    aria-current={isActive ? 'step' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--accent)' : 'var(--line)',
                      background: isActive ? 'var(--soft)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isActive ? 'var(--accent)' : 'var(--bg)',
                        color: isActive ? '#fff' : 'var(--muted)',
                        fontWeight: 700,
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', overflow: 'hidden' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: isActive ? 'var(--accent)' : 'var(--muted)', fontWeight: 700 }}>
                        Stage {idx + 1}
                      </span>
                      <strong style={{ fontSize: '13px', color: isActive ? 'var(--ink)' : 'var(--muted-d, #4B5565)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {_step.title}
                      </strong>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Step Content Animation */}
          <div className="how-it-works-active-content" style={{ minHeight: '130px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${audience}-${activeStep}`}
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', alignItems: 'center' }}
                aria-live="polite"
                aria-atomic="true"
              >
                <div>
                  {/* Mobile-only step indicator (CSS hides this on desktop, shows on ≤768px) */}
                  <div
                    className="mobile-step-indicator"
                    style={{ display: 'none' }}
                    aria-label={`Step ${steps[activeStep].stepNumber} of ${steps.length}`}
                  >
                    <CheckCircle2 size={14} />
                    <span>STEP {steps[activeStep].stepNumber} OF {steps.length}</span>
                  </div>

                  {/* Desktop step indicator (always visible, mobile-step-indicator replaces it on mobile) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}
                    aria-hidden={isMobile}>
                    <CheckCircle2 size={16} />
                    <span>Stage {steps[activeStep].stepNumber} of 3</span>
                  </div>

                  <h3 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--ink)' }}>
                    {steps[activeStep].title}
                  </h3>
                  <p className="muted" style={{ fontSize: '16px', lineHeight: 1.6, maxWidth: '580px' }}>
                    {steps[activeStep].description}
                  </p>

                  {/* Mobile-only progress dots (CSS controls display) */}
                  <div className="mobile-step-dots" style={{ display: 'none' }} aria-hidden="true">
                    {steps.map((_, idx) => (
                      <span
                        key={idx}
                        className={`mobile-step-dot${idx === activeStep ? ' active' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px' } as any}>
                  <Link
                    to={audience === 'seeker' ? '/register-candidate' : '/register-company'}
                    className="btn primary lg"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--r-sm)', fontWeight: 600 }}
                  >
                    <span>{audience === 'seeker' ? 'Create Candidate Profile' : 'Start Employer Account'}</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/how-it-works" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'underline' }}>
                    Read full walkthrough guide
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step Controls Footer */}
          <div className="how-it-works-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous step"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '13px', cursor: 'pointer' }}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next step"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '13px', cursor: 'pointer' }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              title={isPaused ? 'Resume auto-advance' : 'Pause auto-advance'}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
              <span>{isPaused ? 'Paused' : 'Auto-advancing'}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default HowItWorksSection;
