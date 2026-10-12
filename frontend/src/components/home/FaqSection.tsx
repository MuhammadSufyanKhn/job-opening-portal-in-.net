import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { HOME_FAQS } from '../../content/homeContent';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <section className="s white" id="faq" aria-labelledby="faq-heading">
      <div className="container">
        <div className="faq">
          {/* Left Column: Heading and Contact CTA */}
          <div>
            <h2 id="faq-heading" style={{ fontSize: 'clamp(26px, 3.2vw, 40px)', marginBottom: '12px', letterSpacing: '-0.035em' }}>
              Questions? We have answers.
            </h2>
            <p className="muted" style={{ fontSize: '17px', marginBottom: '20px' }}>
              The basics, in plain language.
            </p>
            <a href="mailto:support@hiresphere.com" className="btn">
              Contact us
            </a>
          </div>

          {/* Right Column: Accordion */}
          <div className="acc">
            {HOME_FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              const contentId = `faq-answer-${index}`;
              const triggerId = `faq-trigger-${index}`;

              return (
                <div key={index} className={`qa ${isOpen ? 'open' : ''}`}>
                  <button
                    id={triggerId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{faq.question}</span>
                    <span className="chev">
                      <ChevronDown size={20} />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={contentId}
                      role="region"
                      aria-labelledby={triggerId}
                      className="ans"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
