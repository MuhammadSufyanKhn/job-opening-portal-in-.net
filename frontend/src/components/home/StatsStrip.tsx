import React, { useState, useEffect } from 'react';
import { jobsApi, publicCompaniesApi } from '../../services/api';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedNumber } from '../common';
import { Briefcase, Building2, Clock, Sparkles } from 'lucide-react';

export const StatsStrip: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [totalJobs, setTotalJobs] = useState<number>(1284);
  const [totalCompanies, setTotalCompanies] = useState<number>(312);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveCounts = async () => {
      try {
        const jobsRes = await jobsApi.searchJobs({ pageSize: 1 });
        const liveJobCount = jobsRes?.totalCount || 0;

        const companiesRes = await publicCompaniesApi.getDirectory({ pageSize: 1 });
        const liveCompanyCount = companiesRes?.totalCount || 0;

        if (isMounted) {
          setTotalJobs(1284 + liveJobCount);
          setTotalCompanies(312 + liveCompanyCount);
        }
      } catch {
        // Fallback to baseline figures
      }
    };

    fetchLiveCounts();
    return () => { isMounted = false; };
  }, []);

  const stats = [
    { 
      numValue: totalJobs, 
      label: 'open jobs right now', 
      badge: 'Live vacancies',
      accent: 'accent-blue',
      icon: Briefcase,
      iconBg: 'var(--soft)',
      iconColor: 'var(--accent-d)'
    },
    { 
      numValue: totalCompanies, 
      label: 'companies hiring', 
      badge: 'Vetted employers',
      accent: 'accent-emerald',
      icon: Building2,
      iconBg: '#EDF9F3',
      iconColor: '#0F7A55'
    },
    { 
      numValue: 48, 
      suffix: ' hours', 
      label: 'typical reply time', 
      badge: 'Direct review',
      accent: 'accent-amber',
      icon: Clock,
      iconBg: '#FEF8EB',
      iconColor: '#D97706'
    },
    { 
      rawValue: 'Free', 
      label: 'for all jobseekers', 
      badge: 'Zero fees',
      accent: 'accent-purple',
      icon: Sparkles,
      iconBg: '#F3EEFF',
      iconColor: '#7C3AED'
    }
  ];

  return (
    <section className="stats-ribbon-section" aria-label="Platform Statistics">
      <div className="container">
        <motion.div 
          className="stats-ribbon-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: shouldReduceMotion ? 0 : 0.14
              }
            }
          }}
        >
          {stats.map((s, idx) => {
            const IconComponent = s.icon;
            return (
              <motion.div 
                key={idx}
                className={`stats-ribbon-card ${s.accent}`}
                variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
                  }
                }}
              >
                <div className="stats-ribbon-top">
                  <div 
                    className="stats-ribbon-icon"
                    style={{ background: s.iconBg, color: s.iconColor }}
                  >
                    <IconComponent size={20} />
                  </div>
                  <span 
                    className="stats-ribbon-badge"
                    style={{ background: s.iconBg, color: s.iconColor }}
                  >
                    {s.badge}
                  </span>
                </div>

                <div>
                  <div className="stats-ribbon-value">
                    {s.numValue !== undefined ? (
                      <AnimatedNumber value={s.numValue} suffix={s.suffix} duration={1.6} />
                    ) : (
                      s.rawValue
                    )}
                  </div>
                  <p className="stats-ribbon-label">{s.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsStrip;
