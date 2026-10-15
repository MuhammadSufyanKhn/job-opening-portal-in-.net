import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { Briefcase, AlertCircle, CheckCircle2, Eye, EyeOff, User, Building2 } from 'lucide-react';
import { PageTransition } from '../components/common/PageTransition';

export const RegisterCandidate: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    headline: '',
    location: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateScore = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return p ? Math.max(1, s) : 0;
  };

  const score = calculateScore(formData.password);
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
      await authApi.registerCandidate(formData);
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
            <h1>Find a job you'll love.</h1>
            <p className="sub">
              Create a free profile, see how well you fit each job and follow every application.
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
            <div className="t2">
              <span style={{ color: 'var(--ink)', fontWeight: 700, borderBottom: '2px solid var(--accent)', paddingBottom: '4px' }}>Create account</span>
              <span style={{ color: 'var(--muted)', opacity: 0.4 }}>•</span>
              <Link to="/login" style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>Sign in instead</Link>
            </div>

            <div className="hd">
              <h2>Create your free profile</h2>
              <p>Join thousands of professionals landing verified roles.</p>
            </div>

            {/* Role switcher pill buttons */}
            <div className="seg" role="tablist" aria-label="I am a">
              <button type="button" role="tab" aria-selected="true">
                <User size={15} /> I'm looking for a job
              </button>
              <Link to="/register-company" role="tab" aria-selected="false">
                <Building2 size={15} /> I'm hiring
              </Link>
            </div>

            {error && (
              <div className="err" style={{ padding: '10px 12px', background: 'var(--bad-bg)', borderRadius: '8px', marginBottom: '8px', fontSize: '14px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form" noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className={`fld ${error && !formData.firstName ? 'bad' : ''}`}>
                  <label className="lb" htmlFor="firstName">First name</label>
                  <div className="inp">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Ayesha"
                      autoComplete="given-name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className={`fld ${error && !formData.lastName ? 'bad' : ''}`}>
                  <label className="lb" htmlFor="lastName">Last name</label>
                  <div className="inp">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Khan"
                      autoComplete="family-name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className={`fld ${error && !formData.email ? 'bad' : ''}`}>
                <label className="lb" htmlFor="email">Email address</label>
                <div className="inp">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={`fld ${error && !formData.password ? 'bad' : ''}`}>
                <label className="lb" htmlFor="password">Password</label>
                <div className="inp pw">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="fld">
                  <label className="lb" htmlFor="headline">Headline (optional)</label>
                  <div className="inp">
                    <input
                      id="headline"
                      name="headline"
                      type="text"
                      value={formData.headline}
                      onChange={handleChange}
                      placeholder="e.g. Product Designer"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="fld">
                  <label className="lb" htmlFor="location">City / Location</label>
                  <div className="inp">
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Lahore, PK"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
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
                {isSubmitting ? 'Creating profile...' : 'Create free account'}
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

export default RegisterCandidate;
