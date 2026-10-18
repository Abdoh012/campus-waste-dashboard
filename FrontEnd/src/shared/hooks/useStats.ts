// shared/hooks/useStats.ts
import { useEffect, useState } from "react";
import {
  API_BASE_URL,
  getAuthToken,
  isRecord,
} from "../../services/apiClient";

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

export interface Stats {
  bins: BinsSummary;
  points: PointsSummary;
}

function isBinsSummary(value: unknown): value is BinsSummary {
  return (
    isRecord(value) &&
    typeof value.total === "number" &&
    typeof value.healthy === "number" &&
    typeof value.attention === "number" &&
    typeof value.critical === "number" &&
    typeof value.offline === "number" &&
    typeof value.operationalPct === "number"
  );
}

function isPointsSummary(value: unknown): value is PointsSummary {
  return (
    isRecord(value) &&
    typeof value.totalPoints === "number" &&
    typeof value.studentCount === "number"
  );
}

function isStats(value: unknown): value is Stats {
  return (
    isRecord(value) &&
    isBinsSummary(value.bins) &&
    isPointsSummary(value.points)
  );
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const body: unknown = await res.json();
        if (!isStats(body)) throw new Error("Unexpected stats response");

        if (!cancelled) setStats(body);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // تحديث كل 30 ثانية

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { stats, error, loading };
}
