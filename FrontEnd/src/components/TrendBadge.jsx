const TONES = {
  up: 'bg-success-bg text-success-fg',
  neutral: 'bg-trend-neutral-bg text-trend-neutral-fg',
};

/**
 * Small monospace percentage chip shown in metric footers and the points chart.
 */
export default function TrendBadge({ tone = 'up', children }) {
  return (
    <span className={`rounded px-[5px] py-[3px] font-mono text-[10px] font-semibold ${TONES[tone] ?? TONES.up}`}>
      {children}
    </span>
  );
}
