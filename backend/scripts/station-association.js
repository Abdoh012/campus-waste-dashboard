/**
 * Pure planning for `scripts/assign-demo-stations.js`.
 *
 * The association is destructive in the wrong hands — it would overwrite a real
 * station's name/coordinates or move a container off a real station. This module
 * decides, from the current station and bin documents, whether the demo fixture
 * can be applied safely, without touching a database (so the rules are unit
 * tested directly).
 *
 * Rules:
 *   - a demo station that is absent is created;
 *   - a demo station that exists but differs (name or location) is a conflict;
 *   - a demo bin that is absent is reported and skipped (never created);
 *   - an unassigned demo bin is assigned its demo station;
 *   - an unclassified demo bin is given its demo material;
 *   - an existing station or material that differs is a conflict, never overwritten.
 */
import {
  DEMO_BIN_STATION_MAP,
  DEMO_BIN_WASTE_TYPE_MAP,
  DEMO_STATIONS,
} from './demo-stations.js';
import { isWasteType } from '../src/lib/waste-types.js';

const EPSILON = 1e-9;

function sameNumber(a, b) {
  return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < EPSILON;
}

/** Compare a stored location with the demo fixture location. */
export function locationMatches(actual, expected) {
  if (actual == null || expected == null) return false;
  return (
    (actual.building ?? '') === (expected.building ?? '') &&
    sameNumber(actual.lat, expected.lat) &&
    sameNumber(actual.lng, expected.lng)
  );
}

/** Compare a stored station with the demo fixture station. */
export function stationMatches(actual, expected) {
  return actual != null && actual.name === expected.name && locationMatches(actual.location, expected.location);
}

/**
 * Decide what the association run would do.
 *
 * Returns `{ ok, errors, stations: { create, unchanged }, bins: { assignments,
 * unchanged, missing } }`. When `ok` is false the caller must write nothing.
 */
export function planStationAssociation({
  existingStations = [],
  existingBins = [],
  stations = DEMO_STATIONS,
  binStationMap = DEMO_BIN_STATION_MAP,
  binWasteTypeMap = DEMO_BIN_WASTE_TYPE_MAP,
} = {}) {
  const errors = [];

  const stationsById = new Map(existingStations.map((station) => [station.stationId, station]));
  const create = [];
  const unchangedStations = [];

  for (const station of stations) {
    const existing = stationsById.get(station.stationId);

    if (existing == null) {
      create.push(station);
      continue;
    }

    if (!stationMatches(existing, station)) {
      errors.push(
        `Station ${station.stationId} already exists with different name/location ` +
          `(name="${existing.name}", location=${JSON.stringify(existing.location)}); ` +
          'refusing to overwrite it with the demo fixture.',
      );
      continue;
    }

    unchangedStations.push(station.stationId);
  }

  const binsByDevice = new Map(existingBins.map((bin) => [bin.deviceId, bin]));
  const assignments = [];
  const unchangedBins = [];
  const missing = [];

  for (const [deviceId, stationId] of Object.entries(binStationMap)) {
    const bin = binsByDevice.get(deviceId);
    const wasteType = binWasteTypeMap[deviceId] ?? null;

    if (wasteType !== null && !isWasteType(wasteType)) {
      errors.push(
        `Demo wasteType "${String(wasteType)}" for ${deviceId} is not supported; ` +
          'expected paper, plastic or liquids.',
      );
      continue;
    }

    if (bin == null) {
      missing.push(deviceId);
      continue;
    }

    const currentStation = bin.stationId ? bin.stationId : null;
    const currentWasteType = bin.wasteType ? bin.wasteType : null;

    let conflict = false;

    if (currentStation != null && currentStation !== stationId) {
      errors.push(
        `Bin ${deviceId} is already assigned to station "${currentStation}"; ` +
          `refusing to move it to "${stationId}".`,
      );
      conflict = true;
    }

    if (
      wasteType !== null &&
      currentWasteType !== null &&
      currentWasteType !== wasteType
    ) {
      errors.push(
        `Bin ${deviceId} is already classified as "${currentWasteType}"; ` +
          `refusing to overwrite it with "${wasteType}".`,
      );
      conflict = true;
    }

    if (conflict) continue;

    const setStationId = currentStation == null;
    const setWasteType = wasteType !== null && currentWasteType == null;

    if (setStationId || setWasteType) {
      assignments.push({
        deviceId,
        stationId,
        wasteType,
        setStationId,
        setWasteType,
      });
    } else {
      unchangedBins.push(deviceId);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stations: { create, unchanged: unchangedStations },
    bins: { assignments, unchanged: unchangedBins, missing },
  };
}
