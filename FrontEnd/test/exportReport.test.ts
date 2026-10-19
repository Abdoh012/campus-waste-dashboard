import { describe, expect, it } from 'vitest';
import {
  buildReportCsv,
  csvField,
  type ReportSource,
} from '../src/features/dashboard/exportReport';
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
  points: [{ date: '2026-10-19', points: 2, studentCount: 2 }],
};

const report: ReportSource = {
  generatedAt: new Date('2026-10-19T20:24:00.000Z'),
  stats,
  stations: [station],
  fillHistory,
  pointsDaily,
};

describe('csvField', () => {
  it('leaves plain values untouched', () => {
    expect(csvField('healthy')).toBe('healthy');
    expect(csvField(48.8)).toBe('48.8');
    expect(csvField(true)).toBe('true');
  });

  it('renders null and undefined as empty fields, never "null"', () => {
    expect(csvField(null)).toBe('');
    expect(csvField(undefined)).toBe('');
  });

  it('quotes commas, quotes and line breaks per RFC 4180', () => {
    expect(csvField('North Gate, Zone A')).toBe('"North Gate, Zone A"');
    expect(csvField('Paper "A"')).toBe('"Paper ""A"""');
    expect(csvField('line one\nline two')).toBe('"line one\nline two"');
  });

  it('neutralises spreadsheet formula injection in text fields', () => {
    expect(csvField('=1+1')).toBe("'=1+1");
    expect(csvField('+SUM(A1)')).toBe("'+SUM(A1)");
    expect(csvField('@cmd')).toBe("'@cmd");
    // Numbers keep their sign: only strings are guarded.
    expect(csvField(-5)).toBe('-5');
  });
});

describe('buildReportCsv', () => {
  const csv = buildReportCsv(report);
  const lines = csv.split('\r\n');

  it('starts with the fixed five-column header', () => {
    expect(lines[0]).toBe('section,entity,metric,value,unit');
  });

  it('ends with a single trailing CRLF', () => {
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv.endsWith('\r\n\r\n')).toBe(false);
  });

  it('includes report metadata and summary totals', () => {
    expect(csv).toContain(
      'metadata,report,generated_at,2026-10-19T20:24:00.000Z,ISO-8601',
    );
    expect(csv).toContain('summary,campus,points_total,29,points');
    expect(csv).toContain('summary,campus,students_total,5,students');
    expect(csv).toContain('summary,campus,containers_average_fill,48.8,percent');
    expect(csv).toContain('summary,campus,stations_fully_connected_pct,50,percent');
  });

  it('emits station and container status with correct escaping', () => {
    expect(csv).toContain('station,STN-NORTH,name,"North Gate, Zone A",');
    expect(csv).toContain('station,STN-NORTH,severity,critical,');
    expect(csv).toContain('container,ESP32-BIN-01,name,"Paper ""A""",');
    expect(csv).toContain('container,ESP32-BIN-01,fill_level,18,percent');
    expect(csv).toContain('container,ESP32-BIN-01,fill_status,healthy,');
    expect(csv).toContain('container,ESP32-BIN-01,connectivity,online,');
    // A null fill/type/pin is an empty field, not the string "null".
    expect(csv).toContain('container,ESP32-BIN-05,waste_type,,');
    expect(csv).toContain('container,ESP32-BIN-05,fill_level,,percent');
    expect(csv).toContain('container,ESP32-BIN-05,connectivity,never-connected,');
  });

  it('includes the exact chart histories', () => {
    expect(csv).toContain('fill_history,2026-10-19,avg_fill_level,48.8,percent');
    expect(csv).toContain('fill_history,2026-10-19,samples,5,samples');
    expect(csv).toContain('points_history,2026-10-19,points,2,points');
    expect(csv).toContain('points_history,2026-10-19,students,2,students');
  });

  it('never writes the text "null" for a missing value', () => {
    expect(csv.includes('null')).toBe(false);
  });

  it('gives every data row exactly five columns', () => {
    const rows = lines.filter((line) => line !== '');
    for (const line of rows) {
      // Parse with the same quoting rules the writer used.
      const fields: string[] = [];
      let field = '';
      let quoted = false;
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (quoted) {
          if (char === '"' && line[i + 1] === '"') {
            field += '"';
            i += 1;
          } else if (char === '"') {
            quoted = false;
          } else {
            field += char;
          }
        } else if (char === '"') {
          quoted = true;
        } else if (char === ',') {
          fields.push(field);
          field = '';
        } else {
          field += char;
        }
      }
      fields.push(field);
      expect(fields, line).toHaveLength(5);
    }
  });
});
