import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { HOME_FAQS } from '../../content/homeContent';

export const FaqSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="s white" id="faq" aria-labelledby="faq-heading">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'flex-start' }}>
          {/* Left Column: Balanced info and direct assistance links */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'var(--soft)', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', marginBottom: '16px' }}>
              <HelpCircle size={15} />
              <span>Answers & Assistance</span>
            </div>

            <h2 id="faq-heading" style={{ fontSize: 'clamp(28px, 3.2vw, 38px)', marginBottom: '14px', letterSpacing: '-0.035em' }}>
              Questions? We're here to help.
            </h2>

            <p className="muted" style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '28px', maxWidth: '460px' }}>
              HireSphere unites verified company opportunities with transparent, objective applicant evaluation. Here is everything you need to know about our recruitment workflow, privacy safeguards, and skills simulation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '360px' }}>
              <Link 
                to="/help" 
                className="btn" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--bg)', fontWeight: 600 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <HelpCircle size={18} style={{ color: 'var(--accent)' }} />
                  <span>Visit Knowledge Base</span>
                </div>
                <ArrowRight size={16} />
              </Link>

              <Link 
                to="/contact" 
                className="btn" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--bg)', fontWeight: 600 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={18} style={{ color: 'var(--amber)' }} />
                  <span>Contact Support Team</span>
                </div>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ marginTop: '28px', padding: '16px', borderRadius: 'var(--r-sm)', background: 'var(--soft)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--ink)' }}>
                Protected by strict tenant isolation, verified company records, and encrypted document storage.
              </span>
            </div>
          </div>

          {/* Right Column: Polished Accessible Animated Accordion */}
          <div className="acc" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {HOME_FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              const contentId = `faq-answer-${index}`;
              const triggerId = `faq-trigger-${index}`;

              return (
                <div 
                  key={index} 
                  className={`qa ${isOpen ? 'open' : ''}`}
                  style={{
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid',
                    borderColor: isOpen ? 'var(--accent)' : 'var(--line)',
                    background: isOpen ? 'var(--surface)' : 'var(--bg)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                  }}
                >
                  <button
                    id={triggerId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() => toggleFaq(index)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '18px 20px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '16px',
                      color: isOpen ? 'var(--accent)' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ paddingRight: '12px' }}>{faq.question}</span>
                    <motion.span 
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                      style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronDown size={20} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={contentId}
                        role="region"
                        aria-labelledby={triggerId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 20px 20px 20px', fontSize: '15px', color: 'var(--muted)', lineHeight: 1.6 }}>
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
