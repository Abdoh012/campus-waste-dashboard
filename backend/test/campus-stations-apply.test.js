/**
 * Integration test for adding and verifying the four approved campus stations.
 *
 * Runs against a real local MongoDB, which is dropped afterwards. It uses its
 * own database (`campus_waste_stations_test`) so it never races the API or
 * demo-history suites. If MongoDB is unreachable the suite skips with an
 * explanation.
 *
 * Safety: this calls `dropDatabase()`, so the derived URI is validated before
 * connecting (see `src/lib/db-target.js`).
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { assertSafeTestTarget } from '../src/lib/db-target.js';
import { Bin } from '../src/models/Bin.js';
import { Station } from '../src/models/Station.js';
import { fillStatusForLevel } from '../src/lib/stations.js';
import { seedDemoData } from '../scripts/seed.js';
import {
  CAMPUS_BIN_ASSIGNMENTS,
  CAMPUS_DEVICE_IDS,
  CAMPUS_MOCK_STATE,
  CAMPUS_STATION_IDS,
} from '../scripts/campus-stations.js';
import {
  applyCampusMockState,
  applyCampusStations,
  checkCampusStations,
} from '../scripts/campus-stations-apply.js';

const baseTestUri =
  process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/campus_waste_test';

/** Keep the configured host/credentials but force a test-private database name. */
function withStationsTestDatabase(uri) {
  try {
    const parsed = new URL(uri);
    parsed.pathname = '/campus_waste_stations_test';
    return parsed.toString();
  } catch {
    return 'mongodb://127.0.0.1:27017/campus_waste_stations_test';
  }
}

const TEST_MONGODB_URI = withStationsTestDatabase(baseTestUri);

assertSafeTestTarget({
  uri: TEST_MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
  scriptName: 'campus stations integration test (TEST_MONGODB_URI)',
});

