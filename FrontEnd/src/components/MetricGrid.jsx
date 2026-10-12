import TrendBadge from './TrendBadge.jsx';
import StatusDot from './StatusDot.jsx';
import { SURFACE } from '../styles/surfaces.js';
import { MINI_BAR_HEIGHTS, SPARKLINE_HEIGHTS } from '../data/constants.js';

const CARD = `${SURFACE} relative overflow-hidden px-[19px] pt-[18px] pb-[15px] min-h-[156px] max-[700px]:px-[13px] max-[700px]:py-[15px] max-[700px]:min-h-[145px]`;
const HEAD = 'flex justify-between font-mono text-[10px] tracking-[0.08em] text-label';
const ICON = 'font-sans text-[18px] text-label';
const VALUE = 'mt-3.5 mb-2 block font-heading text-[30px] font-semibold tracking-[-0.04em] max-[700px]:text-[25px]';
const UNIT = 'font-sans text-[13px] font-medium tracking-normal text-label';
const FOOT = 'flex items-center gap-[7px] text-[11px] text-label';

export default function MetricGrid({ totalPoints }) {
  return (
    <section className="mb-4 grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2 max-[700px]:gap-2.5" id="overview" aria-label="Campus performance summary">
      <article className={`${CARD} border-t-[3px] border-t-primary`}>
        <div className={HEAD}>
          <span>DIVERSION RATE</span>
          <span className={ICON}>↗</span>
        </div>
        <strong className={VALUE}>
          78.4<span className={UNIT}>%</span>
        </strong>
        <div className={FOOT}>
          <TrendBadge tone="up">↑ 6.2%</TrendBadge>
          <span>vs. last month</span>
        </div>
        <div className="absolute bottom-3.5 right-[18px] flex h-[25px] items-end gap-[3px]">
          {SPARKLINE_HEIGHTS.map((height, index) => (
            <i key={index} className="block w-1 rounded-[2px] bg-spark" style={{ height }}></i>
          ))}
        </div>
      </article>

      <article className={`${CARD} border-t-[3px] border-t-secondary`}>
        <div className={HEAD}>
          <span>WASTE SORTED</span>
          <span className={ICON}>◌</span>
        </div>
        <strong className={VALUE}>
          1,248<span className={UNIT}> kg</span>
        </strong>
        <div className={FOOT}>
          <TrendBadge tone="up">↑ 12.8%</TrendBadge>
          <span>this month</span>
        </div>
        <div className="absolute bottom-3.5 right-[18px] flex h-[23px] items-end gap-[3px]">
          {MINI_BAR_HEIGHTS.map((height, index) => (
            <i key={index} className="block w-1 rounded-[2px] bg-mini-bar" style={{ height }}></i>
          ))}
        </div>
      </article>

      <article className={`${CARD} border-t-[3px] border-t-info`}>
        <div className={HEAD}>
          <span>POINTS DISTRIBUTED</span>
          <span className={ICON}>✧</span>
        </div>
        <strong className={VALUE}>{totalPoints.toLocaleString()}</strong>
        <div className={FOOT}>
          <TrendBadge tone="up">↑ 18.4%</TrendBadge>
          <span>this month</span>
        </div>
        <div className="mt-[19px] h-1 rounded bg-info-bg">
          <span className="block h-full rounded bg-info" style={{ width: '72%' }}></span>
        </div>
        <small className="mt-[7px] block text-[10px] text-label">72% of monthly goal</small>
      </article>

      <article className={`${CARD} border-t-[3px] border-t-accent`}>
        <div className={HEAD}>
          <span>ACTIVE SMART BINS</span>
          <span className={ICON}>◎</span>
        </div>
        <strong className={VALUE}>
          24<span className={UNIT}> / 26</span>
        </strong>
        <div className={FOOT}>
          <TrendBadge tone="neutral">92.3%</TrendBadge>
          <span>operational</span>
        </div>
        <div className="mt-[22px] flex gap-2.5 text-[10px] text-label">
          <span>
            <StatusDot tone="green" />18 healthy
          </span>
          <span>
            <StatusDot tone="yellow" />4 attention
          </span>
        </div>
      </article>
    </section>
  );
}
