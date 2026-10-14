import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Terminal, ArrowRight, Award, BarChart3 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export const WorkSimIntroSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const features = [
    {
      icon: Terminal,
      title: 'Interactive Role Scenarios',
      description: 'Candidates resolve realistic business problems, debug code, or prioritize client tickets in simulated environments.',
    },
    {
      icon: Award,
      title: 'Objective Skill Rubrics',
      description: 'Every assessment is evaluated against structured competency criteria, reducing subjectivity and bias.',
    },
    {
      icon: BarChart3,
      title: 'Actionable Performance Signals',
      description: 'Hiring teams gain verifiable evidence of candidate problem-solving speed, precision, and critical thinking.',
    },
  ];

  return (
    <section className="s" style={{ background: 'var(--bg)', padding: '72px 0' }} aria-labelledby="worksim-heading">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--amber-soft)', color: 'var(--amber-text)', fontWeight: 600, fontSize: '13px', marginBottom: '14px' }}>
            <Sparkles size={15} />
            <span>Interactive Skills Assessment</span>
          </div>
          <h2 id="worksim-heading" style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', marginBottom: '14px', letterSpacing: '-0.03em' }}>
            Prove practical capability with WorkSim
          </h2>
          <p className="muted" style={{ fontSize: '16px', lineHeight: 1.6 }}>
            HireSphere bridges traditional CV screening with realistic work task simulations, giving both candidates and employers authentic hiring confidence.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '36px' }}>
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.65, delay: shouldReduceMotion ? 0 : idx * 0.12 }}
                className="card"
                style={{ padding: '28px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--sh)' }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--ink)' }}>{item.title}</h3>
                <p className="muted" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/for-employers" className="btn primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--r-sm)', fontWeight: 600 }}>
            <span>Explore WorkSim for hiring teams</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WorkSimIntroSection;
