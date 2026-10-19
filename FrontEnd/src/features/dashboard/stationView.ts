/**
 * Which state the station map should render.
 *
 * Extracted from `BinsMap` so the "never hide a loaded map on a transient
 * refresh failure" rule can be unit tested without a DOM or Google Maps.
 *
 * The important rule: once a station snapshot exists, a later failed poll must
 * not replace the map. The map stays mounted (and keeps its camera) and a
 * non-blocking warning is surfaced instead; a successful poll clears it.
 */

export interface StationViewInput {
  /** The hook is still waiting for its first response. */
  loading: boolean;
  /** The most recent request failed (a previous snapshot may still exist). */
  hasError: boolean;
  /** Number of stations that have usable coordinates and can be drawn. */
  stationCount: number;
  /** Stations returned by the API, including unmappable ones. */
  total: number;
  /** Stations skipped because they have no usable coordinates. */
  skipped: number;
}

export type StationView =
  | { kind: 'loading' }
  | { kind: 'blockingError' }
  | { kind: 'empty'; noCoordinates: boolean }
  | { kind: 'list'; refreshFailed: boolean };

export function resolveStationView({
  loading,
  hasError,
  stationCount,
  total,
  skipped,
}: StationViewInput): StationView {
  // A loaded snapshot always wins: it keeps the markers and the camera in place
  // while a refresh is in flight or has failed.
  if (stationCount > 0) {
    return { kind: 'list', refreshFailed: hasError };
  }

  if (loading) return { kind: 'loading' };
  if (hasError) return { kind: 'blockingError' };

  return { kind: 'empty', noCoordinates: total > 0 && skipped === total };
}
