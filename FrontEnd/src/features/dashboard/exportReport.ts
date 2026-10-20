/**
 * Pure workbook builder for the dashboard's "Export report" button.
 *
 * Instead of one long key–value CSV, the report is a real Excel file with one
 * sheet per question someone would ask:
 *
 *   1. `Overview`    — fleet health totals (the same numbers as the KPI cards), points.
 *   2. `Stations`    — one row per station: location, status, integrity, last sync.
 *   3. `Bins`        — one row per container under its station: fill, status, sync.
 *   4. `Fill history`— daily campus fill profile for the last 30 days.
 *   5. `Points`      — daily recycling points for the last 7 days, with totals.
 *
 * Values come from the same authenticated endpoints the dashboard renders, so
 * the workbook cannot drift from the screen. All timestamps are UTC. Styling is
 * modest and deliberate: bold filled table headers, frozen header rows,
 * filterable columns and sensible widths — no decorations that age badly.
 *
 * `exceljs` is imported dynamically so its size never reaches the initial app
 * bundle; it is only loaded when the user actually exports.
 */
import type { FillHistoryResponse, DailyPointsResponse } from '../../services/historyApi';
import type { StationDto } from '../../services/stationsApi';
import type { Stats } from '../../shared/hooks/useStats';
import type { Worksheet, Workbook } from 'exceljs';

/** History windows included in the export (chart defaults). */
export const REPORT_FILL_PERIOD = 'last30' as const;
export const REPORT_POINTS_PERIOD = 'last7' as const;

/** Exact sheet order — tests pin this. */
export const REPORT_SHEET_NAMES = [
  'Overview',
  'Stations',
  'Bins',
  'Fill history',
  'Points',
] as const;

export interface ReportSource {
  generatedAt: Date;
  stats: Stats;
  stations: readonly StationDto[];
  fillHistory: FillHistoryResponse;
  pointsDaily: DailyPointsResponse;
}

const HEADER_FILL = '1F4E78';
const GROUP_FILL = 'D9E1F2';
const DATETIME_FORMAT = 'yyyy-mm-dd hh:mm:ss';

type ColumnWidth = { width: number };

/* ------------------------------------------------------------------ style */

/** Bold white header on dark blue + freeze + filter — shared by every sheet. */
function styleTableHeader(sheet: Worksheet, columnCount: number): void {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  if (columnCount > 1) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columnCount },
    };
  }
  const header = sheet.getRow(1);
  header.height = 20;
  header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  header.alignment = { vertical: 'middle' };
  header.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  header.commit();
}

