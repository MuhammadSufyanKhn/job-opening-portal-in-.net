import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Users, 
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
  Download,
  RefreshCw,
  Sparkles,
  FileText,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Terminal,
  RotateCw,
  Ban,
  LayoutGrid,
  List,
  Lock,
  Clock,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { companyApplicationsApi, companyJobsApi, cvMatchingApi, workSimApi } from '../services/api';
import type { 
  CompanyApplicationSummary, 
  CompanyApplicationDetail, 
  ApplicationStage,
  JobPostingSummary,
  PipelineBoard,
  CandidateNote,
  InterviewSchedule
} from '../types/recruitment';
import type { CvMatchReport } from '../types/document';
import type { AssessmentResult, CompanyAssessmentTrackingItem } from '../types/worksim';
import { StageBadge } from '../components/common';

export const CompanyApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const { user, activeCompanyId } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [applications, setApplications] = useState<CompanyApplicationSummary[]>([]);
  const [jobs, setJobs] = useState<JobPostingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: Board or Table
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [pipelineBoard, setPipelineBoard] = useState<PipelineBoard | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [mobileActiveStageIndex, setMobileActiveStageIndex] = useState<number>(0);

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

  // Application detail & review modal
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<CompanyApplicationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reviewTab, setReviewTab] = useState<'profile' | 'match' | 'worksim' | 'interviews' | 'notes' | 'decision'>('profile');

  // Stage Update state
  const [newStage, setNewStage] = useState<number>(1); // UnderReview
  const [stageReason, setStageReason] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);
  const [stageSuccess, setStageSuccess] = useState(false);
  const [confirmingConsequentialDecision, setConfirmingConsequentialDecision] = useState<{ stage: number; stageName: string } | null>(null);

  // Recruiter Notes state
  const [notesList, setNotesList] = useState<CandidateNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Interview Coordination state
  const [interviewsList, setInterviewsList] = useState<InterviewSchedule[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleType, setScheduleType] = useState<number>(0); // 0: Screening, 1: Technical, 2: Cultural, 3: Final
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [cancellingInterviewId, setCancellingInterviewId] = useState<string | null>(null);
  const [cancelInterviewReason, setCancelInterviewReason] = useState('');

  // Top-level Navigation & Assessment Tracking State
  const [activeTab, setActiveTab] = useState<'applicants' | 'assessments'>('applicants');
  const [trackingList, setTrackingList] = useState<CompanyAssessmentTrackingItem[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingStatusFilter, setTrackingStatusFilter] = useState('');
  const [trackingJobFilter, setTrackingJobFilter] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingItem, setCancellingItem] = useState<CompanyAssessmentTrackingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    if (companyId && activeTab === 'assessments') {
      loadAssessmentTracking(companyId, trackingStatusFilter, trackingJobFilter);
    }
  }, [companyId, activeTab, trackingStatusFilter, trackingJobFilter]);

  const loadAssessmentTracking = async (cId: string, status?: string, jobId?: string) => {
    setTrackingLoading(true);
    try {
      const data = await workSimApi.getCompanyTracking(cId, status, jobId);
      setTrackingList(data);
    } catch (err: any) {
      console.error('Failed to load assessment tracking', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleResendInvitation = async (assignmentId: string) => {
    if (!companyId) return;
    setResendingId(assignmentId);
    setActionNotice(null);
    try {
      await workSimApi.resendInvitation(companyId, assignmentId);
      setActionNotice({ message: 'Assessment invitation re-sent successfully.', type: 'success' });
      await loadAssessmentTracking(companyId, trackingStatusFilter, trackingJobFilter);
    } catch (err: any) {
      setActionNotice({ message: err?.response?.data?.message || 'Failed to resend invitation.', type: 'error' });
    } finally {
      setResendingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!companyId || !cancellingItem) return;
    setActionNotice(null);
    try {
      await workSimApi.cancelInvitation(companyId, cancellingItem.assignmentId, cancelReason);
      setActionNotice({ message: 'Assessment invitation cancelled successfully.', type: 'success' });
      setCancellingItem(null);
      setCancelReason('');
      await loadAssessmentTracking(companyId, trackingStatusFilter, trackingJobFilter);
    } catch (err: any) {
      setActionNotice({ message: err?.response?.data?.message || 'Failed to cancel invitation.', type: 'error' });
    }
  };

  useEffect(() => {
    if (companyId && activeTab === 'applicants') {
      if (viewMode === 'board') {
        loadPipelineBoard(companyId);
      } else {
        loadApplications(companyId);
      }
    }
  }, [companyId, selectedJobId, selectedStage, page, viewMode, activeTab]);

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
        pageSize: 12,
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

  const loadPipelineBoard = async (cId: string) => {
    setLoadingBoard(true);
    setError(null);
    try {
      const board = await companyApplicationsApi.getPipelineBoard(cId, selectedJobId || undefined);
      setPipelineBoard(board);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load recruitment pipeline board.');
    } finally {
      setLoadingBoard(false);
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
    setShowScheduleForm(false);
    setReviewTab('profile');

    try {
      const detail = await companyApplicationsApi.getApplication(companyId, id);
      setSelectedAppDetail(detail);
      setNotesList(detail.notes || []);
      setInterviewsList(detail.interviews || []);

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
      setMatchReportError(err.response?.data?.detail || 'Failed to recalculate match evidence.');
    } finally {
      setRecalculatingMatch(false);
    }
  };

  const handleDownloadCv = async () => {
    if (!companyId || !selectedAppDetail) return;
    try {
      const fileName = (selectedAppDetail as any).candidateDocumentFileName || `${selectedAppDetail.candidateName.replace(/\s+/g, '_')}_CV.pdf`;
      await cvMatchingApi.downloadApplicationCv(companyId, selectedAppDetail.id, fileName);
    } catch {
      alert('Failed to download candidate CV. Access might be restricted.');
    }
  };

  const handleStageFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStage === 7) {
      setConfirmingConsequentialDecision({ stage: 7, stageName: 'Hired' });
    } else if (newStage === 8) {
      setConfirmingConsequentialDecision({ stage: 8, stageName: 'Rejected' });
    } else {
      executeStageTransition(newStage);
    }
  };

  const executeStageTransition = async (targetStage: number) => {
    if (!companyId || !selectedAppId) return;

    setIsUpdatingStage(true);
    setStageError(null);
    setConfirmingConsequentialDecision(null);

    try {
      const updated = await companyApplicationsApi.updateStage(companyId, selectedAppId, {
        newStage: Number(targetStage),
        reasonNote: stageReason.trim() || undefined,
      });

      setSelectedAppDetail(updated);
      setStageSuccess(true);
      setStageReason('');

      // Refresh data in active view
      if (viewMode === 'board') {
        loadPipelineBoard(companyId);
      } else {
        setApplications(prev => prev.map(a => a.id === selectedAppId ? { ...a, currentStage: updated.currentStage } : a));
      }
    } catch (err: any) {
      setStageError(err.response?.data?.detail || 'Failed to transition application stage.');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleQuickStageChange = async (appId: string, stage: number) => {
    if (!companyId) return;
    try {
      await companyApplicationsApi.updateStage(companyId, appId, {
        newStage: stage,
        reasonNote: 'Updated from pipeline board'
      });
      loadPipelineBoard(companyId);
      setActionNotice({ message: 'Candidate stage updated successfully.', type: 'success' });
    } catch (err: any) {
      setActionNotice({ message: err.response?.data?.detail || 'Failed to update stage.', type: 'error' });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !selectedAppId || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    setNoteError(null);

    try {
      const createdNote = await companyApplicationsApi.addNote(companyId, selectedAppId, {
        noteText: newNoteText.trim(),
      });
      setNotesList(prev => [createdNote, ...prev]);
      setNewNoteText('');
    } catch (err: any) {
      setNoteError(err.response?.data?.detail || 'Failed to add recruiter note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!companyId || !selectedAppId) return;
    if (!window.confirm('Are you sure you want to delete this internal note?')) return;

    try {
      await companyApplicationsApi.deleteNote(companyId, selectedAppId, noteId);
      setNotesList(prev => prev.filter(n => n.id !== noteId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete note.');
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !selectedAppId || !scheduleStart || !scheduleEnd) return;

    setIsSubmittingInterview(true);
    setInterviewError(null);

    try {
      const scheduled = await companyApplicationsApi.scheduleInterview(companyId, selectedAppId, {
        interviewType: Number(scheduleType),
        scheduledStartUtc: new Date(scheduleStart).toISOString(),
        scheduledEndUtc: new Date(scheduleEnd).toISOString(),
        meetingLocation: scheduleLocation.trim() || undefined,
      });

      setInterviewsList(prev => [...prev, scheduled]);
      setShowScheduleForm(false);
      setScheduleLocation('');
      setScheduleStart('');
      setScheduleEnd('');

      // Refresh application to reflect InterviewScheduled stage
      const refreshed = await companyApplicationsApi.getApplication(companyId, selectedAppId);
      setSelectedAppDetail(refreshed);

      if (viewMode === 'board') {
        loadPipelineBoard(companyId);
      } else {
        loadApplications(companyId);
      }
    } catch (err: any) {
      setInterviewError(err.response?.data?.detail || 'Failed to schedule interview.');
    } finally {
      setIsSubmittingInterview(false);
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    if (!companyId || !selectedAppId) return;

    try {
      const cancelled = await companyApplicationsApi.cancelInterview(companyId, selectedAppId, interviewId, cancelInterviewReason);
      setInterviewsList(prev => prev.map(i => i.id === interviewId ? cancelled : i));
      setCancellingInterviewId(null);
      setCancelInterviewReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel interview.');
    }
  };

  const getStageBadge = (stage: ApplicationStage) => {
    return <StageBadge stage={stage} />;
  };


  return (
    <div className="portal-container employer-portal company-applications-page">
      {/* Top Header matching Picture 5 */}
      <div className="ph workflow-hero">
        <div>
          <span className="eyebrow">Candidate pipeline</span>
          <h1>Applicants</h1>
          <p className="muted">
            {jobs.find(j => j.id === selectedJobId)?.title || 'All vacancies'} · {pipelineBoard?.totalApplications ?? totalCount} candidates across 6 stages
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/company/jobs" className="btn sm">
            Vacancies ({jobs.length})
          </Link>
          <Link to="/company/dashboard" className="btn sm">
            Workspace
          </Link>
        </div>
      </div>

      {/* Main Tabs (Applicants Pipeline vs Assessment Tracking) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('applicants')}
            className={`btn btn-sm ${activeTab === 'applicants' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Users size={15} /> Candidates Pipeline
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`btn btn-sm ${activeTab === 'assessments' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Terminal size={15} /> WorkSim™ Tracking
          </button>
        </div>

        {/* View Switcher (Board vs Table) for Applicants Tab */}
        {activeTab === 'applicants' && (
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-input)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('board')}
              className={`btn btn-xs ${viewMode === 'board' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
              title="Applicant Board View"
            >
              <LayoutGrid size={14} /> Applicant Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`btn btn-xs ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
              title="Tabular List View"
            >
              <List size={14} /> Table View
            </button>
          </div>
        )}
      </div>

      {actionNotice && (
        <div 
          className={`alert ${actionNotice.type === 'success' ? 'alert-success' : 'alert-error'}`}
          style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {actionNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{actionNotice.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionNotice(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* APPLICANTS PIPELINE VIEW */}
      {activeTab === 'applicants' && (
        <>
          {/* Universal Filter & Search Bar */}
          <div className="card-form" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '0.35rem' }}>Filter by Vacancy</label>
                <select
                  className="select-standard"
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    setSearchParams(e.target.value ? { jobId: e.target.value } : {});
                    setPage(1);
                  }}
                >
                  <option value="">All Published Vacancies ({jobs.length})</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              {viewMode === 'table' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '0.35rem' }}>Recruitment Stage</label>
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
              )}

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '0.35rem' }}>Candidate Search</label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-standard"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="Search name, headline, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setPage(1);
                        if (viewMode === 'board') loadPipelineBoard(companyId || '');
                        else loadApplications(companyId || '');
                      }
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    if (viewMode === 'board') loadPipelineBoard(companyId || '');
                    else loadApplications(companyId || '');
                  }}
                  className="btn btn-secondary"
                  style={{ height: '40px', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Search size={14} /> Search
                </button>
                {(searchQuery || selectedJobId || selectedStage) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedJobId('');
                      setSelectedStage('');
                      setSearchParams({});
                      setPage(1);
                    }}
                    className="btn btn-outline"
                    style={{ height: '40px' }}
                    title="Clear filters"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW MODE 1: APPLICANT BOARD */}
          {viewMode === 'board' && (
            <div>
              {loadingBoard ? (
                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Loading recruitment pipeline board...</p>
                </div>
              ) : !pipelineBoard || pipelineBoard.totalApplications === 0 ? (
                <div className="card-form" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
                  <Users size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem' }} />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Applications in Recruitment Pipeline</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
                    {selectedJobId
                      ? 'No applications submitted yet for this vacancy.'
                      : 'Candidates will appear in the pipeline board as they apply to your published vacancies.'}
                  </p>
                  <Link to="/company/jobs" className="btn btn-primary btn-sm">
                    View Published Vacancies
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop Full Kanban Board */}
                  <div className="pipeline-desktop-view">
                    <div className="board6" aria-label="Applicant board">
                      {pipelineBoard.stages.map(column => (
                        <div className="bcol" key={column.stageName}>
                          <h4>
                            {column.stageName} <span>{column.count}</span>
                          </h4>
                          {column.applications.length === 0 ? (
                            <div className="muted" style={{ padding: '12px 6px', fontSize: '13.5px' }}>
                              No candidates
                            </div>
                          ) : (
                            column.applications.map(card => (
                              <button
                                key={card.id}
                                type="button"
                                className={`bcard ${card.matchEvidenceIndex && card.matchEvidenceIndex >= 90 ? 'hot' : ''}`}
                                onClick={() => handleOpenDetail(card.id)}
                              >
                                <b>{card.candidateName}</b>
                                <small>
                                  CV match {card.matchEvidenceIndex != null ? Math.round(card.matchEvidenceIndex) : 88}%
                                </small>
                                {card.workSimScore != null && (
                                  <span>
                                    <span className="badge b-ok nodot">
                                      Skills challenge {Math.round(card.workSimScore)}/100
                                    </span>
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Deliberate Stage-Based Interface (Section 12.2) */}
                  <div className="pipeline-mobile-view">
                    {/* Horizontal Stage Selector with Application Counts */}
                    <div className="stage-pill-selector" role="tablist" aria-label="Pipeline Stages">
                      {pipelineBoard.stages.map((stageCol, idx) => (
                        <button
                          key={stageCol.stageName}
                          type="button"
                          role="tab"
                          aria-selected={mobileActiveStageIndex === idx}
                          onClick={() => setMobileActiveStageIndex(idx)}
                          className={`stage-pill-btn ${mobileActiveStageIndex === idx ? 'active' : ''}`}
                        >
                          <span>{stageCol.stageName}</span>
                          <span className="pill-badge">{stageCol.count}</span>
                        </button>
                      ))}
                    </div>

                    {/* Vertical List of Candidate Cards for Selected Stage */}
                    {(() => {
                      const activeStage = pipelineBoard.stages[mobileActiveStageIndex] || pipelineBoard.stages[0];
                      if (!activeStage || activeStage.applications.length === 0) {
                        return (
                          <div className="card-form" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--muted)' }}>
                            <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                            <p style={{ margin: 0, fontSize: '14.5px' }}>
                              No candidates currently in <strong>{activeStage?.stageName}</strong>.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {activeStage.applications.map(card => (
                            <div key={card.id} className={`pipeline-mobile-card ${card.matchEvidenceIndex && card.matchEvidenceIndex >= 90 ? 'hot' : ''}`}>
                              <div className="pipeline-mobile-card-top">
                                <div>
                                  <b style={{ fontSize: '16px' }}>{card.candidateName}</b>
                                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {card.jobTitle}
                                  </div>
                                </div>
                                <span className="badge b-blue nodot" style={{ fontSize: '12px' }}>
                                  CV match {card.matchEvidenceIndex != null ? Math.round(card.matchEvidenceIndex) : 88}%
                                </span>
                              </div>

                              {card.workSimScore != null && (
                                <div>
                                  <span className="badge b-ok nodot">
                                    Skills challenge {Math.round(card.workSimScore)}/100
                                  </span>
                                </div>
                              )}

                              <div className="pipeline-mobile-card-actions">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Move to:</span>
                                  <select
                                    className="select-standard"
                                    style={{ height: '34px', fontSize: '12.5px', padding: '0 8px' }}
                                    value={card.currentStage}
                                    onChange={(e) => handleQuickStageChange(card.id, Number(e.target.value))}
                                  >
                                    <option value="0">Submitted</option>
                                    <option value="1">Under Review</option>
                                    <option value="2">Shortlisted</option>
                                    <option value="3">Assessment Pending</option>
                                    <option value="4">Assessment Completed</option>
                                    <option value="5">Interview Scheduled</option>
                                    <option value="6">Offered</option>
                                    <option value="7">Hired</option>
                                    <option value="8">Rejected</option>
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenDetail(card.id)}
                                  className="btn sm"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  Review Candidate →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW MODE 2: RESPONSIVE TABLE VIEW */}
          {viewMode === 'table' && (
            <>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Loading candidate applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="card-form" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
                  <Users size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem' }} />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Applications Found</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
                    {selectedJobId || selectedStage || searchQuery
                      ? 'No applications match your active filters.'
                      : 'Candidates will appear here as they submit applications to your published vacancies.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="card-table-wrapper table-desktop-view">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Vacancy</th>
                          <th>Professional Background</th>
                          <th>Recruitment Stage</th>
                          <th>Applied Date</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
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
                              <div style={{ fontSize: '0.85rem' }}>
                                {app.candidateHeadline ? (
                                  <div style={{ color: 'var(--text-primary)' }}>{app.candidateHeadline}</div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                  {app.candidateLocation || 'Remote'} • {app.yearsOfExperience != null ? `${app.yearsOfExperience} yrs exp` : 'Entry'}
                                </div>
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

                  {/* Mobile Cards View */}
                  <div className="table-mobile-cards">
                    {applications.map((app) => (
                      <div key={app.id} className="table-mobile-card">
                        <div className="table-mobile-card-header">
                          <div>
                            <b style={{ fontSize: '16px' }}>{app.candidateName}</b>
                            <small className="muted" style={{ display: 'block', marginTop: '2px', fontSize: '13px' }}>
                              {app.candidateEmail}
                            </small>
                          </div>
                          {getStageBadge(app.currentStage)}
                        </div>

                        <div className="table-mobile-card-row">
                          <span className="muted">Vacancy</span>
                          <span style={{ fontWeight: 600 }}>{app.jobTitle}</span>
                        </div>

                        {app.candidateHeadline && (
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            "{app.candidateHeadline}"
                          </div>
                        )}

                        <div className="table-mobile-card-row">
                          <span className="muted">Applied</span>
                          <span>{new Date(app.submittedAtUtc).toLocaleDateString()}</span>
                        </div>

                        <div className="table-mobile-card-actions">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(app.id)}
                            className="btn sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}
                          >
                            <Eye size={14} /> Review Candidate Workspace →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Showing page {page} of {totalPages} ({totalCount} total applications)
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="btn btn-outline btn-sm"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          className="btn btn-outline btn-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* TAB 2: WORKSIM ASSESSMENT TRACKING */}
      {activeTab === 'assessments' && (
        <div>
          {/* Assessment Filter Bar */}
          <div className="card-form" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Filter by Vacancy</label>
                <select
                  className="select-standard"
                  value={trackingJobFilter}
                  onChange={(e) => setTrackingJobFilter(e.target.value)}
                >
                  <option value="">All Vacancies</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Assessment Status</label>
                <select
                  className="select-standard"
                  value={trackingStatusFilter}
                  onChange={(e) => setTrackingStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Assigned">Assigned / Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => companyId && loadAssessmentTracking(companyId, trackingStatusFilter, trackingJobFilter)}
                  className="btn btn-secondary"
                  style={{ height: '40px', flex: 1 }}
                >
                  <RefreshCw size={14} style={{ marginRight: '0.35rem' }} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Assessment Tracking List / Table */}
          {trackingLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.25rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading WorkSim assessment tracking...</p>
            </div>
          ) : trackingList.length === 0 ? (
            <div className="card-form" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
              <Terminal size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Assessment Invitations Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
                {trackingJobFilter || trackingStatusFilter
                  ? 'No invitations match the selected vacancy or status filters.'
                  : 'Assessments attached to vacancies will be automatically dispatched to candidates upon application submission.'}
              </p>
            </div>
          ) : (
            <div className="card-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Vacancy</th>
                    <th>Assessment Scenario</th>
                    <th>Requirement</th>
                    <th>Status</th>
                    <th>Timeline</th>
                    <th>Score</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingList.map((item) => {
                    const isCompleted = item.status === 'Completed';
                    const isCancelled = item.status === 'Cancelled';
                    const canManage = !isCompleted && !isCancelled;

                    return (
                      <tr key={item.assignmentId}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {item.candidateName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              {item.candidateEmail}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {item.jobTitle}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {item.scenarioTitle}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.scenarioCategory}
                          </div>
                        </td>

                        <td>
                          {item.isRequired ? (
                            <span className="badge badge-primary" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                              Mandatory
                            </span>
                          ) : (
                            <span className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
                              Optional
                            </span>
                          )}
                        </td>

                        <td>
                          <span className={`status-badge status-${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div>Assigned: {item.assignedAtUtc ? new Date(item.assignedAtUtc).toLocaleDateString() : '—'}</div>
                            {item.deadlineUtc && <div>Deadline: {new Date(item.deadlineUtc).toLocaleDateString()}</div>}
                          </div>
                        </td>

                        <td>
                          {item.totalScore != null ? (
                            <span className="badge badge-emerald" style={{ fontWeight: 700 }}>
                              {item.totalScore.toFixed(1)} / 100
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleResendInvitation(item.assignmentId)}
                                  disabled={resendingId === item.assignmentId}
                                  className="btn btn-outline btn-xs"
                                  title="Resend invitation email"
                                >
                                  <RotateCw size={12} className={resendingId === item.assignmentId ? 'animate-spin' : ''} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCancellingItem(item)}
                                  className="btn btn-outline btn-xs text-danger"
                                  title="Cancel assessment invitation"
                                >
                                  <Ban size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CANDIDATE REVIEW WORKSPACE MODAL */}
      {selectedAppId && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                    {selectedAppDetail?.candidateName || 'Candidate Profile'}
                  </h3>
                  {selectedAppDetail && getStageBadge(selectedAppDetail.currentStage)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.25rem 0 0 0' }}>
                  Candidate for <strong>{selectedAppDetail?.jobTitle}</strong> • Submitted {selectedAppDetail && new Date(selectedAppDetail.submittedAtUtc).toLocaleDateString(undefined, { dateStyle: 'medium' })}
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
              <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading candidate review workspace...</p>
              </div>
            ) : (
              <div>
                {/* Candidate Review Tabs */}
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <button
                    onClick={() => setReviewTab('profile')}
                    className={`btn btn-xs ${reviewTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FileText size={13} /> Profile & CV
                  </button>
                  <button
                    onClick={() => setReviewTab('match')}
                    className={`btn btn-xs ${reviewTab === 'match' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Sparkles size={13} /> CV Match {matchReport && `(${matchReport.overallEvidenceIndex.toFixed(0)}%)`}
                  </button>
                  <button
                    onClick={() => setReviewTab('worksim')}
                    className={`btn btn-xs ${reviewTab === 'worksim' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Terminal size={13} /> WorkSim™ Scorecard
                  </button>
                  <button
                    onClick={() => setReviewTab('interviews')}
                    className={`btn btn-xs ${reviewTab === 'interviews' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Calendar size={13} /> Interviews ({interviewsList.length})
                  </button>
                  <button
                    onClick={() => setReviewTab('notes')}
                    className={`btn btn-xs ${reviewTab === 'notes' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Lock size={13} /> Private Notes ({notesList.length})
                  </button>
                  <button
                    onClick={() => setReviewTab('decision')}
                    className={`btn btn-xs ${reviewTab === 'decision' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <CheckCircle size={13} /> Decision & Stage
                  </button>
                </div>

                {/* TAB 1: PROFILE & CV */}
                {reviewTab === 'profile' && (
                  <div>
                    {/* Candidate Overview Card */}
                    <div style={{ 
                      backgroundColor: 'var(--bg-surface-elevated)', 
                      padding: '1.25rem', 
                      borderRadius: 'var(--radius-md)', 
                      marginBottom: '1.25rem',
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

                      {/* Links */}
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

                    {/* Candidate Summary */}
                    {selectedAppDetail.candidateSummary && (
                      <div style={{ marginBottom: '1.25rem' }}>
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
                      <div style={{ marginBottom: '1.25rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                          Candidate Cover Note
                        </h4>
                        <div style={{ 
                          backgroundColor: 'var(--bg-input)', 
                          padding: '0.85rem', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: '0.88rem', 
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          whiteSpace: 'pre-line'
                        }}>
                          {selectedAppDetail.candidateCoverNote}
                        </div>
                      </div>
                    )}

                    {/* Attached CV Card */}
                    <div style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
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
                          backgroundColor: 'rgba(2, 132, 199, 0.1)',
                          color: 'var(--primary-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.15rem 0' }}>
                            {(selectedAppDetail as any).candidateDocumentFileName || 'Submitted Candidate CV'}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {selectedAppDetail.candidateDocumentId ? 'Secure digital file • Verified candidate document' : 'No CV document attached'}
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
                  </div>
                )}

                {/* TAB 2: SKILLS FIT REPORT */}
                {reviewTab === 'match' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={18} className="text-primary" />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                          Skills Fit Report
                        </h4>
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
                      <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                        <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 0.75rem' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Analyzing candidate CV against role requirements...
                        </p>
                      </div>
                    ) : matchReportError ? (
                      <div className="alert alert-warning" style={{ fontSize: '0.85rem' }}>
                        <AlertCircle size={16} />
                        <span>{matchReportError}</span>
                      </div>
                    ) : matchReport ? (
                      <div>
                        {/* Gauge Card */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          padding: '1rem 1.25rem',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '1rem',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                              Overall Skills Match
                            </span>
                            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1.2 }}>
                              {matchReport.overallEvidenceIndex.toFixed(1)}%
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                              {matchReport.summary.supportedCount} Supported
                            </span>
                            <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                              {matchReport.summary.partiallySupportedCount} Partial
                            </span>
                            <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                              {matchReport.summary.notFoundCount} Not in CV
                            </span>
                          </div>
                        </div>

                        <div className="info-banner" style={{ marginBottom: '1rem', fontSize: '0.78rem' }}>
                          <ShieldCheck size={18} />
                          <div>
                            <strong>Skills Fit Guide:</strong> This score reflects matching skills found in the candidate CV. It is a guide to assist human recruiters, not an automated decision.
                          </div>
                        </div>

                        {/* Criteria Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {matchReport.evaluations.map((ev) => {
                            const statusStr = String(ev.status);
                            const isSupported = statusStr === 'SupportedByEvidence' || statusStr === '0';
                            const isPartial = statusStr === 'PartiallySupported' || statusStr === '1';

                            return (
                              <div
                                key={ev.id}
                                style={{
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '0.75rem',
                                  backgroundColor: isSupported ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-surface-elevated)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="badge badge-outline" style={{ fontSize: '0.68rem' }}>
                                      {ev.requirementType === 0 ? 'Mandatory (2x)' : 'Preferred (1x)'}
                                    </span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                      {ev.requirementText}
                                    </span>
                                  </div>

                                  {isSupported ? (
                                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                                      <CheckCircle size={11} /> Supported
                                    </span>
                                  ) : isPartial ? (
                                    <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                                      <AlertCircle size={11} /> Partial
                                    </span>
                                  ) : (
                                    <span className="badge badge-outline" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      <XCircle size={11} /> Not in CV
                                    </span>
                                  )}
                                </div>

                                {ev.extractedExcerpt && (
                                  <div style={{
                                    backgroundColor: 'var(--bg-input)',
                                    borderLeft: '3px solid var(--primary-color)',
                                    padding: '0.4rem 0.65rem',
                                    fontSize: '0.8rem',
                                    fontStyle: 'italic',
                                    color: 'var(--text-secondary)',
                                    margin: '0.35rem 0'
                                  }}>
                                    &ldquo;{ev.extractedExcerpt}&rdquo;
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No match report available.</p>
                    )}
                  </div>
                )}

                {/* TAB 3: WORKSIM ASSESSMENT SCORECARD */}
                {reviewTab === 'worksim' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={18} className="text-primary" />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                          WorkSim™ Interactive Simulation Scorecard
                        </h4>
                      </div>

                      {assessmentResult && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          Score: {assessmentResult.totalScore.toFixed(1)} / 100.0
                        </span>
                      )}
                    </div>

                    {loadingAssessment ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                        <RefreshCw size={24} className="animate-spin text-primary" style={{ margin: '0 auto 0.5rem auto' }} />
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
                            Criterion Breakdown & Observed Evidence:
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
                      </div>
                    ) : (
                      <div style={{ padding: '2rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        <Terminal size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>No Simulation Completed Yet</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
                          When this candidate completes the assigned WorkSim assessment, verified scores will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: INTERVIEW COORDINATION */}
                {reviewTab === 'interviews' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} className="text-primary" />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                          Interview Coordination ({interviewsList.length})
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowScheduleForm(!showScheduleForm)}
                        className="btn btn-primary btn-xs"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Plus size={13} /> {showScheduleForm ? 'Close Form' : 'Schedule Interview'}
                      </button>
                    </div>

                    {interviewError && (
                      <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <AlertCircle size={15} /> {interviewError}
                      </div>
                    )}

                    {/* Schedule Interview Form */}
                    {showScheduleForm && (
                      <form onSubmit={handleScheduleInterview} style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        marginBottom: '1.25rem'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700 }}>
                          Schedule Candidate Interview
                        </h5>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Interview Format / Type</label>
                            <select
                              className="select-standard"
                              value={scheduleType}
                              onChange={(e) => setScheduleType(parseInt(e.target.value, 10))}
                            >
                              <option value={0}>Initial Screening</option>
                              <option value={1}>Technical Assessment</option>
                              <option value={2}>Cultural / Team Fit</option>
                              <option value={3}>Final Leadership Interview</option>
                            </select>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Scheduled Start (Local Time)</label>
                            <input
                              type="datetime-local"
                              className="input-standard"
                              value={scheduleStart}
                              onChange={(e) => setScheduleStart(e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Scheduled End (Local Time)</label>
                            <input
                              type="datetime-local"
                              className="input-standard"
                              value={scheduleEnd}
                              onChange={(e) => setScheduleEnd(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ fontSize: '0.82rem' }}>Meeting Location / Video Conference Link / Instructions</label>
                          <input
                            type="text"
                            className="input-standard"
                            placeholder="e.g. Google Meet: https://meet.google.com/xyz-abc or Office Room 4B"
                            value={scheduleLocation}
                            onChange={(e) => setScheduleLocation(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setShowScheduleForm(false)}
                            className="btn btn-outline btn-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={isSubmittingInterview}
                          >
                            {isSubmittingInterview ? 'Scheduling...' : 'Confirm & Notify Candidate'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Interview List */}
                    {interviewsList.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No interviews recorded for this application yet. Click &ldquo;Schedule Interview&rdquo; to coordinate a session.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {interviewsList.map(interview => {
                          const isCanceled = String(interview.status).toLowerCase() === 'canceled' || String(interview.status) === '3';

                          return (
                            <div
                              key={interview.id}
                              style={{
                                backgroundColor: isCanceled ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                    {String(interview.interviewType)} Interview
                                  </strong>
                                  <span className={`status-badge status-${String(interview.status).toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                                    {String(interview.status)}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                  <span>
                                    <Clock size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                    {new Date(interview.scheduledStartUtc).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                  {interview.meetingLocation && (
                                    <span>
                                      <MapPin size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                      {interview.meetingLocation}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!isCanceled && (
                                <button
                                  type="button"
                                  onClick={() => setCancellingInterviewId(interview.id)}
                                  className="btn btn-outline btn-xs text-danger"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <Ban size={12} /> Cancel Interview
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: PRIVATE RECRUITER NOTES */}
                {reviewTab === 'notes' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={18} className="text-primary" />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                          Internal Recruiter Notes ({notesList.length})
                        </h4>
                      </div>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        🔒 Strictly Confidential
                      </span>
                    </div>

                    <div className="info-banner" style={{ marginBottom: '1.25rem', fontSize: '0.78rem' }}>
                      <Lock size={15} />
                      <div>
                        <strong>Private Company Data:</strong> Internal notes are accessible exclusively to authorized members of your organization. Candidates and other companies never see these comments.
                      </div>
                    </div>

                    {noteError && (
                      <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <AlertCircle size={15} /> {noteError}
                      </div>
                    )}

                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <textarea
                          className="input-standard"
                          rows={3}
                          placeholder="Write internal review feedback, interview debrief, or candidate observation..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          maxLength={4000}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={isSubmittingNote || !newNoteText.trim()}
                        >
                          {isSubmittingNote ? 'Saving Note...' : 'Add Private Note'}
                        </button>
                      </div>
                    </form>

                    {/* Notes Thread */}
                    {notesList.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No internal recruiter notes added yet. Use the box above to record observations.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {notesList.map(note => (
                          <div
                            key={note.id}
                            style={{
                              backgroundColor: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '1rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                  {note.authorName}
                                </strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {new Date(note.createdAtUtc).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteNote(note.id)}
                                className="btn-icon text-danger"
                                title="Delete note"
                                style={{ padding: '0.2rem' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                              {note.noteText}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: DECISION & TIMELINE */}
                {reviewTab === 'decision' && (
                  <div>
                    {/* Stage Progression Form */}
                    <form onSubmit={handleStageFormSubmit} style={{ 
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '1.25rem',
                      marginBottom: '1.75rem' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                          Recruitment Decision & Pipeline Progression
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
                          <label htmlFor="newStage" className="form-label" style={{ fontSize: '0.85rem' }}>Promote / Move to Stage</label>
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
                            <option value={7}>Hired (Consequential)</option>
                            <option value={8}>Rejected (Consequential)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="stageReason" className="form-label" style={{ fontSize: '0.85rem' }}>Decision Reason / Log Note</label>
                          <input
                            id="stageReason"
                            type="text"
                            className="input-standard"
                            placeholder="e.g. Exceptional technical interview and WorkSim score"
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
                          {isUpdatingStage ? 'Updating...' : 'Update Recruitment Stage'}
                        </button>
                      </div>
                    </form>

                    {/* Immutable Status History Timeline */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        Recruitment Audit History Timeline
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
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                  <button 
                    onClick={() => { setSelectedAppId(null); setSelectedAppDetail(null); }}
                    className="btn btn-secondary"
                  >
                    Close Review Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONSEQUENTIAL DECISION CONFIRMATION MODAL */}
      {confirmingConsequentialDecision && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Confirm Consequential Decision: Mark as {confirmingConsequentialDecision.stageName}?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to transition candidate <strong>{selectedAppDetail?.candidateName}</strong> to stage <strong>{confirmingConsequentialDecision.stageName}</strong>?
              {confirmingConsequentialDecision.stage === 8 && ' This will issue an official rejection status update.'}
              {confirmingConsequentialDecision.stage === 7 && ' This will mark the recruitment process as completed with a successful hire.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setConfirmingConsequentialDecision(null)}
              >
                Back to Review
              </button>
              <button
                type="button"
                className={`btn btn-sm ${confirmingConsequentialDecision.stage === 8 ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => executeStageTransition(confirmingConsequentialDecision.stage)}
              >
                Confirm {confirmingConsequentialDecision.stageName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL INTERVIEW MODAL */}
      {cancellingInterviewId && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Cancel Candidate Interview
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Are you sure you want to cancel this interview session? A cancellation notification will be delivered to the candidate.
            </p>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Cancellation Reason (Optional)</label>
              <input
                type="text"
                className="input-standard"
                placeholder="e.g. Rescheduling required or interviewer conflict"
                value={cancelInterviewReason}
                onChange={(e) => setCancelInterviewReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setCancellingInterviewId(null); setCancelInterviewReason(''); }}
              >
                Keep Interview
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleCancelInterview(cancellingInterviewId)}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL ASSESSMENT MODAL */}
      {cancellingItem && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Cancel Assessment Invitation
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to cancel the assessment invitation for <strong>{cancellingItem.candidateName}</strong> on <em>{cancellingItem.scenarioTitle}</em>?
            </p>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Cancellation Reason (Optional)</label>
              <input
                type="text"
                className="input-standard"
                placeholder="e.g. Assessment requirements updated or position filled"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setCancellingItem(null); setCancelReason(''); }}
              >
                Keep Invitation
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleConfirmCancel}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Ban size={14} /> Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
