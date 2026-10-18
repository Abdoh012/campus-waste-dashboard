/**
 * Mock data for the Campus Waste Intelligence dashboard.
 *
 * Everything the UI needs is defined here so the components never talk to a
 * backend directly. When a real API is available, replace these exports with
 * fetch/query calls that return the same shapes and the components stay intact.
 */

import type { CachedSyncEvent } from "../../services/syncApi";
import type {
  DashboardSummary,
  HardwareAlert,
  NavItem,
  PointsByDay,
  WasteEntry,
} from "./types";

/**
 * Bottom-dock destinations, in document order so the dock reads left-to-right
 * with the page. Labels are sized for the four dock slots; the hrefs are the
 * section ids the dashboard already renders. Iconography is chrome rather than
 * content, so it is owned by the dock itself (`NAV_ICONS` in
 * `components/BottomNav.tsx`) and keyed by these ids. Setting `disabled: true`
 * on a destination renders it as an inert, untabbable slot. No destination is
 * disabled today.
 */
export const navItems: readonly NavItem[] = [
  { id: "overview", href: "#overview", label: "Overview" },
  { id: "campus-map", href: "#campus-map", label: "Map" },
  { id: "analytics", href: "#analytics", label: "Analytics" },
];

export const dashboardSummary: DashboardSummary = {
  diversionRate: 78.4,
  wasteSortedKg: 1248,
  pointsDistributed: 4820,
  activeBins: 24,
  totalBins: 26,
  healthScore: 92,
  pendingSyncEvents: 12,
  registeredDevices: 26,
};

export const healthAlerts: readonly HardwareAlert[] = [
  {
    id: "camera-offline",
    tone: "critical",
    icon: "!",
    title: "Camera disconnected",
    location: "Bin 03 · Student Union",
    meta: "Detected 8 min ago",
  },
  {
    id: "tank-full",
    tone: "warning",
    icon: "◐",
    title: "Liquid tank nearing full",
    location: "Bin 06 · Library",
    meta: "74% capacity · action soon",
  },
  {
    id: "servo-error",
    tone: "critical",
    icon: "↯",
    title: "Servo motor error",
    location: "Bin 02 · Science Hall",
    meta: "Last checked 14 min ago",
  },
];

/**
 * The mock dataset's "now" — the cached sync events are stamped the day before
 * it, and the waste series below runs up to it. This app has no live clock and
 * the data is a fixed snapshot, so the chart's range selector measures its
 * windows from this calendar day rather than from the visitor's wall clock,
 * which would slowly slide every window off the data.
 */
export const MOCK_NOW = "2026-09-18";

const DAY_MS = 86_400_000;

/**
 * Sunday → Saturday. Weekends sort less, and Sundays not at all (0 kg, so they
 * produce no entry); only the shape matters here, the scale is set below.
 */
const WEEKDAY_SHAPE: readonly number[] = [0, 1, 1.05, 1.08, 1.02, 0.98, 0.45];

/**
 * A fixed 0–1 value per day, standing in for day-to-day variation. A hash rather
 * than `Math.random`, so every render and every test sees the same numbers.
 */
const noise = (day: number): number => {
  const hash = Math.sin(day * 12.9898) * 43_758.5453;
  return hash - Math.floor(hash);
};

/**
 * The analytics chart's raw records: one entry per day the campus sorted waste,
 * from 1 January to `MOCK_NOW`. This is the grain the chart buckets and
 * zero-fills — days with no entry (Sundays) are gaps, not zeroes.
 *
 * Generated rather than hand-authored so it can span the whole year, from a
 * rising trend, a weekly rhythm and the noise above. The series is then scaled
 * so the current month totals `dashboardSummary.wasteSortedKg`, the figure the
 * KPI card reports for "this month".
 */
export const wasteEntries: readonly WasteEntry[] = buildWasteEntries();

function buildWasteEntries(): readonly WasteEntry[] {
  const yearStart = Date.UTC(Number(MOCK_NOW.slice(0, 4)), 0, 1);
  const lastDay = (Date.parse(`${MOCK_NOW}T00:00:00Z`) - yearStart) / DAY_MS;
  const monthStart = lastDay - (Number(MOCK_NOW.slice(8, 10)) - 1);

  const shape = Array.from({ length: lastDay + 1 }, (_, day) => {
    const weekday = new Date(yearStart + day * DAY_MS).getUTCDay();
    const rise = 0.7 + (0.6 * day) / lastDay;
    return rise * WEEKDAY_SHAPE[weekday] * (0.75 + 0.5 * noise(day));
  });

  const monthShape = shape.slice(monthStart).reduce((total, value) => total + value, 0);
  const scale = dashboardSummary.wasteSortedKg / monthShape;

  return shape
    .map((value, day) => ({
      date: new Date(yearStart + day * DAY_MS).toISOString().slice(0, 10),
      kg: Math.round(value * scale),
    }))
    .filter((entry) => entry.kg > 0);
}

export const pointsByDay: readonly PointsByDay[] = [
  { day: "Mon", height: 44 },
  { day: "Tue", height: 64 },
  { day: "Wed", height: 51 },
  { day: "Thu", height: 82, active: true },
  { day: "Fri", height: 68 },
  { day: "Sat", height: 38 },
  { day: "Sun", height: 57 },
];

/**
 * Cached events an ESP32 would flush once it reconnects. Used by the
 * "Sync cached data" action. Typed by the sync service's payload contract,
 * which owns the event shape.
 */
export const cachedSyncEvents: readonly CachedSyncEvent[] = [
  {
    deviceId: "ESP32-BIN-03",
    studentId: "STU-2081",
    points: 120,
    wasteType: "plastic",
    capturedAt: "2026-09-17T10:41:00Z",
  },
  {
    deviceId: "ESP32-BIN-01",
    studentId: "STU-1440",
    points: 80,
    wasteType: "paper",
    capturedAt: "2026-09-17T10:42:12Z",
  },
  {
    deviceId: "ESP32-BIN-06",
    studentId: "STU-0917",
    points: 150,
    wasteType: "organic",
    capturedAt: "2026-09-17T10:44:27Z",
  },
  {
    deviceId: "ESP32-BIN-02",
    studentId: "STU-3005",
    points: 95,
    wasteType: "metal",
    capturedAt: "2026-09-17T10:47:03Z",
  },
];
