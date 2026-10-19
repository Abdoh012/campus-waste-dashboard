// shared/hooks/useStats.ts
import { useEffect, useState } from 'react';
import { apiRequest, isRecord } from '../../services/apiClient';

/** Legacy bin/device summary, kept for backward-compatible consumers. */
interface BinsSummary {
  total: number;
  healthy: number;
  attention: number;
  critical: number;
  offline: number;
  operationalPct: number;
}

interface PointsSummary {
  totalPoints: number;
  studentCount: number;
}

/**
 * Station-level KPIs. Severity/connectivity counts cover only `valid` stations
 * (exactly three well-formed containers); `incomplete` is reported separately.
 */
export interface StationsSummary {
  total: number;
  valid: number;
  incomplete: number;
  healthy: number;
  attention: number;
  critical: number;
  unknown: number;
  online: number;
  partial: number;
  offline: number;
  fullyConnectedPct: number;
}

/**
 * Container-level KPIs. `total` covers station-associated containers;
 * `unassigned` and `orphaned` expose legacy/broken associations instead of
 * counting them as valid station containers.
 */
export interface ContainersSummary {
  total: number;
  healthy: number;
  attention: number;
  critical: number;
  unknown: number;
  online: number;
  offline: number;
  neverConnected: number;
  unassigned: number;
  orphaned: number;
  onlinePct: number;
  averageFill: number | null;
}

export interface Stats {
  bins: BinsSummary;
  points: PointsSummary;
  stations: StationsSummary;
  containers: ContainersSummary;
}

function isBinsSummary(value: unknown): value is BinsSummary {
  return (
    isRecord(value) &&
    typeof value.total === 'number' &&
    typeof value.healthy === 'number' &&
    typeof value.attention === 'number' &&
    typeof value.critical === 'number' &&
    typeof value.offline === 'number' &&
    typeof value.operationalPct === 'number'
  );
}

function isPointsSummary(value: unknown): value is PointsSummary {
  return (
    isRecord(value) &&
    typeof value.totalPoints === 'number' &&
    typeof value.studentCount === 'number'
  );
}

function isStationsSummary(value: unknown): value is StationsSummary {
  return (
    isRecord(value) &&
    typeof value.total === 'number' &&
    typeof value.valid === 'number' &&
    typeof value.incomplete === 'number' &&
    typeof value.healthy === 'number' &&
    typeof value.attention === 'number' &&
    typeof value.critical === 'number' &&
    typeof value.unknown === 'number' &&
    typeof value.online === 'number' &&
    typeof value.partial === 'number' &&
    typeof value.offline === 'number' &&
    typeof value.fullyConnectedPct === 'number'
  );
}

function isContainersSummary(value: unknown): value is ContainersSummary {
  return (
    isRecord(value) &&
    typeof value.total === 'number' &&
    typeof value.healthy === 'number' &&
    typeof value.attention === 'number' &&
    typeof value.critical === 'number' &&
    typeof value.unknown === 'number' &&
    typeof value.online === 'number' &&
    typeof value.offline === 'number' &&
    typeof value.neverConnected === 'number' &&
    typeof value.unassigned === 'number' &&
    typeof value.orphaned === 'number' &&
    typeof value.onlinePct === 'number' &&
    (value.averageFill === null || typeof value.averageFill === 'number')
  );
}

function isStats(value: unknown): value is Stats {
  return (
    isRecord(value) &&
    isBinsSummary(value.bins) &&
    isPointsSummary(value.points) &&
    isStationsSummary(value.stations) &&
    isContainersSummary(value.containers)
  );
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStats() {
      try {
        // Single source of truth: `apiRequest` reads `cw.token` and attaches
        // the Authorization header (and clears it on a 401).
        const body = await apiRequest('/stats', { signal: controller.signal });
        if (!isStats(body)) throw new Error('Unexpected stats response');

        if (controller.signal.aborted) return;
        setStats(body);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // تحديث كل 30 ثانية

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return { stats, error, loading };
}
