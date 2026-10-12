import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Bookmark,
  Zap,
  Clock
} from 'lucide-react';
import { jobsApi } from '../../services/api';
import type { PublicJobPostingSummary } from '../../types/recruitment';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [recentJobs, setRecentJobs] = useState<PublicJobPostingSummary[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await jobsApi.searchJobs({ pageSize: 3 });
        if (res && res.items && res.items.length > 0) {
          setRecentJobs(res.items);
        }
      } catch {
        // Fall back gracefully to static samples
      }
    };
    fetchRecent();
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

  const sampleJobs = [
    {
      id: 'sample-1',
      title: 'Customer Support Lead',
      company: 'Harbor Logistics',
      location: 'Remote',
      type: 'Full-time',
      salary: '$30k – $40k',
      colorClass: 'm3',
      match: '92% match',
    },
    {
      id: 'sample-2',
      title: 'Product Designer',
      company: 'Northwind',
      location: 'Karachi',
      type: 'Full-time',
      salary: '$60k – $80k',
      colorClass: 'm4',
      match: undefined,
    },
    {
      id: 'sample-3',
      title: 'Senior Full Stack Developer',
      company: 'Apex Cloud Systems',
      location: 'London',
      type: 'Full-time',
      salary: '$110k – $135k',
      colorClass: 'm1',
      match: undefined,
    },
  ];

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container">
        {/* Left Column: Messaging & Search */}
        <div>
          <span className="eyebrow">
            <span className="ic"><CheckCircle2 size={16} /></span>
            <span>Free for jobseekers and companies</span>
          </span>

          <h1 id="hero-heading">
            Find a job you'll love, or the person your team needs.
          </h1>

          <p className="lead">
            Browse over 1,200 open jobs from verified companies. Apply in minutes and always know where you stand.
          </p>

          {/* Search Card */}
          <form onSubmit={handleSearchSubmit} className="search" role="search">
            <div className="f">
              <span className="ic"><Search size={18} /></span>
              <input
                type="search"
                aria-label="Job title or keyword"
                placeholder="Job title or keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="sep" aria-hidden="true" />
            <div className="f">
              <span className="ic"><MapPin size={18} /></span>
              <input
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
          </form>

          {/* Popular search chips */}
          <div className="pop">
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
          </div>

          {/* Action buttons */}
          <div className="row">
            <Link to="/jobs" className="btn primary lg">
              <span>Find a job</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/register-company" className="btn lg">
              <Building2 size={18} />
              <span>I'm hiring</span>
            </Link>
          </div>

          {/* Reassurance items */}
          <div className="reassure">
            <span>
              <span className="ic"><CheckCircle2 size={18} /></span>
              Verified companies
            </span>
            <span>
              <span className="ic"><CheckCircle2 size={18} /></span>
              Private CVs
            </span>
            <span>
              <span className="ic"><CheckCircle2 size={18} /></span>
              Real people decide
            </span>
          </div>
        </div>

        {/* Right Column: Visual Stack of Cards */}
        <div className="vis" aria-hidden="true">
          <div className="float f1">
            <span className="ic"><Zap size={18} /></span>
            <span>240 new jobs this week</span>
          </div>
          <div className="float f2">
            <span className="ic"><Clock size={18} /></span>
            <span>Most companies reply within 48 hours</span>
          </div>

          {(recentJobs.length > 0 ? recentJobs.slice(0, 3) : sampleJobs).map((job, idx) => {
            const isReal = 'title' in job && 'companyName' in job;
            const title = isReal ? (job as PublicJobPostingSummary).title : (job as typeof sampleJobs[0]).title;
            const company = isReal ? (job as PublicJobPostingSummary).companyName : (job as typeof sampleJobs[0]).company;
            const loc = isReal ? (job as PublicJobPostingSummary).location || 'Remote' : (job as typeof sampleJobs[0]).location;
            const type = isReal ? (job as PublicJobPostingSummary).employmentType || 'Full-time' : (job as typeof sampleJobs[0]).type;
            const salary = isReal
              ? (job as PublicJobPostingSummary).salaryMin && (job as PublicJobPostingSummary).salaryMax
                ? `$${Math.round((job as PublicJobPostingSummary).salaryMin! / 1000)}k – $${Math.round((job as PublicJobPostingSummary).salaryMax! / 1000)}k`
                : 'Competitive'
              : (job as typeof sampleJobs[0]).salary;
            const colorClass = ['m4', 'm1', 'm2'][idx % 3];

            return (
              <div key={job.id || idx} className="card jc">
                <div className="jc-top">
                  <span className={`mark ${colorClass}`}>
                    {company.charAt(0)}
                  </span>
                  <div>
                    <b>{title}</b>
                    <small>{company} · {loc}</small>
                  </div>
                  <span className="save">
                    <Bookmark size={18} />
                  </span>
                </div>
                <div className="tags">
                  <span className="tag o">{type}</span>
                  <span className="tag">{salary}</span>
                  {idx === 0 && <span className="badge b-ok">92% match</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
