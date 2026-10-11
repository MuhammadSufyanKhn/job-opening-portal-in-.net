import axios, { AxiosError } from 'axios';
import type { AuthResponse, CandidateProfile, CompanyMember, CompanyReview, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hiresphere_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hiresphere_token');
      localStorage.removeItem('hiresphere_refresh');
      // If not already on login/register page, trigger redirect
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  registerCandidate: (data: any) => api.post<AuthResponse>('/auth/register-candidate', data).then(r => r.data),
  registerCompany: (data: any) => api.post<AuthResponse>('/auth/register-company', data).then(r => r.data),
  login: (data: any) => api.post<AuthResponse>('/auth/login', data).then(r => r.data),
  getCurrentUser: () => api.get<User>('/auth/me').then(r => r.data),
  changePassword: (data: any) => api.post('/auth/change-password', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
};

// Candidate endpoints
export const candidateApi = {
  getProfile: () => api.get<CandidateProfile>('/candidates/me/profile').then(r => r.data),
  updateProfile: (data: any) => api.put<CandidateProfile>('/candidates/me/profile', data).then(r => r.data),
};

// Company endpoints
export const companyApi = {
  getMyCompanies: () => api.get<any[]>('/companies/my').then(r => r.data),
  getCompany: (companyId: string) => api.get(`/companies/${companyId}`).then(r => r.data),
  updateProfile: (companyId: string, data: any) => api.put(`/companies/${companyId}`, data).then(r => r.data),
  getMembers: (companyId: string) => api.get<CompanyMember[]>(`/companies/${companyId}/members`).then(r => r.data),
  inviteMember: (companyId: string, data: any) => api.post<CompanyMember>(`/companies/${companyId}/members/invite`, data).then(r => r.data),
  removeMember: (companyId: string, memberId: string) => api.delete(`/companies/${companyId}/members/${memberId}`).then(r => r.data),
};

// Admin endpoints
export const adminApi = {
  getPendingCompanies: () => api.get<CompanyReview[]>('/admin/companies/pending').then(r => r.data),
  getAllCompanies: (status?: string) => api.get<CompanyReview[]>('/admin/companies', { params: { status } }).then(r => r.data),
  getCompanyDetails: (id: string) => api.get<CompanyReview>(`/admin/companies/${id}`).then(r => r.data),
  approveCompany: (id: string) => api.post(`/admin/companies/${id}/approve`).then(r => r.data),
  rejectCompany: (id: string, reason: string) => api.post(`/admin/companies/${id}/reject`, { rejectionReason: reason }).then(r => r.data),
  suspendCompany: (id: string, reason: string) => api.post(`/admin/companies/${id}/suspend`, { reason }).then(r => r.data),
  restoreCompany: (id: string) => api.post(`/admin/companies/${id}/restore`).then(r => r.data),
};

// Public Marketplace API
export const jobsApi = {
  searchJobs: (params?: any) => api.get<import('../types/recruitment').PagedResult<import('../types/recruitment').PublicJobPostingSummary>>('/jobs', { params }).then(r => r.data),
  getJobDetail: (id: string) => api.get<import('../types/recruitment').PublicJobPostingDetail>(`/jobs/${id}`).then(r => r.data),
  getCategories: () => api.get<import('../types/recruitment').JobCategory[]>('/jobs/categories').then(r => r.data),
};

// Company Job Management API
export const companyJobsApi = {
  getJobs: (companyId: string, params?: any) => api.get<import('../types/recruitment').PagedResult<import('../types/recruitment').JobPostingSummary>>(`/companies/${companyId}/jobs`, { params }).then(r => r.data),
  getJob: (companyId: string, jobId: string) => api.get<import('../types/recruitment').JobPostingDetail>(`/companies/${companyId}/jobs/${jobId}`).then(r => r.data),
  createJob: (companyId: string, data: any) => api.post<import('../types/recruitment').JobPostingDetail>(`/companies/${companyId}/jobs`, data).then(r => r.data),
  updateJob: (companyId: string, jobId: string, data: any) => api.put<import('../types/recruitment').JobPostingDetail>(`/companies/${companyId}/jobs/${jobId}`, data).then(r => r.data),
  publishJob: (companyId: string, jobId: string) => api.post<import('../types/recruitment').JobPostingDetail>(`/companies/${companyId}/jobs/${jobId}/publish`).then(r => r.data),
  pauseJob: (companyId: string, jobId: string) => api.post<import('../types/recruitment').JobPostingDetail>(`/companies/${companyId}/jobs/${jobId}/pause`).then(r => r.data),
  reopenJob: (companyId: string, jobId: string) => api.post<import('../types/recruitment').JobPostingDetail>(`/companies/${companyId}/jobs/${jobId}/reopen`).then(r => r.data),
  closeJob: (companyId: string, jobId: string) => api.post<import('../types/recruitment').JobPostingDetail>(`/companies/${companyId}/jobs/${jobId}/close`).then(r => r.data),
  archiveJob: (companyId: string, jobId: string) => api.post<import('../types/recruitment').JobPostingDetail>(`/companies/${companyId}/jobs/${jobId}/archive`).then(r => r.data),
};

// Candidate Applications API
export const candidateApplicationsApi = {
  apply: (jobId: string, data: { candidateDocumentId?: string; coverNote?: string }) => api.post<import('../types/recruitment').CandidateApplicationDetail>(`/jobs/${jobId}/apply`, data).then(r => r.data),
  getMyApplications: () => api.get<import('../types/recruitment').CandidateApplicationSummary[]>('/candidate/applications').then(r => r.data),
  getApplication: (id: string) => api.get<import('../types/recruitment').CandidateApplicationDetail>(`/candidate/applications/${id}`).then(r => r.data),
  withdrawApplication: (id: string) => api.post<import('../types/recruitment').CandidateApplicationDetail>(`/candidate/applications/${id}/withdraw`).then(r => r.data),
};

// Company Applications Review API
export const companyApplicationsApi = {
  getApplications: (companyId: string, params?: any) => api.get<import('../types/recruitment').PagedResult<import('../types/recruitment').CompanyApplicationSummary>>(`/companies/${companyId}/applications`, { params }).then(r => r.data),
  getApplication: (companyId: string, id: string) => api.get<import('../types/recruitment').CompanyApplicationDetail>(`/companies/${companyId}/applications/${id}`).then(r => r.data),
  updateStage: (companyId: string, id: string, data: { newStage: any; reasonNote?: string }) => api.post<import('../types/recruitment').CompanyApplicationDetail>(`/companies/${companyId}/applications/${id}/stage`, data).then(r => r.data),
};

// Candidate Documents API
export const candidateDocumentsApi = {
  getMyDocuments: () => api.get<import('../types/document').CandidateDocumentSummary[]>('/candidate/documents').then(r => r.data),
  getDocument: (id: string) => api.get<import('../types/document').CandidateDocumentDetail>(`/candidate/documents/${id}`).then(r => r.data),
  uploadCv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<import('../types/document').CandidateDocumentDetail>('/candidate/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  uploadNewVersion: (rootDocumentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<import('../types/document').CandidateDocumentDetail>(`/candidate/documents/${rootDocumentId}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  setDefaultCv: (id: string) => api.post(`/candidate/documents/${id}/set-default`).then(r => r.data),
  deleteDocument: (id: string) => api.delete(`/candidate/documents/${id}`).then(r => r.data),
  downloadCv: async (id: string, fileName: string) => {
    const res = await api.get(`/candidate/documents/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// CV Matching & Recruiter Review API
export const cvMatchingApi = {
  getMatchReport: (companyId: string, applicationId: string) =>
    api.get<import('../types/document').CvMatchReport>(`/companies/${companyId}/applications/${applicationId}/match-report`).then(r => r.data),
  recalculateMatchReport: (companyId: string, applicationId: string) =>
    api.post<import('../types/document').CvMatchReport>(`/companies/${companyId}/applications/${applicationId}/match-report/recalculate`).then(r => r.data),
  downloadApplicationCv: async (companyId: string, applicationId: string, fileName: string) => {
    const res = await api.get(`/companies/${companyId}/applications/${applicationId}/cv`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// WorkSim Job Simulation Engine API
export const workSimApi = {
  getCatalog: () =>
    api.get<import('../types/worksim').SimulationScenario[]>('/simulations/catalog').then(r => r.data),
  getMyAssignments: () =>
    api.get<import('../types/worksim').AssessmentAssignment[]>('/candidate/simulations').then(r => r.data),
  startSession: (assignmentId: string) =>
    api.post<import('../types/worksim').CandidateSimulationRuntimeState>(`/candidate/simulations/assignments/${assignmentId}/start`).then(r => r.data),
  getSessionState: (sessionId: string) =>
    api.get<import('../types/worksim').CandidateSimulationRuntimeState>(`/candidate/simulations/sessions/${sessionId}`).then(r => r.data),
  submitAction: (sessionId: string, request: import('../types/worksim').SubmitSimulationActionRequest) =>
    api.post<import('../types/worksim').SubmitSimulationActionResult>(`/candidate/simulations/sessions/${sessionId}/actions`, request).then(r => r.data),
  getSessionResult: (sessionId: string) =>
    api.get<import('../types/worksim').AssessmentResult>(`/candidate/simulations/sessions/${sessionId}/results`).then(r => r.data),
  getCompanyScenarios: (companyId: string) =>
    api.get<import('../types/worksim').SimulationScenario[]>(`/companies/${companyId}/assessments/scenarios`).then(r => r.data),
  getJobAssessmentConfig: (companyId: string, jobId: string) =>
    api.get<import('../types/worksim').JobAssessmentConfiguration>(`/companies/${companyId}/jobs/${jobId}/assessments`).then(r => r.data),
  assignJobAssessment: (companyId: string, jobId: string, request: import('../types/worksim').AssignJobSimulationRequest) =>
    api.post<import('../types/worksim').JobAssessmentConfiguration>(`/companies/${companyId}/jobs/${jobId}/assessments`, request).then(r => r.data),
  removeJobAssessment: (companyId: string, jobId: string) =>
    api.delete(`/companies/${companyId}/jobs/${jobId}/assessments`),
  getApplicationAssessmentResult: (companyId: string, applicationId: string) =>
    api.get<import('../types/worksim').AssessmentResult>(`/companies/${companyId}/applications/${applicationId}/assessment-result`).then(r => r.data),
  getAssignmentDetails: (assignmentId: string) =>
    api.get<import('../types/worksim').AssessmentAssignment>(`/candidate/simulations/assignments/${assignmentId}`).then(r => r.data),
  getCompanyTracking: (companyId: string, statusFilter?: string, jobPostingId?: string) =>
    api.get<import('../types/worksim').CompanyAssessmentTrackingItem[]>(`/companies/${companyId}/assessments/tracking`, {
      params: { statusFilter: statusFilter || undefined, jobPostingId: jobPostingId || undefined },
    }).then(r => r.data),
  resendInvitation: (companyId: string, assignmentId: string) =>
    api.post<{ success: boolean; message: string }>(`/companies/${companyId}/assessments/${assignmentId}/resend`).then(r => r.data),
  cancelInvitation: (companyId: string, assignmentId: string, reason?: string) =>
    api.post<{ success: boolean; message: string }>(`/companies/${companyId}/assessments/${assignmentId}/cancel`, { reason }).then(r => r.data),
};

// In-App Notifications API
export const notificationsApi = {
  getNotifications: (limit: number = 30) =>
    api.get<import('../types/worksim').InAppNotification[]>('/notifications', { params: { limit } }).then(r => r.data),
  getUnreadCount: () =>
    api.get<import('../types/worksim').UnreadNotificationCount>('/notifications/unread-count').then(r => r.data),
  markAsRead: (id: string) =>
    api.post(`/notifications/${id}/read`).then(r => r.data),
  markAllAsRead: () =>
    api.post('/notifications/read-all').then(r => r.data),
};



