/**
 * Rich demo dataset for the Campus Waste Dashboard.
 *
 * Pure and deterministic: given a clock, this module produces the live container
 * state, 30 days of fill history, and five demo students with award ledgers —
 * plus the exact aggregates the API is expected to return. It deliberately has
 * no Mongoose dependency, so the entire fixture and its arithmetic can be unit
 * tested without a database.
 *
 * DEMO ONLY. The fill values are synthetic, but they are stored as real
 * `ScanEvent` documents and real `Student.awards` rows so the existing charts
 * read them from their normal sources. Nothing here claims to be a measurement
 * from physical ESP32 hardware.
 *
 * Design (see the reviewed plan):
 *   - one ScanEvent per connected device per UTC day for the last 30 days;
 *   - the newest ScanEvent of each device sits at that device's live
 *     `lastSyncAt`, so the live Bin state and its newest history row agree;
 *   - every award corresponds 1:1 to a ScanEvent, matching `lib/points.js`, so
 *     `Student.points === sum(awards.points)` for every student.
 */
import { STATUSES, isOffline, statusForFillLevel } from '../src/lib/status.js';
import { summarizeStationAndContainers } from '../src/lib/stats.js';
import { resolveHistoryPeriod } from '../src/lib/periods.js';
import { DEMO_BIN_ASSIGNMENTS, DEMO_STATIONS } from './demo-stations.js';

const DAY_MS = 86_400_000;
/** Mirrors the default OFFLINE_THRESHOLD_MINUTES (5) used by the API reads. */
const THRESHOLD_MS = 5 * 60_000;

export const DEMO_HISTORY_DAYS = 30;
export const DEMO_STUDENT_PREFIX = 'STU-DEMO-';

const round1 = (value) => Math.round(value * 10) / 10;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Live container state. `minutesAgo: null` means the container has never
 * connected (null fill, null last-sync). The mix covers healthy / attention /
 * critical / unknown fill and online / offline / never-connected connectivity.
 */
export const DEMO_LIVE_STATE = Object.freeze([
  { deviceId: 'ESP32-BIN-01', fillLevel: 18, minutesAgo: 0 }, // online, healthy
  { deviceId: 'ESP32-BIN-02', fillLevel: 62, minutesAgo: 2 }, // online, attention
  { deviceId: 'ESP32-BIN-03', fillLevel: 88, minutesAgo: 1 }, // online, critical
  { deviceId: 'ESP32-BIN-04', fillLevel: 21, minutesAgo: 240 }, // offline, healthy
  { deviceId: 'ESP32-BIN-05', fillLevel: null, minutesAgo: null }, // never-connected
  { deviceId: 'ESP32-BIN-06', fillLevel: 55, minutesAgo: 90 }, // offline, attention
]);

/** Synthetic daily fill drift (percentage points per day going back in time). */
export const DEMO_FILL_RAMP_PER_DAY = Object.freeze({
  'ESP32-BIN-01': 0.4,
  'ESP32-BIN-02': 0.8,
  'ESP32-BIN-03': 1.2,
  'ESP32-BIN-04': 0.3,
  'ESP32-BIN-06': 0.7,
});

/** Demo students and the exact award count each must end up with. */
export const DEMO_STUDENTS = Object.freeze([
  { studentId: 'STU-DEMO-1001', points: 12 },
  { studentId: 'STU-DEMO-1002', points: 8 },
  { studentId: 'STU-DEMO-1003', points: 5 },
  { studentId: 'STU-DEMO-1004', points: 3 },
  { studentId: 'STU-DEMO-1005', points: 1 },
]);

/**
 * Which student is credited on which day (key = days ago). Each entry is placed
 * on a distinct connected device for that day, so one device never carries two
 * students in the same scan.
 */
