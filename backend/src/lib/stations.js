import { FILL_THRESHOLDS, toIso } from './status.js';
import {
  WASTE_TYPE_VALUES,
  isWasteType,
  normalisedWasteType,
} from './waste-types.js';

/**
 * Station/container domain rules.
 *
 * Hardware contract (verified from `routes/bins.js`): the ingest route accepts
 * exactly one `fillLevel` per request, addressed by the container's `deviceId`.
 * The repository contains no firmware or device documentation, so the physical
 * arrangement is NOT established. This module therefore models the safe,
 * backward-compatible contract: one reading per device, with each device
 * associated to a station through a stable `stationId`. A future multi-container
 * payload can be layered on top without changing these semantics.
 *
 * Two independent axes:
 *   - fill status:   healthy | attention | critical | unknown
 *   - connectivity:  online  | offline   | never-connected
 *
 * Stale containers keep their last known fill severity; connectivity never
 * erases it.
 */

export const FILL_STATUSES = Object.freeze({
  HEALTHY: 'healthy',
  ATTENTION: 'attention',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown',
});

export const CONNECTIVITIES = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  NEVER_CONNECTED: 'never-connected',
});

export const STATION_CONNECTIVITIES = Object.freeze({
  ONLINE: 'online',
  PARTIAL: 'partial',
  OFFLINE: 'offline',
});

/** The product invariant: a valid station has exactly this many containers. */
export const EXPECTED_CONTAINERS = 3;

/** Highest wins. `unknown` never beats a known severity. */
const SEVERITY_RANK = Object.freeze({
  unknown: 0,
  healthy: 1,
  attention: 2,
  critical: 3,
});

/** Fill percentage (0–100) → fill status. Null/invalid → `unknown`. */
export function fillStatusForLevel(fillLevel) {
  const fill = normalisedFillLevel(fillLevel);
  if (fill === null) return FILL_STATUSES.UNKNOWN;
  if (fill >= FILL_THRESHOLDS.CRITICAL) return FILL_STATUSES.CRITICAL;
  if (fill >= FILL_THRESHOLDS.ATTENTION) return FILL_STATUSES.ATTENTION;
  return FILL_STATUSES.HEALTHY;
}

/** A valid 0–100 number, or null for a missing/never-connected reading. */
export function normalisedFillLevel(fillLevel) {
  if (fillLevel === null || fillLevel === undefined || fillLevel === '') {
    return null;
  }
  const fill = Number(fillLevel);
  if (!Number.isFinite(fill) || fill < 0 || fill > 100) return null;
  return fill;
}

/**
 * Connectivity from `lastSyncAt`, distinct from fill status:
 *   - no (or invalid) timestamp → `never-connected`
 *   - older than the threshold   → `offline`
 *   - otherwise                  → `online`
 */
export function connectivityFor(lastSyncAt, { now = Date.now(), thresholdMs } = {}) {
  const time = lastSyncAt ? new Date(lastSyncAt).getTime() : NaN;
  if (Number.isNaN(time)) return CONNECTIVITIES.NEVER_CONNECTED;
  return now - time > thresholdMs
    ? CONNECTIVITIES.OFFLINE
    : CONNECTIVITIES.ONLINE;
}

/** Highest known fill severity across containers. All unknown → `unknown`. */
export function stationSeverity(containers) {
  return containers.reduce(
    (worst, container) =>
      SEVERITY_RANK[container.fillStatus] > SEVERITY_RANK[worst]
        ? container.fillStatus
        : worst,
    FILL_STATUSES.UNKNOWN,
  );
}

/**
 * Station connectivity summary:
 *   - all containers online           → `online`
 *   - some online, some not           → `partial`
 *   - none online (incl. never / none) → `offline`
 * Never-connected counts as "not online".
 */
export function stationConnectivity(containers) {
  if (containers.length === 0) return STATION_CONNECTIVITIES.OFFLINE;
  const online = containers.filter(
    (container) => container.connectivity === CONNECTIVITIES.ONLINE,
  ).length;
  if (online === containers.length) return STATION_CONNECTIVITIES.ONLINE;
  if (online === 0) return STATION_CONNECTIVITIES.OFFLINE;
  return STATION_CONNECTIVITIES.PARTIAL;
}

/** The newest container timestamp, or null when no container has ever synced. */
function latestSync(containers) {
  let latest = null;
  for (const container of containers) {
    if (!container.lastSyncAt) continue;
    const time = new Date(container.lastSyncAt).getTime();
    if (Number.isNaN(time)) continue;
    if (latest === null || time > latest) latest = time;
  }
  return latest === null ? null : new Date(latest).toISOString();
}

/**
 * Explicit, validated container DTO. Legacy `status` stays on `toBinDto`; this
 * shape exposes the two independent axes plus freshness.
 */
