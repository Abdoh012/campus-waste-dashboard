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

/** The status the API reports for a bin, including the read-time offline override. */
export type BinStatus = 'healthy' | 'attention' | 'critical' | 'offline';

/** Fill-level status a bin (or its marker) is colour-coded by. */
export type BinTone = 'green' | 'yellow' | 'red' | 'offline';

export type AlertTone = 'critical' | 'warning';

export interface HardwareAlert {
  id: string;
  tone: AlertTone;
  icon: string;
  title: string;
  location: string;
  meta: string;
}

