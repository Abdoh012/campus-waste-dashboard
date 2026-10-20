import { beforeAll, describe, expect, it } from 'vitest';
import type { Workbook } from 'exceljs';
import {
  REPORT_SHEET_NAMES,
  buildCampusReportWorkbook,
  type ReportSource,
} from '../src/features/dashboard/exportReport';
import { reportFilename } from '../src/features/dashboard/reportExport';
import type { Stats } from '../src/shared/hooks/useStats';
import type { StationDto } from '../src/services/stationsApi';
import type { FillHistoryResponse, DailyPointsResponse } from '../src/services/historyApi';

const stats: Stats = {
  bins: {
    total: 6,
    healthy: 1,
    attention: 1,
    critical: 1,
    offline: 3,
    operationalPct: 50,
  },
  points: { totalPoints: 29, studentCount: 5 },
  stations: {
    total: 2,
    valid: 2,
    incomplete: 0,
    healthy: 0,
    attention: 1,
    critical: 1,
    unknown: 0,
    online: 1,
    partial: 0,
    offline: 1,
    fullyConnectedPct: 50,
  },
  containers: {
    total: 6,
    healthy: 2,
    attention: 2,
    critical: 1,
    unknown: 1,
    online: 3,
    offline: 2,
    neverConnected: 1,
    unassigned: 0,
    orphaned: 0,
    onlinePct: 50,
    averageFill: 48.8,
  },
};

const station: StationDto = {
  _id: 's1',
  stationId: 'STN-NORTH',
  name: 'North Gate, Zone A',
  location: { building: 'North Gate', lat: 1.23, lng: 4.56 },
  containers: [
    {
      _id: 'c1',
      deviceId: 'ESP32-BIN-01',
      name: 'Paper "A"',
      stationId: 'STN-NORTH',
      wasteType: 'paper',
      fillLevel: 18,
      fillStatus: 'healthy',
      connectivity: 'online',
      lastSyncAt: '2026-10-19T20:24:00.000Z',
      lastKnown: true,
      isStale: false,
    },
    {
      _id: 'c2',
      deviceId: 'ESP32-BIN-05',
      name: 'Plastic',
      stationId: 'STN-NORTH',
      wasteType: null,
      fillLevel: null,
      fillStatus: 'unknown',
      connectivity: 'never-connected',
      lastSyncAt: null,
      lastKnown: false,
      isStale: false,
    },
  ],
  severity: 'critical',
  connectivity: 'online',
  integrity: { expected: 3, actual: 2, valid: false, issues: [] },
  lastSyncAt: '2026-10-19T20:24:00.000Z',
};

const fillHistory: FillHistoryResponse = {
  period: 'last30',
  from: '2026-09-20T00:00:00.000Z',
  to: '2026-10-19T20:24:00.000Z',
  timezone: 'UTC',
  bucket: 'day',
  unit: 'percent',
  points: [
    {
      bucket: '2026-10-19',
      avgFillLevel: 48.8,
      minFillLevel: 15.6,
      maxFillLevel: 88,
      sampleCount: 5,
      binCount: 5,
    },
  ],
};

const pointsDaily: DailyPointsResponse = {
  period: 'last7',
  from: '2026-10-13T00:00:00.000Z',
  to: '2026-10-19T20:24:00.000Z',
  timezone: 'UTC',
  bucket: 'day',
  unit: 'points',
  points: [
    { date: '2026-10-19', points: 2, studentCount: 2 },
    { date: '2026-10-18', points: 1, studentCount: 1 },
  ],
};

const report: ReportSource = {
  generatedAt: new Date('2026-10-19T20:24:00.000Z'),
  stats,
  stations: [station],
  fillHistory,
  pointsDaily,
};

let workbook: Workbook;

beforeAll(async () => {
  workbook = await buildCampusReportWorkbook(report);
});

function sheetRows(name: (typeof REPORT_SHEET_NAMES)[number]): number {
  const sheet = workbook.getWorksheet(name);
  expect(sheet).toBeDefined();
  return sheet?.actualRowCount ?? 0;
}

function findOverviewRow(label: string): { label: string; value: unknown } | null {
  const sheet = workbook.getWorksheet('Overview');
  if (!sheet) return null;
  for (let r = 1; r <= sheet.rowCount; r += 1) {
    const value = sheet.getRow(r).getCell(1).value;
    if (value === label) {
      return { label, value: sheet.getRow(r).getCell(2).value };
    }
  }
  return null;
}

describe('campus report workbook', () => {
  it('creates the five sheets in a fixed order', () => {
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      ...REPORT_SHEET_NAMES,
    ]);
  });
});

describe('overview sheet', () => {
  it('carries report metadata', () => {
    expect(findOverviewRow('Generated (UTC)')?.value).toBe('2026-10-19 20:24:00');
    expect(findOverviewRow('Timezone')?.value).toBe('UTC');
    expect(findOverviewRow('Fill history period (last30)')?.value).toBe(
      '2026-09-20 → 2026-10-19',
    );
    expect(findOverviewRow('Points period (last7)')?.value).toBe('2026-10-13 → 2026-10-19');
  });

  it('carries the KPI totals exactly as the dashboard cards show them', () => {
    expect(findOverviewRow('Stations total')?.value).toBe(2);
    expect(findOverviewRow('Stations offline')?.value).toBe(1);
    expect(findOverviewRow('Containers total')?.value).toBe(6);
    expect(findOverviewRow('Containers never-connected')?.value).toBe(1);
    expect(findOverviewRow('Average fill (%)')?.value).toBe(48.8);
    expect(findOverviewRow('Bins total')?.value).toBe(6);
    expect(findOverviewRow('Points total (all time)')?.value).toBe(29);
    expect(findOverviewRow('Students on leaderboard')?.value).toBe(5);
  });
});

