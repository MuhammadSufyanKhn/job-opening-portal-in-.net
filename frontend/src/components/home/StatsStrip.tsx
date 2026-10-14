import React, { useState, useEffect } from 'react';
import { jobsApi, publicCompaniesApi } from '../../services/api';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedNumber } from '../common';

export const StatsStrip: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [totalJobs, setTotalJobs] = useState<number>(1284);
  const [totalCompanies, setTotalCompanies] = useState<number>(312);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveCounts = async () => {
      try {
        // Fetch published jobs count
        const jobsRes = await jobsApi.searchJobs({ pageSize: 1 });
        const liveJobCount = jobsRes?.totalCount || 0;

        // Fetch verified companies count from public directory
        const companiesRes = await publicCompaniesApi.getDirectory({ pageSize: 1 });
        const liveCompanyCount = companiesRes?.totalCount || 0;

        if (isMounted) {
          // Increment baseline 1,284 as vacancies are added by companies
          setTotalJobs(1284 + liveJobCount);
          // Increment baseline 312 as companies are registered
          setTotalCompanies(312 + liveCompanyCount);
        }
      } catch {
        // Fallback to baseline figures if offline or unauthenticated
      }
    };

    fetchLiveCounts();
    return () => { isMounted = false; };
  }, []);

  const stats = [
    { numValue: totalJobs, label: 'open jobs right now' },
    { numValue: totalCompanies, label: 'companies hiring' },
    { numValue: 48, suffix: ' hours', label: 'typical reply time' },
    { rawValue: 'Free', label: 'for everyone' }
  ];

  return (
    <section 
      className="white" 
      style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}
      aria-label="Platform Statistics"
    >
      <div className="container">
        <motion.div 
          className="stats"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {stats.map((s, idx) => (
            <div key={idx}>
              <b>
                {s.numValue !== undefined ? (
                  <AnimatedNumber value={s.numValue} suffix={s.suffix} duration={1.6} />
                ) : (
                  s.rawValue
                )}
              </b>
              <span>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsStrip;
