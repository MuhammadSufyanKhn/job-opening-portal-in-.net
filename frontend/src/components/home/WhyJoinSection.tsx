import React from 'react';
import { Building2, TrendingUp, Laptop, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export const WhyJoinSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const pillars = [
    {
      icon: <Building2 size={22} className="text-cobalt" />,
      title: 'Top Companies',
      desc: 'Connect exclusively with verified organizations and transparent teams.'
    },
    {
      icon: <TrendingUp size={22} className="text-emerald" />,
      title: 'Career Growth',
      desc: 'Showcase validated capabilities through practical WorkSim challenges.'
    },
    {
      icon: <Laptop size={22} className="text-amber" />,
      title: 'Flexible Work',
      desc: 'Filter verified remote, hybrid, and international opportunities.'
    },
    {
      icon: <Users size={22} className="text-pur" />,
      title: 'Supportive Community',
      desc: 'Direct communication channels with hiring managers and fast feedback.'
    }
  ];

  return (
    <section className="why-join-section" aria-labelledby="why-join-heading">
      <div className="home-container">
        <h2 id="why-join-heading" className="why-join-title">Why join HireSphere?</h2>
        <p className="why-join-subtitle">Built around trust, verified qualifications, and rapid recruitment workflows.</p>

        <div className="why-join-grid">
          {/* Left Grid: 4 Credibility Pillars */}
          <div className="pillars-grid">
            {pillars.map((pillar, idx) => (
              <motion.div 
                key={pillar.title} 
                className="pillar-card"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <div className="pillar-icon-box">
                  {pillar.icon}
                </div>
                <div>
                  <h3 className="pillar-title">{pillar.title}</h3>
                  <p className="pillar-desc">{pillar.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Editorial Testimonial Card (Image 2 style) */}
          <motion.div 
            className="testimonial-editorial-card"
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="testimonial-quote-mark" aria-hidden="true">“</div>
            <p className="testimonial-quote-text">
              I found my dream role through HireSphere in less than three weeks. The objective skills assessment made all the difference, and the team provided instant feedback at every step!
            </p>

            <div className="testimonial-author-row">
              <span className="mark m1" style={{ width: '44px', height: '44px', fontSize: '15px' }}>
                AK
              </span>
              <div>
                <strong className="author-name">Ayesha Khan</strong>
                <span className="author-role">Frontend Engineer at TechNova</span>
              </div>
            </div>

            <div className="testimonial-badge-verified">
              <span>✦ Verified Placement</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyJoinSection;
