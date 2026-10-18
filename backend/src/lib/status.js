/**
 * Status vocabulary + the two rules that produce it.
 *
 * 1. FILL-DERIVED STATUS — set whenever a device reports (`PUT
 *    /api/bins/:deviceId/status`), because the ingest body carries only
 *    fillLevel; the response echoes the status the server computed:
 *
 *      fillLevel < 50  → healthy    (0–49)
 *      fillLevel < 75  → attention  (50–74)
 *      fillLevel ≥ 75  → critical   (75–100)
 *
 *    Boundaries match the reference dashboard's legend (attention around 50%,
 *    critical above 75%) and the mock values it demonstrated (18→healthy,
 *    54→attention, 87→critical).
 *
 * 2. OFFLINE OVERRIDE — applied at read time (GET /api/bins, GET
 *    /api/bins/:id): if a bin has never synced or its lastSyncAt is older
 *    than OFFLINE_THRESHOLD_MS, it reports `offline` even though the stored
 *    status still holds the last fill-derived value. When the device comes
 *    back, the stored status resumes on its own — nothing is overwritten.
 */

export const STATUSES = Object.freeze({
  HEALTHY: 'healthy',
  ATTENTION: 'attention',
  CRITICAL: 'critical',
  OFFLINE: 'offline',
});

export const FILL_THRESHOLDS = Object.freeze({ ATTENTION: 50, CRITICAL: 75 });

/** fillLevel (0–100) → 'healthy' | 'attention' | 'critical'. */
export function statusForFillLevel(fillLevel) {
  const fill = Number(fillLevel);
  if (fill >= FILL_THRESHOLDS.CRITICAL) return STATUSES.CRITICAL;
  if (fill >= FILL_THRESHOLDS.ATTENTION) return STATUSES.ATTENTION;
  return STATUSES.HEALTHY;
}

/**
 * True when a device is considered offline: never synced, or its newest sync
 * predates `now - thresholdMs`.
 */
export function isOffline(lastSyncAt, { now = Date.now(), thresholdMs } = {}) {
  const time = lastSyncAt ? new Date(lastSyncAt).getTime() : NaN;
  if (Number.isNaN(time)) return true;
  return now - time > thresholdMs;
}

/** ISO-8601 string for a Date-ish value, or null when absent/invalid. */
export function toIso(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}
