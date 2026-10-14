import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Code, 
  PenTool, 
  TrendingUp, 
  Briefcase, 
  BarChart3, 
  MessageSquare, 
  Layers, 
  UserCheck,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { jobsApi } from '../../services/api';
import type { JobCategory } from '../../types/recruitment';

export const CategoriesSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const list = await jobsApi.getCategories();
        if (isMounted) {
          setCategories(list);
        }
      } catch {
        // Honest empty state on error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchCats();
    return () => { isMounted = false; };
  }, []);

  const getCategoryIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('tech') || s.includes('soft') || s.includes('dev') || s.includes('it')) return <Code size={20} />;
    if (s.includes('design') || s.includes('creat')) return <PenTool size={20} />;
    if (s.includes('market') || s.includes('growth')) return <TrendingUp size={20} />;
    if (s.includes('sales') || s.includes('biz')) return <Briefcase size={20} />;
    if (s.includes('fin') || s.includes('acc')) return <BarChart3 size={20} />;
    if (s.includes('supp') || s.includes('serv')) return <MessageSquare size={20} />;
    if (s.includes('op') || s.includes('logis')) return <Layers size={20} />;
    if (s.includes('hr') || s.includes('peop') || s.includes('health')) return <UserCheck size={20} />;
    return <Briefcase size={20} />;
  };

  const handleCategoryClick = (cat: JobCategory) => {
    navigate(`/jobs?categoryId=${cat.id}`);
  };

  return (
    <section className="s" id="categories" aria-labelledby="cat-heading">
      <div className="container">
        <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 700 }}>
              Specializations
            </span>
            <h2 id="cat-heading" style={{ marginTop: '4px' }}>Browse jobs by category</h2>
            <p className="muted">Explore real published opportunities grouped by professional discipline.</p>
          </div>
          <Link to="/jobs" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>See all jobs</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card" style={{ height: '80px', background: 'var(--surface)', opacity: 0.6 }} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', background: 'var(--surface)' }}>
            <FolderOpen size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>No categories currently active</h3>
            <p className="muted" style={{ fontSize: '14px' }}>
              Categories will appear here once published postings are available.
            </p>
          </div>
        ) : (
          <div className="cats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : idx * 0.07 }}
              >
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCategoryClick(cat)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(cat); }}
                  className="card cat"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
                >
                  <span className="fi" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '10px', background: 'var(--soft)', color: 'var(--accent)', flexShrink: 0 }}>
                    {getCategoryIcon(cat.slug || cat.name)}
                  </span>
                  <div>
                    <b style={{ display: 'block', fontSize: '15px', color: 'var(--ink)' }}>{cat.name}</b>
                    <small className="muted" style={{ fontSize: '13px' }}>
                      {cat.openJobsCount ?? 0} {cat.openJobsCount === 1 ? 'open job' : 'open jobs'}
                    </small>
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

export default CategoriesSection;
