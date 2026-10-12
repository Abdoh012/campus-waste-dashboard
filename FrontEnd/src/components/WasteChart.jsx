import { useState } from 'react';

const PERIODS = ['Last 30 days', 'Last 7 days', 'This year'];

export default function WasteChart({ showToast }) {
  const [period, setPeriod] = useState(PERIODS[0]);

  const handlePeriodChange = (event) => {
    const { value } = event.target;
    setPeriod(value);
    showToast(`Waste chart updated to ${value.toLowerCase()}`);
  };

  return (
    <article className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">DIVERSION IMPACT</p>
          <h3>Waste sorted over time</h3>
        </div>
        <div className="chart-actions">
          <span className="chart-total">
            1,248 <small>kg total</small>
          </span>
          <select aria-label="Waste chart period" value={period} onChange={handlePeriodChange}>
            {PERIODS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-wrap">
        <div className="y-axis">
          <span>200 kg</span>
          <span>150 kg</span>
          <span>100 kg</span>
          <span>50 kg</span>
          <span>0 kg</span>
        </div>
        <div className="line-chart">
          <div className="grid-line line-1"></div>
          <div className="grid-line line-2"></div>
          <div className="grid-line line-3"></div>
          <div className="grid-line line-4"></div>
          <svg viewBox="0 0 700 240" preserveAspectRatio="none" aria-label="Waste sorted line graph">
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#58b798" stopOpacity=".32" />
                <stop offset="100%" stopColor="#58b798" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              className="area-path"
              d="M0,187 C40,177 54,166 89,170 S125,144 158,151 S200,121 237,130 S275,107 311,115 S350,80 391,94 S432,62 470,80 S510,50 546,62 S584,34 622,46 S665,23 700,30 L700,240 L0,240 Z"
            />
            <path
              className="line-path"
              d="M0,187 C40,177 54,166 89,170 S125,144 158,151 S200,121 237,130 S275,107 311,115 S350,80 391,94 S432,62 470,80 S510,50 546,62 S584,34 622,46 S665,23 700,30"
            />
            <circle cx="391" cy="94" r="5" className="chart-point" />
            <circle cx="700" cy="30" r="5" className="chart-point" />
          </svg>
          <div className="x-axis">
            <span>Aug 19</span>
            <span>Aug 26</span>
            <span>Sep 02</span>
            <span>Sep 09</span>
            <span>Sep 16</span>
          </div>
        </div>
      </div>
    </article>
  );
}
