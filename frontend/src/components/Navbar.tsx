import React, { useState, useEffect, useRef } from 'react';
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
  Compass,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { NotificationBell } from './NotificationBell';
import { LABELS } from '../content/labels';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isCandidate, isCompanyMember, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    menuToggleRef.current?.focus();
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(e.target as Node) &&
        menuToggleRef.current &&
        !menuToggleRef.current.contains(e.target as Node)
      ) {
        closeMobileMenu();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [mobileMenuOpen]);

  // Lock body scroll only while open and cleanly restore on close or unmount
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  return (
    <header className="navbar navbar-floating">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand" onClick={closeMobileMenu}>
          <i aria-hidden="true">
            <Briefcase size={16} />
          </i>
          <span>HireSphere</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-nav" aria-label="Main Navigation">
          {!isAuthenticated ? (
            <>
              <Link 
                to="/jobs" 
                className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}
              >
                Find jobs
              </Link>
              <Link 
                to="/companies" 
                className={`nav-link ${location.pathname.startsWith('/companies') ? 'active' : ''}`}
              >
                Companies
              </Link>
              <Link 
                to="/for-employers" 
                className={`nav-link ${location.pathname === '/for-employers' ? 'active' : ''}`}
              >
                For employers
              </Link>
              <Link 
                to="/how-it-works" 
                className={`nav-link ${location.pathname === '/how-it-works' ? 'active' : ''}`}
              >
                How it works
              </Link>
              <Link 
                to="/help" 
                className={`nav-link ${location.pathname === '/help' ? 'active' : ''}`}
              >
                Help
              </Link>
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
                    <small>
                      {user.roles.some(r => r.toLowerCase() === 'superadmin' || r.toLowerCase() === 'admin') 
                        ? 'Super admin' 
                        : user.roles.includes('CompanyMember') 
                        ? 'Company admin' 
                        : 'Candidate'}
                    </small>
                  </div>
                  <span 
                    className={`mark ${
                      user.roles.some(r => r.toLowerCase() === 'superadmin' || r.toLowerCase() === 'admin')
                        ? 'm4'
                        : user.roles.includes('CompanyMember')
                        ? 'm2'
                        : 'm1'
                    }`} 
                    style={{ width: '38px', height: '38px', fontSize: '14px' }}
                  >
                    {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              {isCompanyMember && (
                <Link to="/company/jobs/new" className="btn sm primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Post a job</span>
                </Link>
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
            ref={menuToggleRef}
            type="button"
            className="menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Accessible Animated Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-navigation-drawer"
            ref={mobileMenuRef}
            className="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mobile-nav-links">
              {!isAuthenticated ? (
                <>
                  <Link to="/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <Compass size={18} />
                    <span>Find jobs</span>
                  </Link>
                  <Link to="/companies" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <Building2 size={18} />
                    <span>Companies</span>
                  </Link>
                  <Link to="/for-employers" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <Briefcase size={18} />
                    <span>For employers</span>
                  </Link>
                  <Link to="/how-it-works" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <TrendingUp size={18} />
                    <span>How it works</span>
                  </Link>
                  <Link to="/help" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <HelpCircle size={18} />
                    <span>Help & FAQ</span>
                  </Link>

                  <div className="mobile-nav-divider" />
                  
                  <Link to="/login" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <span>Sign in</span>
                  </Link>
                  <div className="mobile-cta-group">
                    <Link to="/register-candidate" className="btn btn-outline btn-block" onClick={closeMobileMenu}>
                      <span>Create free profile</span>
                    </Link>
                    <Link to="/register-company" className="btn btn-primary btn-block" onClick={closeMobileMenu}>
                      <span>Post a job</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <Compass size={18} />
                    <span>Find jobs</span>
                  </Link>
                  <Link to="/companies" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <Building2 size={18} />
                    <span>Companies</span>
                  </Link>

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
                      <Link to="/company/jobs/new" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Briefcase size={18} />
                        <span>Post a new job</span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
