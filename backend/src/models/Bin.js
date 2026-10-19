import mongoose from 'mongoose';
import { STATUSES } from '../lib/status.js';
import { WASTE_TYPE_VALUES } from '../lib/waste-types.js';

/**
 * One monitored container and its ESP32 device.
 *
 * `deviceId` is the natural key the hardware knows about — the ingest route
 * addresses containers by it (`PUT /api/bins/:deviceId/status`), while the
 * dashboard reads them by Mongo `_id`. `ScanEvent` and `Student.awards` refer
 * to the same `deviceId`, so history stays valid.
 *
 * `stationId` is the stable grouping key (see `models/Station.js`). The Station
 * owns the authoritative map coordinates; the legacy `location` fields remain
 * optional for backward compatibility with `GET /api/bins` and older records.
 *
 * `wasteType` is an optional material classification for the container, not a
 * sensor reading. It is deliberately separate from `fillLevel`/`lastSyncAt` so
 * legacy containers and real hardware mappings remain valid until classified.
 *
 * `status` stores the last fill-derived value; the read-time `offline` override
 * lives in lib/dto.js and never writes back. `fillStatus`/`connectivity` are
 * computed on read (lib/stations.js) and are the truthful, un-overloaded view.
 */
const binSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    stationId: { type: String, trim: true, index: true },
    // Optional for legacy records; never inferred from a device name or id.
    wasteType: {
      type: String,
      enum: WASTE_TYPE_VALUES,
      default: null,
    },
    location: {
      building: { type: String, trim: true, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    fillLevel: { type: Number, default: null, min: 0, max: 100 },
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
