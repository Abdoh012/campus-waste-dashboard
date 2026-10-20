/**
 * Approved additional campus stations for the BATU dashboard.
 *
 * These four stations are part of the campus fleet, not part of the synthetic
 * 30-day history fixture in `demo-stations.js` / `demo-history.js`. Their
 * coordinates are approximate anchors inside the OSM-mapped campus envelope
 * (way 1271112799, centred on Wikipedia's BATU coordinate). They have not been
 * surveyed and no public building footprints are available, so they must be
 * field-verified before being treated as installed positions.
 *
 * The twelve containers carry **synthetic demo live state**: a deterministic
 * `CAMPUS_MOCK_STATE` fill percentage per device, stamped by the apply path with
 * `lastSyncAt` minutes ago and the fill-derived status — exactly the way
 * `demo-history.js` stages the original six bins. It is demo data for the
 * dashboard, not a measurement from physical ESP32 hardware, and these twelve
 * devices deliberately have **no `ScanEvent` history** so the 30-day charts
 * stay the six-bin demo slice. Re-running the demo seeder re-stamps them.
 *
 * Station ids were chosen so the existing map numbering stays stable:
 * `STN-LIBRARY` (01) and `STN-NORTH` (02) both sort before these ids, so the
 * frontend's sorted `stationId` numbering appends 03–06 instead of renumbering
 * the existing markers.
 */
import { WASTE_TYPES } from '../src/lib/waste-types.js';
import { stationMatches } from './station-association.js';

/** Four planned station anchors, one per documented campus activity area. */
export const CAMPUS_STATIONS = Object.freeze([
  {
    stationId: 'STN-SOUTH',
    name: 'South-West Entrance Station',
    location: {
      building: 'South-West Entrance / Administration',
      lat: 30.856775,
      lng: 29.571783,
    },
  },
  {
    stationId: 'STN-TEACHING',
    name: 'Educational Building Station',
    location: {
      building: 'Educational Building',
      lat: 30.858328,
      lng: 29.571184,
    },
  },
  {
    stationId: 'STN-UNION',
    name: 'Cafeteria & Student Activity Station',
    location: {
      building: 'Cafeteria / Student Activity',
      lat: 30.858062,
      lng: 29.571884,
    },
  },
  {
    stationId: 'STN-WORKSHOPS',
    name: 'Workshops & Laboratories Station',
    location: {
      building: 'Workshops & Laboratories',
      lat: 30.857362,
      lng: 29.572167,
    },
  },
]);

/**
 * Three containers per station, one of each material. The device ids continue
 * the existing ESP32-BIN-01..06 sequence owned by the history fixture.
 */
export const CAMPUS_BIN_ASSIGNMENTS = Object.freeze([
  { deviceId: 'ESP32-BIN-07', name: 'South-West Entrance Paper Bin', stationId: 'STN-SOUTH', wasteType: WASTE_TYPES.PAPER },
  { deviceId: 'ESP32-BIN-08', name: 'South-West Entrance Plastic Bin', stationId: 'STN-SOUTH', wasteType: WASTE_TYPES.PLASTIC },
  { deviceId: 'ESP32-BIN-09', name: 'South-West Entrance Liquids Bin', stationId: 'STN-SOUTH', wasteType: WASTE_TYPES.LIQUIDS },
  { deviceId: 'ESP32-BIN-10', name: 'Educational Building Paper Bin', stationId: 'STN-TEACHING', wasteType: WASTE_TYPES.PAPER },
  { deviceId: 'ESP32-BIN-11', name: 'Educational Building Plastic Bin', stationId: 'STN-TEACHING', wasteType: WASTE_TYPES.PLASTIC },
  { deviceId: 'ESP32-BIN-12', name: 'Educational Building Liquids Bin', stationId: 'STN-TEACHING', wasteType: WASTE_TYPES.LIQUIDS },
  { deviceId: 'ESP32-BIN-13', name: 'Cafeteria Paper Bin', stationId: 'STN-UNION', wasteType: WASTE_TYPES.PAPER },
  { deviceId: 'ESP32-BIN-14', name: 'Cafeteria Plastic Bin', stationId: 'STN-UNION', wasteType: WASTE_TYPES.PLASTIC },
  { deviceId: 'ESP32-BIN-15', name: 'Cafeteria Liquids Bin', stationId: 'STN-UNION', wasteType: WASTE_TYPES.LIQUIDS },
  { deviceId: 'ESP32-BIN-16', name: 'Workshops Paper Bin', stationId: 'STN-WORKSHOPS', wasteType: WASTE_TYPES.PAPER },
  { deviceId: 'ESP32-BIN-17', name: 'Workshops Plastic Bin', stationId: 'STN-WORKSHOPS', wasteType: WASTE_TYPES.PLASTIC },
  { deviceId: 'ESP32-BIN-18', name: 'Workshops Liquids Bin', stationId: 'STN-WORKSHOPS', wasteType: WASTE_TYPES.LIQUIDS },
]);