let connected = true;
try {
  await mongoose.connect(TEST_MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
} catch {
  connected = false;
}

const skip = connected
  ? false
  : `MongoDB not reachable at ${TEST_MONGODB_URI} — start mongod (or set TEST_MONGODB_URI) to run these tests`;

const quiet = () => {};

/** One fixed clock for creation and verification, so timestamps compare exactly. */
const NOW = new Date('2026-10-20T09:00:00.000Z');
const MINUTE = 60_000;
const mockByDevice = new Map(CAMPUS_MOCK_STATE.map((mock) => [mock.deviceId, mock]));

describe('approved campus station apply + verify', { skip }, () => {
  before(async () => {
    await mongoose.connection.dropDatabase();
    // Reuse the local seed path, then remove the four new stations/containers
    // so this suite starts from the real pre-add layout (two stations, six bins).
    await seedDemoData({ log: quiet });
    await Station.deleteMany({ stationId: { $in: CAMPUS_STATION_IDS } });
    await Bin.deleteMany({ deviceId: { $in: CAMPUS_DEVICE_IDS } });
  });

  after(async () => {
    if (!connected) return;
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('starts from the two existing demo stations and six containers', async () => {
    assert.equal(await Station.countDocuments({}), 2);
    assert.equal(await Bin.countDocuments({}), 6);
  });

  it('creates four stations and twelve containers with demo live state', async () => {
    const applied = await applyCampusStations({ now: NOW, log: quiet });

    assert.deepEqual(applied.createdStations, CAMPUS_STATION_IDS);
    assert.equal(applied.createdBins.length, 12);
    assert.deepEqual(applied.skippedStations, []);
    assert.deepEqual(applied.skippedBins, []);

    const check = await checkCampusStations({ now: NOW });
    assert.deepEqual(check.problems, []);
    assert.equal(check.ok, true);
    assert.equal(check.stations.length, 4);
    assert.equal(check.bins.length, 12);

    assert.equal(await Station.countDocuments({}), 6);
    assert.equal(await Bin.countDocuments({}), 18);

    for (const assignment of CAMPUS_BIN_ASSIGNMENTS) {
      const bin = await Bin.findOne({ deviceId: assignment.deviceId }).lean();
      const station = await Station.findOne({ stationId: assignment.stationId }).lean();
      const mock = mockByDevice.get(assignment.deviceId);

      assert.ok(bin, `${assignment.deviceId} exists`);
      assert.equal(bin.stationId, assignment.stationId);
      assert.equal(bin.wasteType, assignment.wasteType);

      // Demo live state, stamped against the test clock.
      assert.equal(bin.fillLevel, mock.fillLevel);
      assert.equal(bin.status, fillStatusForLevel(mock.fillLevel));
      assert.equal(
        bin.lastSyncAt.getTime(),
        NOW.getTime() - mock.minutesAgo * MINUTE,
        `${assignment.deviceId} lastSyncAt is exactly ${mock.minutesAgo}m before the clock`,
      );

      // The station owns the authoritative location; the container mirrors it.
      assert.equal(bin.location.building, station.location.building);
      assert.equal(bin.location.lat, station.location.lat);
      assert.equal(bin.location.lng, station.location.lng);
    }
  });

  it('is idempotent: a second run creates nothing and verifies cleanly', async () => {
    const second = await applyCampusStations({ now: NOW, log: quiet });

    assert.deepEqual(second.createdStations, []);
    assert.deepEqual(second.createdBins, []);
    assert.equal(second.skippedStations.length, 4);
    assert.equal(second.skippedBins.length, 12);

    const binAfterSecondRun = await Bin.findOne({ deviceId: 'ESP32-BIN-07' }).lean();
    assert.equal(binAfterSecondRun.fillLevel, mockByDevice.get('ESP32-BIN-07').fillLevel);

    const check = await checkCampusStations({ now: NOW });
    assert.deepEqual(check.problems, []);
    assert.equal(check.ok, true);
    assert.equal(await Station.countDocuments({}), 6);
    assert.equal(await Bin.countDocuments({}), 18);
  });

  it('applyCampusMockState re-stamps only the three live-state fields', async () => {
    const later = new Date(NOW.getTime() + 30 * MINUTE);
    const refreshed = await applyCampusMockState({ now: later, log: quiet });

    assert.equal(refreshed.stamped.length, 12);

    for (const mock of CAMPUS_MOCK_STATE) {
      const bin = await Bin.findOne({ deviceId: mock.deviceId }).lean();
      assert.equal(bin.fillLevel, mock.fillLevel, `${mock.deviceId} keeps its demo fill`);
      assert.equal(bin.status, fillStatusForLevel(mock.fillLevel));
      assert.equal(
        bin.lastSyncAt.getTime(),
        later.getTime() - mock.minutesAgo * MINUTE,
        `${mock.deviceId} re-stamped against the later clock`,
      );
      // Station/material metadata must be untouched by the refresh.
      assert.equal(bin.stationId, assignmentStation(mock.deviceId));
    }

    const check = await checkCampusStations({ now: later });
    assert.deepEqual(check.problems, []);
    assert.equal(check.ok, true);
  });

  it('refuses to stamp demo state when a container is missing', async () => {
    const later = new Date(NOW.getTime() + 30 * MINUTE);
    await Bin.deleteOne({ deviceId: 'ESP32-BIN-18' });

    await assert.rejects(
      () => applyCampusMockState({ now: NOW, log: quiet }),
      /ESP32-BIN-18 is missing/,
    );

    await Bin.create({
      deviceId: 'ESP32-BIN-18',
      name: 'Workshops Liquids Bin',
      stationId: 'STN-WORKSHOPS',
      wasteType: 'liquids',
      location: { building: 'Workshops & Laboratories', lat: 30.857362, lng: 29.572167 },
      fillLevel: 93,
      status: 'critical',
      lastSyncAt: new Date(NOW.getTime() - 97 * MINUTE),
    });

    const check = await checkCampusStations({ now: later });
    assert.deepEqual(check.problems, []);
    assert.equal(check.ok, true);
  });

  it('refuses to overwrite an existing station with different metadata', async () => {
    await Station.updateOne(
      { stationId: 'STN-SOUTH' },
      { $set: { name: 'Changed by someone else' } },
    );

    await assert.rejects(
      () => applyCampusStations({ now: NOW, log: quiet }),
      /Campus station plan has conflicts/,
    );

    const station = await Station.findOne({ stationId: 'STN-SOUTH' }).lean();
    assert.equal(station.name, 'Changed by someone else');
  });
});

/** The station id the fixture assigns to a device id. */
function assignmentStation(deviceId) {
  return CAMPUS_BIN_ASSIGNMENTS.find((assignment) => assignment.deviceId === deviceId).stationId;
}
