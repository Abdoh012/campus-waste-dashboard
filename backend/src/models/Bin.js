import mongoose from 'mongoose';
import { STATUSES } from '../lib/status.js';

/**
 * A physical smart bin and its ESP32 device.
 *
 * `deviceId` is the natural key the hardware knows about — the ingest route
 * addresses bins by it (`PUT /api/bins/:deviceId/status`), while the
 * dashboard reads them by Mongo `_id`.
 *
 * `status` stores the fill-derived value from the most recent report; the
 * read-time `offline` override lives in lib/dto.js and never writes back.
 */
const binSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: {
      building: { type: String, required: true, trim: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    fillLevel: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: Object.values(STATUSES),
      default: STATUSES.HEALTHY,
    },
    lastSyncAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Bin = mongoose.model('Bin', binSchema);
