// src/controllers/binsController.js
import Bin from '../models/Bin.js';
import Student from '../models/Student.js';
import { computeStatus } from '../lib/status.js';
import { toIngestDto } from '../lib/dto/bins.js';

export async function updateBinStatus(req, res, next) {
  try {
    const { deviceId } = req.params;
    const { fillLevel, capturedAt, studentId } = req.validatedBody;

    const bin = await Bin.findOne({ deviceId });
    if (!bin) {
      return res.status(404).json({ message: 'Device not found' });
    }

    bin.fillLevel = fillLevel;
    bin.status = computeStatus(fillLevel);
    bin.lastSyncAt = capturedAt ? new Date(capturedAt) : new Date();
    await bin.save();

    let pointsAwarded = false;
    if (studentId) {
      await Student.findOneAndUpdate(
        { studentId },
        { $inc: { points: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      pointsAwarded = true;
    }

    return res.status(200).json(toIngestDto(bin, { pointsAwarded }));
  } catch (err) {
    next(err);
  }
}