export const DEMO_AWARD_PLAN = Object.freeze({
  0: ['STU-DEMO-1001', 'STU-DEMO-1004'],
  1: ['STU-DEMO-1002'],
  2: ['STU-DEMO-1001', 'STU-DEMO-1001', 'STU-DEMO-1003', 'STU-DEMO-1005'],
  3: ['STU-DEMO-1004'],
  4: ['STU-DEMO-1001', 'STU-DEMO-1001', 'STU-DEMO-1002'],
  5: ['STU-DEMO-1003'],
  6: ['STU-DEMO-1001', 'STU-DEMO-1002'],
  7: ['STU-DEMO-1001'],
  8: ['STU-DEMO-1002'],
  9: ['STU-DEMO-1003'],
  10: ['STU-DEMO-1001'],
  11: ['STU-DEMO-1002'],
  12: ['STU-DEMO-1001'],
  13: ['STU-DEMO-1002'],
  14: ['STU-DEMO-1004'],
  15: ['STU-DEMO-1001'],
  16: ['STU-DEMO-1002'],
  17: ['STU-DEMO-1001'],
  18: ['STU-DEMO-1002'],
  19: ['STU-DEMO-1001'],
  20: ['STU-DEMO-1003'],
  21: ['STU-DEMO-1003'],
});

/** Connected devices in the fixed order awards are handed out. */
const CONNECTED_DEVICE_ORDER = Object.freeze(
  DEMO_LIVE_STATE.filter((state) => state.fillLevel !== null).map(
    (state) => state.deviceId,
  ),
);

/** Group scans by UTC calendar day into ascending chart buckets. */
function groupFillBuckets(scanEvents) {
  const buckets = new Map();

  for (const scan of scanEvents) {
    const bucket = scan.createdAt.toISOString().slice(0, 10);
    const entry = buckets.get(bucket) ?? {
      sum: 0,
      count: 0,
      min: scan.fillLevel,
      max: scan.fillLevel,
      devices: new Set(),
    };
    entry.sum += scan.fillLevel;
    entry.count += 1;
    entry.min = Math.min(entry.min, scan.fillLevel);
    entry.max = Math.max(entry.max, scan.fillLevel);
    entry.devices.add(scan.deviceId);
    buckets.set(bucket, entry);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, entry]) => ({
      bucket,
      avg: round1(entry.sum / entry.count),
      min: entry.min,
      max: entry.max,
      sampleCount: entry.count,
      binCount: entry.devices.size,
    }));
}

/** Group awards by UTC calendar day into ascending chart buckets. */
function groupPointBuckets(students) {
  const buckets = new Map();

  for (const student of students) {
    for (const award of student.awards) {
      const bucket = award.at.toISOString().slice(0, 10);
      const entry = buckets.get(bucket) ?? { points: 0, students: new Set() };
      entry.points += award.points;
      entry.students.add(student.studentId);
      buckets.set(bucket, entry);
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, entry]) => ({
      bucket,
      points: entry.points,
      studentCount: entry.students.size,
    }));
}

/** Keep only buckets inside a named history period (same range the API uses). */
function withinPeriod(rows, period, now) {
  const range = resolveHistoryPeriod(period, now);
  const from = range.from.toISOString().slice(0, 10);
  const to = range.to.toISOString().slice(0, 10);
  return rows.filter((row) => row.bucket >= from && row.bucket <= to);
}

/**
 * Build the whole fixture for a given clock.
 *
 * @param {Date} [now]
 * @returns {{ bins: object[], scanEvents: object[], students: object[], expected: object }}
 */
