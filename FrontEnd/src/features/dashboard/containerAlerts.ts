/**
 * Localized warnings for containers the station model cannot account for.
 *
 * `GET /api/stats` already separates `unassigned` (no `stationId`) from
 * `orphaned` (a `stationId` with no matching Station), so these are counts the
 * backend derived directly from documents — never invented here. The overview
 * cards headline station severity/connectivity, so these edge cases are shown
 * as a small, explicit warning instead of being silently folded into the totals.
 */
import type { Translate } from '../../shared/i18n/catalog';
import type { ContainersSummary } from '../../shared/hooks/useStats';

export function buildContainerAlerts(
  t: Translate,
  containers: ContainersSummary,
): readonly string[] {
  const alerts: string[] = [];

  if (containers.unassigned > 0) {
    alerts.push(t('metric.alert.unassigned', { count: containers.unassigned }));
  }

  if (containers.orphaned > 0) {
    alerts.push(t('metric.alert.orphaned', { count: containers.orphaned }));
  }

  return alerts;
}
