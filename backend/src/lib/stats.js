// src/lib/stats.js
import { OFFLINE_THRESHOLD_MS } from '../env.js';
import { Bin } from '../models/Bin.js';
import { Station } from '../models/Station.js';
import { Student } from '../models/Student.js';
import { isOffline } from './status.js';
import {
  FILL_STATUSES,
  CONNECTIVITIES,
  STATION_CONNECTIVITIES,
  CONTAINER_FIELDS,
  groupBinsByStation,
  toContainerDto,
  toStationDto,
} from './stations.js';

const round1 = (value) => Math.round(value * 10) / 10;
const percent = (part, total) => (total > 0 ? round1((part / total) * 100) : 0);

/** Counts bins by their *effective* status (same offline override as toBinDto). */
async function getBinsSummary({ thresholdMs = OFFLINE_THRESHOLD_MS } = {}) {
  const bins = await Bin.find({}, 'status lastSyncAt').lean();

  const summary = { total: bins.length, healthy: 0, attention: 0, critical: 0, offline: 0 };

  for (const bin of bins) {
    const effectiveStatus = isOffline(bin.lastSyncAt, { thresholdMs }) ? 'offline' : bin.status;
    if (effectiveStatus in summary) summary[effectiveStatus] += 1;
  }

  summary.operationalPct = percent(summary.total - summary.offline, summary.total);

  return summary;
}

async function getPointsSummary() {
  const result = await Student.aggregate([
    { $group: { _id: null, totalPoints: { $sum: '$points' }, studentCount: { $sum: 1 } } },
  ]);
  const { totalPoints = 0, studentCount = 0 } = result[0] || {};
  return { totalPoints, studentCount };
}

/**
 * Pure station/container KPI aggregation. Exported so the exact fixture
 * arithmetic can be tested without a database or a wall clock.
 *
 * Station severity/connectivity counts only include *valid* stations (exactly
 * three well-formed containers). Incomplete stations are counted separately so
 * they are never silently presented as valid.
 *
 * Container metrics cover containers that are associated with a station; bins
 * without a stationId (legacy demo records) are reported as `unassigned` and
 * containers pointing at a missing station as `orphaned`.
 */
export function summarizeStationAndContainers(
  stations,
  bins,
  { now = Date.now(), thresholdMs = OFFLINE_THRESHOLD_MS } = {},
) {
  const stationIds = new Set(stations.map((station) => station.stationId));
  const groups = groupBinsByStation(bins);

  const dtos = stations.map((station) =>
    toStationDto(station, groups.get(station.stationId) ?? [], { now, thresholdMs }),
  );
  const valid = dtos.filter((dto) => dto.integrity.valid);

  const stationsSummary = {
    total: dtos.length,
    valid: valid.length,
    incomplete: dtos.length - valid.length,
    healthy: valid.filter((dto) => dto.severity === FILL_STATUSES.HEALTHY).length,
    attention: valid.filter((dto) => dto.severity === FILL_STATUSES.ATTENTION).length,
    critical: valid.filter((dto) => dto.severity === FILL_STATUSES.CRITICAL).length,
    unknown: valid.filter((dto) => dto.severity === FILL_STATUSES.UNKNOWN).length,
    online: valid.filter((dto) => dto.connectivity === STATION_CONNECTIVITIES.ONLINE).length,
    partial: valid.filter((dto) => dto.connectivity === STATION_CONNECTIVITIES.PARTIAL).length,
    offline: valid.filter((dto) => dto.connectivity === STATION_CONNECTIVITIES.OFFLINE).length,
  };
  stationsSummary.fullyConnectedPct = percent(
    stationsSummary.online,
    stationsSummary.valid,
  );

  const assigned = bins.filter((bin) => bin.stationId);
  const containerDtos = assigned.map((bin) =>
    toContainerDto(bin, { now, thresholdMs }),
  );

  const containersSummary = {
    total: containerDtos.length,
    healthy: containerDtos.filter((dto) => dto.fillStatus === FILL_STATUSES.HEALTHY).length,
    attention: containerDtos.filter((dto) => dto.fillStatus === FILL_STATUSES.ATTENTION).length,
    critical: containerDtos.filter((dto) => dto.fillStatus === FILL_STATUSES.CRITICAL).length,
    unknown: containerDtos.filter((dto) => dto.fillStatus === FILL_STATUSES.UNKNOWN).length,
    online: containerDtos.filter((dto) => dto.connectivity === CONNECTIVITIES.ONLINE).length,
    offline: containerDtos.filter((dto) => dto.connectivity === CONNECTIVITIES.OFFLINE).length,
    neverConnected: containerDtos.filter(
      (dto) => dto.connectivity === CONNECTIVITIES.NEVER_CONNECTED,
    ).length,
    unassigned: bins.filter((bin) => !bin.stationId).length,
    orphaned: assigned.filter((bin) => !stationIds.has(bin.stationId)).length,
  };
  containersSummary.onlinePct = percent(containersSummary.online, containersSummary.total);

  const known = containerDtos
    .map((dto) => dto.fillLevel)
    .filter((fill) => fill !== null);
  containersSummary.averageFill = known.length
    ? round1(known.reduce((sum, fill) => sum + fill, 0) / known.length)
    : null;

  return { stations: stationsSummary, containers: containersSummary };
}

async function getStationAndContainerSummary(opts = {}) {
  const [stations, bins] = await Promise.all([
    Station.find().lean(),
    Bin.find({}, CONTAINER_FIELDS).lean(),
  ]);

  return summarizeStationAndContainers(stations, bins, opts);
}

export async function getOverviewStats(opts) {
  const [bins, points, stationAndContainer] = await Promise.all([
    getBinsSummary(opts),
    getPointsSummary(),
    getStationAndContainerSummary(opts),
  ]);
  return { bins, points, ...stationAndContainer };
}

/** Shared station view for `GET /api/stations`. */
export async function getStationDtos({ now = Date.now(), thresholdMs = OFFLINE_THRESHOLD_MS } = {}) {
  const [stations, bins] = await Promise.all([
    Station.find().sort({ stationId: 1 }).lean(),
    Bin.find({}, CONTAINER_FIELDS).lean(),
  ]);
  const groups = groupBinsByStation(bins);
  return stations.map((station) =>
    toStationDto(station, groups.get(station.stationId) ?? [], { now, thresholdMs }),
  );
}
