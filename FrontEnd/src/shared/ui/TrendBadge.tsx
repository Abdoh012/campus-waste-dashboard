import type { ReactNode } from 'react';

export type TrendTone = 'up' | 'neutral';

const TONES: Record<TrendTone, string> = {
  up: 'bg-success-bg text-success-fg',
  neutral: 'bg-trend-neutral-bg text-trend-neutral-fg',
};

export interface TrendBadgeProps {
  tone?: TrendTone;
  children: ReactNode;
}

/**
 * Small monospace percentage chip shown in metric footers and the points chart.
 */
export default function TrendBadge({ tone = 'up', children }: TrendBadgeProps) {
  return (
    <span className={`rounded px-1 py-1 font-mono text-2xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}