export function toContainerDto(bin, options = {}) {
  const connectivity = connectivityFor(bin.lastSyncAt, options);
  // A container with no successful reading is never given a fabricated fill,
  // even if a malformed document carries a numeric fillLevel without a time.
  const fillLevel =
    connectivity === CONNECTIVITIES.NEVER_CONNECTED
      ? null
      : normalisedFillLevel(bin.fillLevel);
  const fillStatus = fillStatusForLevel(fillLevel);
  const lastKnown =
    connectivity !== CONNECTIVITIES.ONLINE && fillStatus !== FILL_STATUSES.UNKNOWN;

  return {
    _id: String(bin._id),
    deviceId: bin.deviceId,
    name: bin.name,
    stationId: bin.stationId ?? null,
    // Null means unclassified/legacy; never inferred from a name or device id.
    wasteType: normalisedWasteType(bin.wasteType),
    fillLevel,
    fillStatus,
    connectivity,
    lastSyncAt: toIso(bin.lastSyncAt),
    lastKnown,
    isStale: connectivity === CONNECTIVITIES.OFFLINE,
  };
}

/**
 * Data-integrity report for one station. A station is only `valid` when it has
 * exactly three well-formed containers. Incomplete stations are reported, never
 * silently presented as valid.
 */
export function stationIntegrity(station, rawContainers) {
  const containers = rawContainers ?? [];
  const issues = [];

  if (containers.length !== EXPECTED_CONTAINERS) {
    issues.push({
      code: 'container-count',
      message: `Expected ${EXPECTED_CONTAINERS} containers, found ${containers.length}`,
    });
  }

  const seen = new Set();
  const classified = [];
  const invalidWasteTypes = [];

  for (const bin of containers) {
    const deviceId = typeof bin.deviceId === 'string' ? bin.deviceId.trim() : '';
    if (!deviceId) {
      issues.push({
        code: 'missing-device-id',
        message: 'Container is missing a deviceId',
      });
    } else if (seen.has(deviceId)) {
      issues.push({
        code: 'duplicate-device-id',
        message: `Duplicate container deviceId ${deviceId}`,
      });
    } else {
      seen.add(deviceId);
    }

    if (bin.stationId && station?.stationId && bin.stationId !== station.stationId) {
      issues.push({
        code: 'station-mismatch',
        message: `Container ${deviceId || '(unknown)'} belongs to ${bin.stationId}, not ${station.stationId}`,
      });
    }

    if (
      bin.fillLevel !== null &&
      bin.fillLevel !== undefined &&
      (bin.lastSyncAt === null || bin.lastSyncAt === undefined || bin.lastSyncAt === '')
    ) {
      issues.push({
        code: 'missing-last-sync',
        message: `Container ${deviceId || '(unknown)'} has a fillLevel but no lastSyncAt`,
      });
    }

    if (
      bin.fillLevel !== null &&
      bin.fillLevel !== undefined &&
      normalisedFillLevel(bin.fillLevel) === null
    ) {
      issues.push({
        code: 'invalid-fill-level',
        message: `Invalid fillLevel for ${deviceId || 'container'}`,
      });
    }

    // An empty/missing value is legacy-unclassified, not an error. Only values
    // that were explicitly provided and are unsupported are reported.
    const wasteType = bin.wasteType;
    if (wasteType !== null && wasteType !== undefined && wasteType !== '') {
      if (isWasteType(wasteType)) {
        classified.push(wasteType);
      } else {
        invalidWasteTypes.push({ deviceId, wasteType });
      }
    }
  }

  for (const invalid of invalidWasteTypes) {
    issues.push({
      code: 'invalid-waste-type',
      message: `Invalid wasteType "${String(invalid.wasteType)}" for ${invalid.deviceId || 'container'}`,
    });
  }

  // Once a station has started classifying containers, require exactly one of
  // each material. A fully unclassified legacy station is left structurally
  // valid so existing records do not suddenly disappear from station KPIs.
  if (classified.length > 0) {
    for (const wasteType of WASTE_TYPE_VALUES) {
      const count = classified.filter((value) => value === wasteType).length;
      if (count === 0) {
        issues.push({
          code: 'missing-waste-type',
          message: `No container classified as ${wasteType}`,
        });
      } else if (count > 1) {
        issues.push({
          code: 'duplicate-waste-type',
          message: `${count} containers classified as ${wasteType}`,
        });
      }
    }
  }

  return {
    expected: EXPECTED_CONTAINERS,
    actual: containers.length,
    valid: issues.length === 0,
    issues,
  };
}

/** Explicit station DTO: one authoritative location + its containers. */
export function toStationDto(station, rawContainers, options = {}) {
  const containers = [...(rawContainers ?? [])]
    .map((bin) => toContainerDto(bin, options))
    .sort((a, b) => String(a.deviceId).localeCompare(String(b.deviceId)));

  return {
    _id: String(station._id),
    stationId: station.stationId,
    name: station.name,
    location: {
      building: station.location?.building ?? '',
      lat: station.location?.lat ?? null,
      lng: station.location?.lng ?? null,
    },
    containers,
    severity: stationSeverity(containers),
    connectivity: stationConnectivity(containers),
    integrity: stationIntegrity(station, rawContainers ?? []),
    lastSyncAt: latestSync(containers),
  };
}

/** Group raw bin documents by their `stationId` (deterministic order). */
export function groupBinsByStation(bins) {
  const groups = new Map();
  for (const bin of bins) {
    if (!bin.stationId) continue;
    const group = groups.get(bin.stationId);
    if (group) group.push(bin);
    else groups.set(bin.stationId, [bin]);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => String(a.deviceId).localeCompare(String(b.deviceId)));
  }
  return groups;
}
