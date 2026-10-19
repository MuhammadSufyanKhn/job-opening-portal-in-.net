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
  HelpCircle,
  Search,
  PlusCircle,
  Layers,
  Sparkles,
  MoreHorizontal
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

  // Lock body scroll only while mobile panel is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Contextual Subtitle
  const getContextualSubtitle = () => {
    if (isSuperAdmin) return 'Administration';
    if (isCompanyMember) return 'Employer workspace';
    if (isCandidate) return 'Candidate workspace';
    return 'Talent & Opportunity Marketplace';
  };

  // User initials
  const getUserInitials = () => {
    if (!user?.fullName) return 'HS';
    return user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // User avatar color class
  const getAvatarClass = () => {
    if (isSuperAdmin) return 'm4';
    if (isCompanyMember) return 'm2';
    return 'm1';
  };

  // Helpers to test active route
  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [userMenuOpen]);

  return (
    <>
      <header className="navbar-wrapper">
        <div className="brand-header-area">
          {/* 1. LEFT BRAND & CONTEXTUAL SUBTITLE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/" className="brand-group" onClick={closeMobileMenu}>
              <span className="brand-logo-emblem" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#101B2A" />
                </svg>
              </span>
              <span className="brand-text">HireSphere</span>
            </Link>
            {isAuthenticated && (
              <span className="brand-subtitle-badge">
                {getContextualSubtitle()}
              </span>
            )}
          </div>

          {/* 2. CENTER FLOATING PILL HORIZONTAL NAVIGATION (Desktop/Tablet) */}
          <div className="floating-nav-bar">
            <nav className="floating-nav-pill" aria-label="Main Navigation">
              {!isAuthenticated ? (
                <>
                  <Link 
                    to="/" 
                    className={`floating-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                  >
                    <span>Home</span>
                  </Link>
                  <Link 
                    to="/jobs" 
                    className={`floating-nav-link ${isActive('/jobs') ? 'active' : ''}`}
                  >
                    <span>Find Jobs</span>
                  </Link>
                  <Link 
                    to="/for-employers" 
                    className={`floating-nav-link ${isActive('/for-employers', true) ? 'active' : ''}`}
                  >
                    <span>For Employers</span>
                  </Link>
                  <Link 
                    to="/jobs" 
                    className={`floating-nav-link ${location.pathname === '/jobs' && location.search.includes('candidate') ? 'active' : ''}`}
                  >
                    <span>For Candidates</span>
                  </Link>
                  <Link 
                    to="/how-it-works" 
                    className={`floating-nav-link ${isActive('/how-it-works', true) ? 'active' : ''}`}
                  >
                    <span>About</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Candidate Navigation */}
                  {isCandidate && (
                    <>
                      <Link 
                        to="/jobs" 
                        className={`floating-nav-link ${isActive('/jobs') ? 'active' : ''}`}
                      >
                        <span>Discover Jobs</span>
                      </Link>
                      <Link 
                        to="/candidate/applications" 
                        className={`floating-nav-link ${isActive('/candidate/applications') ? 'active' : ''}`}
                      >
                        <span>My Applications</span>
                      </Link>
                      <Link 
                        to="/candidate/dashboard" 
                        className={`floating-nav-link ${isActive('/candidate/dashboard', true) ? 'active' : ''}`}
                      >
                        <span>Saved Jobs</span>
                      </Link>
                      <Link 
                        to="/candidate/profile" 
                        className={`floating-nav-link ${isActive('/candidate/profile') ? 'active' : ''}`}
                      >
                        <span>Profile</span>
                      </Link>
                    </>
                  )}

                  {/* Employer Navigation */}
                  {isCompanyMember && (
                    <>
                      <Link 
                        to="/company/dashboard" 
                        className={`floating-nav-link ${isActive('/company/dashboard', true) ? 'active' : ''}`}
                      >
                        <span>Overview</span>
                      </Link>
                      <Link 
                        to="/company/jobs" 
                        className={`floating-nav-link ${isActive('/company/jobs') ? 'active' : ''}`}
                      >
                        <span>Vacancies</span>
                      </Link>
                      <Link 
                        to="/company/applications" 
                        className={`floating-nav-link ${isActive('/company/applications') ? 'active' : ''}`}
                      >
                        <span>Applicants</span>
                      </Link>
                      <Link 
                        to="/company/analytics" 
                        className={`floating-nav-link ${isActive('/company/analytics') ? 'active' : ''}`}
                      >
                        <span>Insights</span>
                      </Link>
                      <Link 
                        to="/company/dashboard" 
                        className={`floating-nav-link`}
                      >
                        <span>Team</span>
                      </Link>
                    </>
                  )}

                  {/* Admin Navigation */}
                  {isSuperAdmin && (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        className={`floating-nav-link ${location.pathname === '/admin' || isActive('/admin/dashboard', true) ? 'active' : ''}`}
                      >
                        <span>Overview</span>
                      </Link>
                      <Link 
                        to="/admin/users" 
                        className={`floating-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                      >
                        <span>Users</span>
                      </Link>
                      <Link 
                        to="/admin/companies" 
                        className={`floating-nav-link ${isActive('/admin/companies') ? 'active' : ''}`}
                      >
                        <span>Companies</span>
                      </Link>
                      <Link 
                        to="/admin/jobs" 
                        className={`floating-nav-link ${isActive('/admin/jobs') ? 'active' : ''}`}
                      >
                        <span>Vacancies</span>
                      </Link>
                      <Link 
                        to="/admin/audit" 
                        className={`floating-nav-link ${isActive('/admin/audit') ? 'active' : ''}`}
                      >
                        <span>Reports</span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>

          {/* 3. RIGHT CIRCULAR UTILITY CONTROLS & PROFILE */}
          <div className="utility-group">
            {!isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '14.5px', textDecoration: 'none' }}>
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-lime sm" style={{ fontWeight: 800, padding: '8px 18px', borderRadius: '999px', textDecoration: 'none' }}>
                  Get Started
                </Link>
              </div>
            ) : (
              <>
                {/* Search circular button */}
                <Link 
                  to="/jobs" 
                  className="circle-btn" 
                  title="Search job vacancies"
                  aria-label="Search job vacancies"
                >
                  <Search size={18} />
                </Link>

                {/* Notification bell with count badge */}
                <NotificationBell />

                {/* User Avatar circle button with popover */}
                {user && (
                  <div style={{ position: 'relative' }} ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="avatar-circle-btn"
                      title={`${user.fullName} (${user.email})`}
                      aria-label={`Profile for ${user.fullName}`}
                    >
                      {getUserInitials()}
                    </button>

                    {userMenuOpen && (
                      <div className="user-dropdown-popover" role="menu">
                        <div className="user-dropdown-header">
                          <strong>{user.fullName}</strong>
                          <small>{user.email}</small>
                          <span className="brand-subtitle-badge" style={{ marginTop: '6px' }}>
                            {getContextualSubtitle()}
                          </span>
                        </div>

                        <Link
                          to={isCandidate ? '/candidate/profile' : isCompanyMember ? '/company/dashboard' : '/admin/dashboard'}
                          className="user-dropdown-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserCircle size={16} />
                          <span>My Workspace</span>
                        </Link>

                        {isCandidate && (
                          <Link 
                            to="/candidate/documents" 
                            className="user-dropdown-item" 
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FileText size={16} />
                            <span>CV & Documents</span>
                          </Link>
                        )}

                        {isCompanyMember && (
                          <Link 
                            to="/company/jobs/new" 
                            className="user-dropdown-item" 
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <PlusCircle size={16} />
                            <span>Post a vacancy</span>
                          </Link>
                        )}

                        <Link 
                          to="/help" 
                          className="user-dropdown-item" 
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <HelpCircle size={16} />
                          <span>Help & FAQ</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="user-dropdown-item danger"
                        >
                          <LogOut size={16} />
                          <span>Sign out</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Mobile hamburger menu toggle */}
            <button
              ref={menuToggleRef}
              type="button"
              className="circle-btn mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* 3. MOBILE FLOATING BOTTOM NAVIGATION (Mobile only <= 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
        {!isAuthenticated ? (
          <>
            <Link to="/jobs" className={`mobile-bottom-item ${isActive('/jobs') ? 'active' : ''}`}>
              <span className="bottom-icon"><Compass size={20} /></span>
              <span>Jobs</span>
            </Link>
            <Link to="/companies" className={`mobile-bottom-item ${isActive('/companies') ? 'active' : ''}`}>
              <span className="bottom-icon"><Building2 size={20} /></span>
              <span>Companies</span>
            </Link>
            <Link to="/for-employers" className={`mobile-bottom-item ${isActive('/for-employers', true) ? 'active' : ''}`}>
              <span className="bottom-icon"><Briefcase size={20} /></span>
              <span>Employers</span>
            </Link>
            <Link to="/login" className={`mobile-bottom-item ${isActive('/login', true) ? 'active' : ''}`}>
              <span className="bottom-icon"><UserCircle size={20} /></span>
              <span>Sign in</span>
            </Link>
            <button 
              type="button" 
              className="mobile-bottom-item"
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span className="bottom-icon"><MoreHorizontal size={20} /></span>
              <span>More</span>
            </button>
          </>
        ) : isCandidate ? (
          <>
            <Link to="/jobs" className={`mobile-bottom-item ${isActive('/jobs') ? 'active' : ''}`}>
              <span className="bottom-icon"><Compass size={20} /></span>
              <span>Jobs</span>
            </Link>
            <Link to="/candidate/dashboard" className={`mobile-bottom-item ${isActive('/candidate/dashboard', true) ? 'active' : ''}`}>
              <span className="bottom-icon"><TrendingUp size={20} /></span>
              <span>Dashboard</span>
            </Link>
            <Link to="/candidate/applications" className={`mobile-bottom-item ${isActive('/candidate/applications') ? 'active' : ''}`}>
              <span className="bottom-icon"><FileText size={20} /></span>
              <span>Apps</span>
            </Link>
            <Link to="/candidate/documents" className={`mobile-bottom-item ${isActive('/candidate/documents') ? 'active' : ''}`}>
              <span className="bottom-icon"><FileText size={20} /></span>
              <span>CV Vault</span>
            </Link>
            <button 
              type="button" 
              className="mobile-bottom-item"
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span className="bottom-icon"><MoreHorizontal size={20} /></span>
              <span>More</span>
            </button>
          </>
        ) : isCompanyMember ? (
          <>
            <Link to="/company/dashboard" className={`mobile-bottom-item ${isActive('/company/dashboard', true) ? 'active' : ''}`}>
              <span className="bottom-icon"><Building2 size={20} /></span>
              <span>Workspace</span>
            </Link>
            <Link to="/company/jobs" className={`mobile-bottom-item ${isActive('/company/jobs') ? 'active' : ''}`}>
              <span className="bottom-icon"><Briefcase size={20} /></span>
              <span>Vacancies</span>
            </Link>
            <Link to="/company/applications" className={`mobile-bottom-item ${isActive('/company/applications') ? 'active' : ''}`}>
              <span className="bottom-icon"><Users size={20} /></span>
              <span>Pipeline</span>
            </Link>
            <Link to="/company/analytics" className={`mobile-bottom-item ${isActive('/company/analytics') ? 'active' : ''}`}>
              <span className="bottom-icon"><TrendingUp size={20} /></span>
              <span>Insights</span>
            </Link>
            <button 
              type="button" 
              className="mobile-bottom-item"
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span className="bottom-icon"><MoreHorizontal size={20} /></span>
              <span>More</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/admin/dashboard" className={`mobile-bottom-item ${isActive('/admin/dashboard', true) ? 'active' : ''}`}>
              <span className="bottom-icon"><Layers size={20} /></span>
              <span>Overview</span>
            </Link>
            <Link to="/admin/companies" className={`mobile-bottom-item ${isActive('/admin/companies') ? 'active' : ''}`}>
              <span className="bottom-icon"><Building2 size={20} /></span>
              <span>Companies</span>
            </Link>
            <Link to="/admin/users" className={`mobile-bottom-item ${isActive('/admin/users') ? 'active' : ''}`}>
              <span className="bottom-icon"><Users size={20} /></span>
              <span>Users</span>
            </Link>
            <Link to="/admin/jobs" className={`mobile-bottom-item ${isActive('/admin/jobs') ? 'active' : ''}`}>
              <span className="bottom-icon"><Briefcase size={20} /></span>
              <span>Jobs</span>
            </Link>
            <button 
              type="button" 
              className="mobile-bottom-item"
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span className="bottom-icon"><MoreHorizontal size={20} /></span>
              <span>More</span>
            </button>
          </>
        )}
      </nav>

      {/* 4. EXPANDABLE MOBILE NAVIGATION DRAWER */}
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
            {/* User Info Header in Mobile Drawer */}
            {isAuthenticated && user && (
              <div className="mobile-user-row" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`mark ${getAvatarClass()}`} style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                    {getUserInitials()}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px' }}>{user.fullName}</strong>
                    <small className="muted">{user.email}</small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  className="btn sm"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}

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
                    <Link to="/register-company" className="btn btn-lime btn-block" onClick={closeMobileMenu}>
                      <span>Post a job</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {isCandidate && (
                    <>
                      <Link to="/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Compass size={18} />
                        <span>Find jobs</span>
                      </Link>
                      <Link to="/candidate/dashboard" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <TrendingUp size={18} />
                        <span>Dashboard</span>
                      </Link>
                      <Link to="/candidate/applications" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <FileText size={18} />
                        <span>Applications</span>
                      </Link>
                      <Link to="/candidate/simulations" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Sparkles size={18} />
                        <span>{LABELS.SKILLS_CHALLENGES}</span>
                      </Link>
                      <Link to="/candidate/documents" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <FileText size={18} />
                        <span>{LABELS.MY_CVS}</span>
                      </Link>
                      <Link to="/candidate/profile" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <UserCircle size={18} />
                        <span>Profile settings</span>
                      </Link>
                    </>
                  )}

                  {isCompanyMember && (
                    <>
                      <Link to="/company/dashboard" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Building2 size={18} />
                        <span>Workspace overview</span>
                      </Link>
                      <Link to="/company/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Briefcase size={18} />
                        <span>Vacancies</span>
                      </Link>
                      <Link to="/company/applications" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Users size={18} />
                        <span>Applicants pipeline</span>
                      </Link>
                      <Link to="/company/analytics" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <TrendingUp size={18} />
                        <span>{LABELS.HIRING_INSIGHTS}</span>
                      </Link>
                      <Link to="/company/jobs/new" className="mobile-nav-item" onClick={closeMobileMenu} style={{ color: 'var(--navy)', fontWeight: 700 }}>
                        <PlusCircle size={18} />
                        <span>Post a new vacancy</span>
                      </Link>
                    </>
                  )}

                  {isSuperAdmin && (
                    <>
                      <Link to="/admin/dashboard" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Layers size={18} />
                        <span>Platform overview</span>
                      </Link>
                      <Link to="/admin/companies" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Building2 size={18} />
                        <span>Company verification</span>
                      </Link>
                      <Link to="/admin/users" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Users size={18} />
                        <span>User accounts</span>
                      </Link>
                      <Link to="/admin/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Briefcase size={18} />
                        <span>Job moderation</span>
                      </Link>
                      <Link to="/admin/audit" className="mobile-nav-item" onClick={closeMobileMenu}>
                        <Shield size={18} />
                        <span>Audit trail</span>
                      </Link>
                    </>
                  )}

                  <div className="mobile-nav-divider" />
                  <Link to="/help" className="mobile-nav-item" onClick={closeMobileMenu}>
                    <HelpCircle size={18} />
                    <span>Help & FAQ</span>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
