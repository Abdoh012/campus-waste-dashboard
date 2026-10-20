/**
 * Development seed — additive by default.
 *
 *   npm run seed             create the admin, the two synthetic-history demo
 *                            stations + six sample bins, and the four approved
 *                            campus stations + twelve bins stamped with demo
 *                            fill/sync data; never overwrite any record that
 *                            exists
 *   npm run seed -- --reset   first delete the six history demo bins (by
 *                            deviceId), then recreate them; no other bin is
 *                            ever touched
 *
 * Safety gate: the script refuses to run unless `MONGODB_URI` names a single
 * local (127.0.0.1 / localhost / ::1) development database and `NODE_ENV` is
 * not production-like. A missing NODE_ENV is not treated as proof of safety —
 * the URI host and database name are validated too (see src/lib/db-target.js).
 *
 * Preserving live data: existing Bin documents are left completely untouched
 * (fillLevel, lastSyncAt, status, location, name, stationId and wasteType all
 * keep their current values). An existing admin's password is never re-hashed
 * or reset. Students, points, awards and scan history are never modified.
 *
 * The sample bins are dev fixtures so the dashboard has something to render
 * before the physical ESP32s are registered: they cover all four read-time
 * statuses (healthy / attention / critical plus one deliberately stale device).
 *
 * The admin password comes from SEED_ADMIN_PASSWORD when the admin is first
 * created, or is generated here and printed once. It is never printed when it
 * came from the environment.
 */

import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/env.js';
import { User } from '../src/models/User.js';
import { Bin } from '../src/models/Bin.js';
import { Station } from '../src/models/Station.js';
import { statusForFillLevel } from '../src/lib/status.js';
import { assertSafeLocalDevelopmentTarget } from '../src/lib/db-target.js';
import {
  DEMO_BIN_STATION_MAP,
  DEMO_BIN_WASTE_TYPE_MAP,
  DEMO_STATIONS,
} from './demo-stations.js';
import { applyCampusStations, applyCampusMockState } from './campus-stations-apply.js';
import { demoDeviceIds, planSeedBins } from './seed-plan.js';

const MINUTE = 60_000;

/**
 * deviceId, position and a fill level per demo bin; `minutesAgo` ages lastSyncAt.
 *
 * DEMO positions: the six sample bins are placed on the Borg El Arab
 * Technological University (BATU) campus, using the same centre as the
 * dashboard map (`FrontEnd/src/features/dashboard/campusMapData.ts`:
 * `CAMPUS_CENTER = { lat: 30.8583, lng: 29.57144 }`). The offsets below are a
 * deterministic 3x2 grid roughly 100 m north/south and 115 m east/west of that
 * centre. They are approximate DEMO locations, not surveyed physical bin
 * installations; replace them with real device coordinates once available.
 */
const SAMPLE_BINS = [
  { deviceId: 'ESP32-BIN-01', name: 'North Gate Bin', building: 'North Gate', lat: 30.8574, lng: 29.57024, fillLevel: 18, minutesAgo: 2 },
  { deviceId: 'ESP32-BIN-02', name: 'Science Hall Bin', building: 'Science Hall', lat: 30.8574, lng: 29.57144, fillLevel: 54, minutesAgo: 1 },
  { deviceId: 'ESP32-BIN-03', name: 'Student Union Bin', building: 'Student Union', lat: 30.8574, lng: 29.57264, fillLevel: 87, minutesAgo: 1 },
  // Stale on purpose: older than OFFLINE_THRESHOLD_MINUTES → GET reports offline.
  { deviceId: 'ESP32-BIN-04', name: 'Arts Center Bin', building: 'Arts Center', lat: 30.8592, lng: 29.57024, fillLevel: 21, minutesAgo: 45 },
  { deviceId: 'ESP32-BIN-05', name: 'Rec Center Bin', building: 'Rec Center', lat: 30.8592, lng: 29.57144, fillLevel: 12, minutesAgo: 3 },
  { deviceId: 'ESP32-BIN-06', name: 'Library Bin', building: 'Library', lat: 30.8592, lng: 29.57264, fillLevel: 63, minutesAgo: 2 },
];

/**
 * Create the admin when absent; never modify an existing one. The password is
 * chosen at creation time only, so re-running the seed cannot silently reset a
 * working credential.
 *
 * `log` and `redactAdminEmail` let a caller (the one-off CAMPUS reset) reuse
 * this exact creation logic without printing the operator's email address.
 */
async function seedAdmin({ log = console.log, redactAdminEmail = false } = {}) {
  const email = env.SEED_ADMIN_EMAIL.trim().toLowerCase();
  const shownEmail = redactAdminEmail ? '(configured admin)' : email;
  const existing = await User.findOne({ email }).select('+passwordHash');

  if (existing) {
    log(`= Admin ${shownEmail} already exists — password left unchanged`);
    if (env.SEED_ADMIN_PASSWORD) {
      log('  (SEED_ADMIN_PASSWORD only applies when the admin is first created)');
    }
    return;
  }

  const generated = !env.SEED_ADMIN_PASSWORD;
  const password = env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  await User.create({ email, passwordHash: await bcrypt.hash(password, 10) });

  log(`✓ Admin created: ${shownEmail}`);
  if (generated) {
    log(`  password: ${password}`);
    log('  (generated — set SEED_ADMIN_PASSWORD in .env to choose your own)');
  } else {
    log('  password: (taken from SEED_ADMIN_PASSWORD, not printed)');
  }
}

