import { ScanEvent } from '../models/ScanEvent.js';
import { Student } from '../models/Student.js';
import { resolveHistoryPeriod } from './periods.js';

/**
 * Fill-level history for the dashboard chart.
 *
 * Buckets are UTC. A bucket's value is the average of every ScanEvent
 * `fillLevel` recorded in it; it is a percentage, never a weight.
 * Only buckets that contain at least one real event are returned — missing
 * buckets are omitted rather than rendered as invented zeros.
 */
export async function queryFillHistory(period, now = new Date()) {
  const range = resolveHistoryPeriod(period, now);

  const rows = await ScanEvent.aggregate([
    { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: range.bucketFormat,
            date: '$createdAt',
            timezone: 'UTC',
          },
        },
        avgFillLevel: { $avg: '$fillLevel' },
        minFillLevel: { $min: '$fillLevel' },
        maxFillLevel: { $max: '$fillLevel' },
        sampleCount: { $sum: 1 },
        devices: { $addToSet: '$deviceId' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    period: range.period,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    timezone: range.timezone,
    bucket: range.bucket,
    unit: 'percent',
    points: rows.map((row) => ({
      bucket: row._id,
      avgFillLevel: Math.round(row.avgFillLevel * 10) / 10,
      minFillLevel: row.minFillLevel,
      maxFillLevel: row.maxFillLevel,
      sampleCount: row.sampleCount,
      binCount: row.devices.length,
    })),
  };
}

/**
 * Daily point awards for the dashboard chart.
 *
 * Points are recorded as `awards` on the Student document, atomically with the
 * points increment (see lib/points.js). Only awards written since that ledger
 * was introduced exist here; earlier all-time totals cannot be reconstructed
 * and are deliberately not backfilled.
 */
export async function queryDailyPoints(period, now = new Date()) {
  const range = resolveHistoryPeriod(period, now);

  const rows = await Student.aggregate([
    { $match: { 'awards.at': { $gte: range.from, $lte: range.to } } },
    { $unwind: '$awards' },
    { $match: { 'awards.at': { $gte: range.from, $lte: range.to } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$awards.at',
            timezone: 'UTC',
          },
        },
        points: { $sum: '$awards.points' },
        students: { $addToSet: '$studentId' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    period: range.period,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    timezone: 'UTC',
    bucket: 'day',
    unit: 'points',
    points: rows.map((row) => ({
      date: row._id,
      points: row.points,
      studentCount: row.students.length,
    })),
  };
}
