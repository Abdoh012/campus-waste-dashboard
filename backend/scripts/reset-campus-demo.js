/**
 * ONE-OFF, EXPLICIT reset of the demo application data in the remote `CAMPUS`
 * database, preserving the entire `users` collection.
 *
 *   node scripts/reset-campus-demo.js --confirm-reset-campus
 *
 * This is deliberately NOT part of the general seed path and does NOT touch or
 * weaken `src/lib/db-target.js`. It refuses to run unless every one of these is
 * true:
 *   - the explicit `--confirm-reset-campus` flag is present;
 *   - `MONGODB_URI` names a database exactly `CAMPUS`;
 *   - the connected database is exactly `CAMPUS`;
 *   - the `users`, `bins`, `stations`, `students` and `scanevents` collections
 *     all exist;
 *   - `users` holds exactly one document that has a `passwordHash`;
 *   - the configured `SEED_ADMIN_EMAIL` matches exactly that one user (so the
 *     seed can never create a second admin).
 *
 * It deletes documents only from: bins, stations, students, scanevents.
 * It never deletes, drops, updates, recreates or projects the `users`
 * collection, and it never drops the database.
 */
import mongoose from 'mongoose';
import { env } from '../src/env.js';
import { parseMongoTarget } from '../src/lib/db-target.js';
import { Bin } from '../src/models/Bin.js';
import { Station } from '../src/models/Station.js';
import { groupBinsByStation, toStationDto, EXPECTED_CONTAINERS } from '../src/lib/stations.js';
import { DEMO_BIN_ASSIGNMENTS } from './demo-stations.js';
import { seedDemoData } from './seed.js';

const ALLOWED_DATABASE = 'CAMPUS';
const CONFIRM_FLAG = '--confirm-reset-campus';
const TARGET_COLLECTIONS = ['bins', 'stations', 'students', 'scanevents'];
const REQUIRED_COLLECTIONS = ['users', ...TARGET_COLLECTIONS];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!process.argv.includes(CONFIRM_FLAG)) {
  fail(
    `Refusing to run. This clears application data in "${ALLOWED_DATABASE}". ` +
      `Pass ${CONFIRM_FLAG} to confirm.`,
  );
}

const target = parseMongoTarget(env.MONGODB_URI);
if (!target) {
  fail('MONGODB_URI is missing, malformed or ambiguous; refusing to run.');
}
if (target.database !== ALLOWED_DATABASE) {
  fail(
    `Refusing to run: MONGODB_URI names database "${target.database || '(none)'}", ` +
      `not the authorized "${ALLOWED_DATABASE}".`,
  );
}

