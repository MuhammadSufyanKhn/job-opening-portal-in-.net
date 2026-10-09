import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Building2, Mail, Lock, User, Globe, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

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
      <motion.div
        className="auth-card auth-card-wide"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="auth-header">
          <h2>Register Your Organization</h2>
          <p>Establish your company workspace on HireSphere for evidence-backed recruiting</p>
        </div>

        <div className="info-banner">
          <ShieldCheck size={20} className="text-primary" />
          <span>New organizations enter an administrative review queue (Pending Approval) to ensure platform security and job seeker trust.</span>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <h3 className="section-title">Organization Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <div className="input-icon-wrapper">
                <Building2 size={18} className="input-icon" />
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry Sector</label>
              <input
                id="industry"
                name="industry"
                type="text"
                className="input-standard"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Technology, Finance, Health"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactEmail">General Contact Email</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="careers@acme.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="websiteUrl">Website URL</label>
              <div className="input-icon-wrapper">
                <Globe size={18} className="input-icon" />
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://acme.com"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">About the Organization</label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="textarea-standard"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your business mission and culture..."
            />
          </div>

          <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Primary Account Administrator (Owner)</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ownerFirstName">Owner First Name</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="ownerFirstName"
                  name="ownerFirstName"
                  type="text"
                  value={formData.ownerFirstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ownerLastName">Owner Last Name</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="ownerLastName"
                  name="ownerLastName"
                  type="text"
                  value={formData.ownerLastName}
                  onChange={handleChange}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ownerEmail">Owner Work Email</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  placeholder="jane.smith@acme.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ownerPassword">Owner Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="ownerPassword"
                  name="ownerPassword"
                  type="password"
                  value={formData.ownerPassword}
                  onChange={handleChange}
                  placeholder="Secure password (8+ chars)"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Registering Organization...' : 'Submit Organization for Verification'}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already an employer on HireSphere? <Link to="/login" className="link-subtle">Sign in here</Link></p>
        </div>
      </motion.div>
    </div>
  );
};
