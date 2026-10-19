import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Globe, 
  ArrowLeft, 
  ArrowRight,
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  ShieldCheck,
  Star, 
  Sparkles, 
  Bookmark,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  Briefcase
} from 'lucide-react';
import { jobsApi, candidateApplicationsApi, candidateDocumentsApi, candidateSavedJobsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { PublicJobPostingDetail } from '../types/recruitment';
import type { CandidateDocumentSummary } from '../types/document';
import { PageTransition } from '../components/common/PageTransition';

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isCandidate } = useAuth();

  const [job, setJob] = useState<PublicJobPostingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Saved job bookmark state
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  const [bookmarkFeedback, setBookmarkFeedback] = useState<string | null>(null);

  // Existing application check
  const [existingApplication, setExistingApplication] = useState<any | null>(null);

  // Apply modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [candidateDocs, setCandidateDocs] = useState<CandidateDocumentSummary[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Mobile Accordion States
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    role: true,
    responsibilities: false,
    qualifications: false,
    niceToHave: false,
    company: false
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordion(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const loadJob = useCallback(async (jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobsApi.getJobDetail(jobId);
      setJob(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Job opening not found or no longer publicly active.');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkCandidateStatus = useCallback(async (jobId: string) => {
    try {
      const [savedRes, myApps] = await Promise.all([
        candidateSavedJobsApi.checkSavedStatus(jobId).catch(() => ({ isSaved: false })),
        candidateApplicationsApi.getMyApplications().catch(() => [])
      ]);
      setIsSaved(savedRes.isSaved);
      const app = myApps.find((a: any) => a.jobPostingId === jobId);
      if (app) {
        setExistingApplication(app);
      }
    } catch {
      // Ignore background check failure
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadJob(id);
      if (isCandidate) {
        checkCandidateStatus(id);
      }
    }
  }, [id, isCandidate, loadJob, checkCandidateStatus]);

  const handleToggleSaveJob = async () => {
    if (!id) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=/jobs/${id}`);
      return;
    }
    if (!isCandidate) return;

    setIsSavingBookmark(true);
    try {
      if (isSaved) {
        await candidateSavedJobsApi.unsaveJob(id);
        setIsSaved(false);
        setBookmarkFeedback('Job removed from saved bookmarks.');
      } else {
        await candidateSavedJobsApi.saveJob(id);
        setIsSaved(true);
        setBookmarkFeedback('Job saved to your bookmarks.');
      }
      setTimeout(() => setBookmarkFeedback(null), 3000);
    } catch {
      setBookmarkFeedback('Failed to update bookmark.');
      setTimeout(() => setBookmarkFeedback(null), 3000);
    } finally {
      setIsSavingBookmark(false);
    }
  };

  const handleOpenApplyModal = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/jobs/${job?.id}`);
      return;
    }
    setShowApplyModal(true);
    setApplySuccess(false);
    setApplyError(null);
    if (isCandidate) {
      setLoadingDocs(true);
      try {
        const docs = await candidateDocumentsApi.getMyDocuments();
        setCandidateDocs(docs);
        const defaultDoc = docs.find((d) => d.isDefault) || docs[0];
        if (defaultDoc) {
          setSelectedDocId(defaultDoc.id);
        }
      } catch (err) {
        console.error('Failed to load candidate documents', err);
      } finally {
        setLoadingDocs(false);
      }
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setIsSubmitting(true);
    setApplyError(null);

    try {
      await candidateApplicationsApi.apply(job.id, {
        candidateDocumentId: selectedDocId || undefined,
        coverNote: coverNote.trim() || undefined,
      });
      setApplySuccess(true);
      setExistingApplication({ jobPostingId: job.id, currentStage: 'Submitted' });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit application.';
      setApplyError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWorkplaceLabel = (type: any) => {
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

  const getEmploymentLabel = (type: any) => {
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

  // Helper to format date cleanly
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper for relative published time (e.g. "2 days ago")
  const getRelativePublished = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const now = new Date();
    const published = new Date(dateStr);
    const diffDays = Math.floor((now.getTime() - published.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Helper for remaining time until deadline (e.g. "in 6 weeks")
  const getRemainingDeadline = (dateStr?: string) => {
    if (!dateStr) return 'Open until filled';
    const now = new Date();
    const deadline = new Date(dateStr);
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays < 7) return `in ${diffDays} days`;
    const diffWeeks = Math.ceil(diffDays / 7);
    if (diffWeeks === 1) return 'in 1 week';
    return `in ${diffWeeks} weeks`;
  };

  // Parse responsibilities into list items
  const responsibilityItems = useMemo(() => {
    if (!job?.responsibilities) return [];
    return job.responsibilities
      .split('\n')
      .map(s => s.replace(/^[\s•\-*]+|\d+\.\s*/, '').trim())
      .filter(s => s.length > 0);
  }, [job?.responsibilities]);

  // Mandatory requirements
  const mandatoryRequirements = useMemo(() => {
    if (!job?.requirements) return [];
    return job.requirements
      .filter(r => String(r.requirementType) === 'Mandatory' || String(r.requirementType) === '0')
      .map(r => r.requirementText);
  }, [job?.requirements]);

  // Preferred qualifications ("Nice to have")
  const preferredRequirements = useMemo(() => {
    if (!job?.requirements) return [];
    return job.requirements
      .filter(r => String(r.requirementType) === 'Preferred' || String(r.requirementType) === '1')
      .map(r => r.requirementText);
  }, [job?.requirements]);

  // Estimated experience text (e.g. "3+ years" or "Relevant experience")
  const experienceText = useMemo(() => {
    if (job?.requirements) {
      const expReq = job.requirements.find(r => 
        String(r.requirementCategory) === 'Experience' || 
        String(r.requirementCategory) === '1' ||
        /\b\d+\+?\s*years?\b/i.test(r.requirementText)
      );
      if (expReq) {
        const match = expReq.requirementText.match(/\b\d+\+?\s*years?\b/i);
        if (match) return match[0];
      }
    }
    return '3+ years';
  }, [job?.requirements]);

  const isExpired = job?.expiresAtUtc ? new Date(job.expiresAtUtc).getTime() < Date.now() : false;

  if (loading) {
    return (
      <div className="jd-page">
        <div className="jd-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="spinner" style={{ width: '42px', height: '42px', margin: '0 auto 20px' }} />
          <p style={{ color: '#687993', fontSize: '16px' }}>Loading verified job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="jd-page">
        <div className="jd-container" style={{ padding: '60px 20px' }}>
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <AlertCircle size={22} />
            <div>
              <strong style={{ fontSize: '16px' }}>Unable to load vacancy</strong>
              <p style={{ margin: '4px 0 0' }}>{error || 'This job opening does not exist or has been archived.'}</p>
            </div>
          </div>
          <Link to="/jobs" className="jd-back-link">
            <ArrowLeft size={16} /> Back to all jobs
          </Link>
        </div>
      </div>
    );
  }

  // Primary action button render helper
  const renderPrimaryAction = (isBlock = false) => {
    if (isExpired) {
      return (
        <div className="alert alert-warning" style={{ margin: 0, padding: '10px 16px', fontSize: '14px' }}>
          <Clock size={16} /> Applications closed
        </div>
      );
    }
    if (!isAuthenticated) {
      return (
        <button 
          onClick={() => navigate(`/login?redirect=/jobs/${job.id}`)} 
          className={`jd-btn-primary ${isBlock ? 'jd-btn-block' : ''}`}
        >
          <span>Sign in to apply</span>
          <ArrowRight size={16} />
        </button>
      );
    }
    if (isCandidate) {
      if (existingApplication) {
        return (
          <div className="jd-applied-badge">
            <CheckCircle2 size={16} />
            <span>Already Applied</span>
          </div>
        );
      }
      return (
        <button 
          onClick={handleOpenApplyModal} 
          className={`jd-btn-primary ${isBlock ? 'jd-btn-block' : ''}`}
        >
          <span>Apply Now</span>
          <ArrowRight size={16} />
        </button>
      );
    }
    return (
      <span style={{ fontSize: '13px', color: '#687993' }}>
        Signed in as Employer
      </span>
    );
  };

  return (
    <PageTransition>
      <div className="jd-page" role="main">
        <div className="jd-container">
          {/* A. Back Navigation */}
          <Link to="/jobs" className="jd-back-link">
            <ArrowLeft size={16} />
            <span>Back to all jobs</span>
          </Link>

          {/* Feedback Toast */}
          {bookmarkFeedback && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              background: '#E0F2FE', 
              color: '#0369A1', 
              fontSize: '14px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <CheckCircle2 size={16} />
              <span>{bookmarkFeedback}</span>
            </div>
          )}

          {/* B. Job Identity Header Card */}
          <div className="jd-header-card">
            <div className="jd-header-flex">
              {/* Left Section: Company Avatar, Name, Title, Badges */}
              <div className="jd-company-identity">
                <div className="jd-company-avatar" aria-hidden="true">
                  {job.companyLogoUrl ? (
                    <img src={job.companyLogoUrl} alt={job.companyName} />
                  ) : (
                    <span>{job.companyName ? job.companyName.charAt(0).toUpperCase() : 'H'}</span>
                  )}
                </div>

                <div className="jd-title-area">
                  <div className="jd-company-name-row">
                    <span className="jd-company-name">{job.companyName}</span>
                    <span className="jd-verified-badge" title="Verified Employer">
                      <CheckCircle2 size={16} fill="var(--accent)" color="#FFFFFF" />
                    </span>
                  </div>
                  <div className="jd-company-industry">
                    {job.companyIndustry || 'Software Development & IT Services'}
                  </div>
                  <h1 className="jd-title">{job.title}</h1>
                  <div className="jd-chips-row">
                    <span className="jd-chip">
                      <MapPin size={14} style={{ color: '#687993' }} />
                      <span>{job.location}</span>
                    </span>
                    <span className="jd-chip">
                      <Building2 size={14} style={{ color: '#687993' }} />
                      <span>{getWorkplaceLabel(job.workplaceType)}</span>
                    </span>
                    <span className="jd-chip">
                      <Briefcase size={14} style={{ color: '#687993' }} />
                      <span>{getEmploymentLabel(job.employmentType)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section: Save Job & Primary Action */}
              <div className="jd-header-actions">
                <button
                  type="button"
                  onClick={handleToggleSaveJob}
                  className={`jd-btn-save ${isSaved ? 'saved' : ''}`}
                  disabled={isSavingBookmark}
                  aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
                >
                  <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  <span>{isSaved ? 'Saved' : 'Save job'}</span>
                </button>
                {renderPrimaryAction()}
              </div>
            </div>

            {/* Mobile Actions in Header */}
            <div className="jd-mobile-actions-top">
              {renderPrimaryAction(true)}
              <button
                type="button"
                onClick={handleToggleSaveJob}
                className={`jd-btn-save ${isSaved ? 'saved' : ''}`}
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isSavingBookmark}
              >
                <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                <span>{isSaved ? 'Saved' : 'Save job'}</span>
              </button>
            </div>
          </div>

          {/* C. Compensation & Dates Summary Card */}
          <div className="jd-summary-card">
            {/* Compensation */}
            <div className="jd-summary-col">
              <div className="jd-summary-icon green">
                <span style={{ fontSize: '18px', fontWeight: 800 }}>$</span>
              </div>
              <div>
                <div className="jd-summary-label">COMPENSATION</div>
                <div className="jd-summary-value">
                  {job.salaryMin != null || job.salaryMax != null ? (
                    <>
                      {(job.salaryCurrency && job.salaryCurrency !== 'USD') ? job.salaryCurrency : 'PKR'}{' '}
                      {job.salaryMin != null && job.salaryMin.toLocaleString()}
                      {job.salaryMin != null && job.salaryMax != null && ' – '}
                      {job.salaryMax != null && job.salaryMax.toLocaleString()}{' '}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#687993' }}>/ month</span>
                    </>
                  ) : (
                    'Competitive salary'
                  )}
                </div>
                <div className="jd-summary-sub green">Competitive salary</div>
              </div>
            </div>

            {/* Published */}
            <div className="jd-summary-col">
              <div className="jd-summary-icon navy">
                <Calendar size={18} />
              </div>
              <div>
                <div className="jd-summary-label">PUBLISHED</div>
                <div className="jd-summary-value">
                  {formatDate(job.publishedAtUtc) || 'Recently'}
                </div>
                <div className="jd-summary-sub">
                  {getRelativePublished(job.publishedAtUtc)}
                </div>
              </div>
            </div>

            {/* Application Deadline */}
            <div className="jd-summary-col">
              <div className="jd-summary-icon navy">
                <Clock size={18} />
              </div>
              <div>
                <div className="jd-summary-label">APPLICATION DEADLINE</div>
                <div className="jd-summary-value" style={{ color: isExpired ? '#B42318' : '#09244D' }}>
                  {formatDate(job.expiresAtUtc) || 'Open until filled'}
                </div>
                <div className="jd-summary-sub">
                  {getRemainingDeadline(job.expiresAtUtc)}
                </div>
              </div>
            </div>
          </div>

          {/* D. Main Content and Application Sidebar */}
          <div className="jd-main-layout">
            {/* Left Column (Desktop Card) */}
            <div className="jd-card jd-desktop-card">
              {/* Section 1: About the role */}
              <div className="jd-section">
                <h2 className="jd-section-title">About the role</h2>
                <p className="jd-body-text">
                  {job.summary || `We are looking for a skilled ${job.title} to join our team in ${job.location}. You'll work on scalable web applications, collaborate with cross-functional teams and help build products that make a real impact. This is a great opportunity to grow your skills, take ownership and be part of a supportive and forward-thinking team.`}
                </p>
              </div>

              {/* Section 2: What you'll do / Responsibilities */}
              {(responsibilityItems.length > 0 || job.responsibilities) && (
                <div className="jd-section">
                  <h2 className="jd-section-title">What you'll do</h2>
                  {responsibilityItems.length > 0 ? (
                    <ul className="jd-list">
                      {responsibilityItems.map((resp, idx) => (
                        <li key={idx} className="jd-list-item">
                          <Check size={17} className="jd-check-icon" strokeWidth={2.5} />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="jd-body-text" style={{ whiteSpace: 'pre-line' }}>{job.responsibilities}</p>
                  )}
                </div>
              )}

              {/* Section 3: Required qualifications */}
              {mandatoryRequirements.length > 0 && (
                <div className="jd-section">
                  <h2 className="jd-section-title">Required qualifications</h2>
                  <ul className="jd-list">
                    {mandatoryRequirements.map((req, idx) => (
                      <li key={idx} className="jd-list-item">
                        <Check size={17} className="jd-check-icon" strokeWidth={2.5} />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section 4: Nice to have (Preferred qualifications) */}
              {preferredRequirements.length > 0 && (
                <div className="jd-section">
                  <h2 className="jd-section-title">Nice to have</h2>
                  <ul className="jd-list">
                    {preferredRequirements.map((pref, idx) => (
                      <li key={idx} className="jd-list-item">
                        <Check size={17} className="jd-check-icon" strokeWidth={2.5} />
                        <span>{pref}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section 5: Full description if distinct */}
              {job.description && job.description !== job.summary && (
                <div className="jd-section">
                  <h2 className="jd-section-title">Full job description</h2>
                  <div className="jd-body-text" style={{ whiteSpace: 'pre-line' }}>
                    {job.description}
                  </div>
                </div>
              )}

              {/* Section 6: About the company */}
              <div className="jd-section">
                <h2 className="jd-section-title">About the company</h2>
                <p className="jd-body-text">
                  {job.companyName} builds modern digital solutions for businesses across different industries. We focus on quality, innovation and a people-first culture. Our team works in a collaborative environment where ideas turn into real products.
                </p>
                <div className="jd-company-links">
                  {job.companyWebsiteUrl && (
                    <div className="jd-company-link-item">
                      <Globe size={15} />
                      <a 
                        href={job.companyWebsiteUrl.startsWith('http') ? job.companyWebsiteUrl : `https://${job.companyWebsiteUrl}`} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        {job.companyWebsiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  )}
                  <div className="jd-company-link-item">
                    <Users size={15} />
                    <span>51 – 200 employees</span>
                  </div>
                  <div className="jd-company-link-item">
                    <Building2 size={15} />
                    <span>Private</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile View Accordions */}
            <div className="jd-mobile-accordion">
              {/* Accordion 1: About the role */}
              <div className="jd-acc-item">
                <button 
                  className="jd-acc-header"
                  onClick={() => toggleAccordion('role')}
                  aria-expanded={openAccordion.role}
                >
                  <span>About the role</span>
                  {openAccordion.role ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openAccordion.role && (
                  <div className="jd-acc-body">
                    <p className="jd-body-text">
                      {job.summary || `We are looking for a skilled ${job.title} to join our team in ${job.location}. You'll work on scalable web applications, collaborate with cross-functional teams and help build products that make a real impact.`}
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 2: What you'll do */}
              {(responsibilityItems.length > 0 || job.responsibilities) && (
                <div className="jd-acc-item">
                  <button 
                    className="jd-acc-header"
                    onClick={() => toggleAccordion('responsibilities')}
                    aria-expanded={openAccordion.responsibilities}
                  >
                    <span>What you'll do</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#687993' }}>
                        {responsibilityItems.length} responsibilities
                      </span>
                      {openAccordion.responsibilities ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>
                  {openAccordion.responsibilities && (
                    <div className="jd-acc-body">
                      {responsibilityItems.length > 0 ? (
                        <ul className="jd-list">
                          {responsibilityItems.map((resp, idx) => (
                            <li key={idx} className="jd-list-item">
                              <Check size={16} className="jd-check-icon" strokeWidth={2.5} />
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="jd-body-text" style={{ whiteSpace: 'pre-line' }}>{job.responsibilities}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 3: Required qualifications */}
              {mandatoryRequirements.length > 0 && (
                <div className="jd-acc-item">
                  <button 
                    className="jd-acc-header"
                    onClick={() => toggleAccordion('qualifications')}
                    aria-expanded={openAccordion.qualifications}
                  >
                    <span>Required qualifications</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#687993' }}>
                        {mandatoryRequirements.length} requirements
                      </span>
                      {openAccordion.qualifications ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>
                  {openAccordion.qualifications && (
                    <div className="jd-acc-body">
                      <ul className="jd-list">
                        {mandatoryRequirements.map((req, idx) => (
                          <li key={idx} className="jd-list-item">
                            <Check size={16} className="jd-check-icon" strokeWidth={2.5} />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 4: Nice to have */}
              {preferredRequirements.length > 0 && (
                <div className="jd-acc-item">
                  <button 
                    className="jd-acc-header"
                    onClick={() => toggleAccordion('niceToHave')}
                    aria-expanded={openAccordion.niceToHave}
                  >
                    <span>Nice to have</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#687993' }}>
                        {preferredRequirements.length} preferences
                      </span>
                      {openAccordion.niceToHave ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>
                  {openAccordion.niceToHave && (
                    <div className="jd-acc-body">
                      <ul className="jd-list">
                        {preferredRequirements.map((pref, idx) => (
                          <li key={idx} className="jd-list-item">
                            <Check size={16} className="jd-check-icon" strokeWidth={2.5} />
                            <span>{pref}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 5: About the company */}
              <div className="jd-acc-item">
                <button 
                  className="jd-acc-header"
                  onClick={() => toggleAccordion('company')}
                  aria-expanded={openAccordion.company}
                >
                  <span>About the company</span>
                  {openAccordion.company ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openAccordion.company && (
                  <div className="jd-acc-body">
                    <p className="jd-body-text">
                      {job.companyName} builds modern digital solutions for businesses across different industries. We focus on quality, innovation and a people-first culture.
                    </p>
                    {job.companyWebsiteUrl && (
                      <div style={{ marginTop: '12px' }}>
                        <a 
                          href={job.companyWebsiteUrl.startsWith('http') ? job.companyWebsiteUrl : `https://${job.companyWebsiteUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: 'var(--accent-d)', fontSize: '13.5px', textDecoration: 'underline' }}
                        >
                          Visit website ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Application Sidebar (Desktop Sticky) */}
            <aside className="jd-sidebar" aria-label="Application Summary">
              {/* Card 1: Application Snapshot */}
              <div className="jd-sidebar-card">
                <div className="jd-snapshot-title">
                  <FileText size={18} style={{ color: 'var(--accent-d)' }} />
                  <span>Application snapshot</span>
                </div>

                <div className="jd-snapshot-list">
                  {/* Deadline */}
                  <div className="jd-snapshot-item">
                    <div className="jd-snapshot-icon">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="jd-snapshot-label">Application deadline</div>
                      <div className="jd-snapshot-val" style={{ color: isExpired ? '#B42318' : '#09244D' }}>
                        {formatDate(job.expiresAtUtc) || 'Open until filled'}
                      </div>
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="jd-snapshot-item">
                    <div className="jd-snapshot-icon">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <div className="jd-snapshot-label">Job type</div>
                      <div className="jd-snapshot-val">
                        {getEmploymentLabel(job.employmentType)}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="jd-snapshot-item">
                    <div className="jd-snapshot-icon">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div className="jd-snapshot-label">Location</div>
                      <div className="jd-snapshot-val">
                        {job.location}
                      </div>
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div className="jd-snapshot-item">
                    <div className="jd-snapshot-icon">
                      <Star size={16} />
                    </div>
                    <div>
                      <div className="jd-snapshot-label">Experience level</div>
                      <div className="jd-snapshot-val">
                        {experienceText}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="jd-sidebar-actions">
                  {renderPrimaryAction(true)}
                  <button
                    type="button"
                    onClick={handleToggleSaveJob}
                    className={`jd-btn-save jd-btn-block ${isSaved ? 'saved' : ''}`}
                    style={{ justifyContent: 'center' }}
                    disabled={isSavingBookmark}
                  >
                    <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                    <span>{isSaved ? 'Saved' : 'Save job'}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Why join {company}? */}
              <div className="jd-why-card">
                <div className="jd-why-title">
                  <Sparkles size={18} style={{ color: '#138A55' }} />
                  <span>Why join {job.companyName}?</span>
                </div>
                <p className="jd-why-desc">
                  Competitive salary, flexible work environment, learning opportunities and a supportive team.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="jd-mobile-bottom-bar">
          {renderPrimaryAction(true)}
        </div>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="apply-modal-title">
            <div className="modal-dialog" style={{ maxWidth: '580px', borderRadius: '16px' }}>
              {applySuccess ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle2 size={56} style={{ color: '#138A55', margin: '0 auto 16px' }} />
                  <h3 id="apply-modal-title" style={{ fontSize: '24px', fontWeight: 800, color: '#09244D', marginBottom: '10px' }}>
                    Application Submitted!
                  </h3>
                  <p style={{ color: '#687993', marginBottom: '24px', lineHeight: 1.6, fontSize: '15px' }}>
                    Your application for <strong style={{ color: '#09244D' }}>{job.title}</strong> at <strong style={{ color: '#09244D' }}>{job.companyName}</strong> has been received by the hiring team.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => setShowApplyModal(false)} 
                      className="jd-btn-save"
                    >
                      Close
                    </button>
                    <Link 
                      to="/candidate/applications" 
                      className="jd-btn-primary"
                    >
                      <span>View My Applications</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 id="apply-modal-title" style={{ fontSize: '22px', fontWeight: 800, color: '#09244D', marginBottom: '4px' }}>
                      Apply for {job.title}
                    </h3>
                    <p style={{ color: '#687993', fontSize: '14px', margin: 0 }}>
                      {job.companyName} • {job.location}
                    </p>
                  </div>

                  {applyError && (
                    <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                      <AlertCircle size={18} />
                      <span style={{ fontSize: '14px' }}>{applyError}</span>
                    </div>
                  )}

                  <div style={{ 
                    padding: '14px 16px', 
                    borderRadius: '10px', 
                    background: '#F8F9FA', 
                    border: '1px solid #E7E6E0', 
                    marginBottom: '18px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: '#09244D' }}>
                      <ShieldCheck size={18} style={{ color: 'var(--accent-d)' }} />
                      <span>Applying with your candidate profile</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#687993', lineHeight: 1.45 }}>
                      Your candidate profile, skills summary, and selected CV will be sent directly to the hiring managers.
                    </p>
                  </div>

                  {/* CV Document Selection */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="cvSelect" style={{ fontSize: '14px', fontWeight: 700, color: '#09244D' }}>
                        Attached CV
                      </label>
                      <Link to="/candidate/documents" target="_blank" style={{ fontSize: '12.5px', color: 'var(--accent-d)', fontWeight: 600 }}>
                        Manage CVs ↗
                      </Link>
                    </div>

                    {loadingDocs ? (
                      <div style={{ fontSize: '13.5px', color: '#687993' }}>Loading your CV documents...</div>
                    ) : candidateDocs.length > 0 ? (
                      <select
                        id="cvSelect"
                        className="form-input"
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E7E6E0' }}
                      >
                        {candidateDocs.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.originalFileName} {doc.isDefault ? ' — Default CV' : ''}
                          </option>
                        ))}
                        <option value="">Apply without CV (Profile only)</option>
                      </select>
                    ) : (
                      <div style={{ padding: '14px', background: '#F8F9FA', border: '1px solid #E7E6E0', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: '#687993' }}>
                          You haven't uploaded a CV yet. Attaching a CV allows employers to review your qualifications faster.
                        </p>
                        <Link to="/candidate/documents" className="jd-btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                          Upload a CV
                        </Link>
                      </div>
                    )}

                    {/* Fit Advisory Notice */}
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '12px 14px', 
                      borderRadius: '8px', 
                      background: '#EEF2FF', 
                      border: '1px solid #C7D2FE' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-d)', fontWeight: 700, fontSize: '13px' }}>
                        <Sparkles size={15} />
                        <span>See how well you fit</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#687993', lineHeight: 1.45 }}>
                        When you attach a CV, we show how your skills match the job requirements. A real person reviews every application.
                      </p>
                    </div>
                  </div>

                  {/* Cover Note */}
                  <div style={{ marginBottom: '22px' }}>
                    <label htmlFor="coverNote" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#09244D', marginBottom: '6px' }}>
                      Cover Note (Optional)
                    </label>
                    <textarea
                      id="coverNote"
                      rows={4}
                      className="textarea-standard"
                      placeholder="Briefly highlight why you are a strong match for this vacancy and any relevant achievements..."
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      maxLength={1500}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E7E6E0' }}
                    />
                    <div style={{ fontSize: '12px', color: '#687993', textAlign: 'right', marginTop: '4px' }}>
                      {coverNote.length} / 1500 characters
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowApplyModal(false)} 
                      className="jd-btn-save"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="jd-btn-primary" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner" style={{ width: '16px', height: '16px' }} />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Confirm Submission</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default JobDetail;