export function buildDemoHistory(now = new Date()) {
  const nowMs = now.getTime();
  const assignment = new Map(
    DEMO_BIN_ASSIGNMENTS.map((entry) => [entry.deviceId, entry]),
  );

  const bins = DEMO_LIVE_STATE.map(({ deviceId, fillLevel, minutesAgo }) => {
    const demo = assignment.get(deviceId);
    if (!demo) {
      throw new Error(`Demo device ${deviceId} has no station/material assignment.`);
    }
    const lastSyncAt =
      minutesAgo === null ? null : new Date(nowMs - minutesAgo * 60_000);

    return {
      deviceId,
      stationId: demo.stationId,
      wasteType: demo.wasteType,
      fillLevel,
      status:
        fillLevel === null ? STATUSES.HEALTHY : statusForFillLevel(fillLevel),
      lastSyncAt,
    };
  });

  const liveByDevice = new Map(bins.map((bin) => [bin.deviceId, bin]));
  const scanEvents = [];
  const scanByDeviceDay = new Map();

  for (const deviceId of CONNECTED_DEVICE_ORDER) {
    const live = liveByDevice.get(deviceId);
    const base = live.lastSyncAt.getTime();
    const ramp = DEMO_FILL_RAMP_PER_DAY[deviceId];

    for (let day = 0; day < DEMO_HISTORY_DAYS; day += 1) {
      const at = new Date(base - day * DAY_MS);
      const fillLevel = round1(clamp(live.fillLevel - ramp * day, 0, 100));
      const scan = {
        deviceId,
        stationId: live.stationId,
        fillLevel,
        capturedAt: at,
        createdAt: at,
      };
      scanEvents.push(scan);
      scanByDeviceDay.set(`${deviceId}|${day}`, scan);
    }
  }

  for (const [dayKey, studentIds] of Object.entries(DEMO_AWARD_PLAN)) {
    const day = Number(dayKey);
    studentIds.forEach((studentId, index) => {
      const deviceId = CONNECTED_DEVICE_ORDER[index];
      const scan = scanByDeviceDay.get(`${deviceId}|${day}`);
      if (!scan) {
        throw new Error(
          `Award plan references ${deviceId} on day ${day}, which has no scan.`,
        );
      }
      if (scan.studentId) {
        throw new Error(`Scan ${deviceId} on day ${day} already has a student.`);
      }
      scan.studentId = studentId;
    });
  }

  const students = DEMO_STUDENTS.map(({ studentId, points }) => {
    const awards = scanEvents
      .filter((scan) => scan.studentId === studentId)
      .map((scan) => ({
        at: scan.createdAt,
        deviceId: scan.deviceId,
        stationId: scan.stationId,
        fillLevel: scan.fillLevel,
        capturedAt: scan.capturedAt,
        points: 1,
      }))
      .sort((a, b) => a.at.getTime() - b.at.getTime());

    if (awards.length !== points) {
      throw new Error(
        `Student ${studentId} plan yields ${awards.length} awards but declares ${points} points.`,
      );
    }
    return { studentId, points, awards };
  });

  const stationsForDto = DEMO_STATIONS.map((station) => ({
    ...station,
    _id: station.stationId,
  }));
  const binsForDto = bins.map((bin) => ({ ...bin, _id: bin.deviceId }));
  const summary = summarizeStationAndContainers(stationsForDto, binsForDto, {
    now: nowMs,
    thresholdMs: THRESHOLD_MS,
  });

  const binsLegacy = { total: bins.length, healthy: 0, attention: 0, critical: 0, offline: 0 };
  for (const bin of bins) {
    const effective = isOffline(bin.lastSyncAt, {
      now: nowMs,
      thresholdMs: THRESHOLD_MS,
    })
      ? STATUSES.OFFLINE
      : bin.status;
    binsLegacy[effective] += 1;
  }
  binsLegacy.operationalPct = round1(
    ((binsLegacy.total - binsLegacy.offline) / binsLegacy.total) * 100,
  );

  const fillBuckets = groupFillBuckets(scanEvents);
  const pointBuckets = groupPointBuckets(students);

  const expected = {
    bins,
    stations: summary.stations,
    containers: summary.containers,
    binsLegacy,
    points: {
      totalPoints: students.reduce((total, student) => total + student.points, 0),
      studentCount: students.length,
    },
    scanEventCount: scanEvents.length,
    awardCount: students.reduce((total, student) => total + student.awards.length, 0),
    students: students.map((student) => ({
      studentId: student.studentId,
      points: student.points,
      awards: student.awards.length,
    })),
    fillHistory: {
      last7: withinPeriod(fillBuckets, 'last7', now),
      last30: withinPeriod(fillBuckets, 'last30', now),
    },
    pointsDaily: {
      last7: withinPeriod(pointBuckets, 'last7', now),
    },
  };

  return { bins, scanEvents, students, expected };
}

/** The six demo device ids this fixture owns. */
export const DEMO_DEVICE_IDS = Object.freeze(
  DEMO_BIN_ASSIGNMENTS.map((entry) => entry.deviceId),
);

/** The demo student ids this fixture owns. */
export const DEMO_STUDENT_IDS = Object.freeze(
  DEMO_STUDENTS.map((student) => student.studentId),
);
