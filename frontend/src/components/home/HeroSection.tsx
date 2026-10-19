import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Briefcase
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import heroWomanImg from '../../assets/hero_woman.jpg';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Jobs');

  const categories = [
    'All Jobs',
    'Technology',
    'Design',
    'Marketing',
    'Sales',
    'Finance',
    'Healthcare',
    'Education'
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.append('search', keyword.trim());
    if (location.trim()) params.append('location', location.trim());
    if (jobType) params.append('type', jobType);
    if (selectedCategory && selectedCategory !== 'All Jobs') {
      params.append('category', selectedCategory);
    }
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'All Jobs') {
      navigate('/jobs');
    } else {
      navigate(`/jobs?category=${encodeURIComponent(cat)}`);
    }
  };

  return (
    <section className="landing-hero-container" aria-labelledby="hero-heading">
      {/* 1. TOP HERO ROW (Image 1: Landing Page Hero) */}
      <div className="landing-hero-grid">
        {/* Left Column: Headline, Actions, Live Metrics */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="landing-eyebrow-badge">
            <span style={{ color: 'var(--lime)', fontSize: '16px' }}>✦</span>
            <span>WELCOME TO HIRESPHERE</span>
          </div>

          <h1 id="hero-heading" className="landing-hero-headline">
            More than just jobs.<br />
            It's your <span className="landing-highlight-text">next chapter.</span>
          </h1>

          <p className="landing-hero-desc">
            Connect with top employers, discover meaningful opportunities and build the career you deserve — all in one place.
          </p>

          <div className="landing-cta-row">
            <Link to="/jobs" className="btn-explore-jobs">
              <span>Explore Jobs</span>
              <span className="circle-arrow-icon">
                <ArrowRight size={14} />
              </span>
            </Link>

            <Link to="/for-employers" className="btn-for-employers">
              For Employers
            </Link>
          </div>

          <div className="landing-stats-row">
            <div className="landing-stat-item">
              <h3>10K+</h3>
              <p>Active Jobs</p>
            </div>
            <div className="landing-stat-item">
              <h3>5K+</h3>
              <p>Trusted Employers</p>
            </div>
            <div className="landing-stat-item">
              <h3>50K+</h3>
              <p>Talented Candidates</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Visual Hero Photo with Artistic Styling */}
        <motion.div
          className="landing-visual-wrap"
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <img 
            src={heroWomanImg} 
            alt="Young professional woman smiling with laptop" 
            className="landing-hero-photo"
          />

          {/* Floating Pill Badge */}
          <div className="floating-pill-badge">
            <span>You're closer than you think.</span>
          </div>

          {/* Handwritten Script Accent Badge */}
          <div className="artistic-script-tag">
            Better Jobs · Brighter Futures
          </div>
        </motion.div>
      </div>

      {/* 2. EXPLORE OPPORTUNITIES SECTION (Image 1: Category pills & Search bar) */}
      <motion.div 
        className="landing-explore-opportunities"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <h2 className="landing-explore-title">Explore Opportunities</h2>
        <p className="landing-explore-sub">Find the right role, in the right place, with the right people.</p>

        {/* Category Filter Pills */}
        <div className="category-filter-pills" role="tablist" aria-label="Job Categories">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat)}
              role="tab"
              aria-selected={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Unified Search Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="unified-search-bar" role="search">
          <div className="search-field-inner">
            <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <input
              type="search"
              aria-label="Job title, company or keyword"
              placeholder="Search job title, company, or keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="search-field-inner">
            <MapPin size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <input
              type="text"
              aria-label="Location"
              placeholder="Location (e.g. Remote, Lahore, London)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="search-field-inner">
            <Briefcase size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              aria-label="Job Type"
            >
              <option value="">Job Type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <button type="submit" className="btn-search-navy">
            <span>Search</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </section>
  );
};

export default HeroSection;
