/**
 * Development-only, non-destructive station association.
 *
 * Dry run (default) prints the intended mapping and touches no database:
 *
 *   node scripts/assign-demo-stations.js
 *
 * Apply (requires an explicit flag and a safe local development target):
 *
 *   node scripts/assign-demo-stations.js --apply
 *
 * What it does:
 *   - creates the two demo Station documents when they are missing
 *   - fills in only missing `stationId`/`wasteType` values on the six demo bins
 *
 * What it never does:
 *   - create, delete or reset bins, students, awards or scan history
 *   - change fill levels, statuses or last-sync times
 *   - overwrite an existing station whose name/location differs from the fixture
 *   - move a bin that is already assigned to a different station
 *   - overwrite an existing non-null `wasteType`
 *   - run against a non-local or production-like database
 *
 * Historical `ScanEvent`/`Student.awards` rows keep their `deviceId`; the
 * association is additive and can be undone by unsetting `stationId`.
 */
import mongoose from 'mongoose';
import { env } from '../src/env.js';
import { Bin } from '../src/models/Bin.js';
import { Station } from '../src/models/Station.js';
import { assertSafeLocalDevelopmentTarget } from '../src/lib/db-target.js';
import { DEMO_BIN_ASSIGNMENTS, DEMO_STATIONS } from './demo-stations.js';
import { planStationAssociation } from './station-association.js';

const apply = process.argv.includes('--apply');
const STATION_IDS = DEMO_STATIONS.map((station) => station.stationId);
const DEVICE_IDS = DEMO_BIN_ASSIGNMENTS.map(({ deviceId }) => deviceId);

function printPlan() {
  console.log('Demo station associations (development fixture only):\n');
  for (const station of DEMO_STATIONS) {
    const members = DEMO_BIN_ASSIGNMENTS.filter(
      ({ stationId }) => stationId === station.stationId,
    );
    console.log(
      `  ${station.stationId.padEnd(12)} ${station.name} @ ${station.location.lat},${station.location.lng}`,
    );
    console.log(
      `    containers: ${members
        .map(({ deviceId, wasteType }) => `${deviceId} (${wasteType})`)
        .join(', ')}`,
    );
  }
}

if (!apply) {
  printPlan();
  console.log('\nDry run only — nothing was written. Re-run with --apply to write.');
  process.exit(0);
}

let target;
try {
  target = assertSafeLocalDevelopmentTarget({
    uri: env.MONGODB_URI,
    nodeEnv: env.NODE_ENV,
    scriptName: 'scripts/assign-demo-stations.js --apply',
  });
} catch (err) {
  console.error(`✗ ${err.message}`);
  console.error('  Set MONGODB_URI to a local development database and leave NODE_ENV unset or "development".');
  process.exit(1);
}

console.log(`Associating demo stations in local development database "${target.database}" at ${target.host}\n`);

try {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  // Pre-flight: read every target record, decide the whole plan, and abort
  // before writing anything if the database does not match the demo fixture.
  const [existingStations, existingBins] = await Promise.all([
    Station.find({ stationId: { $in: STATION_IDS } }).lean(),
    Bin.find(
      { deviceId: { $in: DEVICE_IDS } },
      'deviceId stationId wasteType',
    ).lean(),
  ]);

  const plan = planStationAssociation({ existingStations, existingBins });

  if (!plan.ok) {
    console.error('✗ Refusing to write — the target already contains conflicting data:\n');
    for (const error of plan.errors) console.error(`  - ${error}`);
    console.error('\n  Nothing was changed. Resolve the conflicts and re-run.');
    process.exitCode = 1;
  } else {
    for (const station of plan.stations.create) {
      await Station.create({
        stationId: station.stationId,
        name: station.name,
        location: station.location,
      });
      console.log(`✓ created station ${station.stationId}`);
    }

    for (const assignment of plan.bins.assignments) {
      const set = {};
      if (assignment.setStationId) set.stationId = assignment.stationId;
      if (assignment.setWasteType) set.wasteType = assignment.wasteType;

      await Bin.updateOne({ deviceId: assignment.deviceId }, { $set: set });

      const changes = [
        assignment.setStationId ? `station ${assignment.stationId}` : null,
        assignment.setWasteType ? `material ${assignment.wasteType}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      console.log(`✓ updated ${assignment.deviceId} → ${changes}`);
    }

    for (const deviceId of plan.bins.missing) {
      console.log(`  ! ${deviceId} does not exist — skipped (no bin created)`);
    }

    console.log('');
    console.log(
      `✓ Stations created: ${plan.stations.create.length}, already correct: ${plan.stations.unchanged.length}`,
    );
    console.log(
      `✓ Containers updated: ${plan.bins.assignments.length}, already correct: ${plan.bins.unchanged.length}, missing: ${plan.bins.missing.length}`,
    );
  }
} catch (err) {
  console.error(`✗ Association failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
