/**
 * Domain models for the dashboard feature.
 *
 * These describe the shape of the campus-waste domain the dashboard renders
 * (navigation, KPIs, bins, alerts, chart series). They are plain data contracts
 * with no UI or network concerns, so both the mock fixtures and the presentational
 * components can depend on them without a cycle.
 */

/** Bottom-dock destinations, in document order. */
export type NavId = 'overview' | 'campus-map' | 'hardware' | 'analytics';

export interface NavItem {
  id: NavId;
  /** In-page anchor to the section this destination scrolls to. */
  href: `#${string}`;
  label: string;
  /** Set for a gated destination: rendered inert and untabbable. */
  disabled?: boolean;
}

export interface DashboardSummary {
  diversionRate: number;
  wasteSortedKg: number;
  pointsDistributed: number;
  activeBins: number;
  totalBins: number;
  healthScore: number;
  pendingSyncEvents: number;
  registeredDevices: number;
}

/** Fill-level status a bin (or its marker) is colour-coded by. */
export type BinTone = 'green' | 'yellow' | 'red';

export type AlertTone = 'critical' | 'warning';

export interface HardwareAlert {
  id: string;
  tone: AlertTone;
  icon: string;
  title: string;
  location: string;
  meta: string;
}

export interface PointsByDay {
  day: string;
  /** Bar height as a percentage of the chart's plot area (0–100). */
  height: number;
  /** Highlights the current day's bar. */
  active?: boolean;
}

/**
 * One day of sorted waste — the waste chart's raw grain. A calendar day, not an
 * instant: date-only ISO strings carry no zone, so a bucket can never shift with
 * the reader's clock.
 */
export interface WasteEntry {
  /** The day it was recorded, ISO `YYYY-MM-DD`. */
  date: string;
  /** Kilograms sorted that day. */
  kg: number;
}

/** One point of the waste chart's line, after a range's entries are bucketed. */
export interface WasteSeriesPoint {
  /** Axis label: `'Aug 26'` for a daily bucket, `'Aug'` for a monthly one. */
  label: string;
  /** Everything sorted in the bucket; 0 when nothing was recorded in it. */
  kg: number;
}
