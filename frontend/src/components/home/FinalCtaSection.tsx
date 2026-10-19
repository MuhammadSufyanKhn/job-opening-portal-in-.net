import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, PlusCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export const FinalCtaSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="final-cta-section" aria-labelledby="final-cta-title">
      <div className="home-container">
        <motion.div 
          className="final-cta-card"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Subtle background decorative shapes */}
          <div className="final-cta-glow" aria-hidden="true" />

          <div className="final-cta-content">
            <span className="final-cta-eyebrow">✦ TAKE THE NEXT STEP</span>
            <h2 id="final-cta-title" className="final-cta-title">
              Ready to start your <span className="text-lime">next chapter?</span>
            </h2>
            <p className="final-cta-subtitle">
              Join thousands of candidates and innovative organizations accelerating their hiring on HireSphere today.
            </p>

            <div className="final-cta-buttons">
              <Link to="/jobs" className="btn btn-lime lg">
                <Briefcase size={18} />
                <span>Explore Opportunities</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/for-employers" className="btn-outline-white lg">
                <PlusCircle size={18} />
                <span>Post a Vacancy</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
