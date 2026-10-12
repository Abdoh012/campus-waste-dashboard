/**
 * Mock data for the Campus Waste Intelligence dashboard.
 *
 * Everything the UI needs is defined here so the components never talk to a
 * backend directly. When a real API is available, replace these exports with
 * fetch/query calls that return the same shapes and the components stay intact.
 */

/**
 * Bottom-dock destinations, in document order so the dock reads left-to-right
 * with the page. Labels are sized for the four dock slots; the hrefs are the
 * section ids the dashboard already renders. Iconography is chrome rather than
 * content, so it is owned by the dock itself (`NAV_ICONS` in `BottomNav.jsx`)
 * and keyed by these ids. Setting `disabled: true` on a destination renders it
 * as an inert, untabbable slot. No destination is disabled today.
 */
export const navItems = [
  { id: 'overview', href: '#overview', label: 'Overview' },
  { id: 'campus-map', href: '#campus-map', label: 'Map' },
  { id: 'hardware', href: '#hardware', label: 'Hardware' },
  { id: 'analytics', href: '#analytics', label: 'Analytics' },
];

export const dashboardSummary = {
  diversionRate: 78.4,
  wasteSortedKg: 1248,
  pointsDistributed: 4820,
  activeBins: 24,
  totalBins: 26,
  healthScore: 92,
  pendingSyncEvents: 12,
  registeredDevices: 26,
};

export const campusBins = [
  { number: '01', location: 'North Gate', fill: 18, tone: 'green', markerClass: 'marker-1' },
  { number: '02', location: 'Science Hall', fill: 54, tone: 'yellow', markerClass: 'marker-2' },
  { number: '03', location: 'Student Union', fill: 87, tone: 'red', markerClass: 'marker-3' },
  { number: '04', location: 'Arts Center', fill: 21, tone: 'green', markerClass: 'marker-4' },
  { number: '05', location: 'Rec Center', fill: 12, tone: 'green', markerClass: 'marker-5' },
  { number: '06', location: 'Library', fill: 63, tone: 'yellow', markerClass: 'marker-6' },
];

export const healthAlerts = [
  {
    id: 'camera-offline',
    tone: 'critical',
    icon: '!',
    title: 'Camera disconnected',
    location: 'Bin 03 · Student Union',
    meta: 'Detected 8 min ago',
  },
  {
    id: 'tank-full',
    tone: 'warning',
    icon: '◐',
    title: 'Liquid tank nearing full',
    location: 'Bin 06 · Library',
    meta: '74% capacity · action soon',
  },
  {
    id: 'servo-error',
    tone: 'critical',
    icon: '↯',
    title: 'Servo motor error',
    location: 'Bin 02 · Science Hall',
    meta: 'Last checked 14 min ago',
  },
];

export const pointsByDay = [
  { day: 'Mon', height: 44 },
  { day: 'Tue', height: 64 },
  { day: 'Wed', height: 51 },
  { day: 'Thu', height: 82, active: true },
  { day: 'Fri', height: 68 },
  { day: 'Sat', height: 38 },
  { day: 'Sun', height: 57 },
];

/**
 * Cached events an ESP32 would flush once it reconnects. Used by the
 * "Sync cached data" action.
 */
export const cachedSyncEvents = [
  {
    deviceId: 'ESP32-BIN-03',
    studentId: 'STU-2081',
    points: 120,
    wasteType: 'plastic',
    capturedAt: '2026-09-17T10:41:00Z',
  },
  {
    deviceId: 'ESP32-BIN-01',
    studentId: 'STU-1440',
    points: 80,
    wasteType: 'paper',
    capturedAt: '2026-09-17T10:42:12Z',
  },
  {
    deviceId: 'ESP32-BIN-06',
    studentId: 'STU-0917',
    points: 150,
    wasteType: 'organic',
    capturedAt: '2026-09-17T10:44:27Z',
  },
  {
    deviceId: 'ESP32-BIN-02',
    studentId: 'STU-3005',
    points: 95,
    wasteType: 'metal',
    capturedAt: '2026-09-17T10:47:03Z',
  },
];
