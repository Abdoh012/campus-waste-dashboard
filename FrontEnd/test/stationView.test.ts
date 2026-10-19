import { describe, expect, it } from 'vitest';
import { resolveStationView } from '../src/features/dashboard/stationView';

const base = {
  loading: false,
  hasError: false,
  stationCount: 0,
  total: 0,
  skipped: 0,
};

describe('resolveStationView', () => {
  it('shows loading while the first response is pending', () => {
    expect(resolveStationView({ ...base, loading: true })).toEqual({ kind: 'loading' });
  });

  it('shows a blocking error only when there is no snapshot yet', () => {
    expect(resolveStationView({ ...base, hasError: true })).toEqual({ kind: 'blockingError' });
  });

  it('shows the empty state when the API returned no stations', () => {
    expect(resolveStationView(base)).toEqual({ kind: 'empty', noCoordinates: false });
  });

  it('flags the no-coordinates empty state', () => {
    expect(resolveStationView({ ...base, total: 2, skipped: 2 })).toEqual({
      kind: 'empty',
      noCoordinates: true,
    });
  });

  it('keeps the map (with a warning) when a refresh fails after a snapshot loaded', () => {
    const view = resolveStationView({ ...base, stationCount: 2, total: 2, hasError: true });
    expect(view).toEqual({ kind: 'list', refreshFailed: true });
  });

  it('keeps the loaded map visible while a refresh is in flight', () => {
    const view = resolveStationView({ ...base, stationCount: 2, total: 2, loading: true });
    expect(view).toEqual({ kind: 'list', refreshFailed: false });
  });

  it('clears the warning once a refresh succeeds', () => {
    const failed = resolveStationView({ ...base, stationCount: 2, total: 2, hasError: true });
    const recovered = resolveStationView({ ...base, stationCount: 2, total: 2, hasError: false });
    expect(failed).toEqual({ kind: 'list', refreshFailed: true });
    expect(recovered).toEqual({ kind: 'list', refreshFailed: false });
  });
});
