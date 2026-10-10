import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Star, 
  Download, 
  Trash2, 
  History, 
  Eye, 
  X,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { candidateDocumentsApi } from '../services/api';
import type { CandidateDocumentSummary, CandidateDocumentDetail, ExtractionStatus } from '../types/document';

export const CandidateDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<CandidateDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Version upload state
  const [versionTargetDoc, setVersionTargetDoc] = useState<CandidateDocumentSummary | null>(null);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement | null>(null);

  // Detail Modal state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocDetail, setSelectedDocDetail] = useState<CandidateDocumentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete modal state
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<CandidateDocumentSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await candidateDocumentsApi.getMyDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to retrieve your CV document library.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB maximum limit.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setUploadError('Unsupported file type. Please upload a .pdf or .docx document.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setSuccessMessage(null);

    try {
      await candidateDocumentsApi.uploadCv(file);
      setSuccessMessage(`Document "${file.name}" uploaded successfully and indexed.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDocuments();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.title || 'Failed to upload document.';
      setUploadError(detail);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVersionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !versionTargetDoc) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB maximum limit.');
      return;
    }

    setIsUploadingVersion(true);
    setUploadError(null);

    try {
      await candidateDocumentsApi.uploadNewVersion(versionTargetDoc.id, file);
      setSuccessMessage(`New version uploaded for "${versionTargetDoc.originalFileName}".`);
      setVersionTargetDoc(null);
      if (versionFileInputRef.current) versionFileInputRef.current.value = '';
      await loadDocuments();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.title || 'Failed to upload new version.';
      setUploadError(detail);
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleSetDefault = async (docId: string, fileName: string) => {
    try {
      await candidateDocumentsApi.setDefaultCv(docId);
      setSuccessMessage(`"${fileName}" set as your default primary CV for applications.`);
      await loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update primary CV status.');
    }
  };

  const handleDownload = async (doc: CandidateDocumentSummary) => {
    try {
      await candidateDocumentsApi.downloadCv(doc.id, doc.originalFileName);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download CV file. Access may be restricted.');
    }
  };

  const handleViewDetails = async (docId: string) => {
    setSelectedDocId(docId);
    setLoadingDetail(true);
    try {
      const detail = await candidateDocumentsApi.getDocument(docId);
      setSelectedDocDetail(detail);
    } catch (err: any) {
      console.error('Failed to load document details', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetDoc) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await candidateDocumentsApi.deleteDocument(deleteTargetDoc.id);
      setSuccessMessage(`CV "${deleteTargetDoc.originalFileName}" deleted successfully.`);
      setDeleteTargetDoc(null);
      await loadDocuments();
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || err.response?.data?.title || 'Failed to delete CV document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderExtractionBadge = (status: ExtractionStatus | number) => {
    const s = String(status);
    if (s === 'Success' || s === '2') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Text Extracted
        </span>
      );
    }
    if (s === 'Processing' || s === '1') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          Processing Text...
        </span>
      );
    }
    if (s === 'ScannedPdfDetected' || s === '4') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
          Scanned / Image PDF
        </span>
      );
    }
    if (s === 'Failed' || s === '3') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Extraction Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Queued
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            CV & Document Library
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Secure, private document management with automated text extraction and explainable qualification matching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Uploading & Parsing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload New CV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security & Privacy Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><strong>Zero Public Exposure:</strong> Stored securely outside public web roots with unguessable storage keys and SHA-256 integrity verification.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Max Size: 10 MB</span>
          <span>•</span>
          <span>Accepted: PDF, DOCX</span>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {(error || uploadError) && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error || uploadError}</span>
          </div>
          <button onClick={() => { setError(null); setUploadError(null); }} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-xl p-6 h-36"></div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl p-8">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No CV documents uploaded yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Upload your resume (.pdf or .docx) to enable fast one-click job applications and receive transparent, explainable skill matching.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Your Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white border rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${
                doc.isDefault ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* File Details */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    doc.fileExtension.toLowerCase() === '.pdf' 
                      ? 'bg-red-50 text-red-600 border border-red-100' 
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    <FileText className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-base">
                        {doc.originalFileName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                        v{doc.versionNumber}
                      </span>
                      {doc.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          <Star className="w-3 h-3 fill-indigo-600" />
                          Default CV
                        </span>
                      )}
                      {renderExtractionBadge(doc.extractionStatus)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>Size: {formatFileSize(doc.fileSizeBytes)}</span>
                      <span>•</span>
                      <span>Uploaded: {new Date(doc.createdAtUtc).toLocaleDateString()}</span>
                      {doc.extractedSkillsCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                            <Sparkles className="w-3 h-3" />
                            {doc.extractedSkillsCount} skills indexed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  <button
                    onClick={() => handleViewDetails(doc.id)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View Extracted Qualifications"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Download Protected CV"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setVersionTargetDoc(doc);
                      versionFileInputRef.current?.click();
                    }}
                    disabled={isUploadingVersion && versionTargetDoc?.id === doc.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    title="Upload New Version"
                  >
                    {isUploadingVersion && versionTargetDoc?.id === doc.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <History className="w-3.5 h-3.5" />
                    )}
                    New Version
                  </button>

                  {!doc.isDefault && (
                    <button
                      onClick={() => handleSetDefault(doc.id, doc.originalFileName)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Set as Default
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTargetDoc(doc)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete CV"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input for New Versions */}
      <input
        type="file"
        ref={versionFileInputRef}
        onChange={handleVersionUpload}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
      />

      {/* View Detail Modal */}
      {selectedDocId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Extracted CV Information</h3>
                <p className="text-xs text-gray-500">Deterministic extraction used for explainable matching.</p>
              </div>
              <button
                onClick={() => { setSelectedDocId(null); setSelectedDocDetail(null); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {loadingDetail ? (
                <div className="py-12 text-center text-gray-400">Loading extracted details...</div>
              ) : selectedDocDetail ? (
                <>
                  {/* Extracted Skills */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Extracted Technical Skills ({selectedDocDetail.extractedSkills.length})
                    </h4>
                    {selectedDocDetail.extractedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDocDetail.extractedSkills.map((skill, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No recognized technical skills found in document text.</p>
                    )}
                  </div>

                  {/* Certifications */}
                  {selectedDocDetail.extractedCertifications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Identified Certifications
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDocDetail.extractedCertifications.map((cert, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-medium border border-amber-200">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education Degrees */}
                  {selectedDocDetail.extractedEducation.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Education & Qualifications
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDocDetail.extractedEducation.map((edu, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-medium border border-teal-200">
                            {edu}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Text Snippet */}
                  {selectedDocDetail.extractedTextSnippet && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Extracted Text Preview
                      </h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-mono text-xs text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {selectedDocDetail.extractedTextSnippet}
                      </div>
                    </div>
                  )}

                  {/* Integrity Metadata */}
                  <div className="border-t border-gray-100 pt-4 text-xs text-gray-500 space-y-1">
                    <div><strong>Content Hash:</strong> <span className="font-mono">{selectedDocDetail.contentHash || 'N/A'}</span></div>
                    <div><strong>Version:</strong> v{selectedDocDetail.versionNumber} ({selectedDocDetail.versionsCount} total in chain)</div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => { setSelectedDocId(null); setSelectedDocDetail(null); }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete CV Document?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteTargetDoc.originalFileName}</strong>?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-6">
              Note: If this CV was attached to active job applications, deletion will be blocked to preserve employer audit history.
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setDeleteTargetDoc(null); setDeleteError(null); }}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
