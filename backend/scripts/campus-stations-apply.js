/**
 * Apply and verify the four approved campus stations against the *current*
 * mongoose connection.
 *
 * This module owns no target-safety logic: the guarded Atlas entrypoint
 * (`scripts/add-campus-stations.js`), the local seed and the integration test
 * decide which database is safe to touch, then call in here.
 *
 * Scope: only `CAMPUS_STATION_IDS` and `CAMPUS_DEVICE_IDS`. The apply path is
 * additive and idempotent. It never deletes, and never overwrites an existing
 * station's name/location or a container's station/material. The containers
 * carry DEMO live state from `CAMPUS_MOCK_STATE`: a synthetic fill level and a
 * `lastSyncAt` offset from the run's clock, with the fill-derived status. That
 * state is demo data for the dashboard — never a claim about physical ESP32
 * hardware — and `applyCampusMockState` re-stamps it on every demo refresh
 * (`npm run seed` / `seed-campus-demo.js`). The containers stay telemetry-free
 * in one respect: these twelve devices get no `ScanEvent` rows, so the 30-day
 * history charts remain the six-bin demo slice.
 */
import { Bin } from '../src/models/Bin.js';
import { Station } from '../src/models/Station.js';
import {
  fillStatusForLevel,
  groupBinsByStation,
  toStationDto,
} from '../src/lib/stations.js';
import {
  CAMPUS_BIN_COUNT,
  CAMPUS_DEVICE_IDS,
  CAMPUS_MOCK_STATE,
  CAMPUS_STATION_COUNT,
  CAMPUS_STATION_IDS,
  CAMPUS_STATIONS,
  planCampusStationAdd,
} from './campus-stations.js';

const MINUTE = 60_000;
/** Age must be at least this much newer than intended before failing (clock/skew slack). */
const AGE_SLACK_MS = 5_000;

const stationById = new Map(
  CAMPUS_STATIONS.map((station) => [station.stationId, station]),
);
const mockByDevice = new Map(CAMPUS_MOCK_STATE.map((mock) => [mock.deviceId, mock]));

/** Build the exact document for a planned container. */
function containerDocument(assignment, now) {
  const station = stationById.get(assignment.stationId);
  const mock = mockByDevice.get(assignment.deviceId);
  if (!mock) {
    throw new Error(`Container ${assignment.deviceId} has no demo fill/sync state.`);
  }

  return {
    deviceId: assignment.deviceId,
    name: assignment.name,
    stationId: assignment.stationId,
    wasteType: assignment.wasteType,
    location: {
      building: station.location.building,
      lat: station.location.lat,
      lng: station.location.lng,
    },
    fillLevel: mock.fillLevel,
    status: fillStatusForLevel(mock.fillLevel),
    lastSyncAt: new Date(now.getTime() - mock.minutesAgo * MINUTE),
  };
}

/**
 * Create the missing stations/containers with their initial demo live state.
 * Throws before writing anything when the fixture is malformed or an existing
 * record conflicts with it. Existing stations/containers are never touched —
 * use `applyCampusMockState` to re-stamp the demo state instead.
 */
export async function applyCampusStations({ now = new Date(), log = () => {} } = {}) {
  const [existingStations, existingBins] = await Promise.all([
    Station.find({ stationId: { $in: CAMPUS_STATION_IDS } }).lean(),
    Bin.find(
      { deviceId: { $in: CAMPUS_DEVICE_IDS } },
      'deviceId stationId wasteType',
    ).lean(),
  ]);

  const plan = planCampusStationAdd({ existingStations, existingBins });
  if (!plan.ok) {
    throw new Error(
      `Campus station plan has conflicts:\n${plan.conflicts
        .map((problem) => `  - ${problem}`)
        .join('\n')}`,
    );
  }

  for (const station of plan.createStations) {
    await Station.create({
      stationId: station.stationId,
      name: station.name,
      location: station.location,
    });
    log(
      `created station ${station.stationId.padEnd(14)} ${station.name} @ ` +
        `${station.location.lat},${station.location.lng}`,
    );
  }

  for (const stationId of plan.skipStations) {
    log(`station ${stationId.padEnd(14)} already matches — skipped`);
  }

  for (const assignment of plan.createBins) {
    const document = containerDocument(assignment, now);
    await Bin.create(document);
    log(
      `created container ${assignment.deviceId.padEnd(14)} ` +
        `${assignment.stationId}/${assignment.wasteType} ` +
        `fill=${document.fillLevel}% ${mockByDevice.get(assignment.deviceId).minutesAgo}m ago`,
    );
  }

  for (const deviceId of plan.skipBins) {
    log(`container ${deviceId.padEnd(14)} already matches — skipped`);
  }

  return {
    createdStations: plan.createStations.map((station) => station.stationId),
    skippedStations: plan.skipStations,
    createdBins: plan.createBins.map((assignment) => assignment.deviceId),
    skippedBins: plan.skipBins,
  };
}

