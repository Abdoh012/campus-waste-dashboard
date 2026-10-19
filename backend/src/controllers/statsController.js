// src/controllers/statsController.js
import { getOverviewStats } from '../lib/stats.js';
import { queryDailyPoints, queryFillHistory } from '../lib/history.js';
import { isHistoryPeriod } from '../lib/periods.js';
import { badRequest } from '../lib/errors.js';

/** Read and validate `?period=` once for both history handlers. */
function readPeriod(req, fallback) {
  const raw = req.query.period;
  if (raw === undefined) return fallback;
  if (typeof raw !== 'string' || !isHistoryPeriod(raw)) {
    throw badRequest('period must be one of: last7, last30, year');
  }
  return raw;
}

export async function getStats(req, res, next) {
  try {
    const stats = await getOverviewStats();
    return res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getFillHistory(req, res, next) {
  try {
    const period = readPeriod(req, 'last30');
    const history = await queryFillHistory(period);
    return res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

export async function getDailyPoints(req, res, next) {
  try {
    const period = readPeriod(req, 'last7');
    const daily = await queryDailyPoints(period);
    return res.status(200).json(daily);
  } catch (err) {
    next(err);
  }
}
