import { Router } from 'express';
import { OFFLINE_THRESHOLD_MS } from '../env.js';
import { badRequest, notFound } from '../lib/errors.js';
import { toBinDto, toIngestDto } from '../lib/dto.js';
import { statusForFillLevel } from '../lib/status.js';
import { Bin } from '../models/Bin.js';
import { requireAuth, requireDeviceKey } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/bins (auth)
 * → 200: bare array of bins, stable order by deviceId. Fill-derived status
 *   with the read-time offline override applied (lib/dto.js).
 */
router.get('/', requireAuth, async (_req, res) => {
  const bins = await Bin.find().sort({ deviceId: 1 }).lean();
  res.json(bins.map((bin) => toBinDto(bin, { thresholdMs: OFFLINE_THRESHOLD_MS })));
});

/**
 * GET /api/bins/:id (auth)
 * → 200: one bin + createdAt/updatedAt; 404 { message } otherwise
 *   (malformed ObjectIds normalize to the same 404 in middleware/error.js).
 */
router.get('/:id', requireAuth, async (req, res) => {
  const bin = await Bin.findById(req.params.id).lean();
  if (!bin) throw notFound('Bin not found');
  res.json(toBinDto(bin, { detail: true, thresholdMs: OFFLINE_THRESHOLD_MS }));
});

/**
 * PUT /api/bins/:deviceId/status (device ingest)
 *   body: { fillLevel, capturedAt }   — status is computed server-side
 *   200: { deviceId, fillLevel, status, lastSyncAt }
 *   400: { message } on invalid fillLevel / capturedAt
 *   404: { message: 'Device not found' }
 *   401: { message: 'Invalid device key' } — only if DEVICE_INGEST_KEY is set
 */
router.put('/:deviceId/status', requireDeviceKey, async (req, res) => {
  const deviceId = String(req.params.deviceId ?? '').trim();
  const { fillLevel, capturedAt } = req.body ?? {};

  // fillLevel: number or numeric string; must land within 0–100.
  const fill =
    typeof fillLevel === 'number'
      ? fillLevel
      : typeof fillLevel === 'string' && fillLevel.trim() !== ''
        ? Number(fillLevel)
        : NaN;
  if (!Number.isFinite(fill) || fill < 0 || fill > 100) {
    throw badRequest('fillLevel must be a number between 0 and 100');
  }

  // capturedAt: ISO string or epoch-ms; absent means "now".
  let syncedAt = new Date();
  if (capturedAt !== undefined && capturedAt !== null && capturedAt !== '') {
    syncedAt =
      typeof capturedAt === 'number' ? new Date(capturedAt) : new Date(capturedAt);
    if (Number.isNaN(syncedAt.getTime())) {
      throw badRequest('capturedAt must be a valid ISO date or epoch timestamp');
    }
  }

  const updated = await Bin.findOneAndUpdate(
    { deviceId },
    {
      $set: {
        fillLevel: fill,
        status: statusForFillLevel(fill),
        lastSyncAt: syncedAt,
      },
    },
    { new: true },
  ).lean();

  if (!updated) throw notFound('Device not found');

  res.status(200).json(toIngestDto(updated));
});

export default router;
