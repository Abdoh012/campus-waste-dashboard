// src/controllers/statsController.js
import { getOverviewStats } from '../lib/stats.js';

export async function getStats(req, res, next) {
  try {
    const stats = await getOverviewStats();
    return res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}