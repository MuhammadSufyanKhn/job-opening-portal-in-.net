import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Clock, 
  FileCheck,
  Star,
  Layers
} from 'lucide-react';
import { candidateDocumentsApi } from '../services/api';
import type { CandidateDocumentSummary } from '../types/document';

export const CandidateDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<CandidateDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Staged File Upload State
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Versioning state (uploading new version for a specific document)
  const [versionTargetDoc, setVersionTargetDoc] = useState<CandidateDocumentSummary | null>(null);

  // Delete confirmation modal state
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const versionInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await candidateDocumentsApi.getMyDocuments();
      setDocuments(data || []);
    } catch (err: any) {
      handleApiError(err, 'Failed to retrieve your CV documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err: any, fallbackMessage: string) => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail || err.response?.data?.title;

    if (status === 413) {
      setError('File exceeds the 10 MB maximum upload limit. Please compress your document and try again.');
    } else if (status === 415) {
      setError('Unsupported file format. HireSphere requires standard PDF (.pdf) or Word (.docx) files.');
    } else if (status === 401 || status === 403) {
      setError('Your authentication session has expired. Please sign in again.');
    } else if (detail) {
      setError(detail);
    } else if (err.message && err.message.toLowerCase().includes('network')) {
      setError('Network connection error. Please check your internet connection and retry.');
    } else {
      setError(fallbackMessage);
    }
  };

  const validateAndStageFile = (file: File) => {
    setValidationError(null);
    setError(null);

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.pdf', '.docx'];

    if (!validExtensions.includes(ext)) {
      setValidationError(`Unsupported file type (${ext}). Please select a .pdf or .docx document.`);
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit.`);
      return false;
    }

    setStagedFile(file);
    setUploadProgress(0);
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndStageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndStageFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!stagedFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);
    setSuccessMsg(null);

    try {
      if (versionTargetDoc) {
        await candidateDocumentsApi.uploadNewVersion(
          versionTargetDoc.id,
          stagedFile,
          (percent) => setUploadProgress(percent)
        );
        setSuccessMsg(`New version of "${versionTargetDoc.originalFileName}" uploaded successfully.`);
      } else {
        await candidateDocumentsApi.uploadCv(
          stagedFile,
          (percent) => setUploadProgress(percent)
        );
        setSuccessMsg(`"${stagedFile.name}" uploaded successfully and analyzed for job matching.`);
      }

      setStagedFile(null);
      setVersionTargetDoc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (versionInputRef.current) versionInputRef.current.value = '';

      await loadDocuments();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      handleApiError(err, 'Failed to upload CV. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancelStaged = () => {
    setStagedFile(null);
    setVersionTargetDoc(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (versionInputRef.current) versionInputRef.current.value = '';
  };

  const handleSetDefault = async (docId: string, fileName: string) => {
    try {
      await candidateDocumentsApi.setDefaultCv(docId);
      setDocuments(prev => prev.map(d => ({ ...d, isDefault: d.id === docId })));
      setSuccessMsg(`"${fileName}" set as your primary CV for new applications.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      handleApiError(err, 'Unable to set default CV.');
    }
  };

  const confirmDelete = async () => {
    if (!deletingDocId) return;
    setIsDeleting(true);
    try {
      await candidateDocumentsApi.deleteDocument(deletingDocId);
      setDocuments(prev => prev.filter(d => d.id !== deletingDocId));
      setSuccessMsg('CV document removed.');
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeletingDocId(null);
    } catch (err: any) {
      handleApiError(err, 'Unable to delete CV document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      await candidateDocumentsApi.downloadCv(docId, fileName);
    } catch (err: any) {
      handleApiError(err, 'Unable to download CV.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="page candidate-portal candidate-documents-page">
      <div className="container" style={{ maxWidth: '1040px' }}>
        
        {/* Editorial Page Header */}
        <div className="ph" style={{ marginBottom: '32px' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: '10px' }}>
              <ShieldCheck size={14} className="ic" style={{ color: 'var(--ok)' }} />
              <span>Private Document Vault</span>
            </div>
            <h1 style={{ letterSpacing: '-0.035em', fontSize: 'clamp(28px, 3.5vw, 42px)' }}>
              CV & Resume Management
            </h1>
            <p className="muted" style={{ fontSize: '16.5px', maxWidth: '62ch', marginTop: '8px' }}>
              Upload and manage your CVs with automatic skills extraction. Documents are encrypted and only accessible to employers when you explicitly submit an application.
            </p>
          </div>
          <div className="row">
            <button
              type="button"
              className="btn btn-lime"
              onClick={() => {
                setVersionTargetDoc(null);
                fileInputRef.current?.click();
              }}
            >
              <Upload size={16} />
              <span>Upload New CV</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={versionInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div 
            className="card" 
            style={{ 
              background: 'var(--ok-bg)', 
              borderColor: 'rgba(15, 122, 85, 0.25)', 
              color: 'var(--ok)', 
              padding: '14px 18px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}
          >
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        {error && (
          <div 
            className="card" 
            style={{ 
              background: 'var(--bad-bg)', 
              borderColor: 'rgba(180, 35, 24, 0.25)', 
              color: 'var(--bad)', 
              padding: '14px 18px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '24px'
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Upload Issue</strong>
              <span style={{ fontSize: '14.5px' }}>{error}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setError(null)} 
              className="btn sm" 
              style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--bad)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {validationError && (
          <div 
            className="card" 
            style={{ 
              background: 'var(--warn-bg)', 
              borderColor: 'rgba(138, 83, 0, 0.25)', 
              color: 'var(--warn)', 
              padding: '14px 18px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{validationError}</span>
          </div>
        )}

        {/* Staged File Card (Preview before upload) */}
        {stagedFile && (
          <div 
            className="card panel" 
            style={{ 
              border: '2px solid var(--accent)', 
              borderRadius: '16px', 
              marginBottom: '28px',
              background: '#FFFFFF',
              boxShadow: 'var(--sh-md)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  style={{ 
                    width: '46px', 
                    height: '46px', 
                    borderRadius: '12px', 
                    background: 'var(--soft)', 
                    color: 'var(--accent)', 
                    display: 'grid', 
                    placeItems: 'center' 
                  }}
                >
                  <FileText size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '17px', margin: 0 }}>{stagedFile.name}</h3>
                    {versionTargetDoc && (
                      <span className="badge b-pur nodot" style={{ fontSize: '11px' }}>
                        New version for {versionTargetDoc.originalFileName}
                      </span>
                    )}
                  </div>
                  <small className="muted" style={{ fontSize: '13.5px' }}>
                    {formatFileSize(stagedFile.size)} · Ready to upload & parse
                  </small>
                </div>
              </div>

              <div className="row" style={{ gap: '8px' }}>
                <button
                  type="button"
                  className="btn sm"
                  disabled={isUploading}
                  onClick={handleCancelStaged}
                >
                  <X size={15} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  className="btn btn-lime sm"
                  disabled={isUploading}
                  onClick={handleUploadSubmit}
                  style={{ minWidth: '120px' }}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={15} className="spinner" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>{versionTargetDoc ? 'Upload Version' : 'Upload CV'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', marginBottom: '6px' }}>
                  <span>Transferring document securely...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div 
                  style={{ 
                    height: '8px', 
                    background: 'var(--line)', 
                    borderRadius: '999px', 
                    overflow: 'hidden' 
                  }}
                >
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${uploadProgress}%`, 
                      background: 'var(--accent)', 
                      transition: 'width 0.2s ease' 
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drop Zone */}
        {!stagedFile && (
          <div
            className={`drop ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              cursor: 'pointer', 
              marginBottom: '32px',
              padding: '36px 24px',
              borderColor: isDragOver ? 'var(--accent)' : 'var(--line)',
              background: isDragOver ? '#F5F8FF' : '#FFFFFF',
              transition: 'all 0.2s ease',
              borderRadius: '16px'
            }}
          >
            <div 
              className="fi" 
              style={{ 
                width: '56px', 
                height: '56px', 
                fontSize: '24px', 
                background: 'var(--soft)',
                color: 'var(--accent)',
                marginBottom: '8px'
              }}
            >
              <Upload size={26} />
            </div>
            <b style={{ fontSize: '17px' }}>Choose a CV file or drag and drop here</b>
            <span className="muted" style={{ fontSize: '14.5px', maxWidth: '440px', lineHeight: 1.4 }}>
              Supports PDF (.pdf) and Microsoft Word (.docx) documents up to 10 MB. Verified with automated security checks.
            </span>
          </div>
        )}

        {/* Document List Section */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', letterSpacing: '-0.02em' }}>Uploaded Resumes</h2>
            <p className="muted" style={{ fontSize: '14px' }}>
              {documents.length} {documents.length === 1 ? 'document' : 'documents'} stored in your vault
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: '60px 0' }}>
            <div className="spinner" />
            <p className="loading-message">Retrieving your document vault...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="card panel empty-state" style={{ padding: '52px 24px', textAlign: 'center' }}>
            <div 
              style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'var(--soft)', 
                color: 'var(--accent)', 
                display: 'grid', 
                placeItems: 'center', 
                margin: '0 auto 16px' 
              }}
            >
              <FileCheck size={28} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>No CVs uploaded yet</h3>
            <p className="muted" style={{ maxWidth: '420px', margin: '0 auto 20px', fontSize: '15px' }}>
              Upload your CV to enable one-click job applications and automatic skills matching against open vacancies.
            </p>
            <button
              type="button"
              className="btn btn-lime"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              <span>Upload Your First CV</span>
            </button>
          </div>
        ) : (
          <div className="cvs" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className={`card cv ${doc.isDefault ? 'def' : ''}`}
                style={{ 
                  padding: '24px', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div 
                      style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '10px', 
                        background: 'var(--soft)', 
                        color: 'var(--accent)', 
                        display: 'grid', 
                        placeItems: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, wordBreak: 'break-word' }}>
                        {doc.originalFileName}
                      </h3>
                      <small className="muted" style={{ fontSize: '12.5px' }}>
                        {formatFileSize(doc.fileSizeBytes)} · Version {doc.versionNumber}
                      </small>
                    </div>
                  </div>

                  {doc.isDefault ? (
                    <span 
                      className="badge b-ok nodot" 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                    >
                      <Star size={12} fill="currentColor" />
                      <span>Primary</span>
                    </span>
                  ) : null}
                </div>

                {/* Date & Extraction Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} />
                    <span>Uploaded {new Date(doc.createdAtUtc).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </span>
                </div>

                {/* Extracted Skills */}
                {(doc as any).extractedSkills && (doc as any).extractedSkills.length > 0 ? (
                  <div>
                    <div className="muted" style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Verified Skills Extracted
                    </div>
                    <div className="tags">
                      {(doc as any).extractedSkills.slice(0, 6).map((sk: string, i: number) => (
                        <span key={i} className="tag">{sk}</span>
                      ))}
                      {(doc as any).extractedSkills.length > 6 && (
                        <span className="tag o">+{(doc as any).extractedSkills.length - 6} more</span>
                      )}
                    </div>
                  </div>
                ) : doc.extractedSkillsCount > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge b-ok nodot">{doc.extractedSkillsCount} skills parsed</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    <span>Parser ready · Analyzed for matching</span>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div 
                  style={{ 
                    marginTop: 'auto', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--line)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div className="row" style={{ gap: '6px' }}>
                    {!doc.isDefault && (
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => handleSetDefault(doc.id, doc.originalFileName)}
                        title="Use as your default CV when applying to vacancies"
                      >
                        <Star size={13} />
                        <span>Set Default</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => {
                        setVersionTargetDoc(doc);
                        versionInputRef.current?.click();
                      }}
                      title="Upload a revised version of this CV"
                    >
                      <Layers size={13} />
                      <span>New Version</span>
                    </button>
                  </div>

                  <div className="row" style={{ gap: '6px' }}>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => handleDownload(doc.id, doc.originalFileName)}
                      title="Download copy"
                      aria-label={`Download ${doc.originalFileName}`}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn sm danger"
                      onClick={() => setDeletingDocId(doc.id)}
                      title="Delete CV"
                      aria-label={`Delete ${doc.originalFileName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingDocId && (
          <div className="overlay" onClick={() => setDeletingDocId(null)}>
            <div 
              className="card modal" 
              onClick={(e) => e.stopPropagation()} 
              style={{ maxWidth: '440px', padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div 
                  style={{ 
                    width: '42px', 
                    height: '42px', 
                    borderRadius: '50%', 
                    background: 'var(--bad-bg)', 
                    color: 'var(--bad)', 
                    display: 'grid', 
                    placeItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>Delete CV Document?</h3>
                  <small className="muted">This action will remove the CV from your active vault.</small>
                </div>
              </div>
              <p className="muted" style={{ fontSize: '14.5px', marginBottom: '22px' }}>
                Any pending job applications already submitted with this CV will retain their snapshot for recruiter review.
              </p>
              <div className="row" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={isDeleting}
                  onClick={() => setDeletingDocId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CandidateDocuments;
