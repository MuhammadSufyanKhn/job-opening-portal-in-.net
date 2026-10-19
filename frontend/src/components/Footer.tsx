import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="f" role="contentinfo" style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)', padding: '56px 0 32px 0' }}>
      <div className="container">
        <div className="fg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '36px', marginBottom: '44px' }}>
          {/* Brand Column */}
          <div style={{ maxWidth: '300px' }}>
            <Link to="/" className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: 800, color: 'var(--ink)', textDecoration: 'none', marginBottom: '14px' }}>
              <span className="brand-logo-emblem" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#101B2A" />
                </svg>
              </span>
              <span>HireSphere</span>
            </Link>
            <p className="muted" style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
              The modern recruitment SaaS platform uniting verified company vacancies with objective skills assessment simulations.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ok)', background: 'var(--ok-bg)', padding: '4px 10px', borderRadius: '100px', fontWeight: 600 }}>
              <ShieldCheck size={14} />
              <span>Verified Employers Only</span>
            </div>
          </div>

          {/* Column 2: Jobseekers */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>For jobseekers</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><Link to="/jobs" className="muted" style={{ textDecoration: 'none' }}>Find verified jobs</Link></li>
              <li><Link to="/register-candidate" className="muted" style={{ textDecoration: 'none' }}>Create candidate profile</Link></li>
              <li><Link to="/how-it-works" className="muted" style={{ textDecoration: 'none' }}>How it works</Link></li>
              <li><Link to="/login" className="muted" style={{ textDecoration: 'none' }}>Jobseeker sign in</Link></li>
            </ul>
          </div>

          {/* Column 3: Employers */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>For employers</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><Link to="/for-employers" className="muted" style={{ textDecoration: 'none' }}>Employer overview</Link></li>
              <li><Link to="/companies" className="muted" style={{ textDecoration: 'none' }}>Company directory</Link></li>
              <li><Link to="/register-company" className="muted" style={{ textDecoration: 'none' }}>Register organization</Link></li>
              <li><Link to="/login" className="muted" style={{ textDecoration: 'none' }}>Company workspace sign in</Link></li>
            </ul>
          </div>

          {/* Column 4: Support & Legal */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>Support & Policies</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><Link to="/help" className="muted" style={{ textDecoration: 'none' }}>Knowledge base & FAQ</Link></li>
              <li><Link to="/contact" className="muted" style={{ textDecoration: 'none' }}>Contact support desk</Link></li>
              <li><Link to="/privacy" className="muted" style={{ textDecoration: 'none' }}>Privacy policy</Link></li>
              <li><Link to="/terms" className="muted" style={{ textDecoration: 'none' }}>Terms of service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="fb" style={{ paddingTop: '24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--muted)' }}>
          <span>© {new Date().getFullYear()} HireSphere. All rights reserved.</span>
          <span>Verified organizations · Private documents · Human-driven evaluations</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
