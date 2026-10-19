import { describe, expect, it } from 'vitest';
import type { StationDto } from '../src/services/stationsApi';
import { toStationLocations } from '../src/services/stationsApi';
import { binTone, locationTone } from '../src/features/dashboard/campusMapData';

const CONTAINERS = [
  {
    _id: 'c-a1',
    deviceId: 'ESP32-A1',
    name: 'A1',
    stationId: 'STN-NORTH',
    wasteType: 'paper' as const,
    fillLevel: 18,
    fillStatus: 'healthy' as const,
    connectivity: 'online' as const,
    lastSyncAt: '2026-10-19T11:59:00.000Z',
    lastKnown: false,
    isStale: false,
  },
  {
    _id: 'c-a2',
    deviceId: 'ESP32-A2',
    name: 'A2',
    stationId: 'STN-NORTH',
    wasteType: 'plastic' as const,
    fillLevel: 62,
    fillStatus: 'attention' as const,
    connectivity: 'online' as const,
    lastSyncAt: '2026-10-19T11:58:00.000Z',
    lastKnown: false,
    isStale: false,
  },
  {
    _id: 'c-a3',
    deviceId: 'ESP32-A3',
    name: 'A3',
    stationId: 'STN-NORTH',
    wasteType: 'liquids' as const,
    fillLevel: 47,
    fillStatus: 'healthy' as const,
    connectivity: 'online' as const,
    lastSyncAt: '2026-10-19T11:57:00.000Z',
    lastKnown: false,
    isStale: false,
  },
  {
    _id: 'c-b1',
    deviceId: 'ESP32-B1',
    name: 'B1',
    stationId: 'STN-LIBRARY',
    wasteType: 'paper' as const,
    fillLevel: 88,
    fillStatus: 'critical' as const,
    connectivity: 'offline' as const,
    lastSyncAt: '2026-10-19T11:30:00.000Z',
    lastKnown: true,
    isStale: true,
  },
  {
    _id: 'c-b2',
    deviceId: 'ESP32-B2',
    name: 'B2',
    stationId: 'STN-LIBRARY',
    wasteType: 'plastic' as const,
    fillLevel: null,
    fillStatus: 'unknown' as const,
    connectivity: 'never-connected' as const,
    lastSyncAt: null,
    lastKnown: false,
    isStale: false,
  },
  {
    _id: 'c-b3',
    deviceId: 'ESP32-B3',
    name: 'B3',
    stationId: 'STN-LIBRARY',
    wasteType: 'liquids' as const,
    fillLevel: 30,
    fillStatus: 'healthy' as const,
    connectivity: 'online' as const,
    lastSyncAt: '2026-10-19T11:59:00.000Z',
    lastKnown: false,
    isStale: false,
  },
];

const STATIONS: readonly StationDto[] = [
  {
    _id: 'station-north',
    stationId: 'STN-NORTH',
    name: 'North Gate (test)',
    location: { building: 'North Gate', lat: 30.8574, lng: 29.57024 },
    containers: CONTAINERS.slice(0, 3),
    severity: 'attention',
    connectivity: 'online',
    integrity: { expected: 3, actual: 3, valid: true, issues: [] },
    lastSyncAt: '2026-10-19T11:59:00.000Z',
  },
  {
    _id: 'station-library',
    stationId: 'STN-LIBRARY',
    name: 'Library (test)',
    location: { building: 'Library', lat: 30.8592, lng: 29.57264 },
    containers: CONTAINERS.slice(3, 6),
    severity: 'critical',
    connectivity: 'partial',
    integrity: { expected: 3, actual: 3, valid: true, issues: [] },
    lastSyncAt: '2026-10-19T11:59:00.000Z',
  },
];

describe('station map aggregation', () => {
  it('produces exactly one marker location per station, with all three containers', () => {
    const result = toStationLocations(STATIONS);

    expect(result.total).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.locations).toHaveLength(2);
    expect(result.locations.map((location) => location.stationId)).toEqual([
      'STN-LIBRARY',
      'STN-NORTH',
    ]);
    expect(result.locations.every((location) => location.bins.length === 3)).toBe(true);
    expect(new Set(result.locations.map((location) => location.id)).size).toBe(2);

    // Each container carries its material classification through the mapping.
    expect(
      result.locations.flatMap((location) => location.bins.map((bin) => bin.wasteType)),
    ).toEqual(['paper', 'plastic', 'liquids', 'paper', 'plastic', 'liquids']);
  });

  it('keeps the station critical tone even when its reading is offline', () => {
    const result = toStationLocations(STATIONS);
    const library = result.locations.find(
      (location) => location.stationId === 'STN-LIBRARY',
    );

    expect(library).toBeDefined();
    expect(library?.severity).toBe('critical');
    expect(library?.connectivity).toBe('partial');
    expect(library ? locationTone(library) : null).toBe('red');

    const b1 = library?.bins.find((bin) => bin.deviceId === 'ESP32-B1');
    expect(b1?.fill).toBe(88);
    expect(b1?.fillStatus).toBe('critical');
    expect(b1?.connectivity).toBe('offline');
    expect(b1?.lastKnown).toBe(true);
    expect(b1 ? binTone(b1) : null).toBe('red');
  });

  it('preserves a never-connected container as no reading, not 0%', () => {
    const result = toStationLocations(STATIONS);
    const b2 = result.locations
      .flatMap((location) => location.bins)
      .find((bin) => bin.deviceId === 'ESP32-B2');

    expect(b2?.fill).toBeNull();
    expect(b2?.fillStatus).toBe('unknown');
    expect(b2?.connectivity).toBe('never-connected');
    expect(b2 ? binTone(b2) : null).toBe('offline');
  });

  it('skips stations without valid coordinates and reports the count', () => {
    const stations: readonly StationDto[] = [
      ...STATIONS,
      {
        ...STATIONS[0],
        _id: 'station-no-coords',
        stationId: 'STN-NO-COORDS',
        name: 'No coordinates (test)',
        location: { building: 'Unknown', lat: null, lng: null },
      },
    ];

    const result = toStationLocations(stations);
    expect(result.total).toBe(3);
    expect(result.skipped).toBe(1);
    expect(result.locations).toHaveLength(2);
  });

  it('numbers markers deterministically by stationId', () => {
    const result = toStationLocations([...STATIONS].reverse());
    expect(result.locations.map((location) => location.number)).toEqual(['01', '02']);
    expect(result.locations.map((location) => location.stationId)).toEqual([
      'STN-LIBRARY',
      'STN-NORTH',
    ]);
  });
});
