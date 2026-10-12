import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Briefcase, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authApi.login({ email, password });
      login(response);

      if (response.user.roles.includes('SuperAdmin')) {
        navigate('/admin/dashboard');
      } else if (response.user.roles.includes('CompanyMember')) {
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
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand at top */}
        <div className="auth-brand">
          <Link to="/" className="brand">
            <i aria-hidden="true"><Briefcase size={16} /></i>
            <span>HireSphere</span>
          </Link>
        </div>

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your HireSphere account.</p>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '16px', padding: '10px 12px', background: 'var(--bad-bg)', borderRadius: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className="btn primary lg btn-block" 
            disabled={isSubmitting}
            style={{ marginTop: '8px' }}
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account yet?</p>
          <div className="row" style={{ justifyContent: 'center', marginTop: '8px', gap: '12px' }}>
            <Link to="/register-candidate">Create your free profile</Link>
            <span className="muted">·</span>
            <Link to="/register-company">Create your company account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
