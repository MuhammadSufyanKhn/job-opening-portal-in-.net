import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Briefcase, AlertCircle, ArrowRight } from 'lucide-react';

export const RegisterCandidate: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    headline: '',
    location: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authApi.registerCandidate(formData);
      login(response);
      navigate('/candidate/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.title || 'Registration failed. Please check your information.';
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
          <h1>Create your free profile</h1>
          <p>Search, apply and track jobs with verified companies.</p>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '16px', padding: '10px 12px', background: 'var(--bad-bg)', borderRadius: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="g2">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Ayesha"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Khan"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a secure password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="headline" className="form-label">Professional headline</label>
            <input
              id="headline"
              name="headline"
              type="text"
              className="form-input"
              value={formData.headline}
              onChange={handleChange}
              placeholder="e.g. Product Designer or Full Stack Engineer"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location" className="form-label">City or country</label>
            <input
              id="location"
              name="location"
              type="text"
              className="form-input"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Lahore, PK or Remote"
            />
          </div>

          <button 
            type="submit" 
            className="btn primary lg btn-block" 
            disabled={isSubmitting}
            style={{ marginTop: '8px' }}
          >
            <span>{isSubmitting ? 'Creating profile...' : 'Create your free profile'}</span>
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
          <div style={{ marginTop: '10px' }}>
            <span className="muted" style={{ fontSize: '13.5px' }}>Hiring for your team? </span>
            <Link to="/register-company" style={{ fontSize: '13.5px' }}>Create your company account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCandidate;
