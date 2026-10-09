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
