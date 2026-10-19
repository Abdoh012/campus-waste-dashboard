import mongoose from 'mongoose';

/**
 * A physical recycling station: one authoritative location that groups exactly
 * three independently monitored containers (`Bin` documents reference it via
 * `stationId`).
 *
 * The Station owns the map coordinates. Containers do not need their own
 * coordinates; this avoids three duplicate markers per physical station.
 */
const stationSchema = new mongoose.Schema(
  {
    stationId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: {
      building: { type: String, trim: true, default: '' },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true },
);

export const Station = mongoose.model('Station', stationSchema);
