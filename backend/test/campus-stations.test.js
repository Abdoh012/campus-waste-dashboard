/**
 * Pure tests for the four approved campus stations.
 *
 * No database: these assert the fixture is complete (four stations, three
 * containers each, one of every material) and that the planner refuses to
 * overwrite existing stations/containers.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WASTE_TYPES } from '../src/lib/waste-types.js';
import {
  CAMPUS_BIN_ASSIGNMENTS,
  CAMPUS_BIN_COUNT,
  CAMPUS_DEVICE_IDS,
  CAMPUS_MOCK_STATE,
  CAMPUS_STATION_COUNT,
  CAMPUS_STATIONS,
  CAMPUS_TOTAL_BIN_COUNT,
  CAMPUS_TOTAL_STATION_COUNT,
  planCampusStationAdd,
  validateCampusStationFixture,
} from '../scripts/campus-stations.js';

const MATERIALS = Object.values(WASTE_TYPES);

describe('approved campus station fixture', () => {
  it('declares four stations and twelve containers with unique ids', () => {
    assert.equal(CAMPUS_STATIONS.length, 4);
    assert.equal(CAMPUS_BIN_ASSIGNMENTS.length, 12);
    assert.equal(CAMPUS_STATION_COUNT, 4);
    assert.equal(CAMPUS_BIN_COUNT, 12);
    assert.equal(CAMPUS_TOTAL_STATION_COUNT, 6);
    assert.equal(CAMPUS_TOTAL_BIN_COUNT, 18);

    assert.equal(new Set(CAMPUS_STATIONS.map((s) => s.stationId)).size, 4);
    assert.equal(new Set(CAMPUS_DEVICE_IDS).size, 12);
  });

  it('gives every station exactly one container of each material', () => {
    for (const station of CAMPUS_STATIONS) {
      const materials = CAMPUS_BIN_ASSIGNMENTS.filter(
        (bin) => bin.stationId === station.stationId,
      ).map((bin) => bin.wasteType);

      assert.equal(materials.length, 3, `${station.stationId} container count`);
      for (const material of MATERIALS) {
        assert.equal(
          materials.filter((value) => value === material).length,
          1,
          `${station.stationId} has one ${material}`,
        );
      }
    }
  });

  it('uses finite coordinates in the Borg El Arab sanity bounds', () => {
    for (const station of CAMPUS_STATIONS) {
      assert.ok(Number.isFinite(station.location.lat), `${station.stationId} lat`);
      assert.ok(Number.isFinite(station.location.lng), `${station.stationId} lng`);
      assert.ok(station.location.lat > 30.84 && station.location.lat < 30.88);
      assert.ok(station.location.lng > 29.55 && station.location.lng < 29.6);
    }
  });

  it('passes fixture validation', () => {
    assert.deepEqual(validateCampusStationFixture(), []);
  });

  it('stamps demo live state for every container in the fixture', () => {
    assert.equal(CAMPUS_MOCK_STATE.length, CAMPUS_BIN_ASSIGNMENTS.length);

    const deviceIds = new Set(CAMPUS_DEVICE_IDS);
    for (const mock of CAMPUS_MOCK_STATE) {
      assert.ok(deviceIds.has(mock.deviceId), `${mock.deviceId} belongs to the fixture`);
      assert.ok(
        Number.isInteger(mock.fillLevel) && mock.fillLevel >= 0 && mock.fillLevel <= 100,
        `${mock.deviceId} fill is an integer 0–100`,
      );
      assert.ok(
        Number.isInteger(mock.minutesAgo) && mock.minutesAgo >= 0,
        `${mock.deviceId} age is a non-negative integer`,
      );
    }
    assert.equal(new Set(CAMPUS_MOCK_STATE.map((mock) => mock.deviceId)).size, 12);
  });

  it('creates everything when the target has none of the new records', () => {
    const plan = planCampusStationAdd({ existingStations: [], existingBins: [] });

    assert.equal(plan.ok, true);
    assert.deepEqual(plan.conflicts, []);
    assert.equal(plan.createStations.length, 4);
    assert.equal(plan.createBins.length, 12);
    assert.deepEqual(plan.skipStations, []);
    assert.deepEqual(plan.skipBins, []);
  });

  it('is idempotent when every new record already matches', () => {
    const existingStations = CAMPUS_STATIONS.map((station) => ({ ...station }));
    const existingBins = CAMPUS_BIN_ASSIGNMENTS.map((bin) => ({
      deviceId: bin.deviceId,
      stationId: bin.stationId,
      wasteType: bin.wasteType,
    }));

    const plan = planCampusStationAdd({ existingStations, existingBins });

    assert.equal(plan.ok, true);
    assert.deepEqual(plan.conflicts, []);
    assert.deepEqual(plan.createStations, []);
    assert.deepEqual(plan.createBins, []);
    assert.deepEqual(plan.skipStations, CAMPUS_STATIONS.map((s) => s.stationId));
    assert.deepEqual(plan.skipBins, CAMPUS_DEVICE_IDS);
  });

  it('refuses to overwrite a station with a different name/location', () => {
    const [first] = CAMPUS_STATIONS;
    const existingStations = [
      {
        ...first,
        name: `${first.name} (renamed)`,
      },
    ];

    const plan = planCampusStationAdd({ existingStations, existingBins: [] });

    assert.equal(plan.ok, false);
    assert.equal(plan.createStations.some((s) => s.stationId === first.stationId), false);
    assert.ok(plan.conflicts.some((problem) => problem.includes(first.stationId)));
  });

  it('refuses to overwrite a container with a different station/material', () => {
    const [first] = CAMPUS_BIN_ASSIGNMENTS;
    const existingBins = [
      {
        deviceId: first.deviceId,
        stationId: 'STN-OTHER',
        wasteType: WASTE_TYPES.PLASTIC,
      },
    ];

    const plan = planCampusStationAdd({ existingStations: [], existingBins });

    assert.equal(plan.ok, false);
    assert.equal(plan.createBins.some((b) => b.deviceId === first.deviceId), false);
    assert.ok(plan.conflicts.some((problem) => problem.includes(first.deviceId)));
  });

  it('reports malformed fixtures before any write', () => {
    const problems = validateCampusStationFixture({
      stations: [
        {
          stationId: 'STN-BAD',
          name: 'Bad',
          location: { lat: 0, lng: 0 },
        },
      ],
      bins: [
        {
          deviceId: 'BAD-1',
          name: 'Bad 1',
          stationId: 'STN-BAD',
          wasteType: WASTE_TYPES.PAPER,
        },
      ],
    });

    assert.ok(problems.some((problem) => problem.includes('sanity bounds')));
    assert.ok(problems.some((problem) => problem.includes('expected 3')));
    assert.ok(problems.some((problem) => problem.includes('"plastic" container')));
  });
});
