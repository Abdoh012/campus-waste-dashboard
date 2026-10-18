/**
 * The waste-sorted chart's period filter.
 *
 * The series is a snapshot (see `MOCK_NOW`), so each window is measured from
 * that date rather than from the visitor's clock, and every window ends on it.
 * Both ends are inclusive; a point whose `date` will not parse is excluded
 * rather than crashing the chart.
 */

import { MOCK_NOW, wasteSortedByWeek } from './mockData';
import type { WastePeriod } from './options';
import type { WasteSortedPoint } from './types';

const DAY_MS = 86_400_000;

/** UTC midnight, so a window's edges cannot shift with the visitor's time zone. */
const atMidnight = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

/** A window of `days` calendar days ending on the anchor day, today included. */
const trailingDays = (days: number) => (asOf: number) =>
  asOf - (days - 1) * DAY_MS;

/**
 * The first day each option reaches back to. A new option in `WASTE_PERIODS` is
 * a compile error until it has a window here.
 */
const PERIOD_START = {
  'Last 30 days': trailingDays(30),
  'Last 7 days': trailingDays(7),
  'This year': (asOf: number) => Date.UTC(new Date(asOf).getUTCFullYear(), 0, 1),
} satisfies Record<WastePeriod, (asOf: number) => number>;

/** The series points inside the selected period, oldest first. */
export function wasteInPeriod(period: WastePeriod): readonly WasteSortedPoint[] {
  const asOf = atMidnight(MOCK_NOW);
  const from = PERIOD_START[period](asOf);

  return wasteSortedByWeek.filter((point) => {
    const at = atMidnight(point.date);
    return at >= from && at <= asOf;
  });
}
