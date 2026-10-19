/**
 * Pure tests for the seed planner.
 *
 * The rule under test: re-running the seed must never schedule a write against
 * an existing demo bin, so its live reading (fillLevel, lastSyncAt, status,
 * location, name, stationId) is preserved. No database is contacted.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { demoDeviceIds, planSeedBins } from '../scripts/seed-plan.js';

const SAMPLES = [
  { deviceId: 'ESP32-BIN-01', fillLevel: 18 },
  { deviceId: 'ESP32-BIN-02', fillLevel: 54 },
  { deviceId: 'ESP32-BIN-03', fillLevel: 87 },
  { deviceId: 'ESP32-BIN-04', fillLevel: 21 },
  { deviceId: 'ESP32-BIN-05', fillLevel: 12 },
  { deviceId: 'ESP32-BIN-06', fillLevel: 63 },
];

describe('planSeedBins', () => {
  it('creates every demo bin on an empty database', () => {
    const plan = planSeedBins({ existingBins: [], samples: SAMPLES });
    assert.equal(plan.create.length, SAMPLES.length);
    assert.equal(plan.skip.length, 0);
  });

  it('skips existing bins and never schedules a write against them', () => {
    const existingBins = [
      { deviceId: 'ESP32-BIN-01', fillLevel: 99, lastSyncAt: new Date(), status: 'critical' },
      { deviceId: 'ESP32-BIN-04', fillLevel: 5, lastSyncAt: new Date(), status: 'healthy' },
    ];

    const plan = planSeedBins({ existingBins, samples: SAMPLES });

    assert.deepEqual(plan.skip, ['ESP32-BIN-01', 'ESP32-BIN-04']);
    assert.deepEqual(
      plan.create.map((sample) => sample.deviceId),
      ['ESP32-BIN-02', 'ESP32-BIN-03', 'ESP32-BIN-05', 'ESP32-BIN-06'],
    );

    // The guarantee that protects live readings: no existing device id can
    // appear in the create list.
    const existingIds = new Set(existingBins.map((bin) => bin.deviceId));
    assert.equal(
      plan.create.some((sample) => existingIds.has(sample.deviceId)),
      false,
    );
  });

  it('is a no-op when every demo bin already exists', () => {
    const existingBins = SAMPLES.map((sample) => ({ deviceId: sample.deviceId }));
    const plan = planSeedBins({ existingBins, samples: SAMPLES });
    assert.equal(plan.create.length, 0);
    assert.equal(plan.skip.length, SAMPLES.length);
  });
});

describe('demoDeviceIds', () => {
  it('lists exactly the demo device ids, in order', () => {
    assert.deepEqual(demoDeviceIds(SAMPLES), [
      'ESP32-BIN-01',
      'ESP32-BIN-02',
      'ESP32-BIN-03',
      'ESP32-BIN-04',
      'ESP32-BIN-05',
      'ESP32-BIN-06',
    ]);
  });
});
