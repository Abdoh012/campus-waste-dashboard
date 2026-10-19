/**
 * Stations from `GET /api/stations`.
 *
 * The backend groups containers by stable `stationId`; the frontend deliberately
 * does not infer station identity from `location.building`. Each station has one
 * authoritative position and exactly three (or, during migration, fewer)
 * containers. Responses are external data, so every field is validated here.
 */

import type {
  Bin,
  BinLocation,
  ContainerConnectivity,
  FillStatus,
  StationConnectivity,
  StationIntegrity,
  StationIntegrityIssue,
  WasteType,
} from '../features/dashboard/campusMapData';
import { ApiError, apiRequest, isRecord } from './apiClient';

export interface StationContainerDto {
  _id: string;
  deviceId: string;
  name: string;
  stationId: string | null;
  wasteType: WasteType | null;
  fillLevel: number | null;
  fillStatus: FillStatus;
  connectivity: ContainerConnectivity;
  lastSyncAt: string | null;
  lastKnown: boolean;
  isStale: boolean;
}

export interface StationDto {
  _id: string;
  stationId: string;
  name: string;
  location: {
    building: string;
    lat: number | null;
    lng: number | null;
  };
  containers: readonly StationContainerDto[];
  severity: FillStatus;
  connectivity: StationConnectivity;
  integrity: StationIntegrity;
  lastSyncAt: string | null;
}

export interface StationLocationsResult {
  locations: readonly BinLocation[];
  /** Number of stations returned by the API (including unmappable ones). */
  total: number;
  /** Stations skipped because they have no valid coordinates. */
  skipped: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isFillStatus(value: unknown): value is FillStatus {
  return (
    value === 'healthy' ||
    value === 'attention' ||
    value === 'critical' ||
    value === 'unknown'
  );
}

/** Null/absent is treated as unclassified legacy data, never as an error. */
function isWasteTypeOrNull(value: unknown): value is WasteType | null {
  return (
    value === null ||
    value === undefined ||
    value === 'paper' ||
    value === 'plastic' ||
    value === 'liquids'
  );
}

function isContainerConnectivity(value: unknown): value is ContainerConnectivity {
  return (
    value === 'online' ||
    value === 'offline' ||
    value === 'never-connected'
  );
}

function isStationConnectivity(value: unknown): value is StationConnectivity {
  return value === 'online' || value === 'partial' || value === 'offline';
}

function isIntegrityIssue(value: unknown): value is StationIntegrityIssue {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
}

function isStationIntegrity(value: unknown): value is StationIntegrity {
  return (
    isRecord(value) &&
    isFiniteNumber(value.expected) &&
    isFiniteNumber(value.actual) &&
    typeof value.valid === 'boolean' &&
    Array.isArray(value.issues) &&
    value.issues.every(isIntegrityIssue)
  );
}

function isStationContainer(value: unknown): value is StationContainerDto {
  return (
    isRecord(value) &&
    typeof value._id === 'string' &&
    typeof value.deviceId === 'string' &&
    typeof value.name === 'string' &&
    (value.stationId === null || typeof value.stationId === 'string') &&
    isWasteTypeOrNull(value.wasteType) &&
    (value.fillLevel === null || isFiniteNumber(value.fillLevel)) &&
    isFillStatus(value.fillStatus) &&
    isContainerConnectivity(value.connectivity) &&
    (value.lastSyncAt === null || typeof value.lastSyncAt === 'string') &&
    typeof value.lastKnown === 'boolean' &&
    typeof value.isStale === 'boolean'
  );
}

function isStationDto(value: unknown): value is StationDto {
  if (
    !isRecord(value) ||
    !isRecord(value.location) ||
    typeof value._id !== 'string' ||
    typeof value.stationId !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.location.building !== 'string' ||
    !(value.location.lat === null || isFiniteNumber(value.location.lat)) ||
    !(value.location.lng === null || isFiniteNumber(value.location.lng)) ||
    !Array.isArray(value.containers) ||
    !value.containers.every(isStationContainer) ||
    !isFillStatus(value.severity) ||
    !isStationConnectivity(value.connectivity) ||
    !isStationIntegrity(value.integrity) ||
    !(value.lastSyncAt === null || typeof value.lastSyncAt === 'string')
  ) {
    return false;
  }

  return true;
}

/** Fetch and validate the station collection. Throws `ApiError` on failure. */
export async function fetchStations(
  signal?: AbortSignal,
): Promise<readonly StationDto[]> {
  const body = await apiRequest('/stations', { signal });

  if (!Array.isArray(body)) {
    throw new ApiError(0, 'The stations response was not an array.');
  }

  const stations: StationDto[] = [];
  for (const item of body) {
    if (!isStationDto(item)) {
      throw new ApiError(0, 'A station did not match the expected shape.');
    }
    stations.push(item);
  }

  return stations;
}

function toDisplayBin(container: StationContainerDto): Bin {
  const fill = container.fillLevel === null ? null : Math.round(container.fillLevel);
  return {
    id: container._id,
    deviceId: container.deviceId,
    label: container.name.trim() !== '' ? container.name : container.deviceId,
    wasteType: container.wasteType ?? null,
    fill,
    fillStatus: container.fillStatus,
    connectivity: container.connectivity,
    lastSyncAt: container.lastSyncAt,
    lastKnown: container.lastKnown,
  };
}

/**
 * Map the API's stations to marker locations. Exactly one location is produced
 * per station that has valid coordinates; stations without coordinates are
 * counted as `skipped` so the map can show an explicit incomplete state rather
 * than silently dropping them.
 */
export function toStationLocations(
  stations: readonly StationDto[],
): StationLocationsResult {
  let skipped = 0;

  const mapped = stations.flatMap((station) => {
    const { lat, lng } = station.location;
    if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      skipped += 1;
      return [];
    }

    return [
      {
        id: `station-${station.stationId}`,
        stationId: station.stationId,
        number: '00',
        name: station.name,
        position: { lat, lng },
        severity: station.severity,
        connectivity: station.connectivity,
        integrity: station.integrity,
        bins: station.containers.map(toDisplayBin),
      } satisfies BinLocation,
    ];
  });

  const locations = mapped
    .sort((a, b) => a.stationId.localeCompare(b.stationId))
    .map((location, index) => ({
      ...location,
      number: String(index + 1).padStart(2, '0'),
    }));

  return { locations, total: stations.length, skipped };
}
