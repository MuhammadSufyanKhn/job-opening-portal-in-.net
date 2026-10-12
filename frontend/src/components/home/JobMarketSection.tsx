import React from 'react';
import { HOME_FLAGS, MARKET_DATA } from '../../content/homeContent';

export const JobMarketSection: React.FC = () => {
  if (!HOME_FLAGS.showMarketSection) {
    return null;
  }

  return (
    <section className="s" id="market" aria-labelledby="market-heading">
      <div className="container">
        <div className="head">
          <div>
            <h2 id="market-heading">What's happening in the job market</h2>
            <p>A quick look at where the opportunities are, so you can plan your next move with confidence.</p>
          </div>
        </div>

        <div className="market">
          {/* Panel 1: Jobs in Demand */}
          <div className="card panel">
            <h3>Jobs in demand</h3>
            <p className="sub">More openings than last month</p>
            <div className="bars">
              {MARKET_DATA.inDemand.map((item, idx) => (
                <div key={idx}>
                  <div className="l">
                    <span>{item.title}</span>
                    <span>+{item.growth}%</span>
                  </div>
                  <div className="tr">
                    <i style={{ width: `${item.growth * 4}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: What jobs pay */}
          <div className="card panel">
            <h3>What jobs pay</h3>
            <p className="sub">Typical yearly pay, in USD</p>
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Starting</th>
                  <th>Experienced</th>
                </tr>
              </thead>
              <tbody>
                {MARKET_DATA.salaries.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.role}</td>
                    <td>{row.starting}</td>
                    <td><b>{row.experienced}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Panel 3: Where companies are hiring */}
          <div className="card panel">
            <h3>Where companies are hiring</h3>
            <p className="sub">Open jobs by location</p>
            <div className="cities">
              {MARKET_DATA.locations.map((loc, idx) => (
                <div key={idx}>
                  <span>{loc.city}</span>
                  <span>{loc.count} jobs</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="note">
          Sample figures shown for this preview. Connect real numbers before going live.
        </p>
      </div>
    </section>
  );
};
