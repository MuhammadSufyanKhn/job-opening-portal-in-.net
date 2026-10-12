import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { Briefcase, AlertCircle, ShieldCheck, ArrowRight, Building2, User } from 'lucide-react';
import { PageTransition } from '../components/common/PageTransition';

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

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.registerCompany(formData);
      // Explicitly clear any tokens/session so user is not automatically authenticated
      localStorage.removeItem('hiresphere_token');
      localStorage.removeItem('hiresphere_refresh');
      navigate('/login?registered=true', { state: { registered: true } });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.title || 'Registration failed. Please check company details.';
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: '640px' }}>
          {/* Brand at top */}
          <div className="auth-brand">
            <Link to="/" className="brand">
              <i aria-hidden="true"><Briefcase size={16} /></i>
              <span>HireSphere</span>
            </Link>
          </div>

          <div className="auth-header">
            <h1>Create your company workspace</h1>
            <p>Post vacancies, assess candidate capabilities, and build your hiring pipeline.</p>
          </div>

          {/* Reassurance banner */}
          <div className="auth-reassurance" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--r-sm)', background: 'var(--soft)', color: 'var(--accent)', fontSize: '13.5px' }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>Platform administrators audit and verify every company profile before job listings go live.</span>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: '20px', padding: '12px 14px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section 1: Organization Details */}
            <div style={{ padding: '20px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--ink)' }}>
                <Building2 size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '16px' }}>Organization Details</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label htmlFor="companyName" className="form-label">
                    Legal company name <span style={{ color: 'var(--bad)' }}>*</span>
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    className="form-input"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corporation"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="industry" className="form-label">
                      Primary industry <span style={{ color: 'var(--bad)' }}>*</span>
                    </label>
                    <input
                      id="industry"
                      name="industry"
                      type="text"
                      className="form-input"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="e.g. Software, Logistics, Healthcare"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="websiteUrl" className="form-label">Website URL</label>
                    <input
                      id="websiteUrl"
                      name="websiteUrl"
                      type="url"
                      className="form-input"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contactEmail" className="form-label">
                    Official corporate contact email <span style={{ color: 'var(--bad)' }}>*</span>
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    className="form-input"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="recruitment@example.com"
                    required
                    disabled={isSubmitting}
                  />
                  <small className="muted" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Used for platform verification notices and audit validation.
                  </small>
                </div>
              </div>
            </div>

            {/* Section 2: Account Owner Credentials */}
            <div style={{ padding: '20px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--ink)' }}>
                <User size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '16px' }}>Primary Administrator Credentials</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="ownerFirstName" className="form-label">
                      First name <span style={{ color: 'var(--bad)' }}>*</span>
                    </label>
                    <input
                      id="ownerFirstName"
                      name="ownerFirstName"
                      type="text"
                      className="form-input"
                      value={formData.ownerFirstName}
                      onChange={handleChange}
                      placeholder="e.g. Sarah"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="ownerLastName" className="form-label">
                      Last name <span style={{ color: 'var(--bad)' }}>*</span>
                    </label>
                    <input
                      id="ownerLastName"
                      name="ownerLastName"
                      type="text"
                      className="form-input"
                      value={formData.ownerLastName}
                      onChange={handleChange}
                      placeholder="e.g. Jenkins"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="ownerEmail" className="form-label">
                    Sign-in email address <span style={{ color: 'var(--bad)' }}>*</span>
                  </label>
                  <input
                    id="ownerEmail"
                    name="ownerEmail"
                    type="email"
                    className="form-input"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    placeholder="sarah.jenkins@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ownerPassword" className="form-label">
                    Password <span style={{ color: 'var(--bad)' }}>*</span>
                  </label>
                  <input
                    id="ownerPassword"
                    name="ownerPassword"
                    type="password"
                    className="form-input"
                    value={formData.ownerPassword}
                    onChange={handleChange}
                    placeholder="Create a secure password"
                    required
                    disabled={isSubmitting}
                  />
                  <small className="muted" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Must be at least 6 characters with upper/lower case letters and numbers.
                  </small>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn primary lg btn-block" 
              disabled={isSubmitting}
              style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>{isSubmitting ? 'Registering organization...' : 'Create company account'}</span>
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
            <p>Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link></p>
            <div style={{ marginTop: '10px' }}>
              <span className="muted" style={{ fontSize: '13.5px' }}>Looking for a job? </span>
              <Link to="/register-candidate" style={{ fontSize: '13.5px', color: 'var(--accent)' }}>Create your free profile</Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default RegisterCompany;
