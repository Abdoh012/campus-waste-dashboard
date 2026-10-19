/**
 * Apply / verify the rich demo dataset against the *current* mongoose
 * connection. This module owns no target-safety logic: the guarded Atlas script
 * (`scripts/seed-campus-demo.js`) and the integration test decide which database
 * is safe to touch, then call in here.
 *
 * `applyDemoHistory` is idempotent and strictly scoped: it updates only the six
 * demo bins and replaces only demo-owned ScanEvents and STU-DEMO- students. It
 * never touches `users`, never drops a collection and never deletes a document
 * outside the demo id sets.
 */
import { Bin } from '../src/models/Bin.js';
import { Station } from '../src/models/Station.js';
import { Student } from '../src/models/Student.js';
import { ScanEvent } from '../src/models/ScanEvent.js';
import { summarizeStationAndContainers } from '../src/lib/stats.js';
import { queryDailyPoints, queryFillHistory } from '../src/lib/history.js';
import {
  DEMO_DEVICE_IDS,
  DEMO_STUDENT_IDS,
  buildDemoHistory,
} from './demo-history.js';

const THRESHOLD_MS = 5 * 60_000;

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** The chart-relevant part of a fill bucket (min/max are reported separately). */
const fillSummary = (rows) =>
  rows.map((row) => ({ bucket: row.bucket, avg: row.avg, sampleCount: row.sampleCount }));

/**
 * Write the demo fixture. Returns the generated data plus how many demo-owned
 * rows were replaced, so callers can log a truthful summary.
 */
export async function applyDemoHistory({ now = new Date(), log = () => {} } = {}) {
  const data = buildDemoHistory(now);

  for (const bin of data.bins) {
    const result = await Bin.updateOne(
      { deviceId: bin.deviceId },
      {
        $set: {
          fillLevel: bin.fillLevel,
          status: bin.status,
          lastSyncAt: bin.lastSyncAt,
        },
      },
    );
    if (result.matchedCount !== 1) {
      throw new Error(
        `Demo bin ${bin.deviceId} was not found; refusing to seed a partial dataset.`,
      );
    }
  }
  log(`updated live state for ${data.bins.length} demo bins`);

  const scans = await ScanEvent.deleteMany({ deviceId: { $in: DEMO_DEVICE_IDS } });
  await ScanEvent.insertMany(data.scanEvents, { timestamps: false });
  log(`replaced ScanEvents: -${scans.deletedCount} +${data.scanEvents.length}`);

  const students = await Student.deleteMany({ studentId: { $in: DEMO_STUDENT_IDS } });
  await Student.insertMany(data.students);
  log(`replaced demo students: -${students.deletedCount} +${data.students.length}`);

  return {
    data,
    deletedScans: scans.deletedCount,
    deletedStudents: students.deletedCount,
  };
}

/** Read back the demo slice of the database in the shape `expected` uses. */
export async function readDemoHistory({ now = new Date(), thresholdMs = THRESHOLD_MS } = {}) {
  const [stations, bins, demoScans, demoStudents] = await Promise.all([
    Station.find().lean(),
    Bin.find().lean(),
    ScanEvent.find({ deviceId: { $in: DEMO_DEVICE_IDS } })
      .sort({ createdAt: 1 })
      .lean(),
    Student.find({ studentId: { $in: DEMO_STUDENT_IDS } }).lean(),
  ]);

  const summary = summarizeStationAndContainers(stations, bins, {
    now: now.getTime(),
    thresholdMs,
  });

  const latestScans = {};
  const scansPerDevice = {};
  for (const scan of demoScans) {
    scansPerDevice[scan.deviceId] = (scansPerDevice[scan.deviceId] ?? 0) + 1;
    const at = new Date(scan.createdAt).toISOString();
    if (!latestScans[scan.deviceId] || at > latestScans[scan.deviceId].createdAt) {
      latestScans[scan.deviceId] = {
        fillLevel: scan.fillLevel,
        createdAt: at,
        studentId: scan.studentId ?? null,
      };
    }
  }

  const [fill7, fill30, points7] = await Promise.all([
    queryFillHistory('last7', now),
    queryFillHistory('last30', now),
    queryDailyPoints('last7', now),
  ]);

  return {
    stations: summary.stations,
    containers: summary.containers,
    points: {
      totalPoints: demoStudents.reduce((total, student) => total + student.points, 0),
      studentCount: demoStudents.length,
    },
    students: demoStudents
      .map((student) => ({
        studentId: student.studentId,
        points: student.points,
        awards: student.awards?.length ?? 0,
      }))
      .sort((a, b) => a.studentId.localeCompare(b.studentId)),
    scanEventCount: demoScans.length,
    scansPerDevice,
    latestScans,
    fill7: fill7.points.map((point) => ({
      bucket: point.bucket,
      avg: point.avgFillLevel,
      sampleCount: point.sampleCount,
    })),
    fill30: fill30.points.map((point) => ({
      bucket: point.bucket,
      avg: point.avgFillLevel,
      sampleCount: point.sampleCount,
    })),
    points7: points7.points.map((point) => ({
      bucket: point.date,
      points: point.points,
      studentCount: point.studentCount,
    })),
  };
}

