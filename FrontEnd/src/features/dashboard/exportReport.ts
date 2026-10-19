/**
 * Pure report serialisation for the dashboard's "Export report" button.
 *
 * The CSV is a tidy long table — one metric per row — so metadata, summary
 * totals, per-station and per-container status, and the two chart histories all
 * share the same five columns and stay readable in a spreadsheet:
 *
 *   section, entity, metric, value, unit
 *
 * Values come from the same authenticated endpoints the dashboard renders, so
 * the file cannot drift from the screen. Escaping (quotes, commas, newlines) and
 * spreadsheet formula injection are handled here; nothing in this module touches
 * the DOM or the network.
 */
import type { FillHistoryResponse, DailyPointsResponse } from '../../services/historyApi';
import type { StationDto } from '../../services/stationsApi';
import type { Stats } from '../../shared/hooks/useStats';

/** History windows included in the export (chart defaults). */
export const REPORT_FILL_PERIOD = 'last30' as const;
export const REPORT_POINTS_PERIOD = 'last7' as const;

export interface ReportSource {
  generatedAt: Date;
  stats: Stats;
  stations: readonly StationDto[];
  fillHistory: FillHistoryResponse;
  pointsDaily: DailyPointsResponse;
}

export type CsvSection =
  | 'metadata'
  | 'summary'
  | 'station'
  | 'container'
  | 'fill_history'
  | 'points_history';

type CsvValue = string | number | boolean | null | undefined;

/**
 * Escape one CSV field.
 *
 * - `null`/`undefined` become an empty field, never the text "null".
 * - Fields containing a comma, quote or line break are quoted, with inner
 *   quotes doubled (RFC 4180).
 * - Free-text values starting with a formula trigger are prefixed with a single
 *   quote so a spreadsheet treats them as text (CSV injection defence).
 */
