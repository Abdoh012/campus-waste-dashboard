/**
 * Mock bulk-sync endpoint: the app's only API boundary.
 *
 * This module owns the wire contract the future backend will expose:
 *
 *   POST /api/sync
 *   body:   CachedSyncEvent[]
 *   return: SyncResponse
 *
 * The UI depends only on `SyncResponse`, so swapping the body of
 * `syncCachedEvents` for a real request later needs no component changes. A real
 * implementation should validate the parsed JSON before returning it (external
 * data is untrusted) — the simulated version below constructs the response
 * itself and needs no validation.
 *
 *   const response = await fetch('/api/sync', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(events),
 *   });
 *   if (!response.ok) throw new Error('Network response was not ok');
 *   return response.json();
 *
 * No network access happens today — the app runs fully on mock data.
 */

/** One cached student-point event, as captured offline by an ESP32 bin. */
export interface CachedSyncEvent {
  deviceId: string;
  studentId: string;
  points: number;
  wasteType: string;
  /** ISO-8601 timestamp of when the event was captured on the device. */
  capturedAt: string;
}

/** The `/api/sync` response contract the UI depends on. */
export interface SyncResponse {
  ok: boolean;
  received: number;
  pointsAdded: number;
  newTotalPoints: number;
  /** ISO-8601 timestamp of when the batch was accepted. */
  syncedAt: string;
}

const SIMULATED_LATENCY_MS = 900;

export function syncCachedEvents(
  events: readonly CachedSyncEvent[],
  currentTotalPoints: number,
): Promise<SyncResponse> {
  if (!Array.isArray(events)) {
    return Promise.reject(new TypeError('The sync payload must be an array.'));
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const pointsAdded = events.reduce((total, event) => total + Number(event.points || 0), 0);

      resolve({
        ok: true,
        received: events.length,
        pointsAdded,
        newTotalPoints: currentTotalPoints + pointsAdded,
        syncedAt: new Date().toISOString(),
      });
    }, SIMULATED_LATENCY_MS);
  });
}
