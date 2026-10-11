import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  ArrowRight,
  Building2,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import { jobsApi, candidateSavedJobsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { PublicJobPostingSummary, JobCategory } from '../types/recruitment';

export const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCandidate } = useAuth();

  const [jobs, setJobs] = useState<PublicJobPostingSummary[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [workplaceType, setWorkplaceType] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<string>('');
  const [viewSavedOnly, setViewSavedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadCategories();
    if (isCandidate) {
      loadSavedJobIds();
    }
  }, [isCandidate]);

  useEffect(() => {
    loadJobs();
  }, [page, categoryId, workplaceType, employmentType]);

  const loadCategories = async () => {
    try {
      const data = await jobsApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadSavedJobIds = async () => {
    try {
      const savedList = await candidateSavedJobsApi.getSavedJobs();
      setSavedJobIds(new Set(savedList.map(s => s.jobId)));
    } catch {
      // Gracefully ignore if not candidate or table empty
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        pageSize: 9,
      };
      if (search.trim()) params.search = search.trim();
      if (location.trim()) params.location = location.trim();
      if (categoryId) params.categoryId = parseInt(categoryId, 10);
      if (workplaceType !== '') params.workplaceType = parseInt(workplaceType, 10);
      if (employmentType !== '') params.employmentType = parseInt(employmentType, 10);

      const res = await jobsApi.searchJobs(params);
      setJobs(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load vacancies from server.');
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

    setSavingJobId(jobId);
    const isCurrentlySaved = savedJobIds.has(jobId);

    try {
      if (isCurrentlySaved) {
        await candidateSavedJobsApi.unsaveJob(jobId);
        setSavedJobIds(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setFeedbackMsg('Job removed from your saved bookmarks.');
      } else {
        await candidateSavedJobsApi.saveJob(jobId);
        setSavedJobIds(prev => new Set(prev).add(jobId));
        setFeedbackMsg('Job saved to your bookmarks.');
      }
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg('Unable to update bookmark status.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } finally {
      setSavingJobId(null);
    }
  };

  const getWorkplaceBadge = (type: any) => {
    const map: Record<string, { label: string; color: string }> = {
      '0': { label: 'On-Site', color: 'badge-outline' },
      '1': { label: 'Hybrid', color: 'badge-cyan' },
      '2': { label: 'Remote', color: 'badge-emerald' },
      'OnSite': { label: 'On-Site', color: 'badge-outline' },
      'Hybrid': { label: 'Hybrid', color: 'badge-cyan' },
      'Remote': { label: 'Remote', color: 'badge-emerald' },
    };
    const key = String(type);
    const item = map[key] || { label: 'Standard', color: 'badge-outline' };
    return <span className={`badge ${item.color}`}>{item.label}</span>;
  };

  const getEmploymentBadge = (type: any) => {
    const map: Record<string, string> = {
      '0': 'Full-Time',
      '1': 'Part-Time',
      '2': 'Contract',
      '3': 'Internship',
      'FullTime': 'Full-Time',
      'PartTime': 'Part-Time',
      'Contract': 'Contract',
      'Internship': 'Internship',
    };
    return map[String(type)] || 'Full-Time';
  };

  const displayedJobs = viewSavedOnly
    ? jobs.filter(j => savedJobIds.has(j.id))
    : jobs;

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
          Explore Open <span style={{ color: 'var(--color-primary)' }}>Opportunities</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', maxWidth: '640px', margin: '0 auto' }}>
          Discover verified vacancies with transparent qualification criteria, direct CV matching, and real-time application tracking.
        </p>
      </div>

      {feedbackMsg && (
        <div className="alert alert-success" style={{ maxWidth: '700px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Job Title, Keyword, or Skill</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                className="input" 
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. .NET, React, Docker, Python" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Location</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                className="input" 
                style={{ paddingLeft: '2.5rem' }}
                placeholder="City or Remote" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Category</label>
            <select 
              className="input" 
              value={categoryId} 
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Workplace</label>
            <select 
              className="input" 
              value={workplaceType} 
              onChange={(e) => { setWorkplaceType(e.target.value); setPage(1); }}
            >
              <option value="">All Arrangements</option>
              <option value="2">Remote</option>
              <option value="1">Hybrid</option>
              <option value="0">On-Site</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Employment Type</label>
            <select 
              className="input" 
              value={employmentType} 
              onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="0">Full-Time</option>
              <option value="1">Part-Time</option>
              <option value="2">Contract</option>
              <option value="3">Internship</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Candidate Tab Filter (All vs Saved) */}
        {isCandidate && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setViewSavedOnly(false)}
              className={`btn btn-sm ${!viewSavedOnly ? 'btn-primary' : 'btn-outline'}`}
            >
              All Openings ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setViewSavedOnly(true)}
              className={`btn btn-sm ${viewSavedOnly ? 'btn-primary' : 'btn-outline'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Bookmark size={14} /> Saved Bookmarks ({savedJobIds.size})
            </button>
          </div>
        )}
      </form>

      {/* Results Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Searching live job marketplace...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
          <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-outline" onClick={loadJobs}>Try Again</button>
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Briefcase size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {viewSavedOnly ? 'No Saved Vacancies Found' : 'No Vacancies Found'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {viewSavedOnly
              ? 'You have not saved any jobs yet, or saved vacancies are no longer published.'
              : 'No published jobs match your selected filter criteria. Try broadening your keywords or resetting filters.'}
          </p>
          <button 
            className="btn btn-outline" 
            onClick={() => { setSearch(''); setLocation(''); setCategoryId(''); setWorkplaceType(''); setEmploymentType(''); setViewSavedOnly(false); setPage(1); }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Showing <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{displayedJobs.length}</span> verified vacancies
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {displayedJobs.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              return (
                <div 
                  key={job.id} 
                  className="card" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    padding: '1.5rem',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '8px', 
                          backgroundColor: 'var(--color-surface-hover)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--color-primary)'
                        }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                            {job.companyName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                            {job.categoryName}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getWorkplaceBadge(job.workplaceType)}
                        {/* Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleSave(job.id, e)}
                          title={isSaved ? 'Remove bookmark' : 'Save job'}
                          disabled={savingJobId === job.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isSaved ? '#0284c7' : 'var(--color-text-muted)',
                            padding: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Bookmark size={18} fill={isSaved ? '#0284c7' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                      <Link to={`/jobs/${job.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {job.title}
                      </Link>
                    </h3>

                    <p style={{ 
                      color: 'var(--color-text-muted)', 
                      fontSize: '0.875rem', 
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {job.summary}
                    </p>

                    {/* Top Required Skills Tags */}
                    {job.topSkills && job.topSkills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                        {job.topSkills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.5rem',
                              backgroundColor: 'rgba(238, 246, 255, 0.8)',
                              color: '#0369a1',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(186, 230, 253, 0.6)'
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Briefcase size={14} /> {getEmploymentBadge(job.employmentType)}
                      </span>
                      {job.salaryMin != null && job.salaryMax != null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-emerald)' }}>
                          <DollarSign size={14} /> {job.salaryCurrency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={13} /> {job.publishedAtUtc ? new Date(job.publishedAtUtc).toLocaleDateString() : 'Recent'}
                    </span>
                    <Link 
                      to={`/jobs/${job.id}`} 
                      className="btn btn-outline" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {!viewSavedOnly && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="btn btn-outline" 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Page {page} of {totalPages}
              </span>
              <button 
                className="btn btn-outline" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
