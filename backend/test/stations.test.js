/**
 * Pure station/container domain tests.
 *
 * These run without MongoDB and use a controlled clock, so online assertions
 * cannot expire mid-run. The fixture is the documented two-station / six-
 * container scenario (synthetic identifiers, not real hardware).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CONNECTIVITIES,
  CONTAINER_FIELDS,
  EXPECTED_CONTAINERS,
  connectivityFor,
  fillStatusForLevel,
  stationConnectivity,
  stationIntegrity,
  stationSeverity,
  toContainerDto,
  toStationDto,
} from '../src/lib/stations.js';
import { summarizeStationAndContainers } from '../src/lib/stats.js';
import { toBinDto } from '../src/lib/dto.js';
import { WASTE_TYPE_VALUES } from '../src/lib/waste-types.js';

const NOW = Date.parse('2026-10-19T12:00:00.000Z');
const MINUTE = 60_000;
const THRESHOLD = 5 * MINUTE;
const at = (minutesAgo) => new Date(NOW - minutesAgo * MINUTE);

const STATIONS = [
  {
    _id: 'station-north',
    stationId: 'STN-NORTH',
    name: 'North Gate (test)',
    location: { building: 'North Gate', lat: 30.8574, lng: 29.57024 },
  },
  {
    _id: 'station-library',
    stationId: 'STN-LIBRARY',
    name: 'Library (test)',
    location: { building: 'Library', lat: 30.8592, lng: 29.57264 },
  },
];

const CONTAINERS = [
  {
    _id: 'container-a1',
    deviceId: 'ESP32-A1',
    name: 'A1',
    stationId: 'STN-NORTH',
    wasteType: 'paper',
    fillLevel: 18,
    status: 'healthy',
    lastSyncAt: at(1),
  },
  {
    _id: 'container-a2',
    deviceId: 'ESP32-A2',
    name: 'A2',
    stationId: 'STN-NORTH',
    wasteType: 'plastic',
    fillLevel: 62,
    status: 'attention',
    lastSyncAt: at(2),
  },
  {
    _id: 'container-a3',
    deviceId: 'ESP32-A3',
    name: 'A3',
    stationId: 'STN-NORTH',
    wasteType: 'liquids',
    fillLevel: 47,
    status: 'healthy',
    lastSyncAt: at(3),
  },
  {
    _id: 'container-b1',
    deviceId: 'ESP32-B1',
    name: 'B1',
    stationId: 'STN-LIBRARY',
    wasteType: 'paper',
    fillLevel: 88,
    status: 'critical',
    lastSyncAt: at(30),
  },
  {
    _id: 'container-b2',
    deviceId: 'ESP32-B2',
    name: 'B2',
    stationId: 'STN-LIBRARY',
    wasteType: 'plastic',
    fillLevel: null,
    status: 'healthy',
    lastSyncAt: null,
  },
  {
    _id: 'container-b3',
    deviceId: 'ESP32-B3',
    name: 'B3',
    stationId: 'STN-LIBRARY',
    wasteType: 'liquids',
    fillLevel: 30,
    status: 'healthy',
    lastSyncAt: at(1),
  },
];

describe('fill severity thresholds', () => {
  it('uses the source thresholds: healthy <50, attention 50–74, critical ≥75', () => {
    assert.equal(fillStatusForLevel(0), 'healthy');
    assert.equal(fillStatusForLevel(49), 'healthy');
    assert.equal(fillStatusForLevel(50), 'attention');
    assert.equal(fillStatusForLevel(74), 'attention');
    assert.equal(fillStatusForLevel(75), 'critical');
    assert.equal(fillStatusForLevel(100), 'critical');
  });

  it('never fabricates a fill status for a missing or malformed reading', () => {
    assert.equal(fillStatusForLevel(null), 'unknown');
    assert.equal(fillStatusForLevel(undefined), 'unknown');
    assert.equal(fillStatusForLevel(''), 'unknown');
    assert.equal(fillStatusForLevel('not-a-number'), 'unknown');
    assert.equal(fillStatusForLevel(-1), 'unknown');
    assert.equal(fillStatusForLevel(101), 'unknown');
  });
});

describe('connectivity and freshness', () => {
  it('distinguishes never-connected from a stale offline container', () => {
    assert.equal(
      connectivityFor(null, { now: NOW, thresholdMs: THRESHOLD }),
      'never-connected',
    );
    assert.equal(
      connectivityFor(at(30), { now: NOW, thresholdMs: THRESHOLD }),
      'offline',
    );
    assert.equal(
      connectivityFor(at(4), { now: NOW, thresholdMs: THRESHOLD }),
      'online',
    );
  });

  it('keeps last-known severity on an offline critical container', () => {
    const b1 = toContainerDto(CONTAINERS[3], { now: NOW, thresholdMs: THRESHOLD });
    assert.equal(b1.fillLevel, 88);
    assert.equal(b1.fillStatus, 'critical');
    assert.equal(b1.connectivity, 'offline');
    assert.equal(b1.lastKnown, true);
    assert.equal(b1.isStale, true);
  });

  it('returns null fill and unknown status for never-connected containers', () => {
    const b2 = toContainerDto(CONTAINERS[4], { now: NOW, thresholdMs: THRESHOLD });
    assert.equal(b2.fillLevel, null);
    assert.equal(b2.fillStatus, 'unknown');
    assert.equal(b2.connectivity, 'never-connected');
    assert.equal(b2.lastKnown, false);
  });

  it('does not present a numeric fill as a reading when no sync time exists', () => {
    const inconsistent = toContainerDto(
      { ...CONTAINERS[0], lastSyncAt: null },
      { now: NOW, thresholdMs: THRESHOLD },
    );
    assert.equal(inconsistent.connectivity, 'never-connected');
    assert.equal(inconsistent.fillLevel, null);
    assert.equal(inconsistent.fillStatus, 'unknown');
    assert.equal(inconsistent.lastKnown, false);
  });
});

describe('container material classification', () => {
  it('exposes wasteType on container and legacy bin DTOs, null when unclassified', () => {
    const paper = toContainerDto(CONTAINERS[0], { now: NOW, thresholdMs: THRESHOLD });
    assert.equal(paper.wasteType, 'paper');
    assert.equal(
      toBinDto(CONTAINERS[0], { thresholdMs: THRESHOLD }).wasteType,
      'paper',
    );

    const legacy = { ...CONTAINERS[0], wasteType: undefined };
    assert.equal(
      toContainerDto(legacy, { now: NOW, thresholdMs: THRESHOLD }).wasteType,
      null,
    );
    assert.equal(toBinDto(legacy, { thresholdMs: THRESHOLD }).wasteType, null);
  });

  it('reports a missing material once classification has started', () => {
    const integrity = stationIntegrity(STATIONS[0], [
      CONTAINERS[0],
      CONTAINERS[1],
      { ...CONTAINERS[2], wasteType: null },
    ]);

    assert.equal(integrity.valid, false);
    assert.ok(
      integrity.issues.some((issue) => issue.code === 'missing-waste-type'),
    );
  });

  it('reports duplicate material assignments', () => {
    const integrity = stationIntegrity(STATIONS[0], [
      CONTAINERS[0],
      { ...CONTAINERS[1], wasteType: 'paper' },
      CONTAINERS[2],
    ]);

    assert.equal(integrity.valid, false);
    assert.ok(
      integrity.issues.some((issue) => issue.code === 'duplicate-waste-type'),
    );
  });

  it('keeps a fully unclassified legacy station structurally valid', () => {
    const legacy = CONTAINERS.slice(0, 3).map((bin) => ({
      ...bin,
      wasteType: undefined,
    }));
    const integrity = stationIntegrity(STATIONS[0], legacy);

    assert.equal(integrity.valid, true);
    assert.equal(
      integrity.issues.some((issue) => issue.code.includes('waste-type')),
      false,
    );
  });

  it('reports an unsupported value without silently classifying it', () => {
    const unsupported = { ...CONTAINERS[0], wasteType: 'glass' };
    const integrity = stationIntegrity(STATIONS[0], [
      unsupported,
      CONTAINERS[1],
      CONTAINERS[2],
    ]);

    assert.equal(integrity.valid, false);
    assert.ok(
      integrity.issues.some((issue) => issue.code === 'invalid-waste-type'),
    );
    assert.equal(
      toContainerDto(unsupported, { now: NOW, thresholdMs: THRESHOLD }).wasteType,
      null,
    );
  });
});

describe('station query projection', () => {
  it('includes every field the container DTO reads (regression: wasteType)', () => {
    const projected = new Set(CONTAINER_FIELDS.split(/\s+/).filter(Boolean));

    for (const field of [
      'deviceId',
      'stationId',
      'name',
      'fillLevel',
      'status',
      'lastSyncAt',
      'wasteType',
    ]) {
      assert.ok(projected.has(field), `query projection must include ${field}`);
    }
  });

  it('keeps the stored material when a document is reduced to the projection', () => {
    // Reproduces what `.lean()` + a Mongoose projection returns: only the
    // selected fields survive. If `wasteType` is dropped, the DTO silently
    // reports null instead of the stored value.
    const fields = CONTAINER_FIELDS.split(/\s+/).filter(Boolean);
    const selected = Object.fromEntries(
      fields.map((field) => [field, CONTAINERS[0][field]]),
    );

    assert.equal(
      toContainerDto(selected, { now: NOW, thresholdMs: THRESHOLD }).wasteType,
      'paper',
    );
  });
});

describe('station aggregation', () => {
  it('station severity is the highest known fill, ignoring unknown', () => {
    const containers = CONTAINERS.map((bin) =>
      toContainerDto(bin, { now: NOW, thresholdMs: THRESHOLD }),
    );
    assert.equal(stationSeverity(containers.slice(0, 3)), 'attention');
    assert.equal(stationSeverity(containers.slice(3, 6)), 'critical');
    assert.equal(stationSeverity(containers.slice(4, 6)), 'healthy');
    assert.equal(stationSeverity([containers[4]]), 'unknown');
  });

  it('station connectivity is online / partial / offline from container states', () => {
    const containers = CONTAINERS.map((bin) =>
      toContainerDto(bin, { now: NOW, thresholdMs: THRESHOLD }),
    );
    assert.equal(stationConnectivity(containers.slice(0, 3)), 'online');
    assert.equal(stationConnectivity(containers.slice(3, 6)), 'partial');
    assert.equal(stationConnectivity([containers[3], containers[4]]), 'offline');
    assert.equal(stationConnectivity([]), 'offline');
  });

  it('reports incomplete or malformed stations explicitly', () => {
    const incomplete = stationIntegrity(STATIONS[0], CONTAINERS.slice(0, 2));
    assert.equal(incomplete.valid, false);
    assert.equal(incomplete.expected, EXPECTED_CONTAINERS);
    assert.equal(incomplete.actual, 2);
    assert.ok(incomplete.issues.some((issue) => issue.code === 'container-count'));

    const duplicate = stationIntegrity(STATIONS[0], [
      CONTAINERS[0],
      CONTAINERS[0],
      CONTAINERS[1],
    ]);
    assert.equal(duplicate.valid, false);
    assert.ok(duplicate.issues.some((issue) => issue.code === 'duplicate-device-id'));

    const invalid = stationIntegrity(STATIONS[0], [
      CONTAINERS[0],
      CONTAINERS[1],
      { ...CONTAINERS[2], fillLevel: 120 },
    ]);
    assert.equal(invalid.valid, false);
    assert.ok(invalid.issues.some((issue) => issue.code === 'invalid-fill-level'));

    const missingTime = stationIntegrity(STATIONS[0], [
      CONTAINERS[0],
      CONTAINERS[1],
      { ...CONTAINERS[2], lastSyncAt: null },
    ]);
    assert.equal(missingTime.valid, false);
    assert.ok(missingTime.issues.some((issue) => issue.code === 'missing-last-sync'));
  });

  it('builds one station DTO with its authoritative location and three containers', () => {
    const north = toStationDto(STATIONS[0], CONTAINERS.slice(0, 3), {
      now: NOW,
      thresholdMs: THRESHOLD,
    });
    assert.equal(north.stationId, 'STN-NORTH');
    assert.deepEqual(Object.keys(north.location).sort(), ['building', 'lat', 'lng']);
    assert.equal(north.containers.length, 3);
    assert.equal(north.severity, 'attention');
    assert.equal(north.connectivity, 'online');
    assert.equal(north.integrity.valid, true);

    const library = toStationDto(STATIONS[1], CONTAINERS.slice(3, 6), {
      now: NOW,
      thresholdMs: THRESHOLD,
    });
    assert.equal(library.severity, 'critical');
    assert.equal(library.connectivity, 'partial');
    assert.equal(library.integrity.valid, true);
  });
});

describe('station and container KPI arithmetic', () => {
  it('matches the documented two-station fixture exactly', () => {
    const summary = summarizeStationAndContainers(STATIONS, CONTAINERS, {
      now: NOW,
      thresholdMs: THRESHOLD,
    });

    assert.deepEqual(summary.stations, {
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

    assert.deepEqual(summary.containers, {
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

  it('counts fill severity independently when every container has gone offline', () => {
    // Task-2 regression: connectivity collapsing must not erase fill counts.
    const stale = CONTAINERS.map((bin) =>
      bin.lastSyncAt ? { ...bin, lastSyncAt: at(120) } : bin,
    );

    const summary = summarizeStationAndContainers(STATIONS, stale, {
      now: NOW,
      thresholdMs: THRESHOLD,
    });

    assert.deepEqual(summary.containers, {
      total: 6,
      healthy: 3,
      attention: 1,
      critical: 1,
      unknown: 1,
      online: 0,
      offline: 5,
      neverConnected: 1,
      unassigned: 0,
      orphaned: 0,
      onlinePct: 0,
      averageFill: 49,
    });
    assert.equal(summary.stations.online, 0);
    assert.equal(summary.stations.partial, 0);
    assert.equal(summary.stations.offline, 2);
    assert.equal(summary.stations.attention, 1);
    assert.equal(summary.stations.critical, 1);
  });

  it('counts incomplete stations separately and does not treat them as valid', () => {
    const stations = [
      ...STATIONS,
      {
        _id: 'station-partial',
        stationId: 'STN-PARTIAL',
        name: 'Partial (test)',
        location: { building: 'X', lat: 30.8583, lng: 29.57144 },
      },
    ];
    const bins = [
      ...CONTAINERS,
      {
        _id: 'container-p1',
        deviceId: 'ESP32-P1',
        name: 'P1',
        stationId: 'STN-PARTIAL',
        fillLevel: 10,
        status: 'healthy',
        lastSyncAt: at(1),
      },
    ];

    const summary = summarizeStationAndContainers(stations, bins, {
      now: NOW,
      thresholdMs: THRESHOLD,
    });
    assert.equal(summary.stations.total, 3);
    assert.equal(summary.stations.valid, 2);
    assert.equal(summary.stations.incomplete, 1);
    assert.equal(summary.stations.attention, 1);
    assert.equal(summary.stations.critical, 1);
  });

  it('reports legacy bins without stations and orphans separately', () => {
    const bins = [
      ...CONTAINERS,
      {
        _id: 'container-legacy',
        deviceId: 'LEGACY-1',
        name: 'Legacy',
        stationId: null,
        fillLevel: 40,
        status: 'healthy',
        lastSyncAt: at(1),
      },
      {
        _id: 'container-orphan',
        deviceId: 'ORPHAN-1',
        name: 'Orphan',
        stationId: 'STN-MISSING',
        fillLevel: 40,
        status: 'healthy',
        lastSyncAt: at(1),
      },
    ];

    const summary = summarizeStationAndContainers(STATIONS, bins, {
      now: NOW,
      thresholdMs: THRESHOLD,
    });
    assert.equal(summary.containers.unassigned, 1);
    assert.equal(summary.containers.orphaned, 1);
    assert.equal(summary.containers.averageFill, 47.5);
  });
});

// Keep the exported vocabulary in one place; a typo here should fail loudly.
assert.deepEqual(Object.values(CONNECTIVITIES), [
  'online',
  'offline',
  'never-connected',
]);
assert.deepEqual(WASTE_TYPE_VALUES, ['paper', 'plastic', 'liquids']);
