import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { publicCompaniesApi } from '../../services/api';
import type { PublicCompanySummary } from '../../types/recruitment';

export const CompaniesHiringSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [companies, setCompanies] = useState<PublicCompanySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCompanies = async () => {
      try {
        const data = await publicCompaniesApi.getFeatured(8);
        if (isMounted) {
          setCompanies(data);
        }
      } catch {
        // Honest empty state on error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchCompanies();
    return () => { isMounted = false; };
  }, []);

  const handleCompanyClick = (company: PublicCompanySummary) => {
    navigate(`/jobs?search=${encodeURIComponent(company.name)}`);
  };

  return (
    <section className="s white" id="companies" aria-labelledby="companies-heading">
      <div className="container">
        <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 700 }}>
              Verified Employers
            </span>
            <h2 id="companies-heading" style={{ marginTop: '4px' }}>Companies hiring now</h2>
            <p className="muted">Organizations actively recruiting and reviewing applications on HireSphere.</p>
          </div>
          <Link to="/companies" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>See all companies</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card" style={{ height: '90px', background: 'var(--surface)', opacity: 0.6 }} />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg)', borderRadius: 'var(--r)' }}>
            <Building2 size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>No active companies listed yet</h3>
            <p className="muted" style={{ fontSize: '14px', maxWidth: '440px', margin: '0 auto 18px' }}>
              Verified employer profiles with published openings will appear here once active.
            </p>
            <Link to="/register-company" className="btn primary sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>Register your organization</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="logos" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {companies.map((company, idx) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : idx * 0.07 }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCompanyClick(company)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCompanyClick(company); }}
                  className="card co"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
                >
                  {company.logoUrl ? (
                    <img 
                      src={company.logoUrl} 
                      alt={`${company.name} logo`} 
                      style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '10px' }} 
                    />
                  ) : (
                    <span 
                      className="mark m1" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '10px', 
                        background: 'var(--soft)', 
                        color: 'var(--accent)', 
                        fontWeight: 700, 
                        fontSize: '16px',
                        flexShrink: 0 
                      }}
                    >
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: '15px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {company.name}
                    </b>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.industry}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 600, color: company.openJobsCount > 0 ? 'var(--ok)' : 'var(--muted)' }}>
                        {company.openJobsCount} {company.openJobsCount === 1 ? 'opening' : 'openings'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CompaniesHiringSection;
