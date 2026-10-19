import { isOffline, toIso } from './status.js';
import { normalisedWasteType } from './waste-types.js';
import {
  CONNECTIVITIES,
  FILL_STATUSES,
  connectivityFor,
  fillStatusForLevel,
  normalisedFillLevel,
} from './stations.js';

/**
 * Response shapes — the exact contracts the frontend consumes.
 *
 * GET /api/bins        → [ toBinDto … ]
 * GET /api/bins/:id    → toBinDto with detail:true (adds createdAt/updatedAt)
 * PUT ingest response  → toIngestDto
 *
 * Mongoose documents/leans are mapped explicitly so `__v` and any future
 * schema additions never leak into the payload.
 */

/** List/detail DTO: exactly the documented fields, offline override applied. */
export function toBinDto(bin, { detail = false, thresholdMs } = {}) {
  const offline = isOffline(bin.lastSyncAt, { thresholdMs });
  const fillLevel = normalisedFillLevel(bin.fillLevel);
  const fillStatus = fillStatusForLevel(fillLevel);
  const connectivity = connectivityFor(bin.lastSyncAt, { thresholdMs });
  const lastKnown =
    connectivity !== CONNECTIVITIES.ONLINE && fillStatus !== FILL_STATUSES.UNKNOWN;

  const dto = {
    _id: String(bin._id),
    deviceId: bin.deviceId,
    name: bin.name,
    stationId: bin.stationId ?? null,
    // Null for legacy/unclassified containers; never inferred.
    wasteType: normalisedWasteType(bin.wasteType),
    location: {
      building: bin.location?.building ?? '',
      lat: bin.location?.lat ?? null,
      lng: bin.location?.lng ?? null,
    },
    // Legacy, connectivity-overridden status (kept for existing consumers).
    fillLevel,
    status: offline ? 'offline' : bin.status,
    // Independent, truthful axes. Connectivity never erases fill severity.
    fillStatus,
    connectivity,
    lastKnown,
    isStale: connectivity === CONNECTIVITIES.OFFLINE,
    lastSyncAt: toIso(bin.lastSyncAt),
  };

  if (detail) {
    dto.createdAt = toIso(bin.createdAt);
    dto.updatedAt = toIso(bin.updatedAt);
  }

  return dto;
}

/** PUT /api/bins/:deviceId/status response. */
export function toIngestDto(bin, { pointsAwarded = false } = {}) {
  return {
    deviceId: bin.deviceId,
    fillLevel: bin.fillLevel,
    status: bin.status,
    lastSyncAt: toIso(bin.lastSyncAt),
    pointsAwarded,
  };
}