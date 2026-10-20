/**
 * Integration test for applying and verifying the rich demo dataset.
 *
 * Runs against a real local MongoDB, which is dropped afterwards. It always uses
 * its own database (`campus_waste_demo_test`) derived from the host in
 * `TEST_MONGODB_URI`, so it never races the API test suite for the same DB. If
 * MongoDB is unreachable the suite skips with an explanation.
 *
 * Safety: this calls `dropDatabase()`, so the derived URI is validated before
 * connecting (see `src/lib/db-target.js`). A mistyped URI fails closed.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { assertSafeTestTarget } from '../src/lib/db-target.js';
import { Bin } from '../src/models/Bin.js';
import { Station } from '../src/models/Station.js';
import { seedDemoData } from '../scripts/seed.js';
import { applyDemoHistory, checkDemoHistory } from '../scripts/demo-history-apply.js';

const baseTestUri =
  process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/campus_waste_test';

/** Keep the configured host/credentials but force a test-private database name. */
function withDemoTestDatabase(uri) {
  try {
    const parsed = new URL(uri);
    parsed.pathname = '/campus_waste_demo_test';
    return parsed.toString();
  } catch {
    return 'mongodb://127.0.0.1:27017/campus_waste_demo_test';
  }
}

const TEST_MONGODB_URI = withDemoTestDatabase(baseTestUri);

assertSafeTestTarget({
  uri: TEST_MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
  scriptName: 'demo-history integration test (TEST_MONGODB_URI)',
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

const NOW = new Date('2026-10-19T20:24:00.000Z');
const quiet = () => {};

describe('demo history apply + verify', { skip }, () => {
  before(async () => {
    await mongoose.connection.dropDatabase();
    // Reuse the real seed path so the two history demo stations and six bins
    // exist. It also creates the four approved campus stations, which are
    // outside this suite's synthetic history slice.
    await seedDemoData({ log: quiet });
  });

  after(async () => {
    if (!connected) return;
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('lands every documented aggregate in the database', async () => {
    await applyDemoHistory({ now: NOW, log: quiet });

    const check = await checkDemoHistory({ now: NOW });
    assert.deepEqual(check.problems, []);
    assert.equal(check.ok, true);

    assert.equal(check.actual.scanEventCount, 150);
    assert.equal(check.actual.points.totalPoints, 29);
    assert.equal(check.actual.points.studentCount, 5);
    assert.equal(check.actual.fill7.length, 7);
    assert.equal(check.actual.fill30.length, 30);
    assert.equal(check.actual.points7.length, 7);
  });

  it('is idempotent: re-running leaves the data unchanged', async () => {
    await applyDemoHistory({ now: NOW, log: quiet });
    const first = await checkDemoHistory({ now: NOW });

    await applyDemoHistory({ now: NOW, log: quiet });
    const second = await checkDemoHistory({ now: NOW });

    assert.deepEqual(second.actual, first.actual);
    assert.equal(second.ok, true);
  });

  it('verifies only the synthetic history slice, not additional fleet stations', async () => {
    await Station.create({
      stationId: 'STN-EXTRA',
      name: 'Extra test station',
      location: { building: 'Extra', lat: 30.858, lng: 29.5715 },
    });
    await Bin.create({
      deviceId: 'EXTRA-BIN-01',
      name: 'Extra test bin',
      stationId: 'STN-EXTRA',
      wasteType: 'paper',
      fillLevel: 42,
      status: 'healthy',
      lastSyncAt: new Date(NOW),
    });

    await applyDemoHistory({ now: NOW, log: quiet });
    const check = await checkDemoHistory({ now: NOW });

    assert.deepEqual(check.problems, []);
    assert.equal(check.ok, true);
    assert.equal(check.actual.stations.total, 2);
    assert.equal(check.actual.containers.total, 6);
  });
});
