/**
 * Pure planning for `scripts/seed.js`.
 *
 * Kept free of Mongoose so the "never overwrite an existing bin" rule can be
 * tested without a database. The seed script reads the existing demo bins,
 * asks `planSeedBins` which are missing, and creates only those — an existing
 * bin keeps its fillLevel, lastSyncAt, status, location, name, stationId and
 * wasteType.
 */

/** The device ids the demo seed owns; `--reset` is scoped to exactly these. */
export function demoDeviceIds(samples = []) {
  return samples.map((sample) => sample.deviceId);
}

/**
 * Split the demo samples into those that must be created and those already
 * present. Existing device ids are skipped, never overwritten.
 */
export function planSeedBins({ existingBins = [], samples = [] } = {}) {
  const present = new Set(existingBins.map((bin) => bin.deviceId));

  const create = [];
  const skip = [];

  for (const sample of samples) {
    if (present.has(sample.deviceId)) skip.push(sample.deviceId);
    else create.push(sample);
  }

  return { create, skip };
}
