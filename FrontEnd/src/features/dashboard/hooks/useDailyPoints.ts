import { useEffect, useState } from 'react';
import { ApiError, clearAuthToken } from '../../../services/apiClient';
import { fetchDailyPoints } from '../../../services/historyApi';
import type {
  DailyPointsResponse,
  HistoryPeriod,
} from '../../../services/historyApi';

export interface DailyPointsResult {
  data: DailyPointsResponse | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Fetch daily point awards. The ledger only contains awards recorded after it
 * was introduced; days with no recorded awards are omitted rather than filled.
 */
export function useDailyPoints(period: HistoryPeriod): DailyPointsResult {
  const [data, setData] = useState<DailyPointsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;

    setLoading(true);
    setError(null);
    setData(null);

    fetchDailyPoints(period, controller.signal)
      .then((result) => {
        if (!current) return;
        setData(result);
      })
      .catch((cause: unknown) => {
        if (!current || controller.signal.aborted) return;

        if (cause instanceof ApiError && cause.status === 401) {
          clearAuthToken();
          window.location.assign('/');
          return;
        }

        setError(
          cause instanceof ApiError
            ? cause
            : new ApiError(0, 'Could not load daily points.'),
        );
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
      controller.abort();
    };
  }, [period]);

  return { data, loading, error };
}
