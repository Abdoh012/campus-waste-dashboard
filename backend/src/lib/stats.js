// src/lib/stats.js
import { OFFLINE_THRESHOLD_MS } from '../env.js';
import { Bin } from '../models/Bin.js';
import { Student } from '../models/Student.js';
import { isOffline } from './status.js';

/** Counts bins by their *effective* status (same offline override as toBinDto). */
async function getBinsSummary({ thresholdMs = OFFLINE_THRESHOLD_MS } = {}) {
  const bins = await Bin.find({}, 'status lastSyncAt').lean();

  const summary = { total: bins.length, healthy: 0, attention: 0, critical: 0, offline: 0 };

  for (const bin of bins) {
    const effectiveStatus = isOffline(bin.lastSyncAt, { thresholdMs }) ? 'offline' : bin.status;
    if (effectiveStatus in summary) summary[effectiveStatus] += 1;
  }

  summary.operationalPct = summary.total
    ? Number((((summary.total - summary.offline) / summary.total) * 100).toFixed(1))
    : 0;

  return summary;
}

async function getPointsSummary() {
  const result = await Student.aggregate([
    { $group: { _id: null, totalPoints: { $sum: '$points' }, studentCount: { $sum: 1 } } },
  ]);
  const { totalPoints = 0, studentCount = 0 } = result[0] || {};
  return { totalPoints, studentCount };
}

export async function getOverviewStats(opts) {
  const [bins, points] = await Promise.all([getBinsSummary(opts), getPointsSummary()]);
  return { bins, points };
}
