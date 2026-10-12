import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../../content/homeContent';

export const HowItWorksSection: React.FC = () => {
  const [audience, setAudience] = useState<'seeker' | 'employer'>('seeker');

  const steps = HOW_IT_WORKS_STEPS[audience];

  return (
    <section className="s" id="how" aria-labelledby="how-heading">
      <div className="container">
        <div className="head">
          <div>
            <h2 id="how-heading">How it works</h2>
            <p>Three simple steps, whether you're looking for a job or looking to hire.</p>
          </div>

          <div className="seg" role="tablist" aria-label="Audience selector">
            <button
              type="button"
              className="chip"
              role="tab"
              aria-selected={audience === 'seeker'}
              onClick={() => setAudience('seeker')}
            >
              I'm looking for a job
            </button>
            <button
              type="button"
              className="chip"
              role="tab"
              aria-selected={audience === 'employer'}
              onClick={() => setAudience('employer')}
            >
              I'm hiring
            </button>
          </div>
        </div>

        <div className="steps">
          {steps.map((step, idx) => (
            <div key={idx} className="step">
              <div className="dot">{idx + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>

        <div className="center" style={{ textAlign: 'left', marginTop: '40px' }}>
          <Link
            to={audience === 'seeker' ? '/register-candidate' : '/register-company'}
            className="btn primary lg"
          >
            <span>{audience === 'seeker' ? 'Create your free profile' : 'Post your first job'}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};
