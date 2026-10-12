import React from 'react';
import { HOME_FLAGS, STATS_STRIP_DATA } from '../../content/homeContent';

export const StatsStrip: React.FC = () => {
  if (!HOME_FLAGS.showStatsStrip) {
    return null;
  }

  return (
    <section className="white" style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container">
        <div className="stats">
          {STATS_STRIP_DATA.map((s, idx) => (
            <div key={idx}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
