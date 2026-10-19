import { useEffect, useState } from 'react';
import { ApiError, clearAuthToken } from '../../../services/apiClient';
import { fetchFillHistory } from '../../../services/historyApi';
import type {
  FillHistoryResponse,
  HistoryPeriod,
} from '../../../services/historyApi';

export interface FillHistoryResult {
  data: FillHistoryResponse | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Fetch fill-level history for one period. A period change aborts the previous
 * request and clears the old series, so a slow response cannot overwrite the
 * newly selected period.
 */
export function useFillHistory(period: HistoryPeriod): FillHistoryResult {
  const [data, setData] = useState<FillHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;

    setLoading(true);
    setError(null);
    setData(null);

    fetchFillHistory(period, controller.signal)
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
            : new ApiError(0, 'Could not load fill-level history.'),
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