let connected = false;
try {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  connected = true;
  const db = mongoose.connection.db;

  // 1. Verify the real database identity before doing anything.
  if (db.databaseName !== ALLOWED_DATABASE) {
    fail(
      `Refusing to run: connected database is "${db.databaseName}", not ` +
        `the authorized "${ALLOWED_DATABASE}".`,
    );
  }

  const present = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name),
  );
  for (const name of REQUIRED_COLLECTIONS) {
    if (!present.has(name)) {
      fail(`Expected collection "${name}" is missing; refusing to reset.`);
    }
  }

  // 2. Verify the admin invariant before touching anything.
  const usersBefore = await db.collection('users').countDocuments({});
  if (usersBefore !== 1) {
    fail(`Expected exactly 1 admin user, found ${usersBefore}; refusing to reset.`);
  }

  const adminBefore = await db
    .collection('users')
    .findOne({}, { projection: { _id: 1, passwordHash: 1 } });
  if (!adminBefore || typeof adminBefore.passwordHash !== 'string' || adminBefore.passwordHash === '') {
    fail('Admin document is missing a passwordHash; refusing to reset.');
  }

  const configuredEmail = (env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const configuredMatches = await db
    .collection('users')
    .countDocuments({ email: configuredEmail });
  if (configuredMatches !== 1) {
    fail(
      'The configured SEED_ADMIN_EMAIL does not match exactly one user; ' +
        'refusing to reset so the seed cannot create a new admin.',
    );
  }

  const countsBefore = {};
  for (const name of TARGET_COLLECTIONS) {
    countsBefore[name] = await db.collection(name).countDocuments({});
  }

  console.log(`Target database: ${db.databaseName}`);
  console.log(
    `Before: users=${usersBefore}, ` +
      TARGET_COLLECTIONS.map((name) => `${name}=${countsBefore[name]}`).join(', '),
  );
  console.log('');

  // 3. Clear documents ONLY from the four approved collections. Never drop,
  //    and never touch `users`.
  for (const name of TARGET_COLLECTIONS) {
    const { deletedCount } = await db.collection(name).deleteMany({});
    console.log(`cleared ${name}: ${deletedCount} document(s)`);
  }
  console.log('');

  // 4. Reuse the existing seed process (same fixtures + wasteType mapping).
  await seedDemoData({ redactAdminEmail: true });

  // 5. Verify the admin document is byte-for-byte unchanged.
  const usersAfter = await db.collection('users').countDocuments({});
  const adminAfter = await db
    .collection('users')
    .findOne({}, { projection: { _id: 1, passwordHash: 1 } });

  if (usersAfter !== usersBefore) {
    fail(`users count changed (${usersBefore} → ${usersAfter}); aborting verification.`);
  }
  if (
    !adminAfter ||
    String(adminAfter._id) !== String(adminBefore._id) ||
    adminAfter.passwordHash !== adminBefore.passwordHash
  ) {
    fail('The admin document changed during the reset; aborting verification.');
  }

  // 6. Verify the seeded state and material mapping.
  const stations = await Station.find().lean();
  const bins = await Bin.find().lean();
  const groups = groupBinsByStation(bins);
  const stationDtos = stations.map((station) =>
    toStationDto(station, groups.get(station.stationId) ?? []),
  );

  const studentsAfter = await db.collection('students').countDocuments({});
  const scanEventsAfter = await db.collection('scanevents').countDocuments({});

  const expected = new Map(
    DEMO_BIN_ASSIGNMENTS.map(({ deviceId, stationId, wasteType }) => [
      deviceId,
      { stationId, wasteType },
    ]),
  );

  const problems = [];
  if (stations.length !== 2) problems.push(`expected 2 stations, found ${stations.length}`);
  if (bins.length !== 6) problems.push(`expected 6 bins, found ${bins.length}`);
  if (studentsAfter !== 0) problems.push(`expected 0 students, found ${studentsAfter}`);
  if (scanEventsAfter !== 0) problems.push(`expected 0 scan events, found ${scanEventsAfter}`);

  for (const bin of bins) {
    if (!bin.stationId) problems.push(`${bin.deviceId} has no stationId`);
    if (!bin.wasteType) problems.push(`${bin.deviceId} has no wasteType`);
    const want = expected.get(bin.deviceId);
    if (!want) {
      problems.push(`${bin.deviceId} is not a demo fixture`);
      continue;
    }
    if (bin.stationId !== want.stationId) {
      problems.push(`${bin.deviceId} station ${bin.stationId} ≠ ${want.stationId}`);
    }
    if (bin.wasteType !== want.wasteType) {
      problems.push(`${bin.deviceId} material ${bin.wasteType} ≠ ${want.wasteType}`);
    }
  }

  for (const dto of stationDtos) {
    if (!dto.integrity.valid) {
      problems.push(
        `${dto.stationId} integrity invalid: ${dto.integrity.issues
          .map((issue) => issue.code)
          .join(', ')}`,
      );
    }
    if (dto.containers.length !== EXPECTED_CONTAINERS) {
      problems.push(
        `${dto.stationId} has ${dto.containers.length} containers, expected ${EXPECTED_CONTAINERS}`,
      );
    }
  }

  console.log('');
  console.log(`After: users=${usersAfter}, stations=${stations.length}, bins=${bins.length}, students=${studentsAfter}, scanevents=${scanEventsAfter}`);
  for (const dto of stationDtos) {
    const materials = dto.containers
      .map((container) => `${container.deviceId}=${container.wasteType ?? 'unclassified'}`)
      .join(', ');
    console.log(`  ${dto.stationId}: ${materials} · integrity ${dto.integrity.valid ? 'valid' : 'INVALID'}`);
  }

  if (problems.length > 0) {
    console.error('\n✗ Verification failed:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
  } else {
    console.log('\n✓ Reset and reseed verified. users preserved unchanged.');
  }
} catch (err) {
  console.error(`✗ Reset failed: ${err.name}: ${err.message}`);
  process.exitCode = 1;
} finally {
  if (connected) await mongoose.disconnect().catch(() => {});
}
