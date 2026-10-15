import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { Briefcase, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff, User, Building2 } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // If ownerEmail is not set yet, mirror official email as default convenience
      if (name === 'contactEmail' && !prev.ownerEmail) {
        updated.ownerEmail = value;
      }
      return updated;
    });
  };

  const calculateScore = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return p ? Math.max(1, s) : 0;
  };

  const score = calculateScore(formData.ownerPassword);
  const meterLabels = ['Use 8 or more characters', 'Weak', 'Okay', 'Good', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please agree to the Terms and Privacy policy to continue.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.registerCompany(formData);
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
            <h1>Hire the right people, faster.</h1>
            <p className="sub">
              Post jobs for free, see how well each applicant fits and keep your team in sync.
            </p>
          </div>

          <div className="stack" aria-hidden="true">
            <div className="mc">
              <span className="mark m1">ER</span>
              <div>
                <b>Elena Rostova</b>
                <small>Skills challenge passed</small>
              </div>
              <span className="badge b-ok">93% fit</span>
            </div>
            <div className="mc">
              <span className="mark m2">NK</span>
              <div>
                <b>Nadia Khan</b>
                <small>Interview booked</small>
              </div>
              <span className="badge b-ok">91% fit</span>
            </div>
            <div className="mc">
              <span className="mark m4">OF</span>
              <div>
                <b>Omar Farooq</b>
                <small>Ready to review</small>
              </div>
              <span className="badge b-ok">90% fit</span>
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
          <div className="box wrap company-box">
            <div className="t2">
              <span style={{ color: 'var(--ink)', fontWeight: 700, borderBottom: '2px solid var(--accent)', paddingBottom: '4px' }}>Employer registration</span>
              <span style={{ color: 'var(--muted)', opacity: 0.4 }}>•</span>
              <Link to="/login" style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>Sign in instead</Link>
            </div>

            <div className="hd">
              <h2>Create your company account</h2>
              <p>Hire top, pre-vetted talent with practical skills challenges.</p>
            </div>

            {/* Role switcher pill buttons */}
            <div className="seg" role="tablist" aria-label="I am a">
              <Link to="/register-candidate" role="tab" aria-selected="false">
                <User size={15} /> I'm looking for a job
              </Link>
              <button type="button" role="tab" aria-selected="true">
                <Building2 size={15} /> I'm hiring
              </button>
            </div>

            {error && (
              <div className="err" style={{ padding: '10px 12px', background: 'var(--bad-bg)', borderRadius: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form" noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className={`fld ${error && !formData.companyName ? 'bad' : ''}`}>
                  <label className="lb" htmlFor="companyName">Company name</label>
                  <div className="inp">
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Apex Cloud Systems"
                      autoComplete="organization"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className={`fld ${error && !formData.industry ? 'bad' : ''}`}>
                  <label className="lb" htmlFor="industry">Industry</label>
                  <div className="inp">
                    <input
                      id="industry"
                      name="industry"
                      type="text"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="e.g. Software, Logistics"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className={`fld ${error && !formData.contactEmail ? 'bad' : ''}`}>
                <label className="lb" htmlFor="contactEmail">Work / Official email</label>
                <div className="inp">
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="you@yourcompany.com"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="hint">Use your company email so we can verify your account.</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className={`fld ${error && !formData.ownerFirstName ? 'bad' : ''}`}>
                  <label className="lb" htmlFor="ownerFirstName">Your first name</label>
                  <div className="inp">
                    <input
                      id="ownerFirstName"
                      name="ownerFirstName"
                      type="text"
                      value={formData.ownerFirstName}
                      onChange={handleChange}
                      placeholder="Sana"
                      autoComplete="given-name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className={`fld ${error && !formData.ownerLastName ? 'bad' : ''}`}>
                  <label className="lb" htmlFor="ownerLastName">Your last name</label>
                  <div className="inp">
                    <input
                      id="ownerLastName"
                      name="ownerLastName"
                      type="text"
                      value={formData.ownerLastName}
                      onChange={handleChange}
                      placeholder="Malik"
                      autoComplete="family-name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className={`fld ${error && !formData.ownerEmail ? 'bad' : ''}`}>
                <label className="lb" htmlFor="ownerEmail">Admin sign-in email</label>
                <div className="inp">
                  <input
                    id="ownerEmail"
                    name="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    placeholder="sana.malik@yourcompany.com"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={`fld ${error && !formData.ownerPassword ? 'bad' : ''}`}>
                <label className="lb" htmlFor="ownerPassword">Password</label>
                <div className="inp pw">
                  <input
                    id="ownerPassword"
                    name="ownerPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.ownerPassword}
                    onChange={handleChange}
                    placeholder="Create a secure password"
                    autoComplete="new-password"
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
                <div className="meter" data-s={score}>
                  <i></i><i></i><i></i><i></i>
                  <span>{meterLabels[score]}</span>
                </div>
              </div>

              <div className="note">
                <ShieldCheck size={20} className="ic" style={{ flexShrink: 0 }} />
                <span>We check every company before its jobs go live, to keep scams out.</span>
              </div>

              <div className="fld">
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <span>
                    I agree to the <a className="lnk" href="#terms" onClick={(e) => e.preventDefault()}>Terms</a> and <a className="lnk" href="#privacy" onClick={(e) => e.preventDefault()}>Privacy policy</a>.
                  </span>
                </label>
              </div>

              <button className="btn primary lg block" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating company workspace...' : 'Create company account'}
              </button>
            </form>

            <p className="fine">
              Already have an account? <Link to="/login" className="lnk">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default RegisterCompany;
