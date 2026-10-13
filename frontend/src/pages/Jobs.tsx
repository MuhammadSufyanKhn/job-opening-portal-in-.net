import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { jobsApi, candidateSavedJobsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { PublicJobPostingSummary, JobCategory } from '../types/recruitment';
import { Footer } from '../components/Footer';
import { PageTransition } from '../components/common/PageTransition';

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
        <div className="jhead">
        <div className="container">
          <h1>Find your next role</h1>
          <p className="muted">
            {totalCount > 0 ? `${totalCount} open roles from verified companies.` : 'Browse verified roles from checked companies.'}
          </p>

          <form onSubmit={handleSearchSubmit} className="search" role="search">
            <div className="f">
              <span className="ic"><Search size={18} /></span>
              <input
                type="search"
                aria-label="Job title, skill or company"
                placeholder="Job title, skill or company"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="sep" aria-hidden="true" />
            <div className="f">
              <span className="ic"><MapPin size={18} /></span>
              <input
                type="search"
                aria-label="Location"
                placeholder="City or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button type="submit" className="btn primary">
              <span>Search</span>
              <Search size={16} />
            </button>
          </form>
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
                      <span className={`mark ${colorClass}`}>
                        {job.companyName ? job.companyName.charAt(0) : 'H'}
                      </span>
                      <div>
                        <h3>{job.title}</h3>
                        <div className="co">
                          {job.companyName} · {job.location || 'Remote'}
                        </div>
                        <div className="tags" style={{ marginTop: '10px' }}>
                          <span className="tag">{mode}</span>
                          <span className="tag o">{type}</span>
                          <span className="tag o">{pay}</span>
                          {hasChallenge && (
                            <span className="badge b-pur nodot">Skills challenge</span>
                          )}
                        </div>
                      </div>
                      <span className="when">
                        {job.publishedAtUtc ? new Date(job.publishedAtUtc).toLocaleDateString() : 'Recent'}
                      </span>
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
      </div>

      <Footer />
    </div>
  </PageTransition>
  );
};

export default Jobs;
