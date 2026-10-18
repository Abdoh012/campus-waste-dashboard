/**
 * Campus map models, mock data and marker-tone rules.
 *
 * Everything the Google Map renders — the numbered markers and the location
 * popup — reads from this one module, so there are no map values scattered
 * through the components and the mock locations can be swapped for a real API
 * response in a single place.
 */

import type { MapView } from './options';
import type { BinTone } from './types';

/** A single waste bin at a mapped location. */
export interface Bin {
  id: string;
  /** Readable bin label, e.g. `Paper & card`. */
  label: string;
  /** Fill level as a whole percentage (0–100). */
  fill: number;
}

/** A mapped bin location: one numbered marker carrying exactly three bins. */
export interface BinLocation {
  id: string;
  /** Zero-padded display number shown on the marker, e.g. `'03'`. */
  number: string;
  name: string;
  /** Geographic position the marker is anchored to. */
  position: { lat: number; lng: number };
  /** The location's three bins, in the order the popup lists them. */
  bins: readonly [Bin, Bin, Bin];
}

/**
 * MOCK — the centre of Borg El Arab Technological University, Alexandria
 * (the universities district of New Borg El Arab, ~30.8577 N, 29.5717 E).
 * Verified against the university's public record; the bin positions below are
 * not, so re-check both before relying on this map operationally.
 */
export const CAMPUS_CENTER = { lat: 30.8577, lng: 29.5717 };

/** The Google map type behind each configured map view. */
export const MAP_TYPE_BY_VIEW: Record<MapView, 'roadmap' | 'hybrid'> = {
  'Campus view': 'roadmap',
  Satellite: 'hybrid',
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
 * Fill-level cut-offs for a marker's colour, as whole percentages: below
 * `attention` is green, `attention` up to (not including) `critical` is amber,
 * and `critical` or more is red. Centralised so the thresholds and the legend
 * that quotes them can be adjusted together.
 */
export const FILL_THRESHOLDS = { attention: 50, critical: 80 } as const;

/** The tone a single bin's fill level maps to. */
export function fillTone(fill: number): BinTone {
  if (fill >= FILL_THRESHOLDS.critical) return 'red';
  if (fill >= FILL_THRESHOLDS.attention) return 'yellow';
  return 'green';
}

/** The fullest bin at a location — the value its marker colour is based on. */
export function peakFill(location: BinLocation): number {
  return Math.max(...location.bins.map((bin) => bin.fill));
}

/**
 * The tone a location's marker maps to. Deliberately the location's *fullest*
 * bin rather than the average: one bin about to overflow is enough to warrant a
 * collection round, however empty its neighbours are.
 */
export function locationTone(location: BinLocation): BinTone {
  return fillTone(peakFill(location));
}

/**
 * MOCK bin locations. Numbers and names match the hardware alerts elsewhere in
 * the dashboard; each location's fullest bin carries the fill level the map has
 * always shown for it. The coordinates are plausible points inside the campus
 * footprint and MUST be verified against the real bin positions before use.
 */
export const binLocations: readonly BinLocation[] = [
  {
    id: 'loc-01',
    number: '01',
    name: 'North Gate',
    position: { lat: 30.85912, lng: 29.57155 },
    bins: [
      { id: 'bin-01-paper', label: 'Paper & card', fill: 6 },
      { id: 'bin-01-plastic', label: 'Plastic & metal', fill: 12 },
      { id: 'bin-01-organic', label: 'Organic waste', fill: 18 },
    ],
  },
  {
    id: 'loc-02',
    number: '02',
    name: 'Science Hall',
    position: { lat: 30.8583, lng: 29.5729 },
    bins: [
      { id: 'bin-02-paper', label: 'Paper & card', fill: 21 },
      { id: 'bin-02-plastic', label: 'Plastic & metal', fill: 38 },
      { id: 'bin-02-organic', label: 'Organic waste', fill: 54 },
    ],
  },
  {
    id: 'loc-03',
    number: '03',
    name: 'Student Union',
    position: { lat: 30.85745, lng: 29.5731 },
    bins: [
      { id: 'bin-03-paper', label: 'Paper & card', fill: 44 },
      { id: 'bin-03-plastic', label: 'Plastic & metal', fill: 62 },
      { id: 'bin-03-organic', label: 'Organic waste', fill: 87 },
    ],
  },
  {
    id: 'loc-04',
    number: '04',
    name: 'Arts Center',
    position: { lat: 30.85662, lng: 29.57085 },
    bins: [
      { id: 'bin-04-paper', label: 'Paper & card', fill: 7 },
      { id: 'bin-04-plastic', label: 'Plastic & metal', fill: 14 },
      { id: 'bin-04-organic', label: 'Organic waste', fill: 21 },
    ],
  },
  {
    id: 'loc-05',
    number: '05',
    name: 'Rec Center',
    position: { lat: 30.85695, lng: 29.56995 },
    bins: [
      { id: 'bin-05-paper', label: 'Paper & card', fill: 4 },
      { id: 'bin-05-plastic', label: 'Plastic & metal', fill: 8 },
      { id: 'bin-05-organic', label: 'Organic waste', fill: 12 },
    ],
  },
  {
    id: 'loc-06',
    number: '06',
    name: 'Library',
    position: { lat: 30.85805, lng: 29.57035 },
    bins: [
      { id: 'bin-06-paper', label: 'Paper & card', fill: 28 },
      { id: 'bin-06-plastic', label: 'Plastic & metal', fill: 45 },
      { id: 'bin-06-organic', label: 'Organic waste', fill: 63 },
    ],
  },
];