/**
 * Re-stamp the demo live state of the twelve containers: fill level, derived
 * status and `lastSyncAt` relative to `now`. Scoped strictly to the twelve
 * device ids and those three fields — never station/material metadata, never
 * the two original demo bins, never users, scans or students. All twelve
 * containers must already exist (the add path creates them).
 */
export async function applyCampusMockState({ now = new Date(), log = () => {} } = {}) {
  const existing = await Bin.find(
    { deviceId: { $in: CAMPUS_DEVICE_IDS } },
    'deviceId',
  ).lean();
  const existingIds = new Set(existing.map((bin) => bin.deviceId));

  for (const mock of CAMPUS_MOCK_STATE) {
    if (!existingIds.has(mock.deviceId)) {
      throw new Error(
        `Container ${mock.deviceId} is missing; run the station add first ` +
          'before stamping demo state.',
      );
    }
  }

  for (const mock of CAMPUS_MOCK_STATE) {
    await Bin.updateOne(
      { deviceId: mock.deviceId },
      {
        $set: {
          fillLevel: mock.fillLevel,
          status: fillStatusForLevel(mock.fillLevel),
          lastSyncAt: new Date(now.getTime() - mock.minutesAgo * MINUTE),
        },
      },
    );
    log(
      `stamped ${mock.deviceId.padEnd(14)} fill=${mock.fillLevel}% ` +
        `· last sync ${mock.minutesAgo}m ago (demo data)`,
    );
  }

  return { stamped: CAMPUS_MOCK_STATE.map((mock) => mock.deviceId) };
}

/** Read the approved slice back in the shape the API's station DTOs use. */
export async function readCampusStations() {
  const [stations, bins] = await Promise.all([
    Station.find({ stationId: { $in: CAMPUS_STATION_IDS } })
      .sort({ stationId: 1 })
      .lean(),
    Bin.find({ deviceId: { $in: CAMPUS_DEVICE_IDS } })
      .sort({ deviceId: 1 })
      .lean(),
  ]);

  const groups = groupBinsByStation(bins);
  const dtos = stations.map((station) =>
    toStationDto(station, groups.get(station.stationId) ?? []),
  );

  return { stations, bins, dtos };
}

/**
 * Verify the four approved stations: exactly three containers each, valid
 * integrity, and every container carrying its fixture demo live state — the
 * exact fill level, the derived status, and a `lastSyncAt` at least the
 * intended age old (fresh stamps match exactly; an older stamp still passes so
 * a re-check against a lived-on database does not false-alarm).
 */
export async function checkCampusStations({ now = new Date() } = {}) {
  const { stations, bins, dtos } = await readCampusStations();
  const problems = [];
  const binByDevice = new Map(bins.map((bin) => [bin.deviceId, bin]));

  if (stations.length !== CAMPUS_STATION_COUNT) {
    problems.push(
      `expected ${CAMPUS_STATION_COUNT} added stations, found ${stations.length}`,
    );
  }
  if (bins.length !== CAMPUS_BIN_COUNT) {
    problems.push(`expected ${CAMPUS_BIN_COUNT} added containers, found ${bins.length}`);
  }

  for (const dto of dtos) {
    if (!dto.integrity.valid) {
      problems.push(
        `${dto.stationId} integrity invalid: ${dto.integrity.issues
          .map((issue) => issue.code)
          .join(', ')}`,
      );
    }
    if (dto.containers.length !== 3) {
      problems.push(`${dto.stationId} has ${dto.containers.length} containers, expected 3`);
    }
  }

  for (const mock of CAMPUS_MOCK_STATE) {
    const bin = binByDevice.get(mock.deviceId);

    if (!bin) {
      problems.push(`${mock.deviceId} is missing from the four approved stations`);
      continue;
    }

    if (bin.fillLevel !== mock.fillLevel) {
      problems.push(`${mock.deviceId} fill ${bin.fillLevel} ≠ demo ${mock.fillLevel}`);
    }
    if (bin.status !== fillStatusForLevel(mock.fillLevel)) {
      problems.push(
        `${mock.deviceId} status ${bin.status} ≠ derived ${fillStatusForLevel(mock.fillLevel)}`,
      );
    }
    const lastSyncAt = bin.lastSyncAt ? new Date(bin.lastSyncAt) : null;
    if (!lastSyncAt || Number.isNaN(lastSyncAt.getTime())) {
      problems.push(`${mock.deviceId} has no demo lastSyncAt`);
      continue;
    }
    const age = now.getTime() - lastSyncAt.getTime();
    if (age < mock.minutesAgo * MINUTE - AGE_SLACK_MS) {
      problems.push(
        `${mock.deviceId} lastSyncAt is newer than the intended ${mock.minutesAgo}m age`,
      );
    }
  }

  return { ok: problems.length === 0, problems, stations, bins, dtos };
}
