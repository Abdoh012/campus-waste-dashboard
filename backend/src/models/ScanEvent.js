import mongoose from 'mongoose';

/**
 * One row of raw ingest history: a single reading a device reported.
 *
 * `PUT /api/bins/:deviceId/status` updates the live Bin and appends one of
 * these. The append is best-effort (see routes/bins.js) — a missing history
 * row must never fail the live status update. `GET /api/stats/fill-history`
 * aggregates these rows by server-observed `createdAt`.
 */
const scanEventSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, trim: true },
    // Additive, optional: historical rows written before stations existed keep
    // working. Never required for a scan to be recorded.
    stationId: { type: String, trim: true, index: true },
    studentId: { type: String, trim: true },
    fillLevel: { type: Number, required: true, min: 0, max: 100 },
    capturedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

/** The fill-history endpoint filters its aggregation by server-observed time. */
scanEventSchema.index({ createdAt: 1 });

export const ScanEvent = mongoose.model('ScanEvent', scanEventSchema);
