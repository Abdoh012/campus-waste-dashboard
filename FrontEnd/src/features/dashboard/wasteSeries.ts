/**
 * The waste-sorted chart's bucketing: one normalised series per selected range.
 *
 * Every range generates its own buckets up front — a day each for the trailing
 * windows, a month each for the year — sums the entries that fall in them, and
 * fills the rest with 0. The chart plots exactly this array and the panel's
 * total sums the same array, so the two cannot disagree.
 *
 * Days are counted as calendar days: entries are date-only, buckets are derived
 * from the range and from `today`, and neither is ever read off the data, so a
 * range cannot silently shrink to the points it happens to contain.
 */

import type { WastePeriod } from './options';
import type { WasteEntry, WasteSeriesPoint } from './types';

const DAY_MS = 86_400_000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** How many buckets the trailing windows reach back over, today included. */
const TRAILING_DAYS = { 'Last 7 days': 7, 'Last 30 days': 30 } as const;

/**
 * Days since the epoch for an ISO `YYYY-MM-DD` calendar day. Splitting the
 * string ourselves keeps this off the timezone treadmill: no instant is ever
 * constructed, so no bucket can shift with the reader's clock. A malformed date
 * yields NaN, which matches no bucket and is therefore dropped.
 */
const dayIndex = (iso: string): number => {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
};

/** The first day of the month a day falls in — the monthly bucket key. */
const monthIndex = (day: number): number => {
  const date = new Date(day * DAY_MS);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / DAY_MS;
};

/** `'Aug 26'` — the design's mono axis label, zero-padded as `'Sep 02'`. */
const dayLabel = (day: number): string => {
  const date = new Date(day * DAY_MS);
  return `${MONTHS[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, '0')}`;
};

/** `'Aug'` — the month label. */
const monthLabel = (month: number): string => MONTHS[new Date(month * DAY_MS).getUTCMonth()];

/** Every day of a trailing window, oldest first. */
const trailingDays = (today: number, length: number): readonly number[] =>
  Array.from({ length }, (_, offset) => today - (length - 1) + offset);

/** January to the month `today` falls in. */
const yearMonths = (today: number): readonly number[] => {
  const date = new Date(today * DAY_MS);
  return Array.from(
    { length: date.getUTCMonth() + 1 },
    (_, month) => Date.UTC(date.getUTCFullYear(), month, 1) / DAY_MS,
  );
};

interface RangePlan {
  /** The range's buckets, oldest first. */
  buckets: (today: number) => readonly number[];
  /** The bucket a record's day belongs to. */
  bucketOf: (day: number) => number;
  /** The bucket's axis label. */
  label: (key: number) => string;
}

/**
 * How each range buckets its entries. Daily for the trailing windows, monthly
 * for the year, so a range is never thinned to the records it contains. A new
 * option in `WASTE_PERIODS` is a compile error until it has a plan here.
 */
const RANGE_PLAN = {
  'Last 7 days': {
    buckets: (today: number) => trailingDays(today, TRAILING_DAYS['Last 7 days']),
    bucketOf: (day: number) => day,
    label: dayLabel,
  },
  'Last 30 days': {
    buckets: (today: number) => trailingDays(today, TRAILING_DAYS['Last 30 days']),
    bucketOf: (day: number) => day,
    label: dayLabel,
  },
  'This year': {
    buckets: yearMonths,
    bucketOf: monthIndex,
    label: monthLabel,
  },
} satisfies Record<WastePeriod, RangePlan>;

/**
 * The selected range as one series, oldest bucket first: every bucket from the
 * range's start to `today`, each holding the sum of the entries in it. `today`
 * is the anchor the range is measured from — here `MOCK_NOW`, the snapshot's own
 * clock — never the first or last record.
 */
export function buildSeries(
  entries: readonly WasteEntry[],
  range: WastePeriod,
  today: string,
): readonly WasteSeriesPoint[] {
  const plan = RANGE_PLAN[range];
  const asOf = dayIndex(today);
  const buckets = plan.buckets(asOf);
  const totals = new Map<number, number>();

  entries.forEach((entry) => {
    const day = dayIndex(entry.date);
    const bucket = plan.bucketOf(day);
    // A record outside the range is not in it: before its first bucket, or
    // after today, which a monthly bucket would otherwise absorb.
    if (day > asOf || !buckets.includes(bucket)) return;
    totals.set(bucket, (totals.get(bucket) ?? 0) + entry.kg);
  });

  return buckets.map((bucket) => ({
    label: plan.label(bucket),
    kg: totals.get(bucket) ?? 0,
  }));
}

/** Tick steps: 1, 2 and 5, each scaled by a power of ten. */
const TICK_STEPS = [1, 2, 5];

/** The most intervals between 0 and the axis top. */
const MAX_TICK_INTERVALS = 5;

/** The smallest axis top, so an all-zero range still has an axis to sit on. */
const MIN_AXIS_TOP = 5;

export interface WasteAxis {
  /** The value the axis tops out at. */
  top: number;
  /** Evenly spaced ticks from 0 to `top`. */
  ticks: readonly number[];
}

/** The smallest whole step that covers `value` in at most `MAX_TICK_INTERVALS`. */
const axisStep = (value: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(value, 1)));

  // Each decade is ten times coarser than the last, so one of them covers.
  for (let decade = Math.max(1, magnitude / 10); ; decade *= 10) {
    const step = TICK_STEPS.map((base) => base * decade).find(
      (candidate) => value / candidate <= MAX_TICK_INTERVALS,
    );
    if (step !== undefined) return step;
  }
};

/**
 * The y axis for a series whose tallest bucket is `value`: the round step above
 * it, the top that step snaps to, and the ticks between. Steps are whole
 * numbers, so the axis never labels a fraction of a kilogram, and an empty
 * series still gets a visible axis to sit flat on.
 */
export function niceAxis(value: number): WasteAxis {
  const step = axisStep(value);
  const top = Math.max(MIN_AXIS_TOP, Math.ceil(value / step) * step);

  return {
    top,
    ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step),
  };
}
