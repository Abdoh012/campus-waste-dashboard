import mongoose from 'mongoose';

/**
 * One point-award entry. `at` is server time and is the timestamp the daily
 * points chart buckets by; `capturedAt` is the device time, kept for traceability.
 */
const awardSchema = new mongoose.Schema(
  {
    at: { type: Date, required: true },
    deviceId: { type: String, required: true, trim: true },
    // Additive, optional; older awards simply have no stationId.
    stationId: { type: String, trim: true },
    fillLevel: { type: Number, required: true, min: 0, max: 100 },
    capturedAt: { type: Date, required: true },
    /** Points awarded by this event; the ledger sums this, not an assumed 1. */
    points: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

/**
 * A student's campus-points balance.
 *
 * `studentId` is the natural key the bins report; points accrue when a sort is
 * attributed to a student (`PUT /api/bins/:deviceId/status` with `studentId`).
 */
const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    points: { type: Number, default: 0, min: 0 },
    /**
     * Durable award ledger. Appended atomically with the `points` increment
     * (see lib/points.js), so it is the exact source for daily point history.
     * Awards predating this field are not recoverable and are not backfilled.
     */
    awards: { type: [awardSchema], default: [] },
  },
  { timestamps: true },
);

studentSchema.index({ 'awards.at': 1 });

export const Student = mongoose.model('Student', studentSchema);
