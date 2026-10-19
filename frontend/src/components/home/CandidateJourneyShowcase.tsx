import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Award, Compass } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import youngManImg from '../../assets/young_man_backpack.jpg';

export const CandidateJourneyShowcase: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="candidate-showcase-section" aria-labelledby="candidate-showcase-heading">
      <div className="home-container">
        <div className="candidate-showcase-grid">
          {/* Left Column: Visual Artwork */}
          <motion.div 
            className="candidate-artwork-wrap"
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img 
              src={youngManImg} 
              alt="Candidate with backpack ready for their new career chapter" 
              className="candidate-showcase-photo"
            />
            <div className="candidate-floating-pill">
              <Award size={18} className="text-cobalt" />
              <span>Verified Skills Certified</span>
            </div>
          </motion.div>

          {/* Right Column: Copy & Actions */}
          <motion.div 
            className="candidate-content-wrap"
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="candidate-badge-tag">
              <Sparkles size={14} className="text-cobalt" />
              <span>CANDIDATE WORKSPACE</span>
            </div>

            <h2 id="candidate-showcase-heading" className="candidate-showcase-title">
              Your skills. Your future. <span className="highlight-lavender">Validated.</span>
            </h2>

            <p className="candidate-showcase-desc">
              Move beyond generic CV filters. Prove your competencies with interactive WorkSim challenges and track your applications with complete visibility.
            </p>

            <div className="candidate-steps-stack">
              <div className="candidate-step-item">
                <div className="step-num-circle">1</div>
                <div>
                  <h4>Build & Version Your Profile</h4>
                  <p>Store multiple CV versions with automatic skill extraction and tailored targeting.</p>
                </div>
              </div>

              <div className="candidate-step-item">
                <div className="step-num-circle">2</div>
                <div>
                  <h4>Complete WorkSim Challenges</h4>
                  <p>Solve timed scenario assessments that demonstrate actual problem-solving ability.</p>
                </div>
              </div>

              <div className="candidate-step-item">
                <div className="step-num-circle">3</div>
                <div>
                  <h4>Direct Recruiter Engagement</h4>
                  <p>Transparent pipeline status with no ghosting—from screening to interview and offer.</p>
                </div>
              </div>
            </div>

            <div className="candidate-cta-row">
              <Link to="/register-candidate" className="btn btn-lime">
                <span>Create Free Profile</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/jobs" className="btn btn-outline">
                <Compass size={16} />
                <span>Browse Opportunities</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CandidateJourneyShowcase;
