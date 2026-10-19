/**
 * Real historical data for the two dashboard charts.
 *
 * Both endpoints are authenticated through the shared API client. Responses are
 * external data, so each one is validated before the chart sees it.
 */

import { ApiError, apiRequest, isRecord } from './apiClient';

export const HISTORY_PERIODS = ['last7', 'last30', 'year'] as const;
export type HistoryPeriod = (typeof HISTORY_PERIODS)[number];
export type HistoryBucket = 'day' | 'month';

export interface FillHistoryPoint {
  /** `YYYY-MM-DD` for day buckets, `YYYY-MM` for month buckets. */
  bucket: string;
  avgFillLevel: number;
  minFillLevel: number;
  maxFillLevel: number;
  sampleCount: number;
  binCount: number;
}

export interface FillHistoryResponse {
  period: HistoryPeriod;
  from: string;
  to: string;
  timezone: 'UTC';
  bucket: HistoryBucket;
  unit: 'percent';
  points: readonly FillHistoryPoint[];
}

export interface DailyPointsPoint {
  /** `YYYY-MM-DD` (UTC). */
  date: string;
  points: number;
  studentCount: number;
}

export interface DailyPointsResponse {
  period: HistoryPeriod;
  from: string;
  to: string;
  timezone: 'UTC';
  bucket: 'day';
  unit: 'points';
  points: readonly DailyPointsPoint[];
}

function isHistoryPeriod(value: unknown): value is HistoryPeriod {
  return (
    value === 'last7' ||
    value === 'last30' ||
    value === 'year'
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPercentage(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/** `YYYY-MM-DD`, and a real UTC calendar day. */
function isIsoDay(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** `YYYY-MM`, and a real UTC calendar month. */
function isIsoMonth(value: string): boolean {
  const date = new Date(`${value}-01T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 7) === value
  );
}

function isFillHistoryPoint(value: unknown): value is FillHistoryPoint {
  return (
    isRecord(value) &&
    typeof value.bucket === 'string' &&
    isPercentage(value.avgFillLevel) &&
    isPercentage(value.minFillLevel) &&
    isPercentage(value.maxFillLevel) &&
    isNonNegativeInteger(value.sampleCount) &&
    isNonNegativeInteger(value.binCount)
  );
}

function isFillHistoryResponse(value: unknown): value is FillHistoryResponse {
  if (
    !isRecord(value) ||
    !isHistoryPeriod(value.period) ||
    typeof value.from !== 'string' ||
    typeof value.to !== 'string' ||
    value.timezone !== 'UTC' ||
    (value.bucket !== 'day' && value.bucket !== 'month') ||
    value.unit !== 'percent' ||
    !Array.isArray(value.points)
  ) {
    return false;
  }

  const points: unknown[] = value.points;

  if (value.bucket === 'month') {
    return points.every(
      (point) => isFillHistoryPoint(point) && isIsoMonth(point.bucket),
    );
  }

  return points.every(
    (point) => isFillHistoryPoint(point) && isIsoDay(point.bucket),
  );
}

function isDailyPointsPoint(value: unknown): value is DailyPointsPoint {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    isIsoDay(value.date) &&
    isNonNegativeInteger(value.points) &&
    isNonNegativeInteger(value.studentCount)
  );
}

function isDailyPointsResponse(value: unknown): value is DailyPointsResponse {
  return (
    isRecord(value) &&
    isHistoryPeriod(value.period) &&
    typeof value.from === 'string' &&
    typeof value.to === 'string' &&
    value.timezone === 'UTC' &&
    value.bucket === 'day' &&
    value.unit === 'points' &&
    Array.isArray(value.points) &&
    value.points.every(isDailyPointsPoint)
  );
}

/** Fill percentage over time, bucketed by UTC day or month. */
export async function fetchFillHistory(
  period: HistoryPeriod,
  signal?: AbortSignal,
): Promise<FillHistoryResponse> {
  const body = await apiRequest(`/stats/fill-history?period=${period}`, { signal });

  if (!isFillHistoryResponse(body)) {
    throw new ApiError(0, 'The fill-history response did not match the expected shape.');
  }

  return body;
}

/** Daily point-award totals from the durable award ledger. */
export async function fetchDailyPoints(
  period: HistoryPeriod,
  signal?: AbortSignal,
): Promise<DailyPointsResponse> {
  const body = await apiRequest(`/stats/points-daily?period=${period}`, { signal });

  if (!isDailyPointsResponse(body)) {
    throw new ApiError(0, 'The daily-points response did not match the expected shape.');
  }

  return body;
}
