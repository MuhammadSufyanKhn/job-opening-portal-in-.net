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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userToggleRef = useRef<HTMLButtonElement>(null);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    menuToggleRef.current?.focus();
  };

  const closeUserMenu = () => {
    setUserMenuOpen(false);
    userToggleRef.current?.focus();
  };

  // Keyboard navigation: Close open menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) {
          closeMobileMenu();
        }
        if (userMenuOpen) {
          closeUserMenu();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, userMenuOpen]);

  // Outside click handler for user menu dropdown
  useEffect(() => {
    if (!userMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        userMenuRef.current && 
        !userMenuRef.current.contains(e.target as Node) &&
        userToggleRef.current &&
        !userToggleRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [userMenuOpen]);

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
    return null;
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

  // Active route detector: handles exact matches and nested route paths safely
  const isActive = (path: string, exact: boolean = false) => {
    if (exact || path === '/') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const subtitle = getContextualSubtitle();

  return (
    <>
      <header className="navbar-wrapper">
        <div className="brand-header-area">
          {/* 1. LEFT BRAND & CONTEXTUAL SUBTITLE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link 
              to="/" 
              className="brand-group" 
              onClick={closeMobileMenu}
              aria-label="HireSphere Home"
            >
              <span className="brand-logo-emblem" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#101B2A" />
                </svg>
              </span>
              <span className="brand-text">HireSphere</span>
            </Link>
            {isAuthenticated && subtitle && (
              <span className="brand-subtitle-badge" aria-label={`Current portal: ${subtitle}`}>
                {subtitle}
              </span>
            )}
          </div>

          {/* 2. CENTER FLOATING PILL HORIZONTAL NAVIGATION (Desktop/Tablet) */}
          <div className="floating-nav-bar">
            <nav className="floating-nav-pill" aria-label="Primary Navigation">
              {!isAuthenticated ? (
                <>
                  <Link 
                    to="/" 
                    className={`floating-nav-link ${isActive('/', true) ? 'active' : ''}`}
                    aria-current={isActive('/', true) ? 'page' : undefined}
                  >
                    <span>Home</span>
                  </Link>
                  <Link 
                    to="/jobs" 
                    className={`floating-nav-link ${isActive('/jobs') ? 'active' : ''}`}
                    aria-current={isActive('/jobs') ? 'page' : undefined}
                  >
                    <span>Find Jobs</span>
                  </Link>
                  <Link 
                    to="/for-employers" 
                    className={`floating-nav-link ${isActive('/for-employers', true) ? 'active' : ''}`}
                    aria-current={isActive('/for-employers', true) ? 'page' : undefined}
                  >
                    <span>For Employers</span>
                  </Link>
                  <Link 
                    to="/companies" 
                    className={`floating-nav-link ${isActive('/companies', true) ? 'active' : ''}`}
                    aria-current={isActive('/companies', true) ? 'page' : undefined}
                  >
                    <span>Companies</span>
                  </Link>
                  <Link 
                    to="/how-it-works" 
                    className={`floating-nav-link ${isActive('/how-it-works', true) ? 'active' : ''}`}
                    aria-current={isActive('/how-it-works', true) ? 'page' : undefined}
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
                        aria-current={isActive('/jobs') ? 'page' : undefined}
                      >
                        <span>Discover Jobs</span>
                      </Link>
                      <Link 
                        to="/candidate/applications" 
                        className={`floating-nav-link ${isActive('/candidate/applications') ? 'active' : ''}`}
                        aria-current={isActive('/candidate/applications') ? 'page' : undefined}
                      >
                        <span>My Applications</span>
                      </Link>
                      <Link 
                        to="/candidate/dashboard" 
                        className={`floating-nav-link ${isActive('/candidate/dashboard', true) ? 'active' : ''}`}
                        aria-current={isActive('/candidate/dashboard', true) ? 'page' : undefined}
                      >
                        <span>Saved Jobs</span>
                      </Link>
                      <Link 
                        to="/candidate/profile" 
                        className={`floating-nav-link ${isActive('/candidate/profile') ? 'active' : ''}`}
                        aria-current={isActive('/candidate/profile') ? 'page' : undefined}
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
                        aria-current={isActive('/company/dashboard', true) ? 'page' : undefined}
                      >
                        <span>Overview</span>
                      </Link>
                      <Link 
                        to="/company/jobs" 
                        className={`floating-nav-link ${isActive('/company/jobs') ? 'active' : ''}`}
                        aria-current={isActive('/company/jobs') ? 'page' : undefined}
                      >
                        <span>Vacancies</span>
                      </Link>
                      <Link 
                        to="/company/applications" 
                        className={`floating-nav-link ${isActive('/company/applications') ? 'active' : ''}`}
                        aria-current={isActive('/company/applications') ? 'page' : undefined}
                      >
                        <span>Applicants</span>
                      </Link>
                      <Link 
                        to="/company/analytics" 
                        className={`floating-nav-link ${isActive('/company/analytics') ? 'active' : ''}`}
                        aria-current={isActive('/company/analytics') ? 'page' : undefined}
                      >
                        <span>Insights</span>
                      </Link>
                      <Link 
                        to="/company/jobs/new" 
                        className={`floating-nav-link ${isActive('/company/jobs/new', true) ? 'active' : ''}`}
                        aria-current={isActive('/company/jobs/new', true) ? 'page' : undefined}
                      >
                        <span>Post a Job</span>
                      </Link>
                    </>
                  )}

                  {/* Admin Navigation */}
                  {isSuperAdmin && (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        className={`floating-nav-link ${location.pathname === '/admin' || isActive('/admin/dashboard', true) ? 'active' : ''}`}
                        aria-current={(location.pathname === '/admin' || isActive('/admin/dashboard', true)) ? 'page' : undefined}
                      >
                        <span>Overview</span>
                      </Link>
                      <Link 
                        to="/admin/users" 
                        className={`floating-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                        aria-current={isActive('/admin/users') ? 'page' : undefined}
                      >
                        <span>Users</span>
                      </Link>
                      <Link 
                        to="/admin/companies" 
                        className={`floating-nav-link ${isActive('/admin/companies') ? 'active' : ''}`}
                        aria-current={isActive('/admin/companies') ? 'page' : undefined}
                      >
                        <span>Companies</span>
                      </Link>
                      <Link 
                        to="/admin/jobs" 
                        className={`floating-nav-link ${isActive('/admin/jobs') ? 'active' : ''}`}
                        aria-current={isActive('/admin/jobs') ? 'page' : undefined}
                      >
                        <span>Vacancies</span>
                      </Link>
                      <Link 
                        to="/admin/audit" 
                        className={`floating-nav-link ${isActive('/admin/audit') ? 'active' : ''}`}
                        aria-current={isActive('/admin/audit') ? 'page' : undefined}
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
                  <div style={{ position: 'relative' }}>
                    <button
                      ref={userToggleRef}
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="avatar-circle-btn"
                      title={`${user.fullName} (${user.email})`}
                      aria-label={`User menu for ${user.fullName}`}
                      aria-haspopup="true"
                      aria-expanded={userMenuOpen}
                      aria-controls="user-avatar-menu"
                    >
                      {getUserInitials()}
                    </button>

                    {userMenuOpen && (
                      <div 
                        id="user-avatar-menu" 
                        ref={userMenuRef} 
                        className="user-dropdown-popover" 
                        role="menu"
                        aria-label="Account Menu"
                      >
                        <div className="user-dropdown-header">
                          <strong>{user.fullName}</strong>
                          <small>{user.email}</small>
                          {subtitle && (
                            <span className="brand-subtitle-badge" style={{ marginTop: '6px' }}>
                              {subtitle}
                            </span>
                          )}
                        </div>

                        <Link
                          to={isCandidate ? '/candidate/dashboard' : isCompanyMember ? '/company/dashboard' : '/admin/dashboard'}
                          className="user-dropdown-item"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserCircle size={16} />
                          <span>My Workspace</span>
                        </Link>

                        {isCandidate && (
                          <>
                            <Link 
                              to="/candidate/documents" 
                              className="user-dropdown-item" 
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <FileText size={16} />
                              <span>CV & Documents</span>
                            </Link>
                            <Link 
                              to="/candidate/simulations" 
                              className="user-dropdown-item" 
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Sparkles size={16} />
                              <span>{LABELS.SKILLS_CHALLENGES}</span>
                            </Link>
                            <Link 
                              to="/candidate/profile" 
                              className="user-dropdown-item" 
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <UserCircle size={16} />
                              <span>Profile Settings</span>
                            </Link>
                          </>
                        )}

                        {isCompanyMember && (
                          <>
                            <Link 
                              to="/company/jobs/new" 
                              className="user-dropdown-item" 
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <PlusCircle size={16} />
                              <span>Post a Vacancy</span>
                            </Link>
                            <Link 
                              to="/companies" 
                              className="user-dropdown-item" 
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Building2 size={16} />
                              <span>Company Directory</span>
                            </Link>
                          </>
                        )}

                        {isSuperAdmin && (
                          <Link 
                            to="/admin/audit" 
                            className="user-dropdown-item" 
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield size={16} />
                            <span>Audit Trail</span>
                          </Link>
                        )}

                        <Link 
                          to="/help" 
                          className="user-dropdown-item" 
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <HelpCircle size={16} />
                          <span>Help & FAQ</span>
                        </Link>

                        <button
                          type="button"
                          role="menuitem"
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

      {/* 4. MOBILE FLOATING BOTTOM NAVIGATION (Mobile only <= 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {!isAuthenticated ? (
          <>
            <Link 
              to="/" 
              className={`mobile-bottom-item ${isActive('/', true) ? 'active' : ''}`}
              aria-current={isActive('/', true) ? 'page' : undefined}
            >
              <span className="bottom-icon"><Compass size={20} /></span>
              <span>Home</span>
            </Link>
            <Link 
              to="/jobs" 
              className={`mobile-bottom-item ${isActive('/jobs') ? 'active' : ''}`}
              aria-current={isActive('/jobs') ? 'page' : undefined}
            >
              <span className="bottom-icon"><Briefcase size={20} /></span>
              <span>Jobs</span>
            </Link>
            <Link 
              to="/companies" 
              className={`mobile-bottom-item ${isActive('/companies', true) ? 'active' : ''}`}
              aria-current={isActive('/companies', true) ? 'page' : undefined}
            >
              <span className="bottom-icon"><Building2 size={20} /></span>
              <span>Companies</span>
            </Link>
            <Link 
              to="/login" 
              className={`mobile-bottom-item ${isActive('/login', true) ? 'active' : ''}`}
              aria-current={isActive('/login', true) ? 'page' : undefined}
            >
              <span className="bottom-icon"><UserCircle size={20} /></span>
              <span>Sign in</span>
            </Link>
            <button 
              type="button" 
              className={`mobile-bottom-item ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open More Options"
            >
              <span className="bottom-icon"><MoreHorizontal size={20} /></span>
              <span>More</span>
            </button>
          </>
        ) : isCandidate ? (
          <>
            <Link 
              to="/jobs" 
              className={`mobile-bottom-item ${isActive('/jobs') ? 'active' : ''}`}
              aria-current={isActive('/jobs') ? 'page' : undefined}
            >
              <span className="bottom-icon"><Compass size={20} /></span>
              <span>Discover</span>
            </Link>
            <Link 
              to="/candidate/applications" 
              className={`mobile-bottom-item ${isActive('/candidate/applications') ? 'active' : ''}`}
              aria-current={isActive('/candidate/applications') ? 'page' : undefined}
            >
              <span className="bottom-icon"><FileText size={20} /></span>
              <span>Apps</span>
            </Link>
            <Link 
              to="/candidate/dashboard" 
              className={`mobile-bottom-item ${isActive('/candidate/dashboard', true) ? 'active' : ''}`}
              aria-current={isActive('/candidate/dashboard', true) ? 'page' : undefined}
            >
              <span className="bottom-icon"><TrendingUp size={20} /></span>
              <span>Saved</span>
            </Link>
            <Link 
              to="/candidate/profile" 
              className={`mobile-bottom-item ${isActive('/candidate/profile') ? 'active' : ''}`}
              aria-current={isActive('/candidate/profile') ? 'page' : undefined}
            >
              <span className="bottom-icon"><UserCircle size={20} /></span>
              <span>Profile</span>
            </Link>
            <button 
              type="button" 
              className={`mobile-bottom-item ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open More Options"
            >
              <span className="bottom-icon"><MoreHorizontal size={20} /></span>
              <span>More</span>
            </button>
          </>
        ) : isCompanyMember ? (
          <>
            <Link 
              to="/company/dashboard" 
              className={`mobile-bottom-item ${isActive('/company/dashboard', true) ? 'active' : ''}`}
              aria-current={isActive('/company/dashboard', true) ? 'page' : undefined}
            >
              <span className="bottom-icon"><Building2 size={20} /></span>
              <span>Overview</span>
            </Link>
            <Link 
              to="/company/jobs" 
              className={`mobile-bottom-item ${isActive('/company/jobs') ? 'active' : ''}`}
              aria-current={isActive('/company/jobs') ? 'page' : undefined}
            >
              <span className="bottom-icon"><Briefcase size={20} /></span>
              <span>Vacancies</span>
            </Link>
            <Link 
              to="/company/applications" 
              className={`mobile-bottom-item ${isActive('/company/applications') ? 'active' : ''}`}
              aria-current={isActive('/company/applications') ? 'page' : undefined}
            >
              <span className="bottom-icon"><Users size={20} /></span>
              <span>Applicants</span>
            </Link>
            <Link 
              to="/company/analytics" 
              className={`mobile-bottom-item ${isActive('/company/analytics') ? 'active' : ''}`}
              aria-current={isActive('/company/analytics') ? 'page' : undefined}
            >
              <span className="bottom-icon"><TrendingUp size={20} /></span>
              <span>Insights</span>
            </Link>
            <button 
              type="button" 
              className={`mobile-bottom-item ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open More Options"
            >
              <span className="bottom-icon"><MoreHorizontal size={20} /></span>
              <span>More</span>
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/admin/dashboard" 
              className={`mobile-bottom-item ${isActive('/admin/dashboard', true) || location.pathname === '/admin' ? 'active' : ''}`}
              aria-current={(isActive('/admin/dashboard', true) || location.pathname === '/admin') ? 'page' : undefined}
            >
              <span className="bottom-icon"><Layers size={20} /></span>
              <span>Overview</span>
            </Link>
            <Link 
              to="/admin/users" 
              className={`mobile-bottom-item ${isActive('/admin/users') ? 'active' : ''}`}
              aria-current={isActive('/admin/users') ? 'page' : undefined}
            >
              <span className="bottom-icon"><Users size={20} /></span>
              <span>Users</span>
            </Link>
            <Link 
              to="/admin/companies" 
              className={`mobile-bottom-item ${isActive('/admin/companies') ? 'active' : ''}`}
              aria-current={isActive('/admin/companies') ? 'page' : undefined}
            >
              <span className="bottom-icon"><Building2 size={20} /></span>
              <span>Companies</span>
            </Link>
            <Link 
              to="/admin/jobs" 
              className={`mobile-bottom-item ${isActive('/admin/jobs') ? 'active' : ''}`}
              aria-current={isActive('/admin/jobs') ? 'page' : undefined}
            >
              <span className="bottom-icon"><Briefcase size={20} /></span>
              <span>Jobs</span>
            </Link>
            <button 
              type="button" 
              className={`mobile-bottom-item ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open More Options"
            >
              <span className="bottom-icon"><MoreHorizontal size={20} /></span>
              <span>More</span>
            </button>
          </>
        )}
      </nav>

      {/* 5. EXPANDABLE MOBILE NAVIGATION DRAWER & BACKDROP */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              className="mobile-nav-backdrop"
              onClick={closeMobileMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              aria-hidden="true"
            />

            <motion.div
              id="mobile-navigation-drawer"
              ref={mobileMenuRef}
              className="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* User Info Header in Mobile Drawer */}
              {isAuthenticated && user && (
                <div className="mobile-user-row" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="avatar-circle-btn" style={{ width: '38px', height: '38px', fontSize: '13px' }}>
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
                    className="btn btn-outline sm"
                    title="Sign out"
                    aria-label="Sign out"
                    style={{ color: 'var(--bad)', borderColor: 'var(--bad-bg)' }}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )}

              <div className="mobile-nav-links">
                {!isAuthenticated ? (
                  <>
                    <Link to="/" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Compass size={18} />
                      <span>Home</span>
                    </Link>
                    <Link to="/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Briefcase size={18} />
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
                      <UserCircle size={18} />
                      <span>Sign in</span>
                    </Link>
                    <div className="mobile-cta-group">
                      <Link to="/register-candidate" className="btn btn-outline btn-block" onClick={closeMobileMenu}>
                        <span>Create candidate profile</span>
                      </Link>
                      <Link to="/register-company" className="btn btn-lime btn-block" onClick={closeMobileMenu}>
                        <span>Post a job vacancy</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {isCandidate && (
                      <>
                        <Link to="/jobs" className="mobile-nav-item" onClick={closeMobileMenu}>
                          <Compass size={18} />
                          <span>Discover jobs</span>
                        </Link>
                        <Link to="/candidate/dashboard" className="mobile-nav-item" onClick={closeMobileMenu}>
                          <TrendingUp size={18} />
                          <span>Saved jobs & overview</span>
                        </Link>
                        <Link to="/candidate/applications" className="mobile-nav-item" onClick={closeMobileMenu}>
                          <FileText size={18} />
                          <span>My Applications</span>
                        </Link>
                        <Link to="/candidate/documents" className="mobile-nav-item" onClick={closeMobileMenu}>
                          <FileText size={18} />
                          <span>{LABELS.MY_CVS}</span>
                        </Link>
                        <Link to="/candidate/simulations" className="mobile-nav-item" onClick={closeMobileMenu}>
                          <Sparkles size={18} />
                          <span>{LABELS.SKILLS_CHALLENGES}</span>
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
                          <span>Job vacancies</span>
                        </Link>
                        <Link to="/company/jobs/new" className="mobile-nav-item" onClick={closeMobileMenu} style={{ color: 'var(--navy)', fontWeight: 700 }}>
                          <PlusCircle size={18} />
                          <span>Post a new vacancy</span>
                        </Link>
                        <Link to="/company/applications" className="mobile-nav-item" onClick={closeMobileMenu}>
                          <Users size={18} />
                          <span>Applicants pipeline</span>
                        </Link>
                        <Link to="/company/analytics" className="mobile-nav-item" onClick={closeMobileMenu}>
                          <TrendingUp size={18} />
                          <span>{LABELS.HIRING_INSIGHTS}</span>
                        </Link>
                        <Link to="/companies" className="mobile-nav-item" onClick={closeMobileMenu}>
                          <Building2 size={18} />
                          <span>Company directory</span>
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
                          <span>Audit trail & reports</span>
                        </Link>
                      </>
                    )}

                    <div className="mobile-nav-divider" />
                    <Link to="/notifications" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <Compass size={18} />
                      <span>Notifications center</span>
                    </Link>
                    <Link to="/help" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <HelpCircle size={18} />
                      <span>Help & FAQ</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
