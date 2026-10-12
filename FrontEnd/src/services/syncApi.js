/**
 * Mock bulk-sync endpoint.
 *
 * This mirrors the payload contract the future backend will expose:
 *
 *   POST /api/sync
 *   body:   SyncEvent[]
 *   return: { ok, received, pointsAdded, newTotalPoints, syncedAt }
 *
 * The UI only depends on that returned shape, so swapping this for a real
 * request later means replacing the body of `syncCachedEvents` with:
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

const SIMULATED_LATENCY_MS = 900;

export function syncCachedEvents(events, currentTotalPoints) {
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