export function csvField(value: CsvValue): string {
  if (value === null || value === undefined) return '';

  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Serialise one row, padding the unit column so every row has five fields. */
export function csvRow(
  section: CsvSection,
  entity: CsvValue,
  metric: string,
  value: CsvValue,
  unit: CsvValue = '',
): string {
  return [section, entity, metric, value, unit].map(csvField).join(',');
}

/** Build the complete report as CSV text (CRLF line endings, trailing newline). */
export function buildReportCsv({
  generatedAt,
  stats,
  stations,
  fillHistory,
  pointsDaily,
}: ReportSource): string {
  const lines: string[] = [['section', 'entity', 'metric', 'value', 'unit'].join(',')];
  const row = (
    section: CsvSection,
    entity: CsvValue,
    metric: string,
    value: CsvValue,
    unit: CsvValue = '',
  ) => lines.push(csvRow(section, entity, metric, value, unit));

  // 1. Metadata — how and when this snapshot was produced.
  row('metadata', 'report', 'generated_at', generatedAt.toISOString(), 'ISO-8601');
  row('metadata', 'report', 'timezone', fillHistory.timezone);
  row('metadata', 'report', 'fill_history_period', REPORT_FILL_PERIOD);
  row('metadata', 'report', 'fill_history_from', fillHistory.from);
  row('metadata', 'report', 'fill_history_to', fillHistory.to);
  row('metadata', 'report', 'points_history_period', REPORT_POINTS_PERIOD);
  row('metadata', 'report', 'points_history_from', pointsDaily.from);
  row('metadata', 'report', 'points_history_to', pointsDaily.to);

  // 2. Campus summary totals (the same numbers as the KPI cards).
  const { bins, points, stations: stationStats, containers } = stats;
  row('summary', 'campus', 'bins_total', bins.total, 'bins');
  row('summary', 'campus', 'bins_healthy', bins.healthy, 'bins');
  row('summary', 'campus', 'bins_attention', bins.attention, 'bins');
  row('summary', 'campus', 'bins_critical', bins.critical, 'bins');
  row('summary', 'campus', 'bins_offline', bins.offline, 'bins');
  row('summary', 'campus', 'bins_operational_pct', bins.operationalPct, 'percent');
  row('summary', 'campus', 'stations_total', stationStats.total, 'stations');
  row('summary', 'campus', 'stations_valid', stationStats.valid, 'stations');
  row('summary', 'campus', 'stations_incomplete', stationStats.incomplete, 'stations');
  row('summary', 'campus', 'stations_healthy', stationStats.healthy, 'stations');
  row('summary', 'campus', 'stations_attention', stationStats.attention, 'stations');
  row('summary', 'campus', 'stations_critical', stationStats.critical, 'stations');
  row('summary', 'campus', 'stations_unknown', stationStats.unknown, 'stations');
  row('summary', 'campus', 'stations_online', stationStats.online, 'stations');
  row('summary', 'campus', 'stations_partial', stationStats.partial, 'stations');
  row('summary', 'campus', 'stations_offline', stationStats.offline, 'stations');
  row(
    'summary',
    'campus',
    'stations_fully_connected_pct',
    stationStats.fullyConnectedPct,
    'percent',
  );
  row('summary', 'campus', 'containers_total', containers.total, 'containers');
  row('summary', 'campus', 'containers_healthy', containers.healthy, 'containers');
  row('summary', 'campus', 'containers_attention', containers.attention, 'containers');
  row('summary', 'campus', 'containers_critical', containers.critical, 'containers');
  row('summary', 'campus', 'containers_unknown', containers.unknown, 'containers');
  row('summary', 'campus', 'containers_online', containers.online, 'containers');
  row('summary', 'campus', 'containers_offline', containers.offline, 'containers');
  row('summary', 'campus', 'containers_never_connected', containers.neverConnected, 'containers');
  row('summary', 'campus', 'containers_unassigned', containers.unassigned, 'containers');
  row('summary', 'campus', 'containers_orphaned', containers.orphaned, 'containers');
  row('summary', 'campus', 'containers_online_pct', containers.onlinePct, 'percent');
  row('summary', 'campus', 'containers_average_fill', containers.averageFill, 'percent');
  row('summary', 'campus', 'points_total', points.totalPoints, 'points');
  row('summary', 'campus', 'students_total', points.studentCount, 'students');

  // 3. Stations and their containers.
  for (const station of stations) {
    row('station', station.stationId, 'name', station.name);
    row('station', station.stationId, 'building', station.location.building);
    row('station', station.stationId, 'severity', station.severity);
    row('station', station.stationId, 'connectivity', station.connectivity);
    row('station', station.stationId, 'integrity_valid', station.integrity.valid);
    row('station', station.stationId, 'containers', station.containers.length, 'containers');
    row('station', station.stationId, 'last_sync_at', station.lastSyncAt, 'ISO-8601');

    for (const container of station.containers) {
      row('container', container.deviceId, 'station_id', container.stationId);
      row('container', container.deviceId, 'name', container.name);
      row('container', container.deviceId, 'waste_type', container.wasteType);
      row('container', container.deviceId, 'fill_level', container.fillLevel, 'percent');
      row('container', container.deviceId, 'fill_status', container.fillStatus);
      row('container', container.deviceId, 'connectivity', container.connectivity);
      row('container', container.deviceId, 'last_sync_at', container.lastSyncAt, 'ISO-8601');
      row('container', container.deviceId, 'last_known', container.lastKnown);
      row('container', container.deviceId, 'is_stale', container.isStale);
    }
  }

  // 4. Chart histories, exactly as the two dashboard charts receive them.
  for (const point of fillHistory.points) {
    row('fill_history', point.bucket, 'avg_fill_level', point.avgFillLevel, 'percent');
    row('fill_history', point.bucket, 'min_fill_level', point.minFillLevel, 'percent');
    row('fill_history', point.bucket, 'max_fill_level', point.maxFillLevel, 'percent');
    row('fill_history', point.bucket, 'samples', point.sampleCount, 'samples');
    row('fill_history', point.bucket, 'containers', point.binCount, 'containers');
  }
  for (const point of pointsDaily.points) {
    row('points_history', point.date, 'points', point.points, 'points');
    row('points_history', point.date, 'students', point.studentCount, 'students');
  }

  return `${lines.join('\r\n')}\r\n`;
}
