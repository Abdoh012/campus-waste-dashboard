import type { ReactNode } from 'react';
import type { StatCardTone } from '../../shared/ui/StatCard';
import StatusDot from '../../shared/ui/StatusDot';
import type { TrendTone } from '../../shared/ui/TrendBadge';
import { dashboardSummary } from './mockData';
import { MINI_BAR_HEIGHTS, SPARKLINE_HEIGHTS } from './options';


export interface Metric {
  id: string;
  label: string;
  icon: string;
  tone: StatCardTone;
  value: string;
  unit?: string;
  badge: { tone: TrendTone; text: string };
  note: string;
  visual: ReactNode;
}

export const metricCards: readonly Metric[] = [
  {
    id: 'diversion-rate',
    label: 'DIVERSION RATE',
    icon: '↗',
    tone: 'primary',
    value: '78.4',
    unit: '%',
    badge: { tone: 'up', text: '↑ 6.2%' },
    note: 'vs. last month',
    visual: (
      <div className="absolute bottom-3.5 right-4 flex h-6 items-end gap-1">
        {SPARKLINE_HEIGHTS.map((height, index) => (
          <i
            key={index}
            className="block w-1 rounded-xs bg-spark"
            style={{ height }}
          ></i>
        ))}
      </div>
    ),
  },
  {
    id: 'waste-sorted',
    label: 'WASTE SORTED',
    icon: '◌',
    tone: 'secondary',
    value: '1,248',
    unit: ' kg',
    badge: { tone: 'up', text: '↑ 12.8%' },
    note: 'this month',
    visual: (
      <div className="absolute bottom-3.5 right-4 flex h-6 items-end gap-1">
        {MINI_BAR_HEIGHTS.map((height, index) => (
          <i
            key={index}
            className="block w-1 rounded-xs bg-mini-bar"
            style={{ height }}
          ></i>
        ))}
      </div>
    ),
  },
  {
    id: 'points-distributed',
    label: 'POINTS DISTRIBUTED',
    icon: '✧',
    tone: 'info',
    value: dashboardSummary.pointsDistributed.toLocaleString(),
    badge: { tone: 'up', text: '↑ 18.4%' },
    note: 'this month',
    visual: (
      <>
        <div className="mt-5 h-1 rounded bg-info-bg">
          <span
            className="block h-full rounded bg-info"
            style={{ width: '72%' }}
          ></span>
        </div>
        <small className="mt-2 block text-2xs text-label">
          72% of monthly goal
        </small>
      </>
    ),
  },
  {
    id: 'active-bins',
    label: 'ACTIVE SMART BINS',
    icon: '◎',
    tone: 'accent',
    value: '24',
    unit: ' / 26',
    badge: { tone: 'neutral', text: '92.3%' },
    note: 'operational',
    visual: (
      <div className="mt-5 flex gap-2.5 text-2xs text-label">
        <span>
          <StatusDot tone="green" />18 healthy
        </span>
        <span>
          <StatusDot tone="yellow" />4 attention
        </span>
      </div>
    ),
  },
];
