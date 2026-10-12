import React from 'react';
import { Star } from 'lucide-react';
import { HOME_FLAGS, TESTIMONIALS_DATA } from '../../content/homeContent';

export const TestimonialsSection: React.FC = () => {
  if (!HOME_FLAGS.showTestimonials) {
    return null;
  }

  return (
    <section className="s" id="stories" aria-labelledby="stories-heading">
      <div className="container">
        <div className="head">
          <div>
            <h2 id="stories-heading">People who found their fit</h2>
            <p>Real stories from jobseekers and hiring teams.</p>
          </div>
        </div>

        <div className="quotes">
          {TESTIMONIALS_DATA.map((item, idx) => (
            <figure key={idx} className="card quote" style={{ margin: 0 }}>
              <div>
                <div className="stars" aria-label="5 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={17} fill="#F5A524" color="#F5A524" />
                  ))}
                </div>
                <p style={{ marginTop: '12px' }}>"{item.quote}"</p>
              </div>
              <figcaption className="who">
                <span className={`mark ${item.colorClass}`} style={{ borderRadius: '50%' }}>
                  {item.name.charAt(0)}
                </span>
                <span>
                  <b>{item.name}</b>
                  <small>{item.role}</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="note">
          Sample quotes for this preview. Replace with real stories from your users before going live.
        </p>
      </div>
    </section>
  );
};