/** Create the demo stations when absent; never overwrite existing metadata. */
async function seedStations({ log = console.log } = {}) {
  for (const station of DEMO_STATIONS) {
    const existing = await Station.findOne({ stationId: station.stationId }).lean();

    if (existing) {
      log(`= Station ${station.stationId.padEnd(12)} already exists — left unchanged`);
      continue;
    }

    await Station.create({
      stationId: station.stationId,
      name: station.name,
      location: station.location,
    });
    log(`✓ Station ${station.stationId.padEnd(12)} ${station.name}`);
  }
}

/**
 * Create missing demo bins. `--reset` first deletes only the six declared demo
 * device ids, and reports exactly what will be deleted before doing it; no
 * other bin is ever deleted.
 */
async function seedBins({ reset, log = console.log } = {}) {
  const deviceIds = demoDeviceIds(SAMPLE_BINS);

  if (reset) {
    const present = await Bin.countDocuments({ deviceId: { $in: deviceIds } });
    log('--reset is scoped to these demo device ids only:');
    log(`  ${deviceIds.join(', ')}`);
    log(`  ${present} matching demo bin(s) will be deleted, then recreated.`);
    const { deletedCount } = await Bin.deleteMany({ deviceId: { $in: deviceIds } });
    log(`✓ --reset: deleted ${deletedCount} demo bin(s); no other bin was touched.`);
    log('');
  }

  const existingBins = await Bin.find({ deviceId: { $in: deviceIds } }, 'deviceId').lean();
  const { create, skip } = planSeedBins({ existingBins, samples: SAMPLE_BINS });

  for (const deviceId of skip) {
    log(`= ${deviceId.padEnd(14)} already exists — left unchanged`);
  }

  for (const sample of create) {
    const status = statusForFillLevel(sample.fillLevel);
    const syncedAt = new Date(Date.now() - sample.minutesAgo * MINUTE);
    const stationId = DEMO_BIN_STATION_MAP[sample.deviceId];
    const wasteType = DEMO_BIN_WASTE_TYPE_MAP[sample.deviceId] ?? null;

    await Bin.create({
      deviceId: sample.deviceId,
      name: sample.name,
      ...(stationId ? { stationId } : {}),
      ...(wasteType ? { wasteType } : {}),
      location: { building: sample.building, lat: sample.lat, lng: sample.lng },
      fillLevel: sample.fillLevel,
      status,
      lastSyncAt: syncedAt,
    });

    const readsOffline = Date.now() - syncedAt.getTime() > env.OFFLINE_THRESHOLD_MINUTES * MINUTE;
    log(
      `✓ ${sample.deviceId.padEnd(14)} ${sample.building.padEnd(15)} type=${String(wasteType ?? '-').padEnd(7)} fill=${String(sample.fillLevel).padStart(3)}% status=${status} synced=${sample.minutesAgo}m ago${readsOffline ? ' → reads offline' : ''}`,
    );
  }
}

/**
 * Run the demo seed against the *current* mongoose connection, without
 * connecting or applying a target guard. Exported so the one-off CAMPUS reset
 * can reuse the exact same fixture-creation path after it clears the
 * collections. `scripts/seed.js` still owns the guarded, local-only entry
 * point (`main`).
 */
export async function seedDemoData({ reset = false, log = console.log, redactAdminEmail = false } = {}) {
  await seedAdmin({ log, redactAdminEmail });
  log('');
  await seedStations({ log });
  log('');
  await seedBins({ reset, log });
  log('');
  const now = new Date();
  await applyCampusStations({ now, log });
  await applyCampusMockState({ now, log });
  log('\n✓ Seed complete.');
}

async function main() {
  const reset = process.argv.includes('--reset');

  let target;
  try {
    target = assertSafeLocalDevelopmentTarget({
      uri: env.MONGODB_URI,
      nodeEnv: env.NODE_ENV,
      scriptName: 'scripts/seed.js',
    });
  } catch (err) {
    console.error(`✗ ${err.message}`);
    console.error('  Set MONGODB_URI to a local development database and leave NODE_ENV unset or "development".');
    process.exit(1);
  }

  console.log(`Seeding local development database "${target.database}" at ${target.host}`);
  console.log('Existing records are preserved; only missing demo fixtures are created.');
  if (reset) console.log('--reset requested: only the six demo bins will be deleted.');
  console.log('');

  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.error(`✗ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  try {
    await seedDemoData({ reset });
  } finally {
    await mongoose.disconnect();
  }
}

// Only auto-run when executed directly (`node scripts/seed.js`); importing this
// module (e.g. from the one-off CAMPUS reset) must not start a second run.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((err) => {
    console.error('✗ Seed failed:', err);
    process.exit(1);
  });
}
