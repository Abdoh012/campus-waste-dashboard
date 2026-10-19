import { Student } from '../models/Student.js';

const MAX_ATTEMPTS = 3;

/**
 * Record one point award and increment the student's total in a single
 * document update.
 *
 * Keeping the ledger row (`awards`) and the balance (`points`) on the same
 * Student document makes the pair atomic without a transaction: a partial
 * failure cannot award points without a ledger row, or append a row without
 * awarding the point.
 *
 * Two concurrent requests for a student that does not exist yet can race on
 * the unique `studentId` upsert (E11000). The retry then matches the document
 * created by the other request, so both points and awards are applied.
 */
export async function awardPoint({
  studentId,
  deviceId,
  stationId,
  fillLevel,
  capturedAt,
  points = 1,
}) {
  const award = {
    at: new Date(),
    deviceId,
    ...(stationId ? { stationId } : {}),
    fillLevel,
    capturedAt,
    points,
  };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      await Student.updateOne(
        { studentId },
        { $inc: { points }, $push: { awards: award } },
        { upsert: true, setDefaultsOnInsert: false },
      );
      return;
    } catch (err) {
      if (err?.code !== 11000 || attempt === MAX_ATTEMPTS - 1) throw err;
    }
  }
}
