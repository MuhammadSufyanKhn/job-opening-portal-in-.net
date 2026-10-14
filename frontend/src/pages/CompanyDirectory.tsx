import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  ExternalLink, 
  Briefcase, 
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { publicCompaniesApi } from '../services/api';
import type { PublicCompanySummary } from '../types/recruitment';
import { PageTransition } from '../components/common/PageTransition';
import { Pagination } from '../components/common/Pagination';

export const CompanyDirectory: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [companies, setCompanies] = useState<PublicCompanySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDirectory = async (page: number, search: string, industry: string) => {
    setIsLoading(true);
    try {
      const res = await publicCompaniesApi.getDirectory({
        search: search.trim() || undefined,
        industry: industry || undefined,
        page,
        pageSize: 12,
      });
      setCompanies(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setCurrentPage(res.page);
    } catch {
      setCompanies([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory(currentPage, searchTerm, selectedIndustry);
  }, [currentPage, selectedIndustry]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDirectory(1, searchTerm, selectedIndustry);
  };

  const industries = [
    'Technology & Software',
    'Financial Services',
    'Healthcare & Life Sciences',
    'E-Commerce & Retail',
    'Design & Creative',
    'Education',
    'Manufacturing & Logistics',
  ];

  return (
    <PageTransition>
      <div className="portal-container" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--soft)', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', marginBottom: '14px' }}>
            <Building2 size={15} />
            <span>Verified Organizations</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginBottom: '10px' }}>Company Directory</h1>
          <p className="muted" style={{ fontSize: '17px', maxWidth: '640px' }}>
            Explore verified employers actively recruiting on HireSphere. Every organization listed here has undergone verification by our platform team.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="card" style={{ padding: '20px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', marginBottom: '32px', boxShadow: 'var(--sh)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto', gap: '14px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--r-sm)' }}>
              <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <input
                type="search"
                placeholder="Search by company name or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px' }}
                aria-label="Search companies"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--r-sm)' }}>
              <Filter size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <select
                value={selectedIndustry}
                onChange={(e) => {
                  setSelectedIndustry(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px', color: 'var(--ink)' }}
                aria-label="Filter by industry"
              >
                <option value="">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: 'var(--r-sm)', fontWeight: 600, cursor: 'pointer' }}
            >
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Results Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
            {isLoading ? 'Searching directory...' : `${totalCount} verified ${totalCount === 1 ? 'company' : 'companies'} found`}
          </span>
        </div>

        {/* Company Cards Grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="card" style={{ height: '180px', background: 'var(--surface)', opacity: 0.6 }} />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--r)' }}>
            <Building2 size={44} style={{ color: 'var(--muted)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No matching companies found</h3>
            <p className="muted" style={{ fontSize: '15px', maxWidth: '440px', margin: '0 auto 20px' }}>
              We could not find any verified employers matching your current filters. Try adjusting your search term or selecting All Industries.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedIndustry('');
                fetchDirectory(1, '', '');
              }}
              className="btn"
              style={{ padding: '8px 18px', borderRadius: 'var(--r-sm)' }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {companies.map((company, idx) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : idx * 0.07 }}
                className="card"
                style={{ 
                  padding: '24px', 
                  background: 'var(--surface)', 
                  borderRadius: 'var(--r)', 
                  border: '1px solid var(--line)', 
                  boxShadow: 'var(--sh)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {company.logoUrl ? (
                        <img 
                          src={company.logoUrl} 
                          alt={`${company.name} logo`} 
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px' }} 
                        />
                      ) : (
                        <span 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '10px', 
                            background: 'var(--soft)', 
                            color: 'var(--accent)', 
                            fontWeight: 700, 
                            fontSize: '18px' 
                          }}
                        >
                          {company.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <h3 style={{ fontSize: '18px', color: 'var(--ink)' }}>{company.name}</h3>
                        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                          {company.industry}
                        </div>
                      </div>
                    </div>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: 'var(--ok-bg)', color: 'var(--ok)', fontWeight: 600 }}>
                      <CheckCircle2 size={12} />
                      <span>Verified</span>
                    </span>
                  </div>

                  {company.description && (
                    <p className="muted" style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {company.description}
                    </p>
                  )}
                </div>

                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: company.openJobsCount > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                    <Briefcase size={15} />
                    <span>{company.openJobsCount} open {company.openJobsCount === 1 ? 'job' : 'jobs'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {company.websiteUrl && (
                      <a
                        href={company.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                        title="Visit company website"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <Link
                      to={`/jobs?search=${encodeURIComponent(company.name)}`}
                      className="btn primary"
                      style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>View jobs</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default CompanyDirectory;
