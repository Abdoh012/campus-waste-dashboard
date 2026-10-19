import type { ReactNode } from 'react';
import type { StatCardTone } from '../../shared/ui/StatCard';
import StatusDot from '../../shared/ui/StatusDot';
import type { TrendTone } from '../../shared/ui/TrendBadge';
import type { Translate, TranslatePlural } from '../../shared/i18n/catalog';
import type { Stats } from '@/shared/hooks/useStats';

export interface Metric {
  id: string;
  label: string;
  icon: string;
  tone: StatCardTone;
  value: string;
  unit?: string;
  badge: { tone: TrendTone; text: string } | undefined;
  note: string;
  visual: ReactNode;
}

/**
 * The four overview cards, built from the active translations.
 *
 * Station counts and container counts are deliberately separate: the first and
 * third cards headline stations, while their supporting lines report container
 * fill and connectivity. No card calls a fill percentage a weight, and no
 * "this month" claim is made without a monthly calculation.
 */
export function buildMetricCards(
  t: Translate,
  tn: TranslatePlural,
  formatNumber: (value: number) => string,
  stats: Stats,
): readonly Metric[] {
  const { stations, containers } = stats;

  return [
    {
      id: 'active-bins',
      label: t('metric.activeBins'),
      icon: '◎',
      tone: 'accent',
      value: formatNumber(stations.online),
      unit: ` / ${formatNumber(stations.valid)}`,
      badge: { tone: 'neutral', text: `${formatNumber(stations.fullyConnectedPct)}%` },
      note: t('metric.note.operational'),
      visual: (
        <div className="mt-4 flex flex-col gap-1.5 text-2xs text-label">
          <div className="flex gap-2.5">
            <span>
              <StatusDot tone="green" />
              {tn('stations.healthy', stations.healthy)}
            </span>
            <span>
              <StatusDot tone="yellow" />
              {tn('stations.attention', stations.attention)}
            </span>
          </div>
          <div className="font-mono text-label-muted">
            {t('metric.note.stationConnectivity', {
              online: stations.online,
              partial: stations.partial,
              offline: stations.offline,
            })}
          </div>
        </div>
      ),
    },
    {
      id: 'points-distributed',
      label: t('metric.pointsDistributed'),
      icon: '✧',
      tone: 'info',
      value: formatNumber(stats.points.totalPoints),
      badge: undefined,
      note: t('metric.note.allTime'),
      visual: null,
    },
    {
      id: 'critical-bins',
      label: t('metric.criticalBins'),
      icon: '⚠',
      tone: 'primary',
      value: formatNumber(stations.critical),
      unit: ` / ${formatNumber(stations.valid)}`,
      badge: undefined,
      note: t('metric.note.needsAttention'),
      visual: (
        <div className="mt-4 flex flex-col gap-1.5 font-mono text-2xs text-label-muted">
          <div>
            {t('metric.note.containerFill', {
              healthy: containers.healthy,
              attention: containers.attention,
              critical: containers.critical,
              unknown: containers.unknown,
            })}
          </div>
          <div>
            {t('metric.note.containerConnectivity', {
              online: containers.online,
              total: containers.total,
              offline: containers.offline,
              never: containers.neverConnected,
            })}
          </div>
        </div>
      ),
    },
    {
      id: 'students-participating',
      label: t('metric.studentsParticipating'),
      icon: '◈',
      tone: 'secondary',
      value: formatNumber(stats.points.studentCount),
      badge: undefined,
      note: t('metric.note.studentsWithPoints'),
      visual: null,
    },
  ];
}
