/**
 * Seed the rich, consistent demo dataset into the remote `CAMPUS` database.
 *
 *   node scripts/seed-campus-demo.js --confirm-seed-campus
 *
 * This is a dedicated, explicitly guarded one-off — it does NOT touch or weaken
 * `src/lib/db-target.js`, and it never runs against a local/dev target (use
 * `scripts/seed.js` + `scripts/demo-history-apply.js` for local development).
 *
 * It refuses to run unless every one of these is true:
 *   - the explicit `--confirm-seed-campus` flag is present;
 *   - `MONGODB_URI` names a database exactly `CAMPUS`;
 *   - the connected database is exactly `CAMPUS`;
 *   - `users`, `bins`, `stations`, `students` and `scanevents` all exist;
 *   - `users` holds exactly one document with a `passwordHash`, and the
 *     configured `SEED_ADMIN_EMAIL` matches exactly that user;
 *   - the six demo bins already exist with the reviewed station/material
 *     assignment (a mismatch aborts before any write).
 *
 * It writes only: the six demo bins' live state, and the ScanEvents/students
 * owned by the demo id sets. It never deletes users, never drops a database or
 * collection, and never edits `.env`. The admin `_id` and password hash are
 * captured before and re-checked after; a change aborts with a non-zero exit.
 */
import mongoose from 'mongoose';
import { env } from '../src/env.js';
import { parseMongoTarget } from '../src/lib/db-target.js';
import { Bin } from '../src/models/Bin.js';
import { DEMO_BIN_ASSIGNMENTS } from './demo-stations.js';
import { DEMO_DEVICE_IDS } from './demo-history.js';
import { applyDemoHistory, checkDemoHistory } from './demo-history-apply.js';

const ALLOWED_DATABASE = 'CAMPUS';
const CONFIRM_FLAG = '--confirm-seed-campus';
const REQUIRED_COLLECTIONS = ['users', 'bins', 'stations', 'students', 'scanevents'];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!process.argv.includes(CONFIRM_FLAG)) {
  fail(
    `Refusing to run. This writes demo data into "${ALLOWED_DATABASE}". ` +
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
      fail(`Expected collection "${name}" is missing; refusing to seed.`);
    }
  }

  // 2. Admin invariant.
  const usersBefore = await db.collection('users').countDocuments({});
  if (usersBefore !== 1) {
    fail(`Expected exactly 1 admin user, found ${usersBefore}; refusing to seed.`);
  }
  const adminBefore = await db
    .collection('users')
    .findOne({}, { projection: { _id: 1, passwordHash: 1 } });
  if (!adminBefore || typeof adminBefore.passwordHash !== 'string' || adminBefore.passwordHash === '') {
    fail('Admin document is missing a passwordHash; refusing to seed.');
  }
  const configuredEmail = (env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const configuredMatches = await db
    .collection('users')
    .countDocuments({ email: configuredEmail });
  if (configuredMatches !== 1) {
    fail(
      'The configured SEED_ADMIN_EMAIL does not match exactly one user; ' +
        'refusing to seed so the run cannot create a new admin.',
    );
  }

  // 3. The six demo bins must already exist with the reviewed assignment.
  const expectedBins = new Map(
    DEMO_BIN_ASSIGNMENTS.map(({ deviceId, stationId, wasteType }) => [
      deviceId,
      { stationId, wasteType },
    ]),
  );
  const demoBins = await Bin.find(
    { deviceId: { $in: DEMO_DEVICE_IDS } },
    'deviceId stationId wasteType',
  ).lean();
  const demoBinById = new Map(demoBins.map((bin) => [bin.deviceId, bin]));
  for (const [deviceId, want] of expectedBins) {
    const found = demoBinById.get(deviceId);
    if (!found) {
      fail(`Demo bin ${deviceId} is missing; run the reset/seed first.`);
    }
    if (found.stationId !== want.stationId) {
      fail(
        `Demo bin ${deviceId} is on station "${found.stationId}", expected ` +
          `"${want.stationId}"; refusing to move it.`,
      );
    }
    if (found.wasteType !== want.wasteType) {
      fail(
        `Demo bin ${deviceId} is classified "${found.wasteType}", expected ` +
          `"${want.wasteType}"; refusing to reclassify it.`,
      );
    }
  }

  console.log(`Target database: ${db.databaseName}`);
  console.log(`users=${usersBefore} (preserved), demo bins=${demoBins.length}`);
  console.log('');

  // 4. Apply the demo dataset, then verify what actually landed.
  const now = new Date();
  const applied = await applyDemoHistory({ now, log: (line) => console.log(`  ${line}`) });

  // 5. The admin document must be byte-for-byte unchanged.
  const usersAfter = await db.collection('users').countDocuments({});
  const adminAfter = await db
    .collection('users')
    .findOne({}, { projection: { _id: 1, passwordHash: 1 } });
  if (usersAfter !== usersBefore) {
    fail(`users count changed (${usersBefore} → ${usersAfter}); aborting.`);
  }
  if (
    !adminAfter ||
    String(adminAfter._id) !== String(adminBefore._id) ||
    adminAfter.passwordHash !== adminBefore.passwordHash
  ) {
    fail('The admin document changed during the seed; aborting.');
  }

  // 6. Re-run the comparison against the same clock used to write.
  const check = await checkDemoHistory({ now });

  console.log('');
  console.log(
    `After: users=${usersAfter}, scans=${check.actual.scanEventCount}, students=${check.actual.points.studentCount}`,
  );
  console.log(
    `Stations: online=${check.actual.stations.online} partial=${check.actual.stations.partial} ` +
      `offline=${check.actual.stations.offline} · ` +
      `severity attention=${check.actual.stations.attention} critical=${check.actual.stations.critical}`,
  );
  console.log(
    `Containers: healthy=${check.actual.containers.healthy} attention=${check.actual.containers.attention} ` +
      `critical=${check.actual.containers.critical} unknown=${check.actual.containers.unknown} · ` +
      `online=${check.actual.containers.online} offline=${check.actual.containers.offline} ` +
      `never-connected=${check.actual.containers.neverConnected} · avgFill=${check.actual.containers.averageFill}`,
  );
  console.log(
    `Points: total=${check.actual.points.totalPoints} students=${check.actual.points.studentCount} · ` +
      `fill buckets last7=${check.actual.fill7.length} last30=${check.actual.fill30.length} · ` +
      `points days last7=${check.actual.points7.length}`,
  );
  console.log(`Replaced on this run: scans=-${applied.deletedScans} students=-${applied.deletedStudents}`);

  if (!check.ok) {
    console.error('\n✗ Verification failed:');
    for (const problem of check.problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
  } else {
    console.log('\n✓ Demo data seeded and verified. Admin preserved unchanged.');
  }
} catch (err) {
  console.error(`✗ Seed failed: ${err.name}: ${err.message}`);
  process.exitCode = 1;
} finally {
  if (connected) await mongoose.disconnect().catch(() => {});
}
