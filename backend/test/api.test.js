/**
 * Integration tests for the API contract the frontend consumes.
 *
 * Runs against a real MongoDB: `TEST_MONGODB_URI` (default
 * mongodb://127.0.0.1:27017/campus_waste_test — a dedicated database that is
 * dropped afterwards). If MongoDB is unreachable the whole suite skips with
 * an explanation rather than failing.
 *
 * Safety: these tests call `dropDatabase()`, so `TEST_MONGODB_URI` is validated
 * *before* connecting. If it does not name a single local database ending in
 * `_test`/`_tests`, the suite fails closed instead of dropping data — a mistyped
 * URI must never reach the application's own `campus_waste` database. See
 * `src/lib/db-target.js`.
 *
 *   npm test
 */

import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/env.js';
import { assertSafeTestTarget } from '../src/lib/db-target.js';
import { User } from '../src/models/User.js';
import { Bin } from '../src/models/Bin.js';
import { Station } from '../src/models/Station.js';
import { Student } from '../src/models/Student.js';
import { ScanEvent } from '../src/models/ScanEvent.js';

const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/campus_waste_test';

// Fail closed: a bad TEST_MONGODB_URI stops the suite before any connection or
// dropDatabase call, rather than silently pointing destructive tests elsewhere.
assertSafeTestTarget({
  uri: TEST_MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
  scriptName: 'backend integration tests (TEST_MONGODB_URI)',
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

const ADMIN = { email: 'test-admin@campus.test', password: 's3cret-pass' };

/** Three devices: fresh healthy, fresh critical, and a silent one (stale). */
const BIN_FIXTURES = [
  {
    deviceId: 'TEST-BIN-01',
    name: 'Test North Gate',
    wasteType: 'paper',
    location: { building: 'North Gate', lat: 30.8574, lng: 29.57024 },
    fillLevel: 18,
    status: 'healthy',
    lastSyncAt: new Date(Date.now() - 60_000),
  },
  {
    deviceId: 'TEST-BIN-02',
    name: 'Test Student Union',
    location: { building: 'Student Union', lat: 30.8574, lng: 29.57264 },
    fillLevel: 87,
    status: 'critical',
    lastSyncAt: new Date(Date.now() - 30_000),
  },
  {
    deviceId: 'TEST-BIN-03',
    name: 'Test Library',
    location: { building: 'Library', lat: 30.8592, lng: 29.57264 },
    fillLevel: 54,
    // Stored as attention, but 10 minutes silent with a 5-minute threshold:
    // GET must report it offline.
    status: 'attention',
    lastSyncAt: new Date(Date.now() - 10 * 60_000),
  },
];

const LIST_FIELDS = [
  '_id',
  'connectivity',
  'deviceId',
  'fillLevel',
  'fillStatus',
  'isStale',
  'lastKnown',
  'lastSyncAt',
  'location',
  'name',
  'stationId',
  'status',
  'wasteType',
].sort();

const STATION_FIXTURES = [
  {
    stationId: 'STN-NORTH',
    name: 'North Gate (test)',
    location: { building: 'North Gate', lat: 30.8574, lng: 29.57024 },
  },
  {
    stationId: 'STN-LIBRARY',
    name: 'Library (test)',
    location: { building: 'Library', lat: 30.8592, lng: 29.57264 },
  },
];

/** Two stations × three containers; synthetic identifiers, not real hardware. */
const STATION_CONTAINER_FIXTURES = [
  {
    deviceId: 'ESP32-A1',
    name: 'A1',
    stationId: 'STN-NORTH',
    wasteType: 'paper',
    fillLevel: 18,
    status: 'healthy',
    lastSyncAt: new Date(Date.now() - 60_000),
  },
  {
    deviceId: 'ESP32-A2',
    name: 'A2',
    stationId: 'STN-NORTH',
    wasteType: 'plastic',
    fillLevel: 62,
    status: 'attention',
    lastSyncAt: new Date(Date.now() - 60_000),
  },
  {
    deviceId: 'ESP32-A3',
    name: 'A3',
    stationId: 'STN-NORTH',
    wasteType: 'liquids',
    fillLevel: 47,
    status: 'healthy',
    lastSyncAt: new Date(Date.now() - 120_000),
  },
  {
    deviceId: 'ESP32-B1',
    name: 'B1',
    stationId: 'STN-LIBRARY',
    wasteType: 'paper',
    fillLevel: 88,
    status: 'critical',
    lastSyncAt: new Date(Date.now() - 30 * 60_000),
  },
  {
    deviceId: 'ESP32-B2',
    name: 'B2',
    stationId: 'STN-LIBRARY',
    wasteType: 'plastic',
    fillLevel: null,
    status: 'healthy',
    lastSyncAt: null,
  },
  {
    deviceId: 'ESP32-B3',
    name: 'B3',
    stationId: 'STN-LIBRARY',
    wasteType: 'liquids',
    fillLevel: 30,
    status: 'healthy',
    lastSyncAt: new Date(Date.now() - 60_000),
  },
];

describe('Think Outside The Box API', { skip }, () => {
  let server;
  let baseUrl;
  let token;

  async function call(path, { method = 'GET', body, token: bearer, headers = {} } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    if (response.headers.get('content-length') !== '0') {
      data = await response.json().catch(() => null);
    }
    return { status: response.status, data, headers: response.headers };
  }

  async function resetData() {
    await Promise.all([
      Bin.deleteMany({}),
      Station.deleteMany({}),
      Student.deleteMany({}),
      ScanEvent.deleteMany({}),
    ]);
    await Bin.insertMany(BIN_FIXTURES.map((bin) => ({ ...bin })));
  }

  /** Isolated station fixtures for station/KPI/history tests. */
  async function resetStationFixtures() {
    await Promise.all([
      Bin.deleteMany({}),
      Station.deleteMany({}),
      Student.deleteMany({}),
      ScanEvent.deleteMany({}),
    ]);
    await Station.insertMany(STATION_FIXTURES.map((station) => ({ ...station })));
    await Bin.insertMany(STATION_CONTAINER_FIXTURES.map((bin) => ({ ...bin })));
  }

  before(async () => {
    await User.deleteMany({ email: ADMIN.email });
    await User.create({
      email: ADMIN.email,
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
    });
    await resetData();

    const app = createApp();
    await new Promise((resolve, reject) => {
      server = app.listen(0, '127.0.0.1', resolve);
      server.once('error', reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}/api`;

    const login = await call('/auth/login', { method: 'POST', body: ADMIN });
    assert.equal(login.status, 200, 'fixture admin must be able to log in');
    token = login.data.token;
  });

  beforeEach(resetData);

  after(async () => {
    if (!connected) return;
    try {
      if (server) {
        // close() alone waits forever on fetch's keep-alive sockets.
        await new Promise((resolve) => {
          server.close(resolve);
          server.closeAllConnections?.();
        });
      }
      await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });

  /* ----------------------------------------------------------- liveness */

  it('GET /api/health responds without a token', async () => {
    const { status, data } = await call('/health');
    assert.equal(status, 200);
    assert.equal(data.status, 'ok');
  });

  /* ---------------------------------------------------------------- auth */

  it('POST /api/auth/login rejects missing fields with 400', async () => {
    const { status, data } = await call('/auth/login', { method: 'POST', body: {} });
    assert.equal(status, 400);
    assert.deepEqual(data, { message: 'Email and password are required' });
  });

  it('POST /api/auth/login answers 401 identically for unknown email and wrong password', async () => {
    const unknown = await call('/auth/login', {
      method: 'POST',
      body: { email: 'nobody@campus.test', password: 'whatever' },
    });
    const wrongPassword = await call('/auth/login', {
      method: 'POST',
      body: { email: ADMIN.email, password: 'wrong' },
    });
    assert.equal(unknown.status, 401);
    assert.equal(wrongPassword.status, 401);
    assert.deepEqual(unknown.data, { message: 'Invalid email or password' });
    assert.deepEqual(wrongPassword.data, { message: 'Invalid email or password' });
  });

  it('POST /api/auth/login returns { token, user } and the token verifies', async () => {
    const { status, data } = await call('/auth/login', { method: 'POST', body: ADMIN });
    assert.equal(status, 200);
    assert.deepEqual(Object.keys(data).sort(), ['token', 'user']);
    assert.deepEqual(Object.keys(data.user).sort(), ['_id', 'email']);
    assert.equal(data.user.email, ADMIN.email);

    const payload = jwt.verify(data.token, env.JWT_SECRET);
    assert.equal(payload.sub, data.user._id);
  });

  /* ------------------------------------------------------------ bins read */

  it('GET /api/bins requires a valid bearer token', async () => {
    const anonymous = await call('/bins');
    assert.equal(anonymous.status, 401);
    assert.equal(typeof anonymous.data.message, 'string');

    const forged = await call('/bins', { token: 'not.a.jwt' });
    assert.equal(forged.status, 401);
  });

  it('GET /api/bins returns exactly the documented array shape', async () => {
    const { status, data } = await call('/bins', { token });
    assert.equal(status, 200);
    assert.ok(Array.isArray(data));
    assert.equal(data.length, BIN_FIXTURES.length);

    for (const bin of data) {
      assert.deepEqual(Object.keys(bin).sort(), LIST_FIELDS);
      assert.deepEqual(Object.keys(bin.location).sort(), ['building', 'lat', 'lng']);
      assert.equal(typeof bin._id, 'string');
      assert.match(bin.lastSyncAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
      assert.ok(['healthy', 'attention', 'critical', 'offline'].includes(bin.status));
      assert.ok(
        bin.wasteType === null ||
          ['paper', 'plastic', 'liquids'].includes(bin.wasteType),
      );
    }
  });

  it('GET /api/bins reports silent devices offline while fresh ones keep their status', async () => {
    const { data } = await call('/bins', { token });
    const byDevice = Object.fromEntries(data.map((bin) => [bin.deviceId, bin]));

    assert.equal(byDevice['TEST-BIN-01'].status, 'healthy');
    assert.equal(byDevice['TEST-BIN-02'].status, 'critical');
    // Stored "attention" but 10 minutes silent → offline override.
    assert.equal(byDevice['TEST-BIN-03'].status, 'offline');
  });

  it('GET /api/bins/:id adds createdAt/updatedAt and 404s for unknown or malformed ids', async () => {
    const list = await call('/bins', { token });
    const { data: detail } = await call(`/bins/${list.data[0]._id}`, { token });
    assert.deepEqual(
      Object.keys(detail).sort(),
      [...LIST_FIELDS, 'createdAt', 'updatedAt'].sort(),
    );

    const missing = await call(`/bins/${new mongoose.Types.ObjectId()}`, { token });
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.data, { message: 'Bin not found' });

    const malformed = await call('/bins/not-an-object-id', { token });
    assert.equal(malformed.status, 404);
    assert.deepEqual(malformed.data, { message: 'Bin not found' });
  });

  /* ------------------------------------------------------- stations read */

  it('GET /api/stations returns one entry per station with three containers', async () => {
    await resetStationFixtures();

    const { status, data } = await call('/stations', { token });
    assert.equal(status, 200);
    assert.equal(data.length, 2);

    const north = data.find((station) => station.stationId === 'STN-NORTH');
    const library = data.find((station) => station.stationId === 'STN-LIBRARY');
    assert.ok(north && library);
    assert.equal(north.containers.length, 3);
    assert.equal(library.containers.length, 3);
    assert.deepEqual(Object.keys(library.location).sort(), ['building', 'lat', 'lng']);

    // Station severity is the highest container severity, independent of
    // connectivity; an offline critical reading stays critical.
    assert.equal(north.severity, 'attention');
    assert.equal(north.connectivity, 'online');
    assert.equal(north.integrity.valid, true);
    assert.equal(library.severity, 'critical');
    assert.equal(library.connectivity, 'partial');

    const b1 = library.containers.find((c) => c.deviceId === 'ESP32-B1');
    assert.equal(b1.fillStatus, 'critical');
    assert.equal(b1.connectivity, 'offline');
    assert.equal(b1.lastKnown, true);
    assert.equal(b1.isStale, true);

    const b2 = library.containers.find((c) => c.deviceId === 'ESP32-B2');
    assert.equal(b2.fillLevel, null);
    assert.equal(b2.fillStatus, 'unknown');
    assert.equal(b2.connectivity, 'never-connected');
    assert.equal(b2.lastKnown, false);

    // Each station exposes exactly one paper, plastic and liquids container.
    assert.deepEqual(
      north.containers.map((c) => c.wasteType).sort(),
      ['liquids', 'paper', 'plastic'],
    );
    assert.deepEqual(
      library.containers.map((c) => c.wasteType).sort(),
      ['liquids', 'paper', 'plastic'],
    );
  });

  it('GET /api/stats separates station counts from container fill and connectivity', async () => {
    await resetStationFixtures();

    const { status, data } = await call('/stats', { token });
    assert.equal(status, 200);
    assert.deepEqual(data.stations, {
      total: 2,
      valid: 2,
      incomplete: 0,
      healthy: 0,
      attention: 1,
      critical: 1,
      unknown: 0,
      online: 1,
      partial: 1,
      offline: 0,
      fullyConnectedPct: 50,
    });
    assert.deepEqual(data.containers, {
      total: 6,
      healthy: 3,
      attention: 1,
      critical: 1,
      unknown: 1,
      online: 4,
      offline: 1,
      neverConnected: 1,
      unassigned: 0,
      orphaned: 0,
      onlinePct: 66.7,
      averageFill: 49,
    });
  });

  it('reports incomplete stations explicitly instead of accepting them as valid', async () => {
    await Bin.deleteMany({});
    await Station.deleteMany({});
    await Station.create({
      stationId: 'STN-PARTIAL',
      name: 'Partial (test)',
      location: { building: 'X', lat: 30.8583, lng: 29.57144 },
    });
    await Bin.create({
      deviceId: 'ESP32-PARTIAL-1',
      name: 'P1',
      stationId: 'STN-PARTIAL',
      fillLevel: 10,
      status: 'healthy',
      lastSyncAt: new Date(),
    });

    const stations = await call('/stations', { token });
    const partial = stations.data.find((s) => s.stationId === 'STN-PARTIAL');
    assert.equal(partial.integrity.valid, false);
    assert.equal(partial.integrity.actual, 1);
    assert.equal(partial.integrity.expected, 3);

    const stats = await call('/stats', { token });
    assert.equal(stats.data.stations.total, 1);
    assert.equal(stats.data.stations.valid, 0);
    assert.equal(stats.data.stations.incomplete, 1);
  });

  it('GET /api/stations requires a bearer token', async () => {
    const anonymous = await call('/stations');
    assert.equal(anonymous.status, 401);
  });

  /* --------------------------------------------------------- device ingest */

  it('ingest preserves the container station association and rejects unknown stations', async () => {
    await resetStationFixtures();

    const capturedAt = new Date(Date.now() - 60_000).toISOString();
    const ok = await call('/bins/ESP32-A1/status', {
      method: 'PUT',
      body: { fillLevel: 80, capturedAt, studentId: 'STU-STATION' },
    });
    assert.equal(ok.status, 200);

    const stored = await Bin.findOne({ deviceId: 'ESP32-A1' }).lean();
    assert.equal(stored.stationId, 'STN-NORTH');

    // A broken association refuses the write instead of silently persisting.
    await Bin.updateOne({ deviceId: 'ESP32-A1' }, { $set: { stationId: 'STN-MISSING' } });
    const broken = await call('/bins/ESP32-A1/status', {
      method: 'PUT',
      body: { fillLevel: 10 },
    });
    assert.equal(broken.status, 400);
    assert.match(broken.data.message, /unknown station/);
  });

  it('fill history and daily points still work with station-associated ingest', async () => {
    await resetStationFixtures();

    await call('/bins/ESP32-A1/status', {
      method: 'PUT',
      body: { fillLevel: 80, studentId: 'STU-HISTORY' },
    });

    const fill = await call('/stats/fill-history?period=last7', { token });
    assert.equal(fill.status, 200);
    assert.equal(fill.data.points.length, 1);
    assert.equal(fill.data.points[0].avgFillLevel, 80);

    const points = await call('/stats/points-daily?period=last7', { token });
    assert.equal(points.status, 200);
    assert.equal(points.data.points.length, 1);
    assert.equal(points.data.points[0].points, 1);

    const scan = await ScanEvent.findOne({ deviceId: 'ESP32-A1' }).lean();
    assert.equal(scan.stationId, 'STN-NORTH');
  });

  it('documents that repeated device messages are not deduplicated', async () => {
    await resetStationFixtures();

    // The current device contract has no event/message id, so the server cannot
    // distinguish a retry from a real second scan. This test pins the current
    // behaviour; it is NOT a claim that duplicate points are desirable.
    const capturedAt = new Date(Date.now() - 60_000).toISOString();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await call('/bins/ESP32-A1/status', {
        method: 'PUT',
        body: { fillLevel: 80, capturedAt, studentId: 'STU-DUPLICATE' },
      });
      assert.equal(response.status, 200);
    }

    const student = await Student.findOne({ studentId: 'STU-DUPLICATE' }).lean();
    assert.equal(student.points, 2);
    assert.equal(student.awards.length, 2);
    assert.equal(await ScanEvent.countDocuments({ deviceId: 'ESP32-A1' }), 2);
  });

  it('PUT /api/bins/:deviceId/status updates the bin and echoes { deviceId, fillLevel, status, lastSyncAt, pointsAwarded }', async () => {
    // Recent capture — an old capturedAt would (correctly) read offline.
    const capturedAt = new Date(Date.now() - 60_000).toISOString();
    const { status, data } = await call('/bins/TEST-BIN-01/status', {
      method: 'PUT',
      body: { fillLevel: 87, capturedAt },
    });

    assert.equal(status, 200);
    assert.deepEqual(Object.keys(data).sort(), ['deviceId', 'fillLevel', 'lastSyncAt', 'pointsAwarded', 'status']);
    assert.deepEqual(data, {
      deviceId: 'TEST-BIN-01',
      fillLevel: 87,
      status: 'critical',
      lastSyncAt: capturedAt,
      pointsAwarded: false,
    });

    // The dashboard sees the new reading straight away.
    const list = await call('/bins', { token });
    const updated = list.data.find((bin) => bin.deviceId === 'TEST-BIN-01');
    assert.equal(updated.fillLevel, 87);
    assert.equal(updated.status, 'critical');
    assert.equal(updated.lastSyncAt, capturedAt);
  });

  it('PUT /api/bins/:deviceId/status derives status at the 50 / 75 boundaries', async () => {
    const expectations = [
      [49, 'healthy'],
      [50, 'attention'],
      [74, 'attention'],
      [75, 'critical'],
    ];
    for (const [fillLevel, expected] of expectations) {
      const { status, data } = await call('/bins/TEST-BIN-01/status', {
        method: 'PUT',
        body: { fillLevel },
      });
      assert.equal(status, 200);
      assert.equal(data.status, expected, `fillLevel ${fillLevel}`);
      // lastSyncAt defaults to "now" when capturedAt is omitted.
      assert.ok(Date.now() - Date.parse(data.lastSyncAt) < 5_000);
    }
  });

  it('PUT /api/bins/:deviceId/status answers 404 for an unknown device', async () => {
    const { status, data } = await call('/bins/ESP32-NOPE/status', {
      method: 'PUT',
      body: { fillLevel: 40 },
    });
    assert.equal(status, 404);
    assert.deepEqual(data, { message: 'Device not found' });
  });

  it('PUT /api/bins/:deviceId/status validates fillLevel and capturedAt', async () => {
    const tooFull = await call('/bins/TEST-BIN-01/status', {
      method: 'PUT',
      body: { fillLevel: 150 },
    });
    assert.equal(tooFull.status, 400);
    assert.equal(tooFull.data.message, 'fillLevel must be a number between 0 and 100');

    const missing = await call('/bins/TEST-BIN-01/status', { method: 'PUT', body: {} });
    assert.equal(missing.status, 400);

    const badDate = await call('/bins/TEST-BIN-01/status', {
      method: 'PUT',
      body: { fillLevel: 40, capturedAt: 'yesterday-ish' },
    });
    assert.equal(badDate.status, 400);
    assert.equal(badDate.data.message, 'capturedAt must be a valid ISO date or epoch timestamp');
  });

  /* ----------------------------------------------------------------- CORS */

  it('answers a cross-origin preflight from the dashboard dev server', async () => {
    const response = await fetch(`${baseUrl}/bins`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });
    assert.ok([204, 200].includes(response.status));
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.match(response.headers.get('access-control-allow-headers') ?? '', /Authorization/i);
  });
});
