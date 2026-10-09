import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { RegisterCandidate } from './pages/RegisterCandidate';
import { RegisterCompany } from './pages/RegisterCompany';
import { CandidateProfile } from './pages/CandidateProfile';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AdminCompanies } from './pages/AdminCompanies';

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

  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return (
      <div className="portal-container">
        <div className="alert alert-error">
          <h3>Access Denied</h3>
          <p>You do not have the required permissions to view this portal.</p>
        </div>
      </div>
    );
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
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register-candidate" element={<RegisterCandidate />} />
              <Route path="/register-company" element={<RegisterCompany />} />

              <Route
                path="/candidate/profile"
                element={
                  <ProtectedRoute requiredRole="Candidate">
                    <CandidateProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/company/dashboard"
                element={
                  <ProtectedRoute requiredRole="CompanyMember">
                    <CompanyDashboard />
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
