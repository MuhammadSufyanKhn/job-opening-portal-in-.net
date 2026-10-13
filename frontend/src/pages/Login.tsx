import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Briefcase, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { PageTransition } from '../components/common/PageTransition';

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
      <div className="v s2">
        {/* Left story panel */}
        <aside className="l">
          <div>
            <Link to="/" className="brand w">
              <i><Briefcase size={16} /></i>
              <span>HireSphere</span>
            </Link>
          </div>

          <div className="rise">
            <h1>Welcome back.</h1>
            <p className="sub">
              Pick up where you left off: your applications, your messages and your next interview.
            </p>
          </div>

          <div className="stack" aria-hidden="true">
            <div className="mc">
              <span className="mark m3">H</span>
              <div>
                <b>Customer Support Lead</b>
                <small>Harbor Logistics · Remote</small>
              </div>
              <span className="badge b-ok">New</span>
            </div>
            <div className="mc">
              <span className="mark m4">N</span>
              <div>
                <b>Product Designer</b>
                <small>Northwind · Hybrid</small>
              </div>
              <span className="badge b-ok">92% match</span>
            </div>
            <div className="mc">
              <span className="mark m1">A</span>
              <div>
                <b>Senior Developer</b>
                <small>Apex Cloud Systems · London</small>
              </div>
              <span className="badge b-ok">New</span>
            </div>
          </div>

          <div className="pts">
            <span><CheckCircle2 size={18} className="ic" /> Verified companies</span>
            <span><CheckCircle2 size={18} className="ic" /> Private CVs</span>
            <span><CheckCircle2 size={18} className="ic" /> Real people decide</span>
          </div>
        </aside>

        {/* Right Open page form */}
        <section className="r">
          <div className="box wrap">
            <div className="t2" role="tablist">
              <button type="button" role="tab" aria-selected="true">Sign in</button>
              <span aria-hidden="true">/</span>
              <Link to="/register-candidate" role="tab" aria-selected="false">Create account</Link>
            </div>

            <div className="hd">
              <h2>Sign in to your account</h2>
              <p>Good to see you again.</p>
            </div>

            {showRegistrationSuccess && !error && (
              <div style={{ padding: '12px 14px', background: 'var(--ok-bg)', color: 'var(--ok)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14.5px', fontWeight: 600 }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>Your account has been created successfully. Please sign in.</span>
              </div>
            )}

            {error && (
              <div className="err" style={{ padding: '10px 12px', background: 'var(--bad-bg)', borderRadius: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form" noValidate>
              <div className={`fld ${error ? 'bad' : ''}`}>
                <label className="lb" htmlFor="email">Email address</label>
                <div className="inp">
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
                  />
                </div>
              </div>

              <div className={`fld ${error ? 'bad' : ''}`}>
                <label className="lb" htmlFor="password">Password</label>
                <div className="inp pw">
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
                  />
                  <button
                    type="button"
                    className="eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="between">
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link has been dispatched or is managed by platform support.');
                  }}
                  className="lnk"
                  style={{ fontSize: '14px' }}
                >
                  Forgot password?
                </a>
              </div>

              <button className="btn primary lg block" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="fine">
              New to HireSphere? <Link to="/register-candidate" className="lnk">Create a free account</Link>
            </p>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Login;
