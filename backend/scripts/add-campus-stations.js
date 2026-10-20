/**
 * Add the four approved campus stations and twelve containers to `CAMPUS`.
 *
 *   node scripts/add-campus-stations.js --confirm-add-campus-stations
 *
 * Additive and idempotent. It refuses to run unless every one of these is true:
 *   - the explicit `--confirm-add-campus-stations` flag is present;
 *   - `MONGODB_URI` names a database exactly `CAMPUS`;
 *   - the connected database is exactly `CAMPUS`;
 *   - `users`, `bins`, `stations`, `students` and `scanevents` all exist;
 *   - `users` holds exactly one document with a `passwordHash`, and the
 *     configured `SEED_ADMIN_EMAIL` matches exactly that user;
 *   - the two existing demo stations (`STN-NORTH`, `STN-LIBRARY`) are present;
 *   - the four-station fixture is structurally valid and every existing
 *     station/container it would touch is either absent or exactly matching.
 *
 * It writes only the four new Station documents and twelve new Bin documents,
 * and re-stamps the twelve containers' DEMO live state (synthetic fill level +
 * `lastSyncAt` from `CAMPUS_MOCK_STATE`, fill-derived status). It never
 * deletes, drops or overwrites — and it leaves the two original demo bins,
 * users, students and the scan history untouched. The admin document and the
 * students/scan counts are checked before and after.
 *
 * Before any live stamping, all twelve containers must already exist.
 *
 * Errors are redacted so a failed Atlas connection cannot print the URI.
 */
import mongoose from 'mongoose';
import { env } from '../src/env.js';
import { parseMongoTarget } from '../src/lib/db-target.js';
import { Station } from '../src/models/Station.js';
import { DEMO_STATIONS } from './demo-stations.js';
import {
  CAMPUS_TOTAL_BIN_COUNT,
  CAMPUS_TOTAL_STATION_COUNT,
  validateCampusStationFixture,
} from './campus-stations.js';
import {
  applyCampusMockState,
  applyCampusStations,
  checkCampusStations,
} from './campus-stations-apply.js';

const ALLOWED_DATABASE = 'CAMPUS';
const CONFIRM_FLAG = '--confirm-add-campus-stations';
const REQUIRED_COLLECTIONS = ['users', 'bins', 'stations', 'students', 'scanevents'];
const COUNTED_COLLECTIONS = ['users', 'stations', 'bins', 'students', 'scanevents'];

const MONGO_URI_PATTERN = /mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi;

/** Never let a driver error echo the connection string (and its password). */
function redact(value) {
  return String(value).replace(MONGO_URI_PATTERN, '[redacted MongoDB URI]');
}

async function countAll(db) {
  const counts = {};
  for (const name of COUNTED_COLLECTIONS) {
    counts[name] = await db.collection(name).countDocuments({});
  }
  return counts;
}

function formatCounts(counts) {
  return COUNTED_COLLECTIONS.map((name) => `${name}=${counts[name]}`).join(', ');
}

