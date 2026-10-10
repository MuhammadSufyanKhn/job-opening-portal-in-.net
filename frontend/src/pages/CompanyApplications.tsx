import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  MapPin, 
  Calendar, 
  Globe, 
  ExternalLink,
  Eye, 
  X,
  Building2,
  Download,
  RefreshCw,
  Sparkles,
  FileText,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  XCircle,
  Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { companyApplicationsApi, companyJobsApi, cvMatchingApi, workSimApi } from '../services/api';
import type { 
  CompanyApplicationSummary, 
  CompanyApplicationDetail, 
  ApplicationStage,
  JobPostingSummary
} from '../types/recruitment';
import type { CvMatchReport } from '../types/document';
import type { AssessmentResult } from '../types/worksim';

export const CompanyApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const { user, activeCompanyId } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [applications, setApplications] = useState<CompanyApplicationSummary[]>([]);
  const [jobs, setJobs] = useState<JobPostingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Match Report state
  const [matchReport, setMatchReport] = useState<CvMatchReport | null>(null);
  const [loadingMatchReport, setLoadingMatchReport] = useState(false);
  const [recalculatingMatch, setRecalculatingMatch] = useState(false);
  const [matchReportError, setMatchReportError] = useState<string | null>(null);

  // WorkSim Assessment state
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Application detail & stage update modal
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<CompanyApplicationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [newStage, setNewStage] = useState<number>(1); // UnderReview
  const [stageReason, setStageReason] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);
  const [stageSuccess, setStageSuccess] = useState(false);

  useEffect(() => {
    const resolvedId = activeCompanyId || (user?.companies && user.companies.length > 0 ? user.companies[0].companyId : null);
    if (resolvedId) {
      setCompanyId(resolvedId);
      loadCompanyJobs(resolvedId);
    } else {
      setLoading(false);
    }
  }, [activeCompanyId, user]);

  useEffect(() => {
    if (companyId) {
      loadApplications(companyId);
    }
  }, [companyId, selectedJobId, selectedStage, page]);

  const loadCompanyJobs = async (cId: string) => {
    try {
      const res = await companyJobsApi.getJobs(cId, { page: 1, pageSize: 50 });
      setJobs(res.items);
    } catch (err) {
      console.error('Failed to load company vacancies for filter', err);
    }
  };

  const loadApplications = async (cId: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        pageSize: 10,
      };
      if (selectedJobId) params.jobPostingId = selectedJobId;
      if (selectedStage !== '') params.stage = parseInt(selectedStage, 10);
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await companyApplicationsApi.getApplications(cId, params);
      setApplications(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to retrieve applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    if (!companyId) return;
    setSelectedAppId(id);
    setLoadingDetail(true);
    setStageSuccess(false);
    setStageError(null);
    setStageReason('');
    setMatchReport(null);
    setMatchReportError(null);

    try {
      const detail = await companyApplicationsApi.getApplication(companyId, id);
      setSelectedAppDetail(detail);
      // Pre-select next stage
      const stageVal = typeof detail.currentStage === 'number' ? detail.currentStage : 0;
      setNewStage(stageVal < 7 ? stageVal + 1 : stageVal);

      // Load matching report if CV is attached
      if (detail.candidateDocumentId) {
        loadMatchReport(companyId, id);
      }

      // Load WorkSim assessment result
      loadAssessmentResult(companyId, id);
    } catch (err: any) {
      console.error('Failed to load applicant detail', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadMatchReport = async (cId: string, appId: string) => {
    setLoadingMatchReport(true);
    setMatchReportError(null);
    try {
      const report = await cvMatchingApi.getMatchReport(cId, appId);
      setMatchReport(report);
    } catch (err: any) {
      setMatchReportError(err.response?.data?.detail || err.response?.data?.title || 'Matching report not currently computed.');
    } finally {
      setLoadingMatchReport(false);
    }
  };

  const loadAssessmentResult = async (cId: string, appId: string) => {
    setLoadingAssessment(true);
    try {
      const result = await workSimApi.getApplicationAssessmentResult(cId, appId);
      setAssessmentResult(result);
    } catch {
      setAssessmentResult(null);
    } finally {
      setLoadingAssessment(false);
    }
  };

  const handleRecalculateMatch = async () => {
    if (!companyId || !selectedAppId) return;
    setRecalculatingMatch(true);
    setMatchReportError(null);
    try {
      const report = await cvMatchingApi.recalculateMatchReport(companyId, selectedAppId);
      setMatchReport(report);
    } catch (err: any) {
      setMatchReportError(err.response?.data?.detail || err.response?.data?.title || 'Failed to recalculate matching report.');
    } finally {
      setRecalculatingMatch(false);
    }
  };

  const handleDownloadCv = async () => {
    if (!companyId || !selectedAppDetail || !selectedAppDetail.candidateDocumentId) return;
    try {
      const fileName = (selectedAppDetail as any).candidateDocumentFileName || `${selectedAppDetail.candidateName.replace(/\s+/g, '_')}_CV.pdf`;
      await cvMatchingApi.downloadApplicationCv(companyId, selectedAppDetail.id, fileName);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download candidate CV. Access might be restricted.');
    }
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !selectedAppId) return;

    setIsUpdatingStage(true);
    setStageError(null);

    try {
      const updated = await companyApplicationsApi.updateStage(companyId, selectedAppId, {
        newStage: Number(newStage),
        reasonNote: stageReason.trim() || undefined,
      });

      setSelectedAppDetail(updated);
      setStageSuccess(true);
      setStageReason('');

      // Refresh in list
      setApplications(prev => prev.map(a => a.id === selectedAppId ? { ...a, currentStage: updated.currentStage } : a));
    } catch (err: any) {
      setStageError(err.response?.data?.detail || 'Failed to transition application stage.');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const getStageBadge = (stage: ApplicationStage) => {
    const stageStr = String(stage);
    const map: Record<string, { label: string; className: string }> = {
      '0': { label: 'Submitted', className: 'badge-outline' },
      '1': { label: 'Under Review', className: 'badge-purple' },
      '2': { label: 'Shortlisted', className: 'badge-cyan' },
      '3': { label: 'Assessment Pending', className: 'badge-amber' },
      '4': { label: 'Assessment Completed', className: 'badge-cyan' },
      '5': { label: 'Interview Scheduled', className: 'badge-purple' },
      '6': { label: 'Offer Extended', className: 'badge-emerald' },
      '7': { label: 'Hired', className: 'badge-emerald' },
      '8': { label: 'Rejected', className: 'badge-danger' },
      '9': { label: 'Withdrawn', className: 'badge-muted' },
      'Submitted': { label: 'Submitted', className: 'badge-outline' },
      'UnderReview': { label: 'Under Review', className: 'badge-purple' },
      'Shortlisted': { label: 'Shortlisted', className: 'badge-cyan' },
      'AssessmentPending': { label: 'Assessment Pending', className: 'badge-amber' },
      'AssessmentCompleted': { label: 'Assessment Completed', className: 'badge-cyan' },
      'InterviewScheduled': { label: 'Interview Scheduled', className: 'badge-purple' },
      'Offered': { label: 'Offer Extended', className: 'badge-emerald' },
      'Hired': { label: 'Hired', className: 'badge-emerald' },
      'Rejected': { label: 'Rejected', className: 'badge-danger' },
      'Withdrawn': { label: 'Withdrawn', className: 'badge-muted' },
    };
    const item = map[stageStr] || { label: stageStr, className: 'badge-outline' };
    return <span className={`status-badge ${item.className}`}>{item.label}</span>;
  };

  if (!companyId) {
    return (
      <div className="portal-container">
        <div className="empty-state">
          <Building2 size={40} className="text-muted" />
          <h3>No Organization Selected</h3>
          <p>Please select an approved company workspace to review candidate applications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-container" style={{ maxWidth: '1150px', padding: '2.5rem 1.5rem 5rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Recruitment Applications Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Screen candidate submissions, review qualifications, and manage immutable stage transitions.
          </p>
        </div>
        <Link to="/company/jobs" className="btn btn-outline">
          <Briefcase size={16} /> Manage Vacancies
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card-form" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Filter by Vacancy</label>
            <select
              className="select-standard"
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setSearchParams(e.target.value ? { jobId: e.target.value } : {});
                setPage(1);
              }}
            >
              <option value="">All Vacancies</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Recruitment Stage</label>
            <select
              className="select-standard"
              value={selectedStage}
              onChange={(e) => { setSelectedStage(e.target.value); setPage(1); }}
            >
              <option value="">All Stages</option>
              <option value="0">Submitted</option>
              <option value="1">Under Review</option>
              <option value="2">Shortlisted</option>
              <option value="3">Assessment Pending</option>
              <option value="4">Assessment Completed</option>
              <option value="5">Interview Scheduled</option>
              <option value="6">Offer Extended</option>
              <option value="7">Hired</option>
              <option value="8">Rejected</option>
              <option value="9">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Candidate Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-standard"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Search name or headline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    loadApplications(companyId);
                  }
                }}
              />
            </div>
          </div>

          <button
            onClick={() => { setPage(1); loadApplications(companyId); }}
            className="btn btn-secondary"
            style={{ height: '40px' }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading candidate applications...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>
            <strong>Error loading applications</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="card-form" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
          <Users size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Applications Received</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.75rem' }}>
            {selectedJobId || selectedStage || searchQuery
              ? 'No applications match your selected filter criteria. Try clearing filters.'
              : 'Candidates will appear here as soon as they discover your published openings and submit their qualifications.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{applications.length}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong> candidate applications
            </p>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                <button 
                  className="btn btn-outline btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="card-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Target Vacancy</th>
                <th>Experience & Location</th>
                <th>Stage</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {app.candidateName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {app.candidateEmail}
                      </div>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {app.jobTitle}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {app.yearsOfExperience != null ? `${app.yearsOfExperience} yrs exp` : 'Experience not specified'}
                      {app.candidateLocation && ` • ${app.candidateLocation}`}
                    </div>
                  </td>

                  <td>{getStageBadge(app.currentStage)}</td>

                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(app.submittedAtUtc).toLocaleDateString(undefined, { dateStyle: 'short' })}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenDetail(app.id)}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Eye size={14} /> Review Candidate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Applicant Detail & Stage Update Modal */}
      {selectedAppId && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {selectedAppDetail?.candidateName || 'Candidate Profile'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Applied for <strong>{selectedAppDetail?.jobTitle}</strong> on {selectedAppDetail && new Date(selectedAppDetail.submittedAtUtc).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              </div>
              <button 
                onClick={() => { setSelectedAppId(null); setSelectedAppDetail(null); }}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetail || !selectedAppDetail ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading candidate submission details...</p>
              </div>
            ) : (
              <div>
                {/* Candidate Overview Card */}
                <div style={{ 
                  backgroundColor: 'var(--bg-surface-elevated)', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-md)', 
                  marginBottom: '1.5rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <Mail size={15} /> {selectedAppDetail.candidateEmail}
                    </div>
                    {selectedAppDetail.candidateLocation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={15} /> {selectedAppDetail.candidateLocation}
                      </div>
                    )}
                    {selectedAppDetail.yearsOfExperience != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={15} /> {selectedAppDetail.yearsOfExperience} Years Experience
                      </div>
                    )}
                  </div>

                  {selectedAppDetail.candidateHeadline && (
                    <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', fontSize: '0.95rem', margin: '0.5rem 0' }}>
                      "{selectedAppDetail.candidateHeadline}"
                    </p>
                  )}

                  {/* External Links */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    {selectedAppDetail.linkedInUrl && (
                      <a href={selectedAppDetail.linkedInUrl} target="_blank" rel="noreferrer" className="link-subtle" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ExternalLink size={14} /> LinkedIn
                      </a>
                    )}
                    {selectedAppDetail.gitHubUrl && (
                      <a href={selectedAppDetail.gitHubUrl} target="_blank" rel="noreferrer" className="link-subtle" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ExternalLink size={14} /> GitHub
                      </a>
                    )}
                    {selectedAppDetail.portfolioUrl && (
                      <a href={selectedAppDetail.portfolioUrl} target="_blank" rel="noreferrer" className="link-subtle" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Globe size={14} /> Portfolio
                      </a>
                    )}
                  </div>
                </div>

                {/* Candidate Summary / Bio */}
                {selectedAppDetail.candidateSummary && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                      Professional Background
                    </h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {selectedAppDetail.candidateSummary}
                    </p>
                  </div>
                )}

                {/* Cover Note */}
                {selectedAppDetail.candidateCoverNote && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                      Candidate Cover Note
                    </h4>
                    <div style={{ 
                      backgroundColor: 'var(--bg-input)', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.9rem', 
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'pre-line'
                    }}>
                      {selectedAppDetail.candidateCoverNote}
                    </div>
                  </div>
                )}

                {/* Attached CV Document Card */}
                <div style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.15rem 0' }}>
                        {(selectedAppDetail as any).candidateDocumentFileName || 'Attached Candidate CV'}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {selectedAppDetail.candidateDocumentId ? 'Securely stored • Verified digital integrity' : 'No CV document attached with this application'}
                      </span>
                    </div>
                  </div>

                  {selectedAppDetail.candidateDocumentId && (
                    <button
                      type="button"
                      onClick={handleDownloadCv}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Download size={14} /> Download CV
                    </button>
                  )}
                </div>

                {/* Explainable CV-to-Job Matching Report Card */}
                {selectedAppDetail.candidateDocumentId && (
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    marginBottom: '1.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={18} className="text-primary" />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                          Explainable CV-to-Job Matching
                        </h4>
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          v{matchReport?.engineVersion || '1.0-deterministic'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRecalculateMatch}
                        disabled={recalculatingMatch || loadingMatchReport}
                        className="btn btn-outline btn-xs"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <RefreshCw size={12} className={recalculatingMatch ? 'animate-spin' : ''} />
                        {recalculatingMatch ? 'Recalculating...' : 'Recalculate Match'}
                      </button>
                    </div>

                    {loadingMatchReport ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 0.75rem' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Extracting text and computing deterministic criteria evidence...
                        </p>
                      </div>
                    ) : matchReportError ? (
                      <div className="alert alert-warning" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <AlertCircle size={16} />
                        <span>{matchReportError}</span>
                      </div>
                    ) : matchReport ? (
                      <div>
                        {/* Overall Evidence Index Gauge */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          padding: '1rem 1.25rem',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '1rem'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                              Overall Evidence Index
                            </span>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1.2 }}>
                              {matchReport.overallEvidenceIndex.toFixed(1)}%
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                              {matchReport.summary.supportedCount} Supported
                            </span>
                            <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                              {matchReport.summary.partiallySupportedCount} Partial
                            </span>
                            <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                              {matchReport.summary.notFoundCount} Not in CV
                            </span>
                            {matchReport.summary.needsReviewCount > 0 && (
                              <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                                {matchReport.summary.needsReviewCount} Needs Review
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Decision Support Disclaimer */}
                        <div className="info-banner" style={{ marginBottom: '1.25rem', fontSize: '0.78rem' }}>
                          <ShieldCheck size={18} />
                          <div>
                            <strong>Decision Support Only:</strong> This evidence index reflects explicit technical terms identified in the processed CV. &ldquo;Not found in CV&rdquo; indicates absence of text evidence, not proof of lack of capability. Final hiring decisions rest with the recruitment team.
                          </div>
                        </div>

                        {/* Criteria Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {matchReport.evaluations.map((ev) => {
                            const statusStr = String(ev.status);
                            const isSupported = statusStr === 'SupportedByEvidence' || statusStr === '0';
                            const isPartial = statusStr === 'PartiallySupported' || statusStr === '1';
                            const isReview = statusStr === 'RequiresManualReview' || statusStr === '3';

                            return (
                              <div
                                key={ev.id}
                                style={{
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '0.875rem',
                                  backgroundColor: isSupported ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-surface-elevated)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                                      {ev.requirementType === 0 ? 'Mandatory (2x)' : 'Preferred (1x)'}
                                    </span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                      {ev.requirementText}
                                    </span>
                                  </div>

                                  {isSupported ? (
                                    <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                                      <CheckCircle size={11} /> Supported
                                    </span>
                                  ) : isPartial ? (
                                    <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                                      <AlertCircle size={11} /> Partial
                                    </span>
                                  ) : isReview ? (
                                    <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                                      <HelpCircle size={11} /> Review
                                    </span>
                                  ) : (
                                    <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      <XCircle size={11} /> Not in CV
                                    </span>
                                  )}
                                </div>

                                {ev.extractedExcerpt && (
                                  <div style={{
                                    backgroundColor: 'var(--bg-input)',
                                    borderLeft: '3px solid var(--primary-color)',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                                    fontSize: '0.8rem',
                                    fontStyle: 'italic',
                                    color: 'var(--text-secondary)',
                                    margin: '0.4rem 0'
                                  }}>
                                    &ldquo;{ev.extractedExcerpt}&rdquo;
                                  </div>
                                )}

                                {ev.reviewerNote && (
                                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                    {ev.reviewerNote}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* WorkSim™ Assessment Scorecard */}
                <div style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  marginBottom: '1.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Terminal size={18} className="text-primary" />
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                        WorkSim™ Interactive Simulation Scorecard
                      </h4>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        Deterministic Assessment
                      </span>
                    </div>

                    {assessmentResult && (
                      <span className="badge badge-emerald" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        Score: {assessmentResult.totalScore.toFixed(1)} / 100.0
                      </span>
                    )}
                  </div>

                  {loadingAssessment ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                      <RefreshCw size={20} className="animate-spin text-primary" style={{ margin: '0 auto 0.5rem auto' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Retrieving simulation results...</p>
                    </div>
                  ) : assessmentResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          Scenario: {assessmentResult.scenarioTitle} ({assessmentResult.scenarioCategory})
                        </span>
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {assessmentResult.evaluationSummary}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                          Criterion Breakdown & Observed Behaviors:
                        </h5>
                        {assessmentResult.criterionScores.map((c) => (
                          <div key={c.criterionName} style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                {c.criterionName}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                                {c.score.toFixed(1)} / {c.maxScore.toFixed(1)} pts
                              </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                              {c.feedback}
                            </p>
                            {c.supportingEvidence && c.supportingEvidence.length > 0 && (
                              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {c.supportingEvidence.map((ev, idx) => (
                                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{ev}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        💡 <strong>Decision Support:</strong> WorkSim provides verifiable evidence of on-the-job problem solving. Assessment results inform human candidate review and must not replace human judgment.
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      No WorkSim simulation completed by candidate yet for this application.
                    </div>
                  )}
                </div>

                {/* Stage Progression Form */}
                <form onSubmit={handleUpdateStage} style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1.25rem',
                  marginBottom: '1.75rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      Recruiter Decision & Stage Transition
                    </h4>
                    <div>
                      Current: {getStageBadge(selectedAppDetail.currentStage)}
                    </div>
                  </div>

                  {stageSuccess && (
                    <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                      <CheckCircle2 size={16} /> Stage updated successfully!
                    </div>
                  )}

                  {stageError && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={16} /> {stageError}
                    </div>
                  )}

                  <div className="form-row" style={{ marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label htmlFor="newStage">Promote / Move to Stage</label>
                      <select
                        id="newStage"
                        className="select-standard"
                        value={newStage}
                        onChange={(e) => setNewStage(parseInt(e.target.value, 10))}
                      >
                        <option value={1}>Under Review</option>
                        <option value={2}>Shortlisted</option>
                        <option value={3}>Assessment Pending</option>
                        <option value={4}>Assessment Completed</option>
                        <option value={5}>Interview Scheduled</option>
                        <option value={6}>Offer Extended</option>
                        <option value={7}>Hired</option>
                        <option value={8}>Rejected</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="stageReason">Evaluation Reason / Internal Note</label>
                      <input
                        id="stageReason"
                        type="text"
                        className="input-standard"
                        placeholder="e.g. Strong .NET experience, moving to technical interview"
                        value={stageReason}
                        onChange={(e) => setStageReason(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={isUpdatingStage}
                    >
                      {isUpdatingStage ? 'Updating...' : 'Update Application Stage'}
                    </button>
                  </div>
                </form>

                {/* Immutable Status History Timeline */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Recruitment Stage Audit History
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingLeft: '1.25rem', borderLeft: '2px solid var(--border-color)' }}>
                    {selectedAppDetail.statusTimeline.map((item, idx) => (
                      <div key={item.id || idx} style={{ position: 'relative' }}>
                        <div style={{ 
                          position: 'absolute', 
                          left: '-1.55rem', 
                          top: '0.2rem', 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: idx === 0 ? 'var(--primary)' : 'var(--text-muted)' 
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Stage changed to {String(item.newStage)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(item.createdAtUtc).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          By: {item.changedByName || 'Recruiter'}
                          {item.reasonNote && ` — "${item.reasonNote}"`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                  <button 
                    onClick={() => { setSelectedAppId(null); setSelectedAppDetail(null); }}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
