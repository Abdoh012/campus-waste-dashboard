import { Router } from 'express';
import { OFFLINE_THRESHOLD_MS } from '../env.js';
import { notFound } from '../lib/errors.js';
import { Bin } from '../models/Bin.js';
import { Station } from '../models/Station.js';
import { getStationDtos } from '../lib/stats.js';
import { toStationDto } from '../lib/stations.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const CONTAINER_FIELDS = 'deviceId stationId name fillLevel status lastSyncAt';

/**
 * GET /api/stations (auth)
 * → 200: bare array of stations, one entry per station, each with its single
 *   authoritative location and exactly three container states. Incomplete
 *   stations carry an explicit `integrity` report instead of being hidden.
 */
router.get('/', requireAuth, async (_req, res) => {
  const stations = await getStationDtos({ thresholdMs: OFFLINE_THRESHOLD_MS });
  res.json(stations);
});

/**
 * GET /api/stations/:stationId (auth)
 * → 200: one station; 404 `{ message: 'Station not found' }` otherwise.
 */
router.get('/:stationId', requireAuth, async (req, res) => {
  const station = await Station.findOne({ stationId: req.params.stationId }).lean();
  if (!station) throw notFound('Station not found');

  const containers = await Bin.find({ stationId: station.stationId }, CONTAINER_FIELDS).lean();
  res.json(toStationDto(station, containers, { thresholdMs: OFFLINE_THRESHOLD_MS }));
});

export default router;
