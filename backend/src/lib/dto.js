import { isOffline, toIso } from './status.js';

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

  const dto = {
    _id: String(bin._id),
    deviceId: bin.deviceId,
    name: bin.name,
    location: {
      building: bin.location?.building ?? '',
      lat: bin.location?.lat ?? null,
      lng: bin.location?.lng ?? null,
    },
    fillLevel: bin.fillLevel ?? 0,
    // A silent device reads offline; otherwise the stored fill-derived status.
    status: offline ? 'offline' : bin.status,
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