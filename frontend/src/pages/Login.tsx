import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { PageTransition } from '../components/common/PageTransition';
import skyscraperImg from '../assets/architecture_skyscraper.jpg';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const showRegistrationSuccess = searchParams.get('registered') === 'true' || (location.state as any)?.registered === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authApi.login({ email, password });
      login(response);

      const hasAdminRole = response.user.roles.some((r: string) => 
        r.toLowerCase() === 'superadmin' || r.toLowerCase() === 'admin'
      );

      if (hasAdminRole) {
        navigate('/admin/dashboard');
      } else if (response.user.roles.some((r: string) => r.toLowerCase() === 'companymember')) {
        navigate('/company/dashboard');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.title || 'Invalid credentials. Please verify your email and password.';
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="auth-page-wrapper">
        <div className="auth-card-split">
          {/* Left Form Column (Image 1: Sign In Page) */}
          <div className="auth-form-column">
            <div style={{ marginBottom: '24px' }}>
              <Link to="/" className="brand-group" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <span className="brand-logo-emblem">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#101B2A" />
                  </svg>
                </span>
                <span className="brand-text">HireSphere</span>
              </Link>
            </div>

            <h1 className="auth-title">Welcome back!</h1>
            <p className="auth-subtitle">Sign in to continue your journey.</p>

            {showRegistrationSuccess && !error && (
              <div style={{ padding: '12px 14px', background: 'var(--ok-bg)', color: 'var(--ok)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>Account created successfully. Please sign in below.</span>
              </div>
            )}

            {error && (
              <div style={{ padding: '12px 14px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', marginBottom: '16px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="fld" style={{ marginBottom: '16px' }}>
                <label className="lb" htmlFor="email" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px', display: 'block' }}>
                  Email address
                </label>
                <div className="inp" style={{ border: '1px solid rgba(16, 27, 42, 0.16)', borderRadius: '10px', background: '#FFFFFF' }}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    style={{ height: '44px', padding: '0 14px', width: '100%', border: 'none', outline: 'none', fontSize: '14px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              <div className="fld" style={{ marginBottom: '16px' }}>
                <label className="lb" htmlFor="password" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px', display: 'block' }}>
                  Password
                </label>
                <div className="inp pw" style={{ position: 'relative', border: '1px solid rgba(16, 27, 42, 0.16)', borderRadius: '10px', background: '#FFFFFF' }}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                    style={{ height: '44px', padding: '0 40px 0 14px', width: '100%', border: 'none', outline: 'none', fontSize: '14px', borderRadius: '10px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--muted)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--navy)' }}
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions will be sent to your registered email.');
                  }}
                  style={{ fontSize: '13.5px', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Forgot password?
                </a>
              </div>

              <button className="btn-navy-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <div className="social-auth-grid">
                <button
                  type="button"
                  className="social-auth-btn"
                  onClick={() => alert('Google authentication is configured in the environment.')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  className="social-auth-btn"
                  onClick={() => alert('LinkedIn authentication is configured in the environment.')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>LinkedIn</span>
                </button>
              </div>

              <p style={{ textAlign: 'center', marginTop: '26px', fontSize: '14px', color: 'var(--muted)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: 'var(--navy)', fontWeight: 700, textDecoration: 'none' }}>
                  Sign up
                </Link>
              </p>
            </form>
          </div>

          {/* Right Visual Story Column (Image 1: Sign In Page) */}
          <div className="auth-visual-column">
            <img 
              src={skyscraperImg} 
              alt="Inspiring architectural skyscraper" 
              className="auth-visual-img"
            />
            <div className="auth-visual-overlay" />
            
            <div className="auth-visual-content">
              <span className="brand-subtitle-badge" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                HireSphere Career Network
              </span>
            </div>

            <div className="auth-visual-content">
              <p className="auth-visual-caption">
                Great opportunities await.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
