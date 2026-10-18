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

export interface WasteSortedPoint {
  /** Short date label for the x axis, e.g. `'Aug 19'`. */
  week: string;
  /** Kilograms sorted during that week. */
  kg: number;
  /** Draws the emphasised marker on this point. */
  emphasised?: boolean;
}
