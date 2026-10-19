/**
 * Pure tests for the rich demo fixture. No database: the whole dataset and its
 * arithmetic are deterministic once the clock is fixed.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEMO_HISTORY_DAYS,
  buildDemoHistory,
} from '../scripts/demo-history.js';

const NOW = new Date('2026-10-19T20:24:00.000Z');

describe('buildDemoHistory', () => {
  it('is deterministic for a fixed clock', () => {
    assert.equal(
      JSON.stringify(buildDemoHistory(NOW)),
      JSON.stringify(buildDemoHistory(NOW)),
    );
  });

  it('produces 30 days of scans for the five connected devices only', () => {
    const { scanEvents, expected } = buildDemoHistory(NOW);
    assert.equal(scanEvents.length, 5 * DEMO_HISTORY_DAYS);
    assert.equal(expected.scanEventCount, 150);

    const devices = new Set(scanEvents.map((scan) => scan.deviceId));
    assert.equal(devices.has('ESP32-BIN-05'), false, 'never-connected bin has no history');
    assert.equal(devices.size, 5);
  });

  it('keeps each student balance equal to the sum of their awards', () => {
    const { students, expected } = buildDemoHistory(NOW);
    assert.equal(students.length, 5);
    assert.equal(expected.awardCount, 29);
    assert.equal(expected.points.totalPoints, 29);
    assert.equal(expected.points.studentCount, 5);

    for (const student of students) {
      assert.equal(student.points, student.awards.length, student.studentId);
      assert.equal(
        student.awards.reduce((total, award) => total + award.points, 0),
        student.points,
      );
    }
  });

  it('makes every award reference a real scan of the same device and time', () => {
    const { scanEvents, students } = buildDemoHistory(NOW);
    const key = (scan) =>
      `${scan.deviceId}|${scan.createdAt.toISOString()}|${scan.fillLevel}`;
    const scans = new Set(scanEvents.filter((scan) => scan.studentId).map(key));

    let awards = 0;
    for (const student of students) {
      for (const award of student.awards) {
        awards += 1;
        assert.ok(
          scans.has(`${award.deviceId}|${award.at.toISOString()}|${award.fillLevel}`),
          `award ${student.studentId} ${award.deviceId} has no matching scan`,
        );
      }
    }
    assert.equal(awards, 29);
  });

  it('aligns each connected bin with its newest scan and never invents one', () => {
    const { bins, scanEvents } = buildDemoHistory(NOW);

    for (const bin of bins) {
      const scans = scanEvents.filter((scan) => scan.deviceId === bin.deviceId);

      if (bin.lastSyncAt === null) {
        assert.equal(scans.length, 0, `${bin.deviceId} must have no history`);
        continue;
      }

      const newestAt = Math.max(...scans.map((scan) => scan.createdAt.getTime()));
      assert.equal(newestAt, bin.lastSyncAt.getTime(), bin.deviceId);
      const newest = scans.find((scan) => scan.createdAt.getTime() === newestAt);
      assert.equal(newest.fillLevel, bin.fillLevel, bin.deviceId);
    }
  });

  it('matches the reviewed KPI aggregates exactly', () => {
    const { expected } = buildDemoHistory(NOW);

    assert.deepEqual(expected.stations, {
      total: 2,
      valid: 2,
      incomplete: 0,
      healthy: 0,
      attention: 1,
      critical: 1,
      unknown: 0,
      online: 1,
      partial: 0,
      offline: 1,
      fullyConnectedPct: 50,
    });

    assert.deepEqual(expected.containers, {
      total: 6,
      healthy: 2,
      attention: 2,
      critical: 1,
      unknown: 1,
      online: 3,
      offline: 2,
      neverConnected: 1,
      unassigned: 0,
      orphaned: 0,
      onlinePct: 50,
      averageFill: 48.8,
    });

    assert.deepEqual(expected.binsLegacy, {
      total: 6,
      healthy: 1,
      attention: 1,
      critical: 1,
      offline: 3,
      operationalPct: 50,
    });
  });

  it('matches the reviewed chart buckets exactly', () => {
    const { expected } = buildDemoHistory(NOW);

    assert.equal(expected.fillHistory.last7.length, 7);
    assert.deepEqual(
      expected.fillHistory.last7.map((bucket) => bucket.avg),
      [44.7, 45.4, 46.1, 46.8, 47.4, 48.1, 48.8],
    );
    assert.equal(expected.fillHistory.last30.length, 30);
    for (const bucket of expected.fillHistory.last30) {
      assert.equal(bucket.sampleCount, 5);
    }

    assert.deepEqual(
      expected.pointsDaily.last7.map((bucket) => bucket.points),
      [2, 1, 3, 1, 4, 1, 2],
    );
  });
});
