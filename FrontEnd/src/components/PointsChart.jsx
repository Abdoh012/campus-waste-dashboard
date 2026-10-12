import Eyebrow from './Eyebrow.jsx';
import TrendBadge from './TrendBadge.jsx';
import { pointsByDay } from '../data/mockData.js';
import { SURFACE } from '../styles/surfaces.js';

export default function PointsChart({ totalPoints }) {
  return (
    <article className={`${SURFACE} p-5 max-[700px]:p-[15px]`}>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>STUDENT ENGAGEMENT</Eyebrow>
          <h3 className="font-heading text-[19px] font-semibold tracking-[-0.035em]">Points distributed</h3>
        </div>
        <button className="cursor-pointer border-0 bg-transparent text-[13px] tracking-[2px] text-label-muted" type="button" aria-label="More options">
          •••
        </button>
      </div>

      <div className="mt-5 mb-[9px] flex items-baseline gap-[11px]">
        <strong className="font-heading text-[29px] font-semibold tracking-[-0.04em]">{totalPoints.toLocaleString()}</strong>
        <TrendBadge tone="up">↑ 18.4%</TrendBadge>
        <small className="ml-auto block text-[10px] text-label">vs. previous period</small>
      </div>

      <div className="relative flex h-[167px] items-end gap-2.5 border-b border-bar-border px-[5px] max-[700px]:gap-1.5" aria-label="Points distributed bar chart">
        <div className="pointer-events-none absolute inset-x-0 top-1/4 bottom-1/4 border-y border-dashed border-bar-grid"></div>
        {pointsByDay.map((bar) => (
          <div key={bar.day} className="z-[1] flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span
              className={`block w-full max-w-[21px] rounded-t ${bar.active ? 'bg-bar-active' : 'bg-bar'}`}
              style={{ height: `${bar.height}%` }}
            ></span>
            <small className="font-mono text-[9px] text-label-muted">{bar.day}</small>
          </div>
        ))}
      </div>

      <div className="mt-[13px] flex justify-between text-[10px] text-label">
        <span>
          <i className="mr-[5px] inline-block h-2 w-2 rounded-[2px] bg-bar-active"></i>Points earned from sorting
        </span>
        <span>Goal: 6,000</span>
      </div>
    </article>
  );
}
