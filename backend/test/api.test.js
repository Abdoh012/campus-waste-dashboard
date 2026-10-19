/**
 * Integration tests for the API contract the frontend consumes.
 *
 * Runs against a real MongoDB: `TEST_MONGODB_URI` (default
 * mongodb://127.0.0.1:27017/campus_waste_test — a dedicated database that is
 * dropped afterwards). If MongoDB is unreachable the whole suite skips with
 * an explanation rather than failing.
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
import { User } from '../src/models/User.js';
import { Bin } from '../src/models/Bin.js';

const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/campus_waste_test';

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
  'deviceId',
  'fillLevel',
  'lastSyncAt',
  'location',
  'name',
  'status',
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

  async function resetBins() {
    await Bin.deleteMany({});
    await Bin.insertMany(BIN_FIXTURES.map((bin) => ({ ...bin })));
  }

  before(async () => {
    await User.deleteMany({ email: ADMIN.email });
    await User.create({
      email: ADMIN.email,
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
    });
    await resetBins();

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

  beforeEach(resetBins);

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

  /* --------------------------------------------------------- device ingest */

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