describe('stations sheet', () => {
  it('has one row per station with its status and location', () => {
    const sheet = workbook.getWorksheet('Stations');
    expect(sheet?.getRow(1).getCell(1).value).toBe('Station ID');
    expect(sheet?.getRow(1).getCell(7).value).toBe('Integrity valid');
    expect(sheet?.getRow(1).getCell(9).value).toBe('Connectivity');

    const row = sheet?.getRow(2);
    expect(row?.getCell(1).value).toBe('STN-NORTH');
    expect(row?.getCell(2).value).toBe('North Gate, Zone A');
    expect(row?.getCell(6).value).toBe(2); // containers actually attached in the fixture
    expect(row?.getCell(7).value).toBe(false); // integrity: expected 3, actual 2
    expect(row?.getCell(8).value).toBe('critical');
    expect(row?.getCell(9).value).toBe('online');
    expect(row?.getCell(10).value).toEqual(new Date('2026-10-19T20:24:00.000Z'));
  });
});

describe('bins sheet', () => {
  it('lists every container under its station with its live state', () => {
    const sheet = workbook.getWorksheet('Bins');
    expect(sheet?.getRow(1).getCell(4).value).toBe('Material');
    expect(sheet?.getRow(1).getCell(5).value).toBe('Fill (%)');

    const paper = sheet?.getRow(2);
    expect(paper?.getCell(1).value).toBe('STN-NORTH');
    expect(paper?.getCell(2).value).toBe('ESP32-BIN-01');
    expect(paper?.getCell(3).value).toBe('Paper "A"');
    expect(paper?.getCell(4).value).toBe('paper');
    expect(paper?.getCell(5).value).toBe(18);
    expect(paper?.getCell(6).value).toBe('healthy');
    expect(paper?.getCell(7).value).toBe('online');
    expect(paper?.getCell(8).value).toEqual(new Date('2026-10-19T20:24:00.000Z'));
    expect(paper?.getCell(9).value).toBe(true);

    // `never-connected` renders as a truthful blank, never a 0% reading.
    const silent = sheet?.getRow(3);
    expect(silent?.getCell(2).value).toBe('ESP32-BIN-05');
    expect(silent?.getCell(4).value).toBeNull();
    expect(silent?.getCell(5).value).toBeNull();
    expect(silent?.getCell(6).value).toBe('unknown');
    expect(silent?.getCell(7).value).toBe('never-connected');
    expect(silent?.getCell(8).value).toBeNull();
  });
});

describe('fill history sheet', () => {
  it('has one row per day bucket with the chart values', () => {
    const sheet = workbook.getWorksheet('Fill history');
    expect(sheet!.actualRowCount - 1).toBe(fillHistory.points.length);

    const row = sheet?.getRow(2);
    expect(row?.getCell(1).value).toBe('2026-10-19');
    expect(row?.getCell(2).value).toBe(48.8);
    expect(row?.getCell(3).value).toBe(15.6);
    expect(row?.getCell(4).value).toBe(88);
    expect(row?.getCell(5).value).toBe(5);
    expect(row?.getCell(6).value).toBe(5);
    expect(row?.getCell(2).numFmt).toBe('0.0"%"');
  });
});

describe('points sheet', () => {
  it('has one row per day and a real SUM totals row', () => {
    const sheet = workbook.getWorksheet('Points');
    expect(sheet?.getRow(1).getCell(2).value).toBe('Points');

    expect(sheet?.getRow(2).getCell(1).value).toBe('2026-10-19');
    expect(sheet?.getRow(2).getCell(2).value).toBe(2);

    const totalRow = sheet?.getRow(2 + pointsDaily.points.length);
    expect(totalRow?.getCell(1).value).toBe('Total (period)');
    const total = totalRow?.getCell(2).value as { formula?: string } | undefined;
    expect(total?.formula).toBe('SUM(B2:B3)');
  });
});

describe('reportFilename', () => {
  it('uses a date and sortable time stamp', () => {
    expect(reportFilename(new Date('2026-10-19T20:24:00.000Z'))).toBe(
      'campus-report-2026-10-19_2024.xlsx',
    );
  });
});

describe('workbook serialisation', () => {
  it('round-trips through writeBuffer → load as a real xlsx', async () => {
    const ExcelJS = await import('exceljs');
    const bytes = await workbook.xlsx.writeBuffer();

    const parsed = await new ExcelJS.Workbook().xlsx.load(bytes as ArrayBuffer);
    expect(parsed.worksheets.map((sheet) => sheet.name)).toEqual([...REPORT_SHEET_NAMES]);

    const parsedBins = parsed.getWorksheet('Bins');
    expect(parsedBins?.getRow(2).getCell(2).value).toBe('ESP32-BIN-01');
    expect(parsedBins?.getRow(2).getCell(5).value).toBe(18);
  });
});
