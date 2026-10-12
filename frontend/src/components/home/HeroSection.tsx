import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Sparkles,
  Compass,
  Clock
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { jobsApi } from '../../services/api';
import type { PublicJobPostingSummary } from '../../types/recruitment';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [recentJobs, setRecentJobs] = useState<PublicJobPostingSummary[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        const res = await jobsApi.searchJobs({ pageSize: 3, sortBy: 'newest' });
        if (isMounted && res && res.items && res.items.length > 0) {
          setRecentJobs(res.items);
        }
      } catch {
        // Honest fallback to empty array, no fake records
      }
    };
    fetchRecent();
    return () => { isMounted = false; };
  }, []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }
    },
  };

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container">
        <motion.div 
          className="hero-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}
        >
          {/* Left Column: Messaging & Search */}
          <div>
            <motion.div variants={itemVariants}>
              <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--soft)', color: 'var(--accent)', fontWeight: 600, fontSize: '14px', marginBottom: '18px' }}>
                <CheckCircle2 size={16} />
                <span>Verified employers & skills-first hiring</span>
              </span>
            </motion.div>

            <motion.h1 id="hero-heading" variants={itemVariants}>
              Find a job you'll love, or the person your team needs.
            </motion.h1>

            <motion.p className="lead" variants={itemVariants} style={{ color: 'var(--muted)', fontSize: '18px', marginTop: '16px', marginBottom: '28px', maxWidth: '540px' }}>
              Explore genuine openings from vetted companies, prove your capabilities through interactive WorkSim challenges, and track applications with complete transparency.
            </motion.p>

            {/* Search Card */}
            <motion.form 
              onSubmit={handleSearchSubmit} 
              className="card" 
              role="search" 
              aria-label="Job search form"
              variants={itemVariants}
              style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh-lg)', marginBottom: '20px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--r-sm)' }}>
                  <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <input
                    id="hero-job-search"
                    type="search"
                    placeholder="Role title, skill, or keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    aria-label="Search job titles or keywords"
                    style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--r-sm)' }}>
                  <MapPin size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <input
                    id="hero-location-search"
                    type="text"
                    placeholder="Location or 'Remote'"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    aria-label="Filter by location"
                    style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn primary"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 22px', borderRadius: 'var(--r-sm)', background: 'var(--accent)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  <span>Find jobs</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Quick Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)', fontSize: '13px', color: 'var(--muted)' }}>
                <span style={{ fontWeight: 600 }}>Popular:</span>
                {['Remote', 'Engineering', 'Product', 'Design', 'Marketing'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickKeyword(term)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.form>

            {/* Hero CTAs */}
            <motion.div variants={itemVariants} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <Link to="/jobs" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontWeight: 600 }}>
                <Compass size={16} style={{ color: 'var(--accent)' }} />
                <span>Explore all jobs</span>
              </Link>
              <Link to="/for-employers" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontWeight: 600 }}>
                <Building2 size={16} style={{ color: 'var(--amber)' }} />
                <span>For employers</span>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Real Jobs Preview OR Neutral WorkSim Illustration */}
          <motion.div variants={itemVariants}>
            {recentJobs.length > 0 ? (
              <div className="card" style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontWeight: 700 }}>
                      Latest Published Openings
                    </span>
                    <h3 style={{ fontSize: '18px', marginTop: '2px' }}>Real Opportunities Today</h3>
                  </div>
                  <Link to="/jobs" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>All jobs</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentJobs.map((job) => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      style={{ 
                        display: 'block', 
                        padding: '14px', 
                        borderRadius: 'var(--r-sm)', 
                        border: '1px solid var(--line)', 
                        background: 'var(--bg)', 
                        transition: 'all 0.2s ease',
                        textDecoration: 'none'
                      }}
                      className="job-preview-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <b style={{ fontSize: '15px', color: 'var(--ink)' }}>{job.title}</b>
                          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={13} />
                            <span>{job.companyName}</span>
                            <span>•</span>
                            <MapPin size={13} />
                            <span>{job.location}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '100px', background: 'var(--soft)', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {job.employmentType}
                        </span>
                      </div>
                      {job.salaryCurrency && (job.salaryMin || job.salaryMax) && (
                        <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--ok)' }}>
                          {job.salaryCurrency} {job.salaryMin?.toLocaleString()} {job.salaryMax ? `– ${job.salaryMax.toLocaleString()}` : '+'}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              /* Neutral WorkSim Illustrative Card (clearly labeled as feature preview) */
              <div className="card" style={{ padding: '28px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ display: 'inline-flex', padding: '6px', borderRadius: '8px', background: 'var(--soft)', color: 'var(--accent)' }}>
                    <Sparkles size={18} />
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    WorkSim Assessment Simulation
                  </span>
                </div>

                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>
                  Evaluate Real Capability, Not Just Resumes
                </h3>
                
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                  HireSphere pairs traditional applications with interactive, time-bounded problem-solving challenges so candidates can demonstrate authentic job abilities.
                </p>

                <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-sm)', padding: '16px', border: '1px solid var(--line)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Sample Challenge Setup</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--amber-text)', background: 'var(--amber-soft)', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>
                      <Clock size={12} />
                      <span>25 mins simulation</span>
                    </span>
                  </div>

                  <b style={{ fontSize: '15px', color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                    Incident Triage & Stakeholder Response
                  </b>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                    Simulates prioritizing customer tickets and drafting structured communication during system downtime.
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['Critical Thinking', 'Prioritization', 'Client Empathy'].map((skill) => (
                      <span key={skill} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)', fontWeight: 500 }}>
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--muted)' }}>
                  <span>Objective rubrics · Blind evaluation</span>
                  <Link to="/how-it-works" style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Learn how it works</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
