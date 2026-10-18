/**
 * Live bins from the `bins` collection.
 *
 * `GET /api/bins` returns one document per physical bin (see
 * `backend/src/models/Bin.js`): a device, its building + coordinates, one
 * fill level, a derived status, and the last sync time.
 *
 * The map is organised by *location* (one marker per building) rather than by
 * device, so `toBinLocations` groups the documents by building. A building
 * with one bin gets one row in the popup; a building with three gets three —
 * the popup already handles any count.
 */

import type { Bin, BinLocation } from '../features/dashboard/campusMapData';
import type { BinStatus } from '../features/dashboard/types';
import { ApiError, apiRequest, isRecord } from './apiClient';

/** The exact `GET /api/bins` item shape (backend `lib/dto.js`). */
export interface BinDto {
  _id: string;
  deviceId: string;
  name: string;
  location: {
    building: string;
    lat: number | null;
    lng: number | null;
  };
  fillLevel: number;
  status: BinStatus;
  lastSyncAt: string | null;
}

function isBinStatus(value: unknown): value is BinStatus {
  return (
    value === 'healthy' ||
    value === 'attention' ||
    value === 'critical' ||
    value === 'offline'
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBinDto(value: unknown): value is BinDto {
  if (!isRecord(value) || !isRecord(value.location)) return false;
  const { location } = value;

  return (
    typeof value._id === 'string' &&
    typeof value.deviceId === 'string' &&
    typeof value.name === 'string' &&
    typeof location.building === 'string' &&
    (location.lat === null || isFiniteNumber(location.lat)) &&
    (location.lng === null || isFiniteNumber(location.lng)) &&
    isFiniteNumber(value.fillLevel) &&
    isBinStatus(value.status) &&
    (value.lastSyncAt === null || typeof value.lastSyncAt === 'string')
  );
}

/** Fetch and validate the live collection. Throws `ApiError` on failure. */
export async function fetchBins(
  signal?: AbortSignal,
): Promise<readonly BinDto[]> {
  const body = await apiRequest('/bins', { signal });

  if (!Array.isArray(body)) {
    throw new ApiError(0, 'The bins response was not an array.');
  }

  const bins: BinDto[] = [];
  for (const item of body) {
    if (!isBinDto(item)) {
      throw new ApiError(0, 'A bin did not match the expected shape.');
    }
    bins.push(item);
  }

  return bins;
}

/** A stable key for grouping bins that share a building. */
function locationKey(bin: BinDto): string {
  const building = bin.location.building.trim().toLowerCase();
  return building !== '' ? building : bin.deviceId.toLowerCase();
}

function toDisplayBin(bin: BinDto): Bin {
  return {
    id: bin._id,
    deviceId: bin.deviceId,
    label: bin.name.trim() !== '' ? bin.name : bin.deviceId,
    fill: Math.round(bin.fillLevel),
    status: bin.status,
    lastSyncAt: bin.lastSyncAt,
  };
}

/**
 * Group device documents into marker locations. Bins without coordinates are
 * skipped (they cannot be placed on a map), and markers are numbered in
 * building order so the display stays stable between refreshes.
 */
export function toBinLocations(bins: readonly BinDto[]): readonly BinLocation[] {
  const groups = new Map<string, BinDto[]>();

  for (const bin of bins) {
    const { lat, lng } = bin.location;
    if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const key = locationKey(bin);
    const group = groups.get(key);
    if (group) {
      group.push(bin);
    } else {
      groups.set(key, [bin]);
    }
  }

  const locations = [...groups.entries()].map(([key, group]) => {
    const ordered = [...group].sort((a, b) => a.deviceId.localeCompare(b.deviceId));
    const first = ordered[0];
    const building = first.location.building.trim();

    const position = ordered.reduce(
      (sum, bin) => ({
        lat: sum.lat + (bin.location.lat ?? 0),
        lng: sum.lng + (bin.location.lng ?? 0),
      }),
      { lat: 0, lng: 0 },
    );

    return {
      id: `loc-${key}`,
      number: '00',
      name: building !== '' ? building : first.name.trim(),
      position: {
        lat: position.lat / ordered.length,
        lng: position.lng / ordered.length,
      },
      bins: ordered.map(toDisplayBin),
    };
  });

  return locations
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((location, index) => ({
      ...location,
      number: String(index + 1).padStart(2, '0'),
    }));
}
