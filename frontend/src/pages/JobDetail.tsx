import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Globe, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  ShieldCheck,
  Star,
  Sparkles,
  Bookmark
} from 'lucide-react';
import { jobsApi, candidateApplicationsApi, candidateDocumentsApi, candidateSavedJobsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { PublicJobPostingDetail, JobRequirement } from '../types/recruitment';
import type { CandidateDocumentSummary } from '../types/document';

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

  useEffect(() => {
    if (id) {
      loadJob(id);
      if (isCandidate) {
        checkCandidateStatus(id);
      }
    }
  }, [id, isCandidate]);

  const checkCandidateStatus = async (jobId: string) => {
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
  };

  const handleToggleSaveJob = async () => {
    if (!id || !isCandidate) return;
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

  const loadJob = async (jobId: string) => {
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
  };

  const handleOpenApplyModal = async () => {
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
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit application.';
      setApplyError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWorkplaceLabel = (type: any) => {
    const map: Record<string, string> = {
      '0': 'On-Site',
      '1': 'Hybrid',
      '2': 'Remote',
      'OnSite': 'On-Site',
      'Hybrid': 'Hybrid',
      'Remote': 'Remote',
    };
    return map[String(type)] || 'On-Site';
  };

  const getEmploymentLabel = (type: any) => {
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

  const getRequirementCategoryBadge = (cat: any) => {
    const map: Record<string, { label: string; color: string }> = {
      '0': { label: 'Skill', color: 'badge-cyan' },
      '1': { label: 'Experience', color: 'badge-purple' },
      '2': { label: 'Education', color: 'badge-emerald' },
      '3': { label: 'Certification', color: 'badge-amber' },
      'Skill': { label: 'Skill', color: 'badge-cyan' },
      'Experience': { label: 'Experience', color: 'badge-purple' },
      'Education': { label: 'Education', color: 'badge-emerald' },
      'Certification': { label: 'Certification', color: 'badge-amber' },
    };
    const item = map[String(cat)] || { label: 'Requirement', color: 'badge-outline' };
    return <span className={`badge ${item.color}`}>{item.label}</span>;
  };

  const isExpired = job?.expiresAtUtc ? new Date(job.expiresAtUtc) < new Date() : false;

  if (loading) {
    return (
      <div className="portal-container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading verified vacancy specifications...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="portal-container">
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load vacancy</strong>
            <p>{error || 'This job posting does not exist or has been archived.'}</p>
          </div>
        </div>
        <Link to="/jobs" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Job Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="portal-container" style={{ maxWidth: '1000px', padding: '2rem 1.5rem 4rem' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/jobs" className="link-subtle" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Open Vacancies
        </Link>
      </div>

      {/* Main Vacancy Card */}
      <div className="card-form" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-purple">{job.categoryName}</span>
              <span className="badge badge-emerald">{getWorkplaceLabel(job.workplaceType)}</span>
              <span className="badge badge-outline">{getEmploymentLabel(job.employmentType)}</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              {job.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                <Building2 size={18} className="text-primary" /> {job.companyName}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={18} /> {job.location}
              </span>
              {job.companyWebsiteUrl && (
                <>
                  <span>•</span>
                  <a 
                    href={job.companyWebsiteUrl.startsWith('http') ? job.companyWebsiteUrl : `https://${job.companyWebsiteUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="link-subtle"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Globe size={16} /> Website
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Action CTA */}
          <div>
            {bookmarkFeedback && (
              <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} />
                <span>{bookmarkFeedback}</span>
              </div>
            )}
            {isExpired ? (
              <div className="alert alert-warning" style={{ margin: 0, padding: '0.65rem 1rem' }}>
                <Clock size={18} /> Application deadline expired
              </div>
            ) : !isAuthenticated ? (
              <button 
                onClick={() => navigate(`/login?redirect=/jobs/${job.id}`)} 
                className="btn btn-primary btn-lg"
              >
                Sign In to Apply
              </button>
            ) : isCandidate ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleToggleSaveJob}
                  className={`btn btn-lg ${isSaved ? 'btn-primary' : 'btn-outline'}`}
                  title={isSaved ? 'Remove Bookmark' : 'Save Job to Bookmarks'}
                  disabled={isSavingBookmark}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  <span>{isSaved ? 'Saved' : 'Save Job'}</span>
                </button>

                {existingApplication ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1.15rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)' }}>
                    <CheckCircle2 size={18} className="text-emerald" />
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Already Applied</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: {String(existingApplication.currentStage)}</span>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleOpenApplyModal} 
                    className="btn btn-primary btn-lg"
                    style={{ boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
                  >
                    <Send size={18} /> Apply for this Role
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Signed in as Employer / Admin</span>
                <p style={{ marginTop: '0.2rem' }}>Only candidate accounts can submit applications</p>
              </div>
            )}
          </div>
        </div>

        {/* Highlight Metadata Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.25rem', 
          padding: '1.25rem', 
          backgroundColor: 'var(--bg-surface-elevated)', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '2.5rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
              Compensation Range
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <DollarSign size={18} className="text-emerald" />
              {job.salaryMin != null || job.salaryMax != null ? (
                <>
                  {job.salaryMin != null && `$${job.salaryMin.toLocaleString()}`}
                  {job.salaryMin != null && job.salaryMax != null && ' – '}
                  {job.salaryMax != null && `$${job.salaryMax.toLocaleString()}`} {job.salaryCurrency}
                </>
              ) : (
                'Competitive / Undisclosed'
              )}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
              Published Date
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} />
              {job.publishedAtUtc ? new Date(job.publishedAtUtc).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Recently'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
              Application Deadline
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: isExpired ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} />
              {job.expiresAtUtc ? new Date(job.expiresAtUtc).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Open until filled'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
              Industry Sector
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {job.companyIndustry || 'Technology & Innovation'}
            </div>
          </div>
        </div>

        {/* Short Summary */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Role Overview</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7' }}>
            {job.summary}
          </p>
        </div>

        {/* Structured Job Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Sparkles size={20} className="text-primary" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Structured Qualifications & Requirements</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              HireSphere evaluates applications transparently against explicit criteria set by the employer.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {job.requirements.map((req: JobRequirement, idx: number) => {
                const isMandatory = String(req.requirementType) === 'Mandatory' || String(req.requirementType) === '0';
                return (
                  <div 
                    key={req.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ marginTop: '0.2rem' }}>
                      {isMandatory ? (
                        <span title="Mandatory Requirement"><ShieldCheck size={20} className="text-emerald" /></span>
                      ) : (
                        <span title="Preferred Qualification"><Star size={20} className="text-amber" /></span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        {getRequirementCategoryBadge(req.requirementCategory)}
                        <span className={`status-badge ${isMandatory ? 'status-approved' : 'badge-role'}`} style={{ fontSize: '0.72rem' }}>
                          {isMandatory ? 'Mandatory' : 'Preferred'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                        {req.requirementText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Responsibilities */}
        {job.responsibilities && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Key Responsibilities</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {job.responsibilities}
            </div>
          </div>
        )}

        {/* Full Job Description */}
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Full Description & Organization Context</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
            {job.description}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '580px' }}>
            {applySuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} className="text-emerald" style={{ margin: '0 auto 1.25rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Application Submitted!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
                  Your profile and application details for <strong style={{ color: 'var(--text-primary)' }}>{job.title}</strong> at <strong style={{ color: 'var(--text-primary)' }}>{job.companyName}</strong> have been recorded.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setShowApplyModal(false)} 
                    className="btn btn-outline"
                  >
                    Close
                  </button>
                  <Link 
                    to="/candidate/applications" 
                    className="btn btn-primary"
                  >
                    View My Applications
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Apply for {job.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {job.companyName} • {job.location}
                  </p>
                </div>

                {applyError && (
                  <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: '0.85rem' }}>{applyError}</span>
                  </div>
                )}

                <div className="info-banner" style={{ marginBottom: '1.25rem' }}>
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Profile-First Application</strong>
                    <p style={{ marginTop: '0.2rem', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Your verified candidate profile, skills, and contact information will be transmitted with this application. An immutable snapshot of the vacancy description (v{1}) will be locked to this submission.
                    </p>
                  </div>
                </div>

                {/* CV Document Selection */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="cvSelect" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600 }}>Attached CV Document</span>
                    <Link to="/candidate/documents" target="_blank" style={{ fontSize: '0.75rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
                      Manage CV Library ↗
                    </Link>
                  </label>
                  {loadingDocs ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading your uploaded CVs...</div>
                  ) : candidateDocs.length > 0 ? (
                    <select
                      id="cvSelect"
                      className="input-standard"
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                    >
                      {candidateDocs.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.originalFileName} (v{doc.versionNumber}){doc.isDefault ? ' — Primary CV' : ''}
                        </option>
                      ))}
                      <option value="">No CV (Apply with Profile Only)</option>
                    </select>
                  ) : (
                    <div style={{ padding: '0.75rem', background: 'var(--surface-color)', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '0.825rem' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                        You haven't uploaded a CV yet. Attaching a CV allows employers to perform automated, explainable qualification matching.
                      </p>
                      <Link to="/candidate/documents" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                        Upload a CV in Library
                      </Link>
                    </div>
                  )}

                  {/* Transparent Match Advisory Banner */}
                  <div style={{ marginTop: '0.75rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(238, 246, 255, 0.9)', border: '1px solid rgba(186, 230, 253, 0.9)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', color: '#0369a1', fontWeight: 600, fontSize: '0.85rem' }}>
                      <Sparkles size={16} /> Transparent CV-to-Job Qualification Matching
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      When a CV is attached, HireSphere compares your extracted technical qualifications against this vacancy's requirements. Match scores are advisory estimates to guide interview preparation. <strong>They do not cause automated rejection, and hiring managers review every application.</strong>
                    </p>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="coverNote">Cover Note / Value Proposition (Optional)</label>
                  <textarea
                    id="coverNote"
                    rows={4}
                    className="textarea-standard"
                    placeholder="Briefly highlight why you are a strong match for this vacancy and any relevant achievements..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    maxLength={1500}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {coverNote.length} / 1500 characters
                  </span>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowApplyModal(false)} 
                    className="btn btn-outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner" style={{ width: '16px', height: '16px' }} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Confirm Submission
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
  );
};
