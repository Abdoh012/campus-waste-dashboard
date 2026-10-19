/**
 * Live bins from the `bins` collection (legacy `GET /api/bins` contract).
 *
 * The dashboard map now reads `GET /api/stations` through `stationsApi.ts`,
 * which groups containers by stable `stationId`. This module is kept for the
 * legacy endpoint's external consumers and for `useBins`, and still groups
 * documents by `building` because that endpoint returns one row per device.
 */

import type {
  Bin,
  BinLocation,
  ContainerConnectivity,
  FillStatus,
  StationConnectivity,
  WasteType,
} from '../features/dashboard/campusMapData';
import type { BinStatus } from '../features/dashboard/types';
import { ApiError, apiRequest, isRecord } from './apiClient';

/** The exact `GET /api/bins` item shape (backend `lib/dto.js`). */
export interface BinDto {
  _id: string;
  deviceId: string;
  name: string;
  stationId: string | null;
  wasteType: WasteType | null;
  location: {
    building: string;
    lat: number | null;
    lng: number | null;
  };
  fillLevel: number | null;
  status: BinStatus;
  fillStatus: FillStatus;
  connectivity: ContainerConnectivity;
  lastKnown: boolean;
  isStale: boolean;
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
    (value.fillLevel === null || isFiniteNumber(value.fillLevel)) &&
    isBinStatus(value.status) &&
    (value.stationId === null || typeof value.stationId === 'string') &&
    isWasteTypeOrNull(value.wasteType) &&
    isFillStatus(value.fillStatus) &&
    isConnectivity(value.connectivity) &&
    typeof value.lastKnown === 'boolean' &&
    typeof value.isStale === 'boolean' &&
    (value.lastSyncAt === null || typeof value.lastSyncAt === 'string')
  );
}

function isFillStatus(value: unknown): value is FillStatus {
  return (
    value === 'healthy' ||
    value === 'attention' ||
    value === 'critical' ||
    value === 'unknown'
  );
}

function isConnectivity(value: unknown): value is ContainerConnectivity {
  return (
    value === 'online' ||
    value === 'offline' ||
    value === 'never-connected'
  );
}

/** Null/absent is legacy-unclassified data, never a validation error. */
function isWasteTypeOrNull(value: unknown): value is WasteType | null {
  return (
    value === null ||
    value === undefined ||
    value === 'paper' ||
    value === 'plastic' ||
    value === 'liquids'
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
    wasteType: bin.wasteType ?? null,
    fill: bin.fillLevel === null ? null : Math.round(bin.fillLevel),
    fillStatus: bin.fillStatus,
    connectivity: bin.connectivity,
    lastSyncAt: bin.lastSyncAt,
    lastKnown: bin.lastKnown,
  };
}

const SEVERITY_RANK: Record<FillStatus, number> = {
  unknown: 0,
  healthy: 1,
  attention: 2,
  critical: 3,
};

function maxSeverity(bins: readonly Bin[]): FillStatus {
  return bins.reduce<FillStatus>(
    (worst, bin) =>
      SEVERITY_RANK[bin.fillStatus] > SEVERITY_RANK[worst]
        ? bin.fillStatus
        : worst,
    'unknown',
  );
}

function summarizeConnectivity(bins: readonly Bin[]): StationConnectivity {
  if (bins.length === 0) return 'offline';
  const online = bins.filter((bin) => bin.connectivity === 'online').length;
  if (online === bins.length) return 'online';
  if (online === 0) return 'offline';
  return 'partial';
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

    const bins = ordered.map(toDisplayBin);

    return {
      id: `loc-${key}`,
      // Legacy rows are grouped by their display building, which is not a
      // station identity; leave it blank rather than fabricating one.
      stationId: '',
      number: '00',
      name: building !== '' ? building : first.name.trim(),
      position: {
        lat: position.lat / ordered.length,
        lng: position.lng / ordered.length,
      },
      severity: maxSeverity(bins),
      connectivity: summarizeConnectivity(bins),
      integrity: {
        expected: 3,
        actual: bins.length,
        valid: bins.length === 3,
        issues:
          bins.length === 3
            ? []
            : [
                {
                  code: 'container-count',
                  message: `Expected 3 containers, found ${bins.length}`,
                },
              ],
      },
      bins,
    };
  });

  return locations
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((location, index) => ({
      ...location,
      number: String(index + 1).padStart(2, '0'),
    }));
}
