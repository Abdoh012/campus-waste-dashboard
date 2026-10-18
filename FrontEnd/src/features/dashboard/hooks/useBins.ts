/**
 * Loads the live bin network for the dashboard map.
 *
 * Fetches once per mount/retry, aborts on unmount, and turns a 401 into a
 * return to the sign-in page (the token is already cleared by the API client).
 * Everything else surfaces as an `ApiError` so the map can show a retry state.
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError, clearAuthToken } from '../../../services/apiClient';
import { fetchBins, toBinLocations } from '../../../services/binsApi';
import type { BinLocation } from '../campusMapData';

export interface BinsResult {
  locations: readonly BinLocation[];
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
}

export function useBins(): BinsResult {
  const [locations, setLocations] = useState<readonly BinLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;

    setLoading(true);
    setError(null);

    fetchBins(controller.signal)
      .then((bins) => {
        if (!current) return;
        setLocations(toBinLocations(bins));
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
            : new ApiError(0, 'Could not load the bin network.'),
        );
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
      controller.abort();
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { locations, loading, error, reload };
}