export const CAMPUS_STATION_IDS = Object.freeze(
  CAMPUS_STATIONS.map((station) => station.stationId),
);

export const CAMPUS_DEVICE_IDS = Object.freeze(
  CAMPUS_BIN_ASSIGNMENTS.map((assignment) => assignment.deviceId),
);

export const CAMPUS_STATION_COUNT = CAMPUS_STATIONS.length;
export const CAMPUS_BIN_COUNT = CAMPUS_BIN_ASSIGNMENTS.length;

/**
 * Deterministic demo live state for the twelve containers. The demo seeder
 * stamps each device with this fill level and a `lastSyncAt` this many minutes
 * before the run's clock; the stored status is derived from the fill level at
 * ingest time. The spread is chosen so the dashboard exercises every state:
 * mostly online (1–4 min), ATTENTION, CRITICAL, and one stale offline
 * container that keeps its last-known critical reading.
 */
export const CAMPUS_MOCK_STATE = Object.freeze([
  { deviceId: 'ESP32-BIN-07', fillLevel: 21, minutesAgo: 2 },
  { deviceId: 'ESP32-BIN-08', fillLevel: 34, minutesAgo: 1 },
  { deviceId: 'ESP32-BIN-09', fillLevel: 12, minutesAgo: 3 },
  { deviceId: 'ESP32-BIN-10', fillLevel: 64, minutesAgo: 2 },
  { deviceId: 'ESP32-BIN-11', fillLevel: 86, minutesAgo: 1 },
  { deviceId: 'ESP32-BIN-12', fillLevel: 41, minutesAgo: 4 },
  { deviceId: 'ESP32-BIN-13', fillLevel: 68, minutesAgo: 3 },
  { deviceId: 'ESP32-BIN-14', fillLevel: 52, minutesAgo: 1 },
  { deviceId: 'ESP32-BIN-15', fillLevel: 24, minutesAgo: 2 },
  { deviceId: 'ESP32-BIN-16', fillLevel: 31, minutesAgo: 3 },
  { deviceId: 'ESP32-BIN-17', fillLevel: 58, minutesAgo: 2 },
  { deviceId: 'ESP32-BIN-18', fillLevel: 93, minutesAgo: 97 },
]);

/** Expected totals once the two existing demo stations are included. */
export const CAMPUS_TOTAL_STATION_COUNT = 6;
export const CAMPUS_TOTAL_BIN_COUNT = 18;

/** The three materials every station is expected to separate. */
const REQUIRED_WASTE_TYPES = Object.freeze([
  WASTE_TYPES.PAPER,
  WASTE_TYPES.PLASTIC,
  WASTE_TYPES.LIQUIDS,
]);

/**
 * Broad Borg El Arab sanity bounds. This is not a campus boundary: it only
 * catches gross typos (a swapped lat/lng or a coordinate on another continent)
 * before a write.
 */
const SANITY_BOUNDS = Object.freeze({
  minLat: 30.84,
  maxLat: 30.88,
  minLng: 29.55,
  maxLng: 29.6,
});

