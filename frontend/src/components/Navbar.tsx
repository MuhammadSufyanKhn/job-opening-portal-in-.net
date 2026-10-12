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
  TrendingUp, 
  Menu, 
  X,
  Compass
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { LABELS } from '../content/labels';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isCandidate, isCompanyMember, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand" onClick={closeMobileMenu}>
          <i aria-hidden="true">
            <Briefcase size={16} />
          </i>
          <span>HireSphere</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-nav" aria-label="Main Navigation">
          {!isAuthenticated ? (
            <>
              <Link 
                to="/jobs" 
                className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}
              >
                Find jobs
              </Link>
              <a href="/#companies" className="nav-link">
                Companies
              </a>
              <a href="/#employers" className="nav-link">
                For employers
              </a>
              <a href="/#how-it-works" className="nav-link">
                How it works
              </a>
              <a href="/#faq" className="nav-link">
                Help
              </a>
            </>
          ) : (
            <>
              {isCandidate && (
                <>
                  <Link 
                    to="/jobs" 
                    className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}
                  >
                    <Compass size={16} />
                    <span>Find jobs</span>
                  </Link>
                  <Link 
                    to="/candidate/dashboard" 
                    className={`nav-link ${location.pathname === '/candidate/dashboard' ? 'active' : ''}`}
                  >
                    <TrendingUp size={16} />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    to="/candidate/applications" 
                    className={`nav-link ${location.pathname.startsWith('/candidate/applications') ? 'active' : ''}`}
                  >
                    <FileText size={16} />
                    <span>Applications</span>
                  </Link>
                  <Link 
                    to="/candidate/simulations" 
                    className={`nav-link ${location.pathname.startsWith('/candidate/simulations') ? 'active' : ''}`}
                  >
                    <Briefcase size={16} />
                    <span>{LABELS.SKILLS_CHALLENGES}</span>
                  </Link>
                  <Link 
                    to="/candidate/documents" 
                    className={`nav-link ${location.pathname.startsWith('/candidate/documents') ? 'active' : ''}`}
                  >
                    <FileText size={16} />
                    <span>{LABELS.MY_CVS}</span>
                  </Link>
                  <Link 
                    to="/candidate/profile" 
                    className={`nav-link ${location.pathname.startsWith('/candidate/profile') ? 'active' : ''}`}
                  >
                    <UserCircle size={16} />
                    <span>Profile</span>
                  </Link>
                </>
              )}

              {isCompanyMember && (
                <>
                  <Link 
                    to="/company/dashboard" 
                    className={`nav-link ${location.pathname === '/company/dashboard' ? 'active' : ''}`}
                  >
                    <Building2 size={16} />
                    <span>Workspace</span>
                  </Link>
                  <Link 
                    to="/company/jobs" 
                    className={`nav-link ${location.pathname.startsWith('/company/jobs') ? 'active' : ''}`}
                  >
                    <Briefcase size={16} />
                    <span>Vacancies</span>
                  </Link>
                  <Link 
                    to="/company/applications" 
                    className={`nav-link ${location.pathname.startsWith('/company/applications') ? 'active' : ''}`}
                  >
                    <Users size={16} />
                    <span>Applicants</span>
                  </Link>
                  <Link 
                    to="/company/analytics" 
                    className={`nav-link ${location.pathname.startsWith('/company/analytics') ? 'active' : ''}`}
                  >
                    <TrendingUp size={16} />
                    <span>{LABELS.HIRING_INSIGHTS}</span>
                  </Link>
                </>
              )}

              {isSuperAdmin && (
                <Link 
                  to="/admin" 
                  className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                >
                  <Shield size={16} />
                  <span>Admin operations</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Desktop User Menu / Right Actions */}
        <div className="nav-right desktop-nav-right">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn sm">
                Sign in
              </Link>
              <Link to="/register-candidate" className="btn sm">
                Sign up
              </Link>
              <Link to="/register-company" className="btn sm primary">
                Post a job
              </Link>
            </>
          ) : (
            <>
              <NotificationBell />
              {user && (
                <div className="user">
                  <div>
                    {user.fullName}
                    <small>{user.roles.includes('SuperAdmin') ? 'Super admin' : user.roles.includes('CompanyMember') ? 'Company account' : 'Jobseeker'}</small>
                  </div>
                  <span className="mark m1" style={{ width: '38px', height: '38px', fontSize: '14px' }}>
                    {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <button 
                onClick={logout} 
                className="btn sm" 
                title="Sign out" 
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
          
          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-panel" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div className="mobile-nav-links">
            <Link to="/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
              <Briefcase size={18} />
              <span>Find jobs</span>
            </Link>

            {!isAuthenticated ? (
              <>
                <a href="/#companies" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>Companies</span>
                </a>
                <a href="/#employers" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>For employers</span>
                </a>
                <a href="/#how-it-works" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>How it works</span>
                </a>
                <a href="/#faq" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>Help</span>
                </a>
                <div className="mobile-nav-divider" />
                <Link to="/login" className="mobile-nav-item" onClick={closeMobileMenu}>
                  <span>Sign in</span>
                </Link>
                <div className="mobile-cta-group">
                  <Link to="/register-candidate" className="btn btn-outline btn-block" onClick={closeMobileMenu}>
                    <span>Create your free profile</span>
                  </Link>
                  <Link to="/register-company" className="btn btn-primary btn-block" onClick={closeMobileMenu}>
                    <span>Post a job for free</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {isCandidate && (
                  <>
                    <Link to="/candidate/dashboard" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <TrendingUp size={18} />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/candidate/applications" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <FileText size={18} />
                      <span>Applications</span>
                    </Link>
                    <Link to="/candidate/simulations" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Briefcase size={18} />
                      <span>{LABELS.SKILLS_CHALLENGES}</span>
                    </Link>
                    <Link to="/candidate/documents" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <FileText size={18} />
                      <span>{LABELS.MY_CVS}</span>
                    </Link>
                    <Link to="/candidate/profile" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <UserCircle size={18} />
                      <span>Profile</span>
                    </Link>
                  </>
                )}

                {isCompanyMember && (
                  <>
                    <Link to="/company/dashboard" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Building2 size={18} />
                      <span>Workspace</span>
                    </Link>
                    <Link to="/company/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Briefcase size={18} />
                      <span>Vacancies</span>
                    </Link>
                    <Link to="/company/applications" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Users size={18} />
                      <span>Applicants</span>
                    </Link>
                    <Link to="/company/analytics" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <TrendingUp size={18} />
                      <span>{LABELS.HIRING_INSIGHTS}</span>
                    </Link>
                  </>
                )}

                {isSuperAdmin && (
                  <Link to="/admin" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <Shield size={18} />
                    <span>Admin operations</span>
                  </Link>
                )}

                <div className="mobile-nav-divider" />
                <div className="mobile-user-row">
                  <div className="mobile-user-info">
                    <span className="font-semibold">{user?.fullName}</span>
                    <span className="text-muted text-xs">{user?.roles.join(', ')}</span>
                  </div>
                  <button onClick={() => { logout(); closeMobileMenu(); }} className="btn sm">
                    <LogOut size={16} />
                    <span>Sign out</span>
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
