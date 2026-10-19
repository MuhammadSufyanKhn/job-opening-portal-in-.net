import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight,
  Terminal,
  ArrowRight,
  Briefcase,
  Building2,
  TrendingUp,
  HeartHandshake
} from 'lucide-react';
import { jobsApi, candidateSavedJobsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { PublicJobPostingSummary, JobCategory } from '../types/recruitment';
import { Footer } from '../components/Footer';
import { PageTransition } from '../components/common/PageTransition';
import backpackImg from '../assets/young_man_backpack.jpg';

export const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isCandidate } = useAuth();

  const [jobs, setJobs] = useState<PublicJobPostingSummary[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('categoryId') || searchParams.get('category') || 'All'
  );
  const [workplaceType, setWorkplaceType] = useState<string>(searchParams.get('mode') || '');
  const [employmentType, setEmploymentType] = useState<string>(searchParams.get('type') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sync state when URL params change
  useEffect(() => {
    const s = searchParams.get('search') || '';
    const l = searchParams.get('location') || '';
    const c = searchParams.get('categoryId') || searchParams.get('category') || 'All';
    setSearch(s);
    setLocation(l);
    setSelectedCategory(c);
    setPage(1);
  }, [searchParams]);

  // Selected job for right-hand preview panel
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    if (isCandidate) {
      loadSavedJobIds();
    }
  }, [isCandidate]);

  useEffect(() => {
    loadJobs();
  }, [page, selectedCategory, workplaceType, employmentType]);

  const loadCategories = async () => {
    try {
      const data = await jobsApi.getCategories();
      setCategories(data);
    } catch {
      // Gracefully ignore error
    }
  };

  const loadSavedJobIds = async () => {
    try {
      const savedList = await candidateSavedJobsApi.getSavedJobs();
      setSavedJobIds(new Set(savedList.map(s => s.jobId)));
    } catch {
      // Gracefully ignore
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        pageSize: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (location.trim()) params.location = location.trim();
      
      if (selectedCategory && selectedCategory !== 'All') {
        const catNum = parseInt(selectedCategory, 10);
        const catObj = categories.find(c => (!isNaN(catNum) && c.id === catNum) || c.name.toLowerCase() === selectedCategory.toLowerCase());
        if (catObj) {
          params.categoryId = catObj.id;
        } else if (!isNaN(catNum)) {
          params.categoryId = catNum;
        } else {
          params.search = params.search ? `${params.search} ${selectedCategory}` : selectedCategory;
        }
      }

      if (workplaceType !== '') {
        const workplaceMap: Record<string, number> = { 'On-site': 0, 'Hybrid': 1, 'Remote': 2 };
        if (workplaceMap[workplaceType] !== undefined) {
          params.workplaceType = workplaceMap[workplaceType];
        }
      }

      if (employmentType !== '') {
        const empMap: Record<string, number> = { 'Full-time': 0, 'Part-time': 1, 'Contract': 2, 'Internship': 3 };
        if (empMap[employmentType] !== undefined) {
          params.employmentType = empMap[employmentType];
        }
      }

      const res = await jobsApi.searchJobs(params);
      setJobs(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);

      if (res.items && res.items.length > 0) {
        setSelectedJobId(prev => prev && res.items.some(j => j.id === prev) ? prev : res.items[0].id);
      } else {
        setSelectedJobId(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to load openings at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const handleToggleSave = async (jobId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login?redirect=/jobs');
      return;
    }

    if (!isCandidate) {
      setFeedbackMsg('Job bookmarking is available for candidate accounts.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    const isCurrentlySaved = savedJobIds.has(jobId);
    try {
      if (isCurrentlySaved) {
        await candidateSavedJobsApi.unsaveJob(jobId);
        setSavedJobIds(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setFeedbackMsg('Removed from saved jobs.');
      } else {
        await candidateSavedJobsApi.saveJob(jobId);
        setSavedJobIds(prev => new Set(prev).add(jobId));
        setFeedbackMsg('Saved to your bookmarks.');
      }
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch {
      setFeedbackMsg('Unable to update bookmark.');
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const formatEmploymentType = (type: any) => {
    const map: Record<string, string> = {
      '0': 'Full-time',
      '1': 'Part-time',
      '2': 'Contract',
      '3': 'Internship',
      'FullTime': 'Full-time',
      'PartTime': 'Part-time',
      'Contract': 'Contract',
      'Internship': 'Internship',
    };
    return map[String(type)] || 'Full-time';
  };

  const formatWorkplaceType = (type: any) => {
    const map: Record<string, string> = {
      '0': 'On-site',
      '1': 'Hybrid',
      '2': 'Remote',
      'OnSite': 'On-site',
      'Hybrid': 'Hybrid',
      'Remote': 'Remote',
    };
    return map[String(type)] || 'On-site';
  };

  const formatSalary = (min?: number | null, max?: number | null, curr = 'PKR') => {
    if (!min && !max) return 'Competitive';
    const num = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
    const displayCurr = (!curr || curr === 'USD') ? 'PKR' : curr;
    if (min && max) return `${displayCurr} ${num(min)} – ${num(max)}`;
    if (min) return `From ${displayCurr} ${num(min)}`;
    if (max) return `Up to ${displayCurr} ${num(max)}`;
    return 'Competitive';
  };

  const colorClasses = ['m1', 'm2', 'm4', 'm3', 'm5', 'm6'];

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const popularCats = ['All', 'Engineering', 'Design', 'Data', 'Marketing', 'Operations'];

  return (
    <PageTransition>
      <div>
        {/* Header Band */}
        {/* Editorial Hero Banner matching Image 2: Candidate Workspace */}
        <div className="container" style={{ paddingTop: '20px' }}>
          <div className="editorial-hero-banner">
            <div>
              <span className="landing-eyebrow-badge" style={{ color: 'var(--muted)', marginBottom: '8px' }}>
                Find your next opportunity
              </span>
              <h1 className="editorial-headline-large" style={{ margin: '4px 0 10px 0' }}>
                Your skills. Your future.
              </h1>
              <p style={{ fontSize: '15.5px', color: 'var(--muted)', maxWidth: '480px', marginBottom: '24px', lineHeight: 1.5 }}>
                Explore top companies, exciting roles and build the career you've always wanted.
              </p>

              <form onSubmit={handleSearchSubmit} className="unified-search-bar" role="search" style={{ background: '#F7F5EF', padding: '6px' }}>
                <div className="search-field-inner" style={{ height: '44px' }}>
                  <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <input
                    type="search"
                    aria-label="Job title, skill or company"
                    placeholder="Search jobs, skills, or companies..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="search-field-inner" style={{ height: '44px' }}>
                  <MapPin size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <input
                    type="text"
                    aria-label="Location"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="search-field-inner" style={{ height: '44px' }}>
                  <select
                    value={workplaceType}
                    onChange={(e) => { setWorkplaceType(e.target.value); setPage(1); }}
                    aria-label="Work style"
                  >
                    <option value="">Job Type</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <button type="submit" className="btn-search-navy" style={{ background: 'var(--lime)', color: '#101B2A', height: '44px', padding: '0 22px' }}>
                  <Search size={16} />
                  <span>Search</span>
                </button>
              </form>
            </div>

            <div className="editorial-artwork-container">
              <img 
                src={backpackImg} 
                alt="Discover career opportunities" 
                className="editorial-artwork-img"
              />
              <div className="artistic-script-tag">
                Better Opportunities Ahead
              </div>
            </div>
          </div>
        </div>

      {feedbackMsg && (
        <div className="toast" role="status">
          {feedbackMsg}
        </div>
      )}

      {/* Filters Strip */}
      <div className="container">
        <div className="filters" role="group" aria-label="Filters">
          {popularCats.map((cat) => (
            <button
              key={cat}
              type="button"
              className="chip"
              aria-pressed={selectedCategory === cat}
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
            >
              {cat}
            </button>
          ))}

          <select
            value={workplaceType}
            onChange={(e) => { setWorkplaceType(e.target.value); setPage(1); }}
            aria-label="Work style"
          >
            <option value="">Any work style</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <select
            value={employmentType}
            onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
            aria-label="Job type"
          >
            <option value="">Any job type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>

          <span className="count">{totalCount} roles</span>
        </div>

        {/* Two-Pane Board: List on Left, Detail Preview on Right */}
        <div className="board">
          {/* Left Column: Job Cards List */}
          <div>
            <div className="list">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <p className="loading-message">Loading roles...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="card panel" style={{ textAlign: 'center' }}>
                  <b>No roles match those filters.</b>
                  <p className="muted" style={{ margin: '6px 0 14px' }}>
                    {error || 'Try removing a filter or searching a broader term.'}
                  </p>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setSearch('');
                      setLocation('');
                      setSelectedCategory('All');
                      setWorkplaceType('');
                      setEmploymentType('');
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                jobs.map((job, idx) => {
                  const isSelected = job.id === selectedJobId;
                  const colorClass = colorClasses[idx % colorClasses.length];
                  const mode = formatWorkplaceType(job.workplaceType);
                  const type = formatEmploymentType(job.employmentType);
                  const pay = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
                  const hasChallenge = !!(job as any).hasWorkSimAssessment;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      className="jb"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        if (window.innerWidth <= 1000) {
                          navigate(`/jobs/${job.id}`);
                        }
                      }}
                    >
                      <span className={`mark ${colorClass}`} style={{ width: '44px', height: '44px', fontSize: '16px', borderRadius: '12px' }}>
                        {job.companyName ? job.companyName.charAt(0) : 'H'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--navy)' }}>{job.title}</h3>
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(job.id, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: savedJobIds.has(job.id) ? 'var(--navy)' : 'var(--muted)' }}
                            title={savedJobIds.has(job.id) ? 'Remove bookmark' : 'Bookmark job'}
                          >
                            <Bookmark size={18} fill={savedJobIds.has(job.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <div className="co" style={{ marginTop: '3px', fontSize: '13.5px', color: 'var(--muted)' }}>
                          {job.companyName} · {job.location || 'Remote'}
                        </div>
                        <div className="tags" style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <span className="tag" style={{ borderRadius: '6px', fontSize: '12px' }}>{mode}</span>
                          <span className="tag o" style={{ borderRadius: '6px', fontSize: '12px' }}>{type}</span>
                          <span className="tag o" style={{ borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}>{pay}</span>
                          {hasChallenge && (
                            <span className="badge b-pur nodot" style={{ borderRadius: '6px', fontSize: '11px' }}>Skills challenge</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
                        <span className="when" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {job.publishedAtUtc ? new Date(job.publishedAtUtc).toLocaleDateString() : 'Recent'}
                        </span>
                        <Link
                          to={`/jobs/${job.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn btn-lime sm"
                          style={{ fontWeight: 800, padding: '6px 14px', borderRadius: '999px', fontSize: '12.5px', textDecoration: 'none' }}
                        >
                          Apply Now
                        </Link>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pgbar">
                <span>Showing page {page} of {totalPages} ({totalCount} total)</span>
                <div className="pager">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={page === pageNum ? 'on' : ''}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Detail Panel */}
          {selectedJob && jobs.length > 0 && (
            <article className="card detail" aria-live="polite">
              <div className="row" style={{ flexWrap: 'nowrap', gap: '14px' }}>
                <span className="mark m1" style={{ width: '52px', height: '52px', fontSize: '18px' }}>
                  {selectedJob.companyName ? selectedJob.companyName.charAt(0) : 'H'}
                </span>
                <div>
                  <h2>{selectedJob.title}</h2>
                  <div className="muted">
                    {selectedJob.companyName} · {selectedJob.location || 'Remote'} · posted {selectedJob.publishedAtUtc ? new Date(selectedJob.publishedAtUtc).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              </div>

              <dl className="facts">
                <div>
                  <dt>Salary</dt>
                  <dd>{formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}</dd>
                </div>
                <div>
                  <dt>Work style</dt>
                  <dd>{formatWorkplaceType(selectedJob.workplaceType)}</dd>
                </div>
                <div>
                  <dt>Job type</dt>
                  <dd>{formatEmploymentType(selectedJob.employmentType)}</dd>
                </div>
              </dl>

              {(selectedJob as any).hasWorkSimAssessment && (
                <div className="box" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={16} className="text-primary" />
                  <span>This role includes a <b>skills challenge</b> after review.</span>
                </div>
              )}

              <h4>About the role</h4>
              <p className="desc">
                {selectedJob.summary || 'Join our team to make a meaningful impact. Explore the full requirements and submit your application.'}
              </p>

              {selectedJob.topSkills && selectedJob.topSkills.length > 0 && (
                <>
                  <h4>Key skills</h4>
                  <div className="tags" style={{ margin: '8px 0 16px' }}>
                    {selectedJob.topSkills.map((sk, i) => (
                      <span key={i} className="tag">{sk}</span>
                    ))}
                  </div>
                </>
              )}

              <div className="box" style={{ marginTop: '20px', background: '#F5F8FF', borderColor: '#C9D8FF' }}>
                <b>See how well you fit</b>
                <div className="muted" style={{ fontSize: '14px', marginTop: '4px' }}>
                  View full requirements, verify your skills match, and submit your private CV.
                </div>
              </div>

              <div className="row" style={{ marginTop: '22px' }}>
                <Link to={`/jobs/${selectedJob.id}`} className="btn primary">
                  <span>View full job details</span>
                  <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  className="btn"
                  onClick={(e) => handleToggleSave(selectedJob.id, e)}
                >
                  <Bookmark size={16} fill={savedJobIds.has(selectedJob.id) ? 'currentColor' : 'none'} />
                  <span>{savedJobIds.has(selectedJob.id) ? 'Saved' : 'Save job'}</span>
                </button>
              </div>
            </article>
          )}
        </div>

        {/* Why Join HireSphere & Testimonial Section (Image 2 & Image 1) */}
        <div style={{ marginTop: '48px', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
            {/* Why Join HireSphere */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(16, 27, 42, 0.08)', borderRadius: '24px', padding: '28px 32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '18px' }}>
                Why join HireSphere?
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF3FF', color: '#4263EB', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--navy)', display: 'block' }}>Top Companies</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Verified employers only</small>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EAF5E8', color: '#0F7A55', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--navy)', display: 'block' }}>Career Growth</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>High impact roles</small>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFEFCF', color: '#8A5300', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--navy)', display: 'block' }}>Flexible Work</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Remote & hybrid choices</small>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ECE8FF', color: '#5B3FD0', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <HeartHandshake size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--navy)', display: 'block' }}>Supportive Community</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Real human feedback</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial & Get Noticed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(16, 27, 42, 0.08)', borderRadius: '24px', padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                <p style={{ fontStyle: 'italic', fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '14px' }}>
                  "I found my dream job through HireSphere. The process was smooth, transparent, and the team was incredibly helpful!"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--lime)', color: '#101B2A', fontWeight: 800, fontSize: '13px', display: 'grid', placeItems: 'center' }}>
                    AK
                  </div>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--navy)', display: 'block' }}>Ayesha Khan</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Frontend Developer</small>
                  </div>
                </div>
              </div>

              {isCandidate && (
                <div style={{ background: '#F7F5EF', border: '1px solid rgba(16, 27, 42, 0.08)', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--navy)', display: 'block' }}>Get noticed</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Complete your profile and increase your interview chances.</small>
                  </div>
                  <Link to="/candidate/profile" className="btn btn-lime sm" style={{ fontWeight: 800, padding: '6px 14px', borderRadius: '999px', fontSize: '12px', textDecoration: 'none' }}>
                    Profile: 70%
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  </PageTransition>
  );
};

export default Jobs;
