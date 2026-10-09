import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, UserCircle, Shield, LogOut, Briefcase } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isCandidate, isCompanyMember, isSuperAdmin } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Briefcase size={22} className="text-primary" />
          </div>
          <span className="brand-text">Hire<span className="text-gradient">Sphere</span></span>
        </Link>

        <nav className="navbar-nav">
          {isAuthenticated ? (
            <>
              {isCandidate && (
                <Link to="/candidate/profile" className="nav-link">
                  <UserCircle size={18} />
                  <span>Candidate Profile</span>
                </Link>
              )}

              {isCompanyMember && (
                <Link to="/company/dashboard" className="nav-link">
                  <Building2 size={18} />
                  <span>Company Workspace</span>
                </Link>
              )}

              {isSuperAdmin && (
                <Link to="/admin/companies" className="nav-link nav-link-admin">
                  <Shield size={18} />
                  <span>Admin Governance</span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register-candidate" className="nav-btn-secondary">Candidate Sign Up</Link>
              <Link to="/register-company" className="nav-btn-primary">For Employers</Link>
            </>
          )}
        </nav>

        {isAuthenticated && user && (
          <div className="navbar-user">
            <div className="user-details">
              <span className="user-name">{user.fullName}</span>
              <span className="user-badge">{user.roles.join(', ')}</span>
            </div>
            <button onClick={logout} className="logout-btn" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
