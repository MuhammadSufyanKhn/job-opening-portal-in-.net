import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Briefcase, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

export const RegisterCompany: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    contactEmail: '',
    businessRegistrationNumber: '',
    websiteUrl: '',
    description: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authApi.registerCompany(formData);
      login(response);
      navigate('/company/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.title || 'Registration failed. Please check company details.';
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        {/* Brand at top */}
        <div className="auth-brand">
          <Link to="/" className="brand">
            <i aria-hidden="true"><Briefcase size={16} /></i>
            <span>HireSphere</span>
          </Link>
        </div>

        <div className="auth-header">
          <h1>Create your company account</h1>
          <p>Post jobs and find the right people for your team.</p>
        </div>

        {/* Reassurance banner */}
        <div className="auth-reassurance" style={{ marginBottom: '20px' }}>
          <ShieldCheck size={18} />
          <span>We check every company before its jobs go live, to keep scams out.</span>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '16px', padding: '10px 12px', background: 'var(--bad-bg)', borderRadius: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="companyName" className="form-label">Company name</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              className="form-input"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. Apex Cloud Systems"
              required
            />
          </div>

          <div className="g2">
            <div className="form-group">
              <label htmlFor="industry" className="form-label">Industry</label>
              <input
                id="industry"
                name="industry"
                type="text"
                className="form-input"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Software, Logistics"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="websiteUrl" className="form-label">Website</label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                type="text"
                className="form-input"
                value={formData.websiteUrl}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="contactEmail" className="form-label">Company contact email</label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              className="form-input"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="contact@company.com"
              required
            />
          </div>

          <div className="g2">
            <div className="form-group">
              <label htmlFor="ownerFirstName" className="form-label">Your first name</label>
              <input
                id="ownerFirstName"
                name="ownerFirstName"
                type="text"
                className="form-input"
                value={formData.ownerFirstName}
                onChange={handleChange}
                placeholder="Sana"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ownerLastName" className="form-label">Your last name</label>
              <input
                id="ownerLastName"
                name="ownerLastName"
                type="text"
                className="form-input"
                value={formData.ownerLastName}
                onChange={handleChange}
                placeholder="Malik"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ownerEmail" className="form-label">Your sign-in email</label>
            <input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              className="form-input"
              value={formData.ownerEmail}
              onChange={handleChange}
              placeholder="sana@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ownerPassword" className="form-label">Password</label>
            <input
              id="ownerPassword"
              name="ownerPassword"
              type="password"
              className="form-input"
              value={formData.ownerPassword}
              onChange={handleChange}
              placeholder="Create a secure password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn primary lg btn-block" 
            disabled={isSubmitting}
            style={{ marginTop: '8px' }}
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create your company account'}</span>
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
          <div style={{ marginTop: '10px' }}>
            <span className="muted" style={{ fontSize: '13.5px' }}>Looking for a job? </span>
            <Link to="/register-candidate" style={{ fontSize: '13.5px' }}>Create your free profile</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