/** Validate the fixture independently of any database. */
export function validateCampusStationFixture({
  stations = CAMPUS_STATIONS,
  bins = CAMPUS_BIN_ASSIGNMENTS,
  mockState = CAMPUS_MOCK_STATE,
} = {}) {
  const problems = [];
  const stationIds = new Set();

  for (const station of stations) {
    if (!station.stationId) {
      problems.push('Every station needs a stationId.');
    } else if (stationIds.has(station.stationId)) {
      problems.push(`Duplicate stationId "${station.stationId}".`);
    }
    stationIds.add(station.stationId);

    if (!station.name) problems.push(`Station ${station.stationId} is missing a name.`);

    const lat = station.location?.lat;
    const lng = station.location?.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      problems.push(`Station ${station.stationId} needs finite lat/lng coordinates.`);
    } else if (
      lat < SANITY_BOUNDS.minLat ||
      lat > SANITY_BOUNDS.maxLat ||
      lng < SANITY_BOUNDS.minLng ||
      lng > SANITY_BOUNDS.maxLng
    ) {
      problems.push(
        `Station ${station.stationId} coordinates (${lat}, ${lng}) are outside the Borg El Arab sanity bounds.`,
      );
    }
  }

  const deviceIds = new Set();
  const materialsByStation = new Map();

  for (const assignment of bins) {
    if (!assignment.deviceId) {
      problems.push('Every container needs a deviceId.');
    } else if (deviceIds.has(assignment.deviceId)) {
      problems.push(`Duplicate deviceId "${assignment.deviceId}".`);
    }
    deviceIds.add(assignment.deviceId);

    if (!assignment.name) {
      problems.push(`Container ${assignment.deviceId} is missing a name.`);
    }
    if (!stationIds.has(assignment.stationId)) {
      problems.push(
        `Container ${assignment.deviceId} references unknown station "${assignment.stationId}".`,
      );
    }
    if (!REQUIRED_WASTE_TYPES.includes(assignment.wasteType)) {
      problems.push(
        `Container ${assignment.deviceId} has unsupported material "${assignment.wasteType}".`,
      );
    }

    const materials = materialsByStation.get(assignment.stationId) ?? [];
    materials.push(assignment.wasteType);
    materialsByStation.set(assignment.stationId, materials);
  }

  for (const stationId of stationIds) {
    const materials = materialsByStation.get(stationId) ?? [];
    if (materials.length !== REQUIRED_WASTE_TYPES.length) {
      problems.push(
        `Station ${stationId} has ${materials.length} container(s); expected ${REQUIRED_WASTE_TYPES.length}.`,
      );
    }
    for (const material of REQUIRED_WASTE_TYPES) {
      const count = materials.filter((value) => value === material).length;
      if (count !== 1) {
        problems.push(
          `Station ${stationId} has ${count} "${material}" container(s); expected exactly 1.`,
        );
      }
    }
  }

  // Demo live state must cover exactly the declared containers, with an
  // integer fill in range and a non-negative integer age in minutes.
  const mockByDevice = new Map();
  for (const mock of mockState) {
    if (mockByDevice.has(mock.deviceId)) {
      problems.push(`Duplicate demo state entry for "${mock.deviceId}".`);
    }
    mockByDevice.set(mock.deviceId, mock);
    if (!Number.isInteger(mock.fillLevel) || mock.fillLevel < 0 || mock.fillLevel > 100) {
      problems.push(`Container ${mock.deviceId} needs an integer fill 0–100.`);
    }
    if (!Number.isInteger(mock.minutesAgo) || mock.minutesAgo < 0) {
      problems.push(`Container ${mock.deviceId} needs a non-negative age in minutes.`);
    }
  }
  for (const assignment of bins) {
    if (!mockByDevice.has(assignment.deviceId)) {
      problems.push(`Container ${assignment.deviceId} has no demo fill/sync state.`);
    }
  }

  return problems;
}

/**
 * Decide what an apply run would create, skip or refuse. Pure: no Mongoose.
 *
 * `ok` is false when any existing station/container conflicts with the fixture
 * or the fixture itself is malformed. The caller must write nothing when
 * `ok` is false. Existing records are never overwritten.
 */
export function planCampusStationAdd({
  existingStations = [],
  existingBins = [],
  stations = CAMPUS_STATIONS,
  bins = CAMPUS_BIN_ASSIGNMENTS,
} = {}) {
  const conflicts = [...validateCampusStationFixture({ stations, bins })];
  const stationsById = new Map(
    existingStations.map((station) => [station.stationId, station]),
  );
  const binsByDevice = new Map(
    existingBins.map((bin) => [bin.deviceId, bin]),
  );

  const createStations = [];
  const skipStations = [];
  const createBins = [];
  const skipBins = [];

  for (const station of stations) {
    const existing = stationsById.get(station.stationId);

    if (existing == null) {
      createStations.push(station);
      continue;
    }

    if (!stationMatches(existing, station)) {
      conflicts.push(
        `Station ${station.stationId} already exists with a different name/location; ` +
          'refusing to overwrite it.',
      );
      continue;
    }

    skipStations.push(station.stationId);
  }

  for (const assignment of bins) {
    const existing = binsByDevice.get(assignment.deviceId);

    if (existing == null) {
      createBins.push(assignment);
      continue;
    }

    if (
      existing.stationId !== assignment.stationId ||
      existing.wasteType !== assignment.wasteType
    ) {
      conflicts.push(
        `Container ${assignment.deviceId} already exists with ` +
          `station="${existing.stationId}" material="${existing.wasteType}"; ` +
          'refusing to overwrite it.',
      );
      continue;
    }

    skipBins.push(assignment.deviceId);
  }

  return {
    ok: conflicts.length === 0,
    conflicts,
    createStations,
    skipStations,
    createBins,
    skipBins,
  };
}
