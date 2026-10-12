import { useState } from 'react';
import Eyebrow from './Eyebrow.jsx';
import { WASTE_PERIODS } from '../data/constants.js';
import { SURFACE } from '../styles/surfaces.js';

export default function WasteChart({ showToast }) {
  const [period, setPeriod] = useState(WASTE_PERIODS[0]);

  const handlePeriodChange = (event) => {
    const { value } = event.target;
    setPeriod(value);
    showToast(`Waste chart updated to ${value.toLowerCase()}`);
  };

  return (
    <article className={`${SURFACE} p-5 max-[700px]:p-[15px]`}>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>DIVERSION IMPACT</Eyebrow>
          <h3 className="font-heading text-[19px] font-semibold tracking-[-0.035em]">Waste sorted over time</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-heading text-[17px] font-semibold max-[700px]:hidden">
            1,248 <small className="font-sans text-[10px] font-normal text-label">kg total</small>
          </span>
          <select
            className="rounded border border-border bg-input p-[7px] text-[10px] text-muted-foreground"
            aria-label="Waste chart period"
            value={period}
            onChange={handlePeriodChange}
          >
            {WASTE_PERIODS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-[18px] flex h-[220px] max-[700px]:h-[195px]">
        <div className="flex w-[47px] flex-col justify-between pt-px pr-1.5 pb-[23px] text-right font-mono text-[9px] text-axis">
          <span>200 kg</span>
          <span>150 kg</span>
          <span>100 kg</span>
          <span>50 kg</span>
          <span>0 kg</span>
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 h-px bg-grid"></div>
          <div className="absolute inset-x-0 top-1/4 h-px bg-grid"></div>
          <div className="absolute inset-x-0 top-1/2 h-px bg-grid"></div>
          <div className="absolute inset-x-0 top-3/4 h-px bg-grid"></div>
          <svg className="absolute left-0 top-0 h-[190px] w-full overflow-visible" viewBox="0 0 700 240" preserveAspectRatio="none" aria-label="Waste sorted line graph">
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--color-chart-area)', stopOpacity: 0.32 }} />
                <stop offset="100%" style={{ stopColor: 'var(--color-chart-area)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <path
              fill="url(#areaGradient)"
              d="M0,187 C40,177 54,166 89,170 S125,144 158,151 S200,121 237,130 S275,107 311,115 S350,80 391,94 S432,62 470,80 S510,50 546,62 S584,34 622,46 S665,23 700,30 L700,240 L0,240 Z"
            />
            <path
              className="fill-none stroke-chart-line stroke-[3]"
              d="M0,187 C40,177 54,166 89,170 S125,144 158,151 S200,121 237,130 S275,107 311,115 S350,80 391,94 S432,62 470,80 S510,50 546,62 S584,34 622,46 S665,23 700,30"
            />
            <circle cx="391" cy="94" r="5" className="fill-card stroke-chart-line stroke-[3]" />
            <circle cx="700" cy="30" r="5" className="fill-card stroke-chart-line stroke-[3]" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[9px] text-axis">
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
