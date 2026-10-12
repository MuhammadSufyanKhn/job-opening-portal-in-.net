import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { RegisterCandidate } from './pages/RegisterCandidate';
import { RegisterCompany } from './pages/RegisterCompany';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { CandidateProfile } from './pages/CandidateProfile';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCompanies } from './pages/AdminCompanies';
import { AdminUsers } from './pages/AdminUsers';
import { AdminJobs } from './pages/AdminJobs';
import { AdminAudit } from './pages/AdminAudit';
import { Jobs } from './pages/Jobs';
import { JobDetail } from './pages/JobDetail';
import { CandidateApplications } from './pages/CandidateApplications';
import { CompanyJobs } from './pages/CompanyJobs';
import { CreateEditJob } from './pages/CreateEditJob';
import { CompanyApplications } from './pages/CompanyApplications';
import { CandidateDocuments } from './pages/CandidateDocuments';
import { CandidateSimulations } from './pages/CandidateSimulations';
import { SimulationWorkspace } from './pages/SimulationWorkspace';
import { SimulationResult } from './pages/SimulationResult';
import { NotificationCenter } from './pages/NotificationCenter';
import { CompanyAnalytics } from './pages/CompanyAnalytics';
import { CompanyDirectory } from './pages/CompanyDirectory';
import { ForEmployers } from './pages/ForEmployers';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { HelpFaq } from './pages/HelpFaq';
import { Contact } from './pages/Contact';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="loading-state">Authenticating session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const hasRole = (requiredRole === 'SuperAdmin' || requiredRole === 'Admin')
      ? user?.roles.some(r => r.toLowerCase() === 'superadmin' || r.toLowerCase() === 'admin')
      : user?.roles.some(r => r.toLowerCase() === requiredRole.toLowerCase());

    if (!hasRole) {
      return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '640px' }}>
          <div className="card panel" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--bad)', marginBottom: '8px' }}>Access Denied</h3>
            <p className="muted">You do not have the required permissions to view this portal.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register-candidate" element={<RegisterCandidate />} />
              <Route path="/register-company" element={<RegisterCompany />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/companies" element={<CompanyDirectory />} />
              <Route path="/for-employers" element={<ForEmployers />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/help" element={<HelpFaq />} />
              <Route path="/faq" element={<Navigate to="/help" replace />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />

              {/* Candidate Protected Routes */}
              <Route
                path="/candidate"
                element={<Navigate to="/candidate/dashboard" replace />}
              />
              <Route
                path="/candidate/dashboard"
                element={
                  <ProtectedRoute requiredRole="Candidate">
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/profile"
                element={
                  <ProtectedRoute requiredRole="Candidate">
                    <CandidateProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/applications"
                element={
                  <ProtectedRoute requiredRole="Candidate">
                    <CandidateApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/documents"
                element={
                  <ProtectedRoute requiredRole="Candidate">
                    <CandidateDocuments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/simulations"
                element={
                  <ProtectedRoute requiredRole="Candidate">
                    <CandidateSimulations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/simulations/session/:sessionId"
                element={
                  <ProtectedRoute requiredRole="Candidate">
                    <SimulationWorkspace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/simulations/session/:sessionId/results"
                element={
                  <ProtectedRoute requiredRole="Candidate">
                    <SimulationResult />
                  </ProtectedRoute>
                }
              />

              {/* Company Protected Routes */}
              <Route
                path="/company/dashboard"
                element={
                  <ProtectedRoute requiredRole="CompanyMember">
                    <CompanyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/jobs"
                element={
                  <ProtectedRoute requiredRole="CompanyMember">
                    <CompanyJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/jobs/new"
                element={
                  <ProtectedRoute requiredRole="CompanyMember">
                    <CreateEditJob />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/jobs/:id/edit"
                element={
                  <ProtectedRoute requiredRole="CompanyMember">
                    <CreateEditJob />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/applications"
                element={
                  <ProtectedRoute requiredRole="CompanyMember">
                    <CompanyApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/analytics"
                element={
                  <ProtectedRoute requiredRole="CompanyMember">
                    <CompanyAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="SuperAdmin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredRole="SuperAdmin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/companies"
                element={
                  <ProtectedRoute requiredRole="SuperAdmin">
                    <AdminCompanies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="SuperAdmin">
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/jobs"
                element={
                  <ProtectedRoute requiredRole="SuperAdmin">
                    <AdminJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute requiredRole="SuperAdmin">
                    <AdminAudit />
                  </ProtectedRoute>
                }
              />

              {/* Common Authenticated Routes */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 */}
              <Route
                path="*"
                element={
                  <div className="portal-container">
                    <div className="empty-state">
                      <h2>404 - Page Not Found</h2>
                      <p>The requested HireSphere view does not exist.</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