/**
 * Compare the live database slice with what the fixture promised.
 *
 * @returns {{ ok: boolean, problems: string[], expected: object, actual: object }}
 */
export async function checkDemoHistory({ now = new Date(), thresholdMs = THRESHOLD_MS } = {}) {
  const { expected } = buildDemoHistory(now);
  const actual = await readDemoHistory({ now, thresholdMs });
  const problems = [];

  if (!sameJson(actual.stations, expected.stations)) {
    problems.push(
      `station summary mismatch: expected ${JSON.stringify(expected.stations)}, got ${JSON.stringify(actual.stations)}`,
    );
  }
  if (!sameJson(actual.containers, expected.containers)) {
    problems.push(
      `container summary mismatch: expected ${JSON.stringify(expected.containers)}, got ${JSON.stringify(actual.containers)}`,
    );
  }
  if (!sameJson(actual.points, expected.points)) {
    problems.push(
      `points summary mismatch: expected ${JSON.stringify(expected.points)}, got ${JSON.stringify(actual.points)}`,
    );
  }
  if (actual.scanEventCount !== expected.scanEventCount) {
    problems.push(
      `ScanEvent count: expected ${expected.scanEventCount}, got ${actual.scanEventCount}`,
    );
  }

  const expectedStudents = [...expected.students].sort((a, b) =>
    a.studentId.localeCompare(b.studentId),
  );
  if (!sameJson(actual.students, expectedStudents)) {
    problems.push(
      `student ledgers mismatch: expected ${JSON.stringify(expectedStudents)}, got ${JSON.stringify(actual.students)}`,
    );
  }

  const expectedFill7 = fillSummary(expected.fillHistory.last7);
  if (!sameJson(actual.fill7, expectedFill7)) {
    problems.push(
      `fill history (last7) mismatch: expected ${JSON.stringify(expectedFill7)}, got ${JSON.stringify(actual.fill7)}`,
    );
  }
  const expectedFill30 = fillSummary(expected.fillHistory.last30);
  if (!sameJson(actual.fill30, expectedFill30)) {
    problems.push(
      `fill history (last30) mismatch: expected ${JSON.stringify(expectedFill30)}, got ${JSON.stringify(actual.fill30)}`,
    );
  }
  if (!sameJson(actual.points7, expected.pointsDaily.last7)) {
    problems.push(
      `points history (last7) mismatch: expected ${JSON.stringify(expected.pointsDaily.last7)}, got ${JSON.stringify(actual.points7)}`,
    );
  }

  for (const bin of expected.bins) {
    if (bin.lastSyncAt === null) {
      if (actual.latestScans[bin.deviceId]) {
        problems.push(
          `never-connected ${bin.deviceId} unexpectedly has a ScanEvent.`,
        );
      }
      continue;
    }
    const latest = actual.latestScans[bin.deviceId];
    if (!latest) {
      problems.push(`${bin.deviceId} has no ScanEvent history.`);
      continue;
    }
    if (latest.fillLevel !== bin.fillLevel) {
      problems.push(
        `${bin.deviceId} newest scan fill ${latest.fillLevel} ≠ live ${bin.fillLevel}`,
      );
    }
    if (latest.createdAt !== bin.lastSyncAt.toISOString()) {
      problems.push(
        `${bin.deviceId} newest scan time ${latest.createdAt} ≠ live ${bin.lastSyncAt.toISOString()}`,
      );
    }
  }

  return { ok: problems.length === 0, problems, expected, actual };
}
