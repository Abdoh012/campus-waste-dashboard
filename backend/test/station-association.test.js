/**
 * Pure tests for the demo-station association planner.
 *
 * The rules under test: the run aborts (writes nothing) when an existing
 * station's name/location differs from the fixture or a demo bin is already on
 * a different station, and it converges to a no-op on a safe rerun. No database
 * is contacted.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEMO_BIN_STATION_MAP,
  DEMO_BIN_WASTE_TYPE_MAP,
  DEMO_STATIONS,
} from '../scripts/demo-stations.js';
import {
  locationMatches,
  planStationAssociation,
  stationMatches,
} from '../scripts/station-association.js';

const DEVICE_IDS = Object.keys(DEMO_BIN_STATION_MAP);

function station(overrides = {}) {
  return { ...DEMO_STATIONS[0], ...overrides };
}

function binsOn(stationId) {
  return DEVICE_IDS.map((deviceId) => ({
    deviceId,
    stationId,
    wasteType: DEMO_BIN_WASTE_TYPE_MAP[deviceId],
  }));
}

describe('planStationAssociation', () => {
  it('creates missing stations and assigns unassigned bins', () => {
    const plan = planStationAssociation({ existingStations: [], existingBins: [] });

    assert.equal(plan.ok, true);
    assert.deepEqual(
      plan.stations.create.map((s) => s.stationId).sort(),
      ['STN-LIBRARY', 'STN-NORTH'],
    );
    assert.equal(plan.stations.unchanged.length, 0);
    // Every demo bin is absent, so none is created and none is assigned.
    assert.equal(plan.bins.assignments.length, 0);
    assert.deepEqual(plan.bins.missing, DEVICE_IDS);
    assert.equal(plan.bins.unchanged.length, 0);
  });

  it('assigns unassigned bins when the stations already match', () => {
    const existingBins = DEVICE_IDS.map((deviceId) => ({ deviceId, stationId: undefined }));
    const plan = planStationAssociation({
      existingStations: DEMO_STATIONS,
      existingBins,
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.stations.create.length, 0);
    assert.equal(plan.stations.unchanged.length, DEMO_STATIONS.length);
    assert.deepEqual(
      plan.bins.assignments.map((a) => a.deviceId),
      DEVICE_IDS,
    );
    assert.equal(plan.bins.missing.length, 0);
    assert.equal(plan.bins.assignments.every((a) => a.setStationId), true);
    assert.equal(plan.bins.assignments.every((a) => a.setWasteType), true);
    assert.deepEqual(
      plan.bins.assignments.map((a) => a.wasteType),
      DEVICE_IDS.map((deviceId) => DEMO_BIN_WASTE_TYPE_MAP[deviceId]),
    );
  });

  it('classifies an already-associated bin without moving it', () => {
    const existingBins = DEVICE_IDS.map((deviceId) => ({
      deviceId,
      stationId: DEMO_BIN_STATION_MAP[deviceId],
    }));
    const plan = planStationAssociation({
      existingStations: DEMO_STATIONS,
      existingBins,
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.bins.assignments.length, DEVICE_IDS.length);
    assert.equal(plan.bins.assignments.every((a) => !a.setStationId), true);
    assert.equal(plan.bins.assignments.every((a) => a.setWasteType), true);
  });

  it('allows a safe rerun when metadata and associations already match', () => {
    const plan = planStationAssociation({
      existingStations: DEMO_STATIONS,
      existingBins: binsOn('STN-NORTH').map((bin, index) =>
        index < 3 ? bin : { ...bin, stationId: 'STN-LIBRARY' },
      ),
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.errors.length, 0);
    assert.equal(plan.stations.create.length, 0);
    assert.equal(plan.bins.assignments.length, 0);
    assert.equal(plan.bins.unchanged.length, DEVICE_IDS.length);
  });

  it('rejects an existing station with unexpected name or location', () => {
    const plan = planStationAssociation({
      existingStations: [
        station({ name: 'Real Station Name', location: { building: 'Elsewhere', lat: 1, lng: 2 } }),
        DEMO_STATIONS[1],
      ],
      existingBins: [],
    });

    assert.equal(plan.ok, false);
    assert.match(plan.errors.join('\n'), /refusing to overwrite/);
    assert.equal(plan.stations.create.length, 0);
  });

  it('detects a location that differs by a meaningful amount', () => {
    const moved = { ...DEMO_STATIONS[0], location: { ...DEMO_STATIONS[0].location, lat: 30.9999 } };
    assert.equal(stationMatches(DEMO_STATIONS[0], DEMO_STATIONS[0]), true);
    assert.equal(stationMatches(moved, DEMO_STATIONS[0]), false);
  });

  it('rejects a bin already assigned to a different station', () => {
    const existingBins = DEVICE_IDS.map((deviceId) => ({ deviceId, stationId: 'STN-REAL' }));
    const plan = planStationAssociation({
      existingStations: DEMO_STATIONS,
      existingBins,
    });

    assert.equal(plan.ok, false);
    assert.match(plan.errors.join('\n'), /already assigned to station "STN-REAL"/);
    // The conflicting bins are never scheduled to move.
    assert.equal(plan.bins.assignments.length, 0);
  });

  it('rejects a bin already classified as a different material', () => {
    const existingBins = DEVICE_IDS.map((deviceId) => ({
      deviceId,
      stationId: DEMO_BIN_STATION_MAP[deviceId],
      wasteType: DEMO_BIN_WASTE_TYPE_MAP[deviceId],
    }));
    existingBins[0] = { ...existingBins[0], wasteType: 'plastic' };

    const plan = planStationAssociation({
      existingStations: DEMO_STATIONS,
      existingBins,
    });

    assert.equal(plan.ok, false);
    assert.match(plan.errors.join('\n'), /already classified as "plastic"/);
    assert.equal(plan.bins.assignments.length, 0);
  });

  it('treats an empty-string stationId as unassigned', () => {
    const plan = planStationAssociation({
      existingStations: DEMO_STATIONS,
      existingBins: [{ deviceId: 'ESP32-BIN-01', stationId: '' }],
    });

    assert.equal(plan.ok, true);
    assert.deepEqual(plan.bins.assignments, [
      {
        deviceId: 'ESP32-BIN-01',
        stationId: 'STN-NORTH',
        wasteType: 'paper',
        setStationId: true,
        setWasteType: true,
      },
    ]);
    assert.deepEqual(plan.bins.missing, DEVICE_IDS.slice(1));
  });
});

describe('locationMatches', () => {
  it('compares building name and both coordinates', () => {
    const expected = { building: 'North Gate', lat: 30.8574, lng: 29.57024 };
    assert.equal(locationMatches(expected, expected), true);
    assert.equal(locationMatches({ ...expected, building: 'North' }, expected), false);
    assert.equal(locationMatches({ ...expected, lng: 0 }, expected), false);
    assert.equal(locationMatches(null, expected), false);
    assert.equal(locationMatches(undefined, undefined), false);
  });
});
