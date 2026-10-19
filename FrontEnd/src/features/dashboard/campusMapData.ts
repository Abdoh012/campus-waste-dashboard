/**
 * Campus map models and marker-tone rules.
 *
 * The map carries no mock locations: `services/binsApi.ts` maps the live
 * `bins` collection into these `BinLocation` values, and everything the Google
 * Map renders — markers and the location popup — reads from them.
 */

import type { MapView } from "./options";
import type { BinStatus, BinTone } from "./types";

/** A single waste bin at a mapped location. */
export interface Bin {
  id: string;
  /** The hardware's natural key, e.g. `ESP32-BIN-03`. */
  deviceId: string;
  /** Readable label shown in the popup (the bin's name). */
  label: string;
  /** Fill level as a whole percentage (0–100). */
  fill: number;
  /** Server-derived status, including the read-time `offline` override. */
  status: BinStatus;
  /** ISO timestamp of the last device report, or null when never synced. */
  lastSyncAt: string | null;
}

/** A mapped bin location: one numbered marker and the bins in that building. */
export interface BinLocation {
  id: string;
  /** Zero-padded display number shown on the marker, e.g. `'03'`. */
  number: string;
  name: string;
  /** Geographic position the marker is anchored to. */
  position: { lat: number; lng: number };
  /** The building's bins, in device order. One, or several, per location. */
  bins: readonly Bin[];
}

/** The Google map type behind each configured map view. */
export const MAP_TYPE_BY_VIEW: Record<MapView, "roadmap" | "hybrid"> = {
  "Campus view": "roadmap",
  Satellite: "hybrid",
};

/** Initial zoom, plus the range the map's own zoom controls step within. */
export const MAP_ZOOM = { initial: 17, min: 11, max: 20 } as const;

/**
 * How the location popup sits against its marker, in pixels: the marker's own
 * radius (the marker is 32px across), the gap between the marker's edge and the
 * popup, and the margin kept between the popup and the panel's edges — the
 * popup flips and clamps to these so it can never be cut off by the panel.
 */
export const POPUP_PLACEMENT = { markerRadius: 16, gap: 14, edge: 8 } as const;

/**
 * Fill-level cut-offs for a marker's colour, as whole percentages. These match
 * the backend's `lib/status.js` (attention at 50, critical at 75) so the legend
 * and the server-derived statuses agree.
 */
export const FILL_THRESHOLDS = { attention: 50, critical: 75 } as const;

/** The tone a single bin's fill level maps to. */
export function fillTone(fill: number): BinTone {
  if (fill >= FILL_THRESHOLDS.critical) return "red";
  if (fill >= FILL_THRESHOLDS.attention) return "yellow";
  return "green";
}

/** The tone a bin maps to: a silent device reads offline, whatever its fill. */
export function binTone(bin: Bin): BinTone {
  return bin.status === "offline" ? "offline" : fillTone(bin.fill);
}

/** The fullest bin at a location — the value the popup footer quotes. */
export function peakFill(location: BinLocation): number {
  if (location.bins.length === 0) return 0;
  return Math.max(...location.bins.map((bin) => bin.fill));
}

const TONE_SEVERITY: Record<BinTone, number> = {
  offline: 0,
  green: 1,
  yellow: 2,
  red: 3,
};

/**
 * The tone a location's marker maps to: its most urgent bin. Offline only wins
 * when every bin at the location is silent — a critical bin still outranks an
 * offline neighbour, because a collection round is the more urgent action.
 */
export function locationTone(location: BinLocation): BinTone {
  return location.bins.reduce<BinTone>((worst, bin) => {
    const tone = binTone(bin);
    return TONE_SEVERITY[tone] > TONE_SEVERITY[worst] ? tone : worst;
  }, "offline");
}

/**
 * Borg El Arab Technological University (BATU), Alexandria, Egypt — the map's
 * fixed default centre. Resolved from Plus Code `VH5C+8H8`
 * (30°51′30″N 29°34′17″E); Wikipedia lists BATU at 30.8577, 29.5717, ~70 m away.
 *
 * This is only the *opening* position: the live bins from `GET /api/bins` are
 * framed on first load (see `BinsMap`).
 */
export const CAMPUS_CENTER = {
  lat: 30.8583,
  lng: 29.57144,
};
