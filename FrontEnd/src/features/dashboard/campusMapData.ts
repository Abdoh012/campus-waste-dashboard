/**
 * Campus map models and marker-tone rules.
 *
 * The map carries no mock stations: `services/stationsApi.ts` maps the live
 * `GET /api/stations` response into these `BinLocation` values (one location
 * per station), and everything the Google Map renders — markers and the
 * station popup — reads from them.
 */

import type { MapView } from "./options";
import type { BinTone } from "./types";

/** Fill severity for one container or a station's highest known container. */
export type FillStatus = "healthy" | "attention" | "critical" | "unknown";

/** A single container's sensor connectivity. */
export type ContainerConnectivity = "online" | "offline" | "never-connected";

/** The material a container separates, when it has been classified. */
export type WasteType = "paper" | "plastic" | "liquids";

/** A station's aggregated connectivity (three containers). */
export type StationConnectivity = "online" | "partial" | "offline";

/** One data-integrity problem reported by the station endpoint. */
export interface StationIntegrityIssue {
  code: string;
  message: string;
}

/** Whether a station has exactly three well-formed containers. */
export interface StationIntegrity {
  expected: number;
  actual: number;
  valid: boolean;
  issues: readonly StationIntegrityIssue[];
}

/** One container as shown inside a station popup. */
export interface Bin {
  id: string;
  /** The hardware's natural key, e.g. `ESP32-BIN-03`. */
  deviceId: string;
  /** Readable label shown in the popup (the container's name). */
  label: string;
  /** Material classification, or null for a legacy/unclassified container. */
  wasteType: WasteType | null;
  /** Last known fill percentage, or null when never connected. */
  fill: number | null;
  /** Independent fill severity; never erased by connectivity. */
  fillStatus: FillStatus;
  /** Independent connectivity state. */
  connectivity: ContainerConnectivity;
  /** ISO timestamp of the last device report, or null when never connected. */
  lastSyncAt: string | null;
  /** True when the displayed reading is a stale last-known value. */
  lastKnown: boolean;
}

/** A mapped station: exactly one numbered marker and its containers. */
export interface BinLocation {
  id: string;
  /** Stable station identity used for grouping. */
  stationId: string;
  /** Zero-padded display number shown on the marker, e.g. `'03'`. */
  number: string;
  name: string;
  /** The station's single authoritative position. */
  position: { lat: number; lng: number };
  /** Highest known fill severity across the station's containers. */
  severity: FillStatus;
  /** Aggregated station connectivity. */
  connectivity: StationConnectivity;
  /** Exactly-three-containers integrity report. */
  integrity: StationIntegrity;
  /** The station's containers, in device order. */
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

/** The tone a fill severity maps to. `unknown` uses the neutral tone. */
export function severityTone(severity: FillStatus): BinTone {
  if (severity === "critical") return "red";
  if (severity === "attention") return "yellow";
  if (severity === "healthy") return "green";
  return "offline";
}

/** The tone a single container's last known fill maps to. */
export function fillTone(fill: number | null): BinTone {
  if (fill === null) return "offline";
  if (fill >= FILL_THRESHOLDS.critical) return "red";
  if (fill >= FILL_THRESHOLDS.attention) return "yellow";
  return "green";
}

/**
 * The tone a container maps to. This is deliberately based on fill severity,
 * not connectivity: an offline container with a critical last-known reading
 * keeps its red bar and severity.
 */
export function binTone(bin: Bin): BinTone {
  return severityTone(bin.fillStatus);
}

/** The fullest known container at a station, or null when none has read. */
export function peakFill(location: BinLocation): number | null {
  const known = location.bins
    .map((bin) => bin.fill)
    .filter((fill): fill is number => fill !== null);
  if (known.length === 0) return null;
  return Math.max(...known);
}

/**
 * The station marker takes its colour from the station's highest known fill
 * severity, which the API computes independently of connectivity.
 */
export function locationTone(location: BinLocation): BinTone {
  return severityTone(location.severity);
}

/**
 * Borg El Arab Technological University (BATU), Alexandria, Egypt — the map's
 * fixed default centre. Resolved from Plus Code `VH5C+8H8`
 * (30°51′30″N 29°34′17″E); Wikipedia lists BATU at 30.8577, 29.5717, ~70 m away.
 *
 * This is only the *opening* position: the live stations from
 * `GET /api/stations` are framed on first load (see `BinsMap`).
 */
export const CAMPUS_CENTER = {
  lat: 30.8583,
  lng: 29.57144,
};
