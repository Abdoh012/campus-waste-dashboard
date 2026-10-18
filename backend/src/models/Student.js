import mongoose from 'mongoose';

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
  },
  { timestamps: true },
);

export const Student = mongoose.model('Student', studentSchema);
