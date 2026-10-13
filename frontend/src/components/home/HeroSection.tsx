import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Zap,
  Clock,
  Bookmark
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { jobsApi } from '../../services/api';
import type { PublicJobPostingSummary } from '../../types/recruitment';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
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
        // Fallback to sample preview figures if network error
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
    navigate(`/jobs?search=${encodeURIComponent(term)}`);
  };

  const toggleSave = (idx: number) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
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
      transition: { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] as const }
    },
  };

  // 3 reference preview cards from Pic 1, with live data enhancement if available
  const previewCards = [
    {
      mark: 'm4',
      letter: recentJobs[0]?.companyName ? recentJobs[0].companyName[0].toUpperCase() : 'N',
      title: recentJobs[0]?.title || 'Product Designer',
      company: recentJobs[0]?.companyName || 'Northwind',
      city: recentJobs[0]?.location || 'Karachi',
      type: recentJobs[0]?.employmentType || 'Full-time',
      pay: recentJobs[0]?.salaryMin && recentJobs[0]?.salaryMax 
        ? `PKR ${Math.round(recentJobs[0].salaryMin / 1000)}k – ${Math.round(recentJobs[0].salaryMax / 1000)}k`
        : 'PKR 180k – 240k',
      match: '92% match',
      id: recentJobs[0]?.id
    },
    {
      mark: 'm1',
      letter: recentJobs[1]?.companyName ? recentJobs[1].companyName[0].toUpperCase() : 'A',
      title: recentJobs[1]?.title || 'Senior Full Stack Developer',
      company: recentJobs[1]?.companyName || 'Apex Cloud Systems',
      city: recentJobs[1]?.location || 'London',
      type: recentJobs[1]?.employmentType || 'Full-time',
      pay: recentJobs[1]?.salaryMin && recentJobs[1]?.salaryMax 
        ? `PKR ${Math.round(recentJobs[1].salaryMin / 1000)}k – ${Math.round(recentJobs[1].salaryMax / 1000)}k`
        : 'PKR 350k – 450k',
      match: null,
      id: recentJobs[1]?.id
    },
    {
      mark: 'm2',
      letter: recentJobs[2]?.companyName ? recentJobs[2].companyName[0].toUpperCase() : 'K',
      title: recentJobs[2]?.title || 'Marketing Executive',
      company: recentJobs[2]?.companyName || 'Kite Commerce',
      city: recentJobs[2]?.location || 'Lahore',
      type: recentJobs[2]?.employmentType || 'Part-time',
      pay: recentJobs[2]?.salaryMin && recentJobs[2]?.salaryMax 
        ? `PKR ${Math.round(recentJobs[2].salaryMin / 1000)}k – ${Math.round(recentJobs[2].salaryMax / 1000)}k`
        : 'PKR 60k – 90k',
      match: null,
      id: recentJobs[2]?.id
    }
  ];

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container">
        {/* Left Column */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <span className="eyebrow">
              <CheckCircle2 size={16} />
              <span>Free for jobseekers and companies</span>
            </span>
          </motion.div>

          <motion.h1 id="hero-heading" variants={itemVariants}>
            Find a job you'll love, or the person your team needs.
          </motion.h1>

          <motion.p className="lead" variants={itemVariants}>
            Browse over 1,200 open jobs from verified companies. Apply in minutes and always know where you stand.
          </motion.p>

          {/* Search Box */}
          <motion.form 
            onSubmit={handleSearchSubmit} 
            className="search" 
            role="search" 
            aria-label="Job search form"
            variants={itemVariants}
          >
            <div className="f">
              <span className="ic"><Search size={18} /></span>
              <input
                id="hero-job-search"
                type="search"
                aria-label="Job title or keyword"
                placeholder="Job title or keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="sep" />
            <div className="f">
              <span className="ic"><MapPin size={18} /></span>
              <input
                id="hero-location-search"
                type="search"
                aria-label="City or Remote"
                placeholder="City or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button type="submit" className="btn primary">
              <span>Search jobs</span>
              <ArrowRight size={16} />
            </button>
          </motion.form>

          {/* Popular Chips */}
          <motion.div className="pop" variants={itemVariants}>
            <span>Popular:</span>
            {['Remote', 'Customer support', 'Developer', 'Designer', 'Accountant', 'Internship'].map((term) => (
              <button
                key={term}
                type="button"
                className="chip"
                onClick={() => handleQuickKeyword(term)}
              >
                {term}
              </button>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div className="row" variants={itemVariants} style={{ marginTop: '20px' }}>
            <Link to="/jobs" className="btn primary lg">
              <span>Find a job</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/register-company" className="btn lg">
              <Building2 size={18} />
              <span>I'm hiring</span>
            </Link>
          </motion.div>

          {/* Reassurance Features */}
          <motion.div className="reassure" variants={itemVariants}>
            <span>
              <CheckCircle2 size={18} className="ic" />
              <span>Verified companies</span>
            </span>
            <span>
              <CheckCircle2 size={18} className="ic" />
              <span>Private CVs</span>
            </span>
            <span>
              <CheckCircle2 size={18} className="ic" />
              <span>Real people decide</span>
            </span>
          </motion.div>
        </motion.div>

        {/* Right Column: Pic 1 Exact Visual Boxes & Floating Pills with Slow Animation */}
        <motion.div
          className="vis"
          aria-label="Job openings preview cards"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {/* Top Floating Pill */}
          <div className="float f1">
            <Zap size={16} className="ic" />
            <span>240 new jobs this week</span>
          </div>

          {/* 3 Job Cards (Pic 1 Structure) */}
          {previewCards.map((card, idx) => (
            <motion.div
              key={idx}
              className="card jc"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.12, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className="jc-top">
                <span className={`mark ${card.mark}`}>{card.letter}</span>
                <div>
                  {card.id ? (
                    <Link to={`/jobs/${card.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <b>{card.title}</b>
                    </Link>
                  ) : (
                    <b>{card.title}</b>
                  )}
                  <small>{card.company} · {card.city}</small>
                </div>
                <button
                  type="button"
                  className="save"
                  onClick={() => toggleSave(idx)}
                  aria-label={`Save ${card.title}`}
                  title="Bookmark job"
                >
                  <Bookmark 
                    size={18} 
                    fill={savedJobs.has(idx) ? 'var(--accent)' : 'none'}
                    color={savedJobs.has(idx) ? 'var(--accent)' : 'var(--muted)'}
                  />
                </button>
              </div>

              <div className="tags">
                <span className="tag o">{card.type}</span>
                <span className="tag">{card.pay}</span>
                {card.match && (
                  <span className="badge b-ok">{card.match}</span>
                )}
              </div>
            </motion.div>
          ))}

          {/* Bottom Floating Pill */}
          <div className="float f2">
            <Clock size={16} className="ic" />
            <span>Most companies reply within 48 hours</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