/** Bold blue group heading used on the Overview sheet. */
function styleGroupHeading(rowNumber: number, sheet: Worksheet, title: string): void {
  const row = sheet.getRow(rowNumber);
  row.getCell(1).value = title;
  row.font = { bold: true, size: 11 };
  row.eachCell((cell, colNumber) => {
    if (colNumber <= 2) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${GROUP_FILL}` },
      };
    }
  });
  row.commit();
}

/* --------------------------------------------------------------- overview */

const OVERVIEW_WIDTHS: ColumnWidth[] = [{ width: 34 }, { width: 24 }];

function overviewSheet(workbook: Workbook, source: ReportSource): void {
  const sheet = workbook.addWorksheet(REPORT_SHEET_NAMES[0], {
    views: [],
  });
  sheet.columns = OVERVIEW_WIDTHS;

  const title = sheet.getRow(1);
  title.getCell(1).value = 'Campus Waste Dashboard — Operations Report';
  title.font = { bold: true, size: 14 };
  title.commit();

  const meta = [
    ['Generated (UTC)', source.generatedAt.toISOString().replace('T', ' ').slice(0, 19)],
    ['Timezone', source.fillHistory.timezone],
    [
      `Fill history period (${REPORT_FILL_PERIOD})`,
      `${source.fillHistory.from.slice(0, 10)} → ${source.fillHistory.to.slice(0, 10)}`,
    ],
    [
      `Points period (${REPORT_POINTS_PERIOD})`,
      `${source.pointsDaily.from.slice(0, 10)} → ${source.pointsDaily.to.slice(0, 10)}`,
    ],
    ['Stations on report', source.stations.length],
  ];
  let rowNumber = 3;
  meta.forEach(([label, value]) => {
    const row = sheet.getRow(rowNumber);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = value;
    rowNumber += 1;
  });

  const { bins, points, stations: stationStats, containers } = source.stats;

  const groups: Array<{ title: string; pairs: Array<[string, string | number | null]> }> = [
    {
      title: 'Fleet — stations',
      pairs: [
        ['Stations total', stationStats.total],
        ['Stations valid', stationStats.valid],
        ['Stations incomplete', stationStats.incomplete],
        ['Stations healthy', stationStats.healthy],
        ['Stations attention', stationStats.attention],
        ['Stations critical', stationStats.critical],
        ['Stations unknown', stationStats.unknown],
        ['Stations online', stationStats.online],
        ['Stations partial', stationStats.partial],
        ['Stations offline', stationStats.offline],
        ['Fully connected (%)', stationStats.fullyConnectedPct],
      ],
    },
    {
      title: 'Fleet — containers',
      pairs: [
        ['Containers total', containers.total],
        ['Containers healthy', containers.healthy],
        ['Containers attention', containers.attention],
        ['Containers critical', containers.critical],
        ['Containers unknown', containers.unknown],
        ['Containers online', containers.online],
        ['Containers offline', containers.offline],
        ['Containers never-connected', containers.neverConnected],
        ['Containers unassigned', containers.unassigned],
        ['Containers orphaned', containers.orphaned],
        ['Containers online (%)', containers.onlinePct],
        ['Average fill (%)', containers.averageFill],
      ],
    },
    {
      title: 'Bins (legacy view)',
      pairs: [
        ['Bins total', bins.total],
        ['Bins healthy', bins.healthy],
        ['Bins attention', bins.attention],
        ['Bins critical', bins.critical],
        ['Bins offline', bins.offline],
        ['Operational (%)', bins.operationalPct],
      ],
    },
    {
      title: 'Points',
      pairs: [
        ['Points total (all time)', points.totalPoints],
        ['Students on leaderboard', points.studentCount],
      ],
    },
  ];

  rowNumber += 1;
  for (const group of groups) {
    styleGroupHeading(rowNumber, sheet, group.title);
    rowNumber += 1;
    for (const [label, value] of group.pairs) {
      const row = sheet.getRow(rowNumber);
      row.getCell(1).value = label;
      row.getCell(2).value = value;
      rowNumber += 1;
    }
    rowNumber += 1; // blank row between groups
  }
}

/* --------------------------------------------------------- station sheet */

const STATION_HEADER = [
  'Station ID',
  'Station name',
  'Building',
  'Latitude',
  'Longitude',
  'Containers',
  'Integrity valid',
  'Severity',
  'Connectivity',
  'Last sync (UTC)',
] as const;

const STATION_WIDTHS: ColumnWidth[] = [
  { width: 15 }, { width: 32 }, { width: 30 }, { width: 11 }, { width: 11 },
  { width: 11 }, { width: 13 }, { width: 12 }, { width: 13 }, { width: 21 },
];

function stationsSheet(workbook: Workbook, source: ReportSource): void {
  const sheet = workbook.addWorksheet(REPORT_SHEET_NAMES[1]);
  sheet.columns = STATION_WIDTHS;
  sheet.addRow([...STATION_HEADER]);
  styleTableHeader(sheet, STATION_HEADER.length);

  for (const station of source.stations) {
    const row = sheet.addRow([
      station.stationId,
      station.name,
      station.location.building,
      station.location.lat,
      station.location.lng,
      station.containers.length,
      station.integrity.valid,
      station.severity,
      station.connectivity,
      station.lastSyncAt === null ? null : new Date(station.lastSyncAt),
    ]);
    const lastSyncCell = row.getCell(STATION_HEADER.length);
    lastSyncCell.numFmt = DATETIME_FORMAT;
  }
}

/* ------------------------------------------------------------ bins sheet */

const BIN_HEADER = [
  'Station ID',
  'Container ID',
  'Container name',
  'Material',
  'Fill (%)',
  'Fill status',
  'Connectivity',
  'Last sync (UTC)',
  'Last known',
  'Stale',
] as const;

const BIN_WIDTHS: ColumnWidth[] = [
  { width: 15 }, { width: 15 }, { width: 34 }, { width: 11 },
  { width: 9 }, { width: 12 }, { width: 16 }, { width: 21 },
  { width: 11 }, { width: 8 },
];

function binsSheet(workbook: Workbook, source: ReportSource): void {
  const sheet = workbook.addWorksheet(REPORT_SHEET_NAMES[2]);
  sheet.columns = BIN_WIDTHS;
  sheet.addRow([...BIN_HEADER]);
  styleTableHeader(sheet, BIN_HEADER.length);

  for (const station of source.stations) {
    for (const container of station.containers) {
      const row = sheet.addRow([
        station.stationId,
        container.deviceId,
        container.name,
        container.wasteType,
        container.fillLevel,
        container.fillStatus,
        container.connectivity,
        container.lastSyncAt === null ? null : new Date(container.lastSyncAt),
        container.lastKnown,
        container.isStale,
      ]);
      row.getCell(5).numFmt = '0"%"';
      row.getCell(8).numFmt = DATETIME_FORMAT;
    }
  }
}

/* ----------------------------------------------------- fill history sheet */

const FILL_HEADER = [
  'Day (UTC)',
  'Average fill (%)',
  'Min fill (%)',
  'Max fill (%)',
  'Samples',
  'Containers',
] as const;

const FILL_WIDTHS: ColumnWidth[] = [
  { width: 13 }, { width: 16 }, { width: 13 }, { width: 13 },
  { width: 10 }, { width: 12 },
];

function fillHistorySheet(workbook: Workbook, source: ReportSource): void {
  const sheet = workbook.addWorksheet(REPORT_SHEET_NAMES[3]);
  sheet.columns = FILL_WIDTHS;
  sheet.addRow([...FILL_HEADER]);
  styleTableHeader(sheet, FILL_HEADER.length);

  for (const point of source.fillHistory.points) {
    const row = sheet.addRow([
      point.bucket,
      point.avgFillLevel,
      point.minFillLevel,
      point.maxFillLevel,
      point.sampleCount,
      point.binCount,
    ]);
    for (const column of [2, 3, 4]) {
      row.getCell(column).numFmt = '0.0"%"';
    }
  }
}

/* ------------------------------------------------------------- points sheet */

const POINTS_HEADER = ['Date (UTC)', 'Points', 'Students'] as const;

const POINTS_WIDTHS: ColumnWidth[] = [{ width: 15 }, { width: 12 }, { width: 12 }];

function pointsSheet(workbook: Workbook, source: ReportSource): void {
  const sheet = workbook.addWorksheet(REPORT_SHEET_NAMES[4]);
  sheet.columns = POINTS_WIDTHS;
  sheet.addRow([...POINTS_HEADER]);
  styleTableHeader(sheet, POINTS_HEADER.length);

  const firstDataRow = 2;
  for (const point of source.pointsDaily.points) {
    sheet.addRow([point.date, point.points, point.studentCount]);
  }

  const lastDataRow = Math.max(firstDataRow, source.pointsDaily.points.length + 1);
  if (lastDataRow >= firstDataRow) {
    const totalRow = sheet.addRow([
      'Total (period)',
      { formula: `SUM(B${firstDataRow}:B${lastDataRow})` },
      { formula: `SUM(C${firstDataRow}:C${lastDataRow})` },
    ]);
    totalRow.font = { bold: true };
  }
}

/* ------------------------------------------------------------------ build */

/**
 * Build the complete five-sheet workbook in memory.
 *
 * Returns the workbook itself (not bytes) so callers can verify it in tests and
 * let the export path choose how to serialise it.
 */
export async function buildCampusReportWorkbook(source: ReportSource): Promise<Workbook> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Campus Waste Dashboard';
  workbook.created = source.generatedAt;
  workbook.modified = source.generatedAt;

  overviewSheet(workbook, source);
  stationsSheet(workbook, source);
  binsSheet(workbook, source);
  fillHistorySheet(workbook, source);
  pointsSheet(workbook, source);

  return workbook;
}
