/**
 * Development-only station fixtures.
 *
 * The real hardware-to-station mapping is NOT established by the repository
 * (there is no firmware or device documentation). These two stations and the
 * six device associations below are an illustrative demo grouping for local
 * development and tests only. They are never asserted to describe real physical
 * installations and are never written to a production database.
 *
 * A station owns one authoritative location; containers reference it by
 * `stationId` and do not need their own coordinates.
 *
 * The four additional approved campus stations (and their twelve containers,
 * which carry demo fill/sync state stamped by the demo seeder) live in
 * `campus-stations.js`. They are kept
 * separate because they are part of the real fleet, not this synthetic history
 * fixture; the demo-history seeder must never reset their live state.
 */
import { WASTE_TYPES } from '../src/lib/waste-types.js';

export const DEMO_STATIONS = [
  {
    stationId: 'STN-NORTH',
    name: 'North Gate Station (demo)',
    location: { building: 'North Gate', lat: 30.8574, lng: 29.57024 },
  },
  {
    stationId: 'STN-LIBRARY',
    name: 'Library Station (demo)',
    location: { building: 'Library', lat: 30.8592, lng: 29.57264 },
  },
];

/**
 * Single source of truth for the six illustrative containers: station and
 * material are declared together so the seed and association scripts cannot
 * drift. Device order within each station is paper, plastic, liquids.
 *
 * DEMO ONLY. This is not a verified hardware mapping; real device→material
 * assignments must be supplied by the firmware/installation owner.
 */
export const DEMO_BIN_ASSIGNMENTS = Object.freeze([
  { deviceId: 'ESP32-BIN-01', stationId: 'STN-NORTH', wasteType: WASTE_TYPES.PAPER },
  { deviceId: 'ESP32-BIN-02', stationId: 'STN-NORTH', wasteType: WASTE_TYPES.PLASTIC },
  { deviceId: 'ESP32-BIN-03', stationId: 'STN-NORTH', wasteType: WASTE_TYPES.LIQUIDS },
  { deviceId: 'ESP32-BIN-04', stationId: 'STN-LIBRARY', wasteType: WASTE_TYPES.PAPER },
  { deviceId: 'ESP32-BIN-05', stationId: 'STN-LIBRARY', wasteType: WASTE_TYPES.PLASTIC },
  { deviceId: 'ESP32-BIN-06', stationId: 'STN-LIBRARY', wasteType: WASTE_TYPES.LIQUIDS },
]);

/** Derived views kept for callers that only need one dimension. */
export const DEMO_BIN_STATION_MAP = Object.freeze(
  Object.fromEntries(
    DEMO_BIN_ASSIGNMENTS.map(({ deviceId, stationId }) => [deviceId, stationId]),
  ),
);

export const DEMO_BIN_WASTE_TYPE_MAP = Object.freeze(
  Object.fromEntries(
    DEMO_BIN_ASSIGNMENTS.map(({ deviceId, wasteType }) => [deviceId, wasteType]),
  ),
);
