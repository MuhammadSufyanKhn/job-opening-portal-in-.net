import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  UserCircle, 
  Shield, 
  LogOut, 
  Briefcase, 
  Users, 
  FileText, 
  Terminal, 
  TrendingUp, 
  Menu, 
  X
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isCandidate, isCompanyMember, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <div className="brand-icon">
            <Briefcase size={20} className="text-primary" />
          </div>
          <span className="brand-text">Hire<span className="text-gradient">Sphere</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-nav desktop-nav" aria-label="Main Navigation">
          {/* Universal Public Links */}
          <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>
            <span>Find Jobs</span>
          </Link>

          {!isAuthenticated ? (
            <>
              <a href="/#how-it-works" className="nav-link">How It Works</a>
              <a href="/#worksim" className="nav-link">WorkSim</a>
              <a href="/#employers" className="nav-link">For Employers</a>
              <div className="nav-separator" aria-hidden="true" />
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register-candidate" className="btn btn-outline btn-sm">Sign Up</Link>
              <Link to="/register-company" className="btn btn-primary btn-sm">
                <span>Post a Job</span>
              </Link>
            </>
          ) : (
            <>
              {isCandidate && (
                <>
                  <Link to="/candidate/dashboard" className={`nav-link ${location.pathname.startsWith('/candidate/dashboard') ? 'active' : ''}`}>
                    <TrendingUp size={16} />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/candidate/applications" className={`nav-link ${location.pathname.startsWith('/candidate/applications') ? 'active' : ''}`}>
                    <FileText size={16} />
                    <span>Applications</span>
                  </Link>
                  <Link to="/candidate/simulations" className={`nav-link ${location.pathname.startsWith('/candidate/simulations') ? 'active' : ''}`}>
                    <Terminal size={16} />
                    <span>WorkSim</span>
                  </Link>
                  <Link to="/candidate/documents" className={`nav-link ${location.pathname.startsWith('/candidate/documents') ? 'active' : ''}`}>
                    <FileText size={16} />
                    <span>CV Vault</span>
                  </Link>
                  <Link to="/candidate/profile" className={`nav-link ${location.pathname.startsWith('/candidate/profile') ? 'active' : ''}`}>
                    <UserCircle size={16} />
                    <span>Profile</span>
                  </Link>
                </>
              )}

              {isCompanyMember && (
                <>
                  <Link to="/company/jobs" className={`nav-link ${location.pathname.startsWith('/company/jobs') ? 'active' : ''}`}>
                    <Briefcase size={16} />
                    <span>Vacancies</span>
                  </Link>
                  <Link to="/company/applications" className={`nav-link ${location.pathname.startsWith('/company/applications') ? 'active' : ''}`}>
                    <Users size={16} />
                    <span>Applicants</span>
                  </Link>
                  <Link to="/company/analytics" className={`nav-link ${location.pathname.startsWith('/company/analytics') ? 'active' : ''}`}>
                    <TrendingUp size={16} />
                    <span>Analytics</span>
                  </Link>
                  <Link to="/company/dashboard" className={`nav-link ${location.pathname.startsWith('/company/dashboard') ? 'active' : ''}`}>
                    <Building2 size={16} />
                    <span>Workspace</span>
                  </Link>
                </>
              )}

              {isSuperAdmin && (
                <Link to="/admin" className={`nav-link nav-link-admin ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                  <Shield size={16} />
                  <span>Admin Operations</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Desktop User Menu */}
        {isAuthenticated && user && (
          <div className="navbar-user desktop-user-menu">
            <NotificationBell />
            <div className="user-details">
              <span className="user-name">{user.fullName}</span>
              <span className="user-badge">{user.roles.join(', ')}</span>
            </div>
            <button onClick={logout} className="logout-btn" title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        )}

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-panel" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div className="mobile-nav-links">
            <Link to="/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
              <Briefcase size={18} />
              <span>Find Jobs</span>
            </Link>

            {!isAuthenticated ? (
              <>
                <a href="/#how-it-works" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>How It Works</span>
                </a>
                <a href="/#worksim" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>WorkSim</span>
                </a>
                <a href="/#employers" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>For Employers</span>
                </a>
                <a href="/#faq" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>FAQ</span>
                </a>
                <div className="mobile-nav-divider" />
                <Link to="/login" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>Sign In</span>
                </Link>
                <div className="mobile-cta-group">
                  <Link to="/register-candidate" className="btn btn-outline btn-block" onClick={closeMobileMenu}>
                    <span>Candidate Sign Up</span>
                  </Link>
                  <Link to="/register-company" className="btn btn-primary btn-block" onClick={closeMobileMenu}>
                    <span>Post a Job / For Employers</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {isCandidate && (
                  <>
                    <Link to="/candidate/dashboard" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <TrendingUp size={18} />
                      <span>Candidate Dashboard</span>
                    </Link>
                    <Link to="/candidate/applications" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <FileText size={18} />
                      <span>My Applications</span>
                    </Link>
                    <Link to="/candidate/simulations" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Terminal size={18} />
                      <span>WorkSim Assessments</span>
                    </Link>
                    <Link to="/candidate/documents" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <FileText size={18} />
                      <span>CV Library</span>
                    </Link>
                    <Link to="/candidate/profile" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <UserCircle size={18} />
                      <span>My Profile</span>
                    </Link>
                  </>
                )}

                {isCompanyMember && (
                  <>
                    <Link to="/company/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Briefcase size={18} />
                      <span>Manage Vacancies</span>
                    </Link>
                    <Link to="/company/applications" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Users size={18} />
                      <span>Applicants</span>
                    </Link>
                    <Link to="/company/analytics" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <TrendingUp size={18} />
                      <span>Analytics</span>
                    </Link>
                    <Link to="/company/dashboard" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Building2 size={18} />
                      <span>Company Workspace</span>
                    </Link>
                  </>
                )}

                {isSuperAdmin && (
                  <Link to="/admin" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <Shield size={18} />
                    <span>Admin Operations</span>
                  </Link>
                )}

                <div className="mobile-nav-divider" />
                <div className="mobile-user-row">
                  <div className="mobile-user-info">
                    <span className="font-semibold">{user?.fullName}</span>
                    <span className="text-muted text-xs">{user?.roles.join(', ')}</span>
                  </div>
                  <button onClick={() => { logout(); closeMobileMenu(); }} className="btn btn-outline btn-sm">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
