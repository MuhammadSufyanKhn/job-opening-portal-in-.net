import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PageTransition } from '../components/common/PageTransition';
import backpackImg from '../assets/young_man_backpack.jpg';

interface RegisterProps {
  defaultRole?: 'candidate' | 'employer';
}

export const Register: React.FC<RegisterProps> = ({ defaultRole = 'candidate' }) => {
  const [role, setRole] = useState<'candidate' | 'employer'>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('Information Technology');
  const [password, setPassword] = useState('');
  const [headline, setHeadline] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please complete all required fields.');
      return;
    }

    if (role === 'employer' && !companyName.trim()) {
      setError('Please provide your company name.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Member';

      if (role === 'candidate') {
        await authApi.registerCandidate({
          firstName,
          lastName,
          email: email.trim(),
          password,
          headline: headline.trim() || undefined,
        });
      } else {
        await authApi.registerCompany({
          companyName: companyName.trim(),
          industry: industry || 'Technology',
          contactEmail: email.trim(),
          ownerFirstName: firstName,
          ownerLastName: lastName,
          ownerEmail: email.trim(),
          ownerPassword: password,
          businessRegistrationNumber: '',
          websiteUrl: '',
        });
      }

      localStorage.removeItem('hiresphere_token');
      localStorage.removeItem('hiresphere_refresh');
      navigate('/login?registered=true', { state: { registered: true } });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.title || 'Registration failed. Please check your information.';
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="auth-page-wrapper">
        <div className="auth-card-split">
          {/* Left Form Column (Image 1: Sign Up Page) */}
          <div className="auth-form-column">
            <div style={{ marginBottom: '20px' }}>
              <Link to="/" className="brand-group" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <span className="brand-logo-emblem">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#101B2A" />
                  </svg>
                </span>
                <span className="brand-text">HireSphere</span>
              </Link>
            </div>

            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Join HireSphere and take the next step.</p>

            {/* Role selection tabs: Candidate vs Employer (Exact Image 1 layout) */}
            <div className="role-selector-pills" role="tablist" aria-label="Account Type">
              <button
                type="button"
                className={`role-selector-btn ${role === 'candidate' ? 'active' : ''}`}
                onClick={() => {
                  setRole('candidate');
                  setError(null);
                }}
                role="tab"
                aria-selected={role === 'candidate'}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`role-selector-btn ${role === 'employer' ? 'active' : ''}`}
                onClick={() => {
                  setRole('employer');
                  setError(null);
                }}
                role="tab"
                aria-selected={role === 'employer'}
              >
                Employer
              </button>
            </div>

            {error && (
              <div style={{ padding: '12px 14px', background: 'var(--bad-bg)', color: 'var(--bad)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', marginBottom: '16px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div className="fld" style={{ marginBottom: '14px' }}>
                <label className="lb" htmlFor="fullName" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px', display: 'block' }}>
                  {role === 'candidate' ? 'Full Name' : 'Full Name / Contact Person'}
                </label>
                <div className="inp" style={{ border: '1px solid rgba(16, 27, 42, 0.16)', borderRadius: '10px', background: '#FFFFFF' }}>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'candidate' ? 'John Doe' : 'Alex Smith'}
                    required
                    disabled={isSubmitting}
                    style={{ height: '42px', padding: '0 14px', width: '100%', border: 'none', outline: 'none', fontSize: '14px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* Employer Specific: Company Name */}
              {role === 'employer' && (
                <div className="fld" style={{ marginBottom: '14px' }}>
                  <label className="lb" htmlFor="companyName" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px', display: 'block' }}>
                    Company Name
                  </label>
                  <div className="inp" style={{ border: '1px solid rgba(16, 27, 42, 0.16)', borderRadius: '10px', background: '#FFFFFF' }}>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="TechNova Solutions"
                      required
                      disabled={isSubmitting}
                      style={{ height: '42px', padding: '0 14px', width: '100%', border: 'none', outline: 'none', fontSize: '14px', borderRadius: '10px' }}
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="fld" style={{ marginBottom: '14px' }}>
                <label className="lb" htmlFor="email" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px', display: 'block' }}>
                  {role === 'candidate' ? 'Email Address' : 'Work Email Address'}
                </label>
                <div className="inp" style={{ border: '1px solid rgba(16, 27, 42, 0.16)', borderRadius: '10px', background: '#FFFFFF' }}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'candidate' ? 'you@example.com' : 'alex@technova.com'}
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    style={{ height: '42px', padding: '0 14px', width: '100%', border: 'none', outline: 'none', fontSize: '14px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* Employer Specific: Industry */}
              {role === 'employer' && (
                <div className="fld" style={{ marginBottom: '14px' }}>
                  <label className="lb" htmlFor="industry" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px', display: 'block' }}>
                    Industry
                  </label>
                  <div className="inp" style={{ border: '1px solid rgba(16, 27, 42, 0.16)', borderRadius: '10px', background: '#FFFFFF' }}>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      style={{ height: '42px', padding: '0 14px', width: '100%', border: 'none', outline: 'none', fontSize: '14px', borderRadius: '10px', background: '#FFFFFF' }}
                    >
                      <option value="Information Technology">Information Technology</option>
                      <option value="Software & Internet">Software & Internet</option>
                      <option value="Design & Creative">Design & Creative</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Healthcare">Healthcare & Biotech</option>
                      <option value="Education">Education & Training</option>
                      <option value="Logistics & Supply">Logistics & Supply</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Candidate Optional: Headline */}
              {role === 'candidate' && (
                <div className="fld" style={{ marginBottom: '14px' }}>
                  <label className="lb" htmlFor="headline" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px', display: 'block' }}>
                    Professional Headline <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div className="inp" style={{ border: '1px solid rgba(16, 27, 42, 0.16)', borderRadius: '10px', background: '#FFFFFF' }}>
                    <input
                      id="headline"
                      name="headline"
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Senior Full Stack Engineer"
                      disabled={isSubmitting}
                      style={{ height: '42px', padding: '0 14px', width: '100%', border: 'none', outline: 'none', fontSize: '14px', borderRadius: '10px' }}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="fld" style={{ marginBottom: '16px' }}>
                <label className="lb" htmlFor="password" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px', display: 'block' }}>
                  Password
                </label>
                <div className="inp pw" style={{ position: 'relative', border: '1px solid rgba(16, 27, 42, 0.16)', borderRadius: '10px', background: '#FFFFFF' }}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                    style={{ height: '42px', padding: '0 40px 0 14px', width: '100%', border: 'none', outline: 'none', fontSize: '14px', borderRadius: '10px' }}
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

              {/* Terms Checkbox */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--muted)' }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: 'var(--navy)' }}
                  />
                  <span>
                    I agree to the <Link to="/terms" style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
                  </span>
                </label>
              </div>

              {/* Submit Button: Acid Lime */}
              <button className="btn-lime-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: 'var(--muted)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 700, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          {/* Right Visual Story Column (Image 1: Sign Up Page) */}
          <div className="auth-visual-column">
            <img 
              src={backpackImg} 
              alt="Young professional embarking on a career journey" 
              className="auth-visual-img"
            />
            <div className="auth-visual-overlay" style={{ background: 'linear-gradient(135deg, rgba(215, 255, 85, 0.4) 0%, rgba(184, 165, 255, 0.3) 50%, rgba(16, 27, 42, 0.65) 100%)' }} />
            
            <div className="auth-visual-content">
              <span className="brand-subtitle-badge" style={{ background: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.4)' }}>
                Your Career Journey
              </span>
            </div>

            <div className="auth-visual-content">
              <p className="auth-visual-caption">
                Your future starts here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