async function main() {
  if (!process.argv.includes(CONFIRM_FLAG)) {
    throw new Error(
      `Refusing to run. This writes stations into "${ALLOWED_DATABASE}". ` +
        `Pass ${CONFIRM_FLAG} to confirm.`,
    );
  }

  const target = parseMongoTarget(env.MONGODB_URI);
  if (!target) {
    throw new Error('MONGODB_URI is missing, malformed or ambiguous; refusing to run.');
  }
  if (target.database !== ALLOWED_DATABASE) {
    throw new Error(
      `Refusing to run: MONGODB_URI names database "${target.database || '(none)'}", ` +
        `not the authorized "${ALLOWED_DATABASE}".`,
    );
  }

  const fixtureProblems = validateCampusStationFixture();
  if (fixtureProblems.length > 0) {
    throw new Error(
      `The four-station fixture is invalid; refusing to write:\n${fixtureProblems
        .map((problem) => `  - ${problem}`)
        .join('\n')}`,
    );
  }

  let connected = false;
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    connected = true;
    const db = mongoose.connection.db;

    // 1. Verify the real database identity before doing anything.
    if (db.databaseName !== ALLOWED_DATABASE) {
      throw new Error(
        `Refusing to run: connected database is "${db.databaseName}", not ` +
          `the authorized "${ALLOWED_DATABASE}".`,
      );
    }

    const present = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name),
    );
    for (const name of REQUIRED_COLLECTIONS) {
      if (!present.has(name)) {
        throw new Error(`Expected collection "${name}" is missing; refusing to add stations.`);
      }
    }

    // 2. Admin invariant.
    const before = await countAll(db);
    if (before.users !== 1) {
      throw new Error(`Expected exactly 1 admin user, found ${before.users}; refusing.`);
    }
    const adminBefore = await db
      .collection('users')
      .findOne({}, { projection: { _id: 1, passwordHash: 1 } });
    if (
      !adminBefore ||
      typeof adminBefore.passwordHash !== 'string' ||
      adminBefore.passwordHash === ''
    ) {
      throw new Error('Admin document is missing a passwordHash; refusing.');
    }
    const configuredEmail = (env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
    const configuredMatches = await db
      .collection('users')
      .countDocuments({ email: configuredEmail });
    if (configuredMatches !== 1) {
      throw new Error(
        'The configured SEED_ADMIN_EMAIL does not match exactly one user; ' +
          'refusing to run.',
      );
    }

    // 3. The existing two-station demo must be present. This prevents adding
    //    the four planned stations to a different "CAMPUS" database.
    const demoStationIds = DEMO_STATIONS.map((station) => station.stationId);
    const existingDemoStations = await Station.find(
      { stationId: { $in: demoStationIds } },
      'stationId',
    ).lean();
    if (existingDemoStations.length !== demoStationIds.length) {
      throw new Error(
        `Expected the two existing demo stations (${demoStationIds.join(', ')}); ` +
          `found ${existingDemoStations.length}. Refusing to add stations.`,
      );
    }

    console.log(`Target database: ${db.databaseName}`);
    console.log(`Before: ${formatCounts(before)}`);
    console.log('');

    // 4. Apply only the missing stations/containers, then stamp the demo live
    //    state with one clock so the check below verifies it exactly.
    const now = new Date();
    const applied = await applyCampusStations({ now, log: (line) => console.log(`  ${line}`) });
    await applyCampusMockState({ now, log: (line) => console.log(`  ${line}`) });

    // 5. Re-read and verify the approved slice against the same clock.
    const check = await checkCampusStations({ now });
    if (!check.ok) {
      throw new Error(
        `Post-apply verification failed:\n${check.problems
          .map((problem) => `  - ${problem}`)
          .join('\n')}`,
      );
    }

    // 6. Admin, history and count invariants.
    const after = await countAll(db);
    const adminAfter = await db
      .collection('users')
      .findOne({}, { projection: { _id: 1, passwordHash: 1 } });

    if (!adminAfter) throw new Error('Admin document disappeared during the run.');
    if (String(adminAfter._id) !== String(adminBefore._id)) {
      throw new Error('The admin _id changed during the run; aborting.');
    }
    if (adminAfter.passwordHash !== adminBefore.passwordHash) {
      throw new Error('The admin passwordHash changed during the run; aborting.');
    }
    if (after.users !== before.users) {
      throw new Error(`users count changed (${before.users} → ${after.users}); aborting.`);
    }
    if (after.students !== before.students) {
      throw new Error(
        `students count changed (${before.students} → ${after.students}); aborting.`,
      );
    }
    if (after.scanevents !== before.scanevents) {
      throw new Error(
        `scanevents count changed (${before.scanevents} → ${after.scanevents}); aborting.`,
      );
    }
    if (after.stations !== before.stations + applied.createdStations.length) {
      throw new Error(
        `stations count changed unexpectedly (${before.stations} → ${after.stations}; ` +
          `created ${applied.createdStations.length}).`,
      );
    }
    if (after.bins !== before.bins + applied.createdBins.length) {
      throw new Error(
        `bins count changed unexpectedly (${before.bins} → ${after.bins}; ` +
          `created ${applied.createdBins.length}).`,
      );
    }
    if (after.stations !== CAMPUS_TOTAL_STATION_COUNT) {
      throw new Error(
        `expected ${CAMPUS_TOTAL_STATION_COUNT} stations after the add, found ${after.stations}.`,
      );
    }
    if (after.bins !== CAMPUS_TOTAL_BIN_COUNT) {
      throw new Error(
        `expected ${CAMPUS_TOTAL_BIN_COUNT} containers after the add, found ${after.bins}.`,
      );
    }

    console.log('');
    console.log(`After: ${formatCounts(after)}`);
    console.log(
      `Applied: +${applied.createdStations.length} station(s), ` +
        `+${applied.createdBins.length} container(s); ` +
        `${applied.skippedStations.length} station(s) and ` +
        `${applied.skippedBins.length} container(s) already matched.`,
    );
    console.log(
      `Verified: ${check.dtos.length} added stations valid; ` +
        `${check.bins.length} containers carry the demo fill/sync state.`,
    );
    console.log('Admin _id and passwordHash unchanged; students and scans unchanged.');
    console.log('\n✓ Campus stations added and verified.');
  } finally {
    if (connected) await mongoose.disconnect().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`✗ ${err.name}: ${redact(err.message)}`);
  process.exitCode = 1;
});
