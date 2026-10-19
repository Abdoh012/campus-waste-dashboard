/**
 * Loads station data for the dashboard map.
 *
 * Stations refresh every 30 seconds, matching `useStats`, so map markers do not
 * stay indefinitely stale while the KPI cards update. Polling failures keep the
 * last good station snapshot on screen and surface the error; a 401 clears the
 * token and returns to the sign-in page.
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError, clearAuthToken } from '../../../services/apiClient';
import { fetchStations, toStationLocations } from '../../../services/stationsApi';
import type { StationLocationsResult } from '../../../services/stationsApi';

export interface StationsResult extends StationLocationsResult {
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
}

const EMPTY: StationLocationsResult = {
  locations: [],
  total: 0,
  skipped: 0,
};

export function useStations(): StationsResult {
  const [result, setResult] = useState<StationLocationsResult>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    let first = true;

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const stations = await fetchStations(controller.signal);
        if (!current) return;
        setResult(toStationLocations(stations));
        setError(null);
      } catch (cause: unknown) {
        if (!current || controller.signal.aborted) return;

        if (cause instanceof ApiError && cause.status === 401) {
          clearAuthToken();
          window.location.assign('/');
          return;
        }

        setError(
          cause instanceof ApiError
            ? cause
            : new ApiError(0, 'Could not load the station network.'),
        );
      } finally {
        if (current && first) {
          first = false;
          setLoading(false);
        }
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, 30_000);

    return () => {
      current = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...result, loading, error, reload };
}
