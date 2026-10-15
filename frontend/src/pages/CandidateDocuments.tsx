import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2
} from 'lucide-react';
import { candidateDocumentsApi } from '../services/api';
import type { CandidateDocumentSummary } from '../types/document';

export const CandidateDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<CandidateDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setError(err.response?.data?.detail || 'Failed to retrieve your CVs.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setToastMsg('File size exceeds the 10 MB limit.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    setIsUploading(true);
    try {
      await candidateDocumentsApi.uploadCv(file);
      setToastMsg('CV uploaded successfully.');
      setTimeout(() => setToastMsg(null), 3000);
      await loadDocuments();
    } catch (err: any) {
      setToastMsg(err.response?.data?.detail || 'Failed to upload CV file.');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetDefault = async (docId: string) => {
    try {
      await candidateDocumentsApi.setDefaultCv(docId);
      setDocuments(prev => prev.map(d => ({ ...d, isDefault: d.id === docId })));
      setToastMsg('Default CV updated.');
      setTimeout(() => setToastMsg(null), 2500);
    } catch {
      setToastMsg('Unable to set default CV.');
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await candidateDocumentsApi.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setToastMsg('CV deleted.');
      setTimeout(() => setToastMsg(null), 2500);
    } catch {
      setToastMsg('Unable to delete CV.');
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      await candidateDocumentsApi.downloadCv(docId, fileName);
    } catch {
      setToastMsg('Unable to download CV.');
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '182 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="page candidate-portal candidate-documents-page">
      <div className="container">
        {/* Header */}
        <div className="ph workflow-hero">
          <div>
            <span className="eyebrow">Candidate toolkit</span>
            <h1>My CVs</h1>
            <p>Private storage for your resumes. Companies only see a CV when you apply.</p>
          </div>
          <div className="row">
            <button
              type="button"
              className="btn primary"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              <span>{isUploading ? 'Uploading...' : 'Upload CV'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {toastMsg && (
          <div className="toast" role="status">
            {toastMsg}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          className="drop"
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer', marginBottom: '24px' }}
        >
          <div className="fi">
            <Upload size={22} />
          </div>
          <b>Choose a file or drag and drop here</b>
          <span className="muted">
            PDF or DOCX, up to 10 MB. We check every file before reading it.
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p className="loading-message">Loading your CVs...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="card panel" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <p className="muted">No CVs uploaded yet. Upload your resume above to start applying.</p>
          </div>
        ) : (
          <div className="cvs">
            {documents.map((doc) => (
              <div key={doc.id} className={`card cv ${doc.isDefault ? 'def' : ''}`}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3>
                    <FileText size={20} className="text-primary" />
                    <span>{doc.originalFileName}</span>
                  </h3>
                  {doc.isDefault && <span className="badge b-blue">Default</span>}
                </div>

                <small className="muted">
                  {formatFileSize(doc.fileSizeBytes)} · uploaded {new Date(doc.createdAtUtc).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </small>

                {(doc as any).extractedSkills && (doc as any).extractedSkills.length > 0 ? (
                  <div>
                    <div className="muted" style={{ fontSize: '13px', marginBottom: '6px' }}>
                      Extracted skills
                    </div>
                    <div className="tags">
                      {(doc as any).extractedSkills.slice(0, 6).map((sk: string, i: number) => (
                        <span key={i} className="tag">{sk}</span>
                      ))}
                    </div>
                  </div>
                ) : doc.extractedSkillsCount > 0 ? (
                  <div>
                    <span className="badge b-ok">{doc.extractedSkillsCount} skills extracted</span>
                  </div>
                ) : null}

                <div className="row" style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  {!doc.isDefault && (
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => handleSetDefault(doc.id)}
                    >
                      Set as default
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => handleDownload(doc.id, doc.originalFileName)}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    className="btn sm danger"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDocuments;
