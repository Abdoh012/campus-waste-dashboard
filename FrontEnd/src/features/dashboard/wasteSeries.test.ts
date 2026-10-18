import { describe, expect, it } from 'vitest';
import { dashboardSummary, MOCK_NOW, wasteEntries } from './mockData';
import { buildSeries, niceAxis } from './wasteSeries';
import type { WasteEntry } from './types';

const TODAY = '2026-09-18';

const entries: readonly WasteEntry[] = [
  { date: '2025-12-31', kg: 400 }, // before every range
  { date: '2026-01-01', kg: 1 }, // the first day "this year" reaches
  { date: '2026-09-01', kg: 3 }, // inside the year, outside both trailing windows
  { date: '2026-09-10', kg: 5 }, // inside the 30-day window, outside the 7-day one
  { date: '2026-09-14', kg: 7 },
  { date: '2026-09-14', kg: 8 }, // the same day again: summed, never overwritten
  { date: '2026-09-18', kg: 9 }, // today, the last bucket
  { date: '2026-09-19', kg: 11 }, // after today
  { date: '', kg: 13 }, // unreadable: dropped rather than plotted as a stray bucket
];

const kgOf = (series: readonly { kg: number }[]): readonly number[] =>
  series.map((point) => point.kg);

describe('buildSeries', () => {
  it('sums every entry in a bucket and zero-fills the rest', () => {
    const series = buildSeries(entries, 'Last 7 days', TODAY);

    expect(series.map((point) => point.label)).toEqual([
      'Sep 12',
      'Sep 13',
      'Sep 14',
      'Sep 15',
      'Sep 16',
      'Sep 17',
      'Sep 18',
    ]);
    // Sep 14 holds both of its entries; the days around it hold none.
    expect(kgOf(series)).toEqual([0, 0, 15, 0, 0, 0, 9]);
  });

  it('totals the range, not the source: nothing in the window is dropped', () => {
    const series = buildSeries(entries, 'Last 30 days', TODAY);

    expect(series).toHaveLength(30);
    expect(series[0]?.label).toBe('Aug 20');
    // 3 + 5 + 7 + 8 + 9, and none of the entries outside 20 Aug – 18 Sep.
    expect(kgOf(series).reduce((total, kg) => total + kg, 0)).toBe(32);
  });

  it('buckets the year by month, from 1 January to the current month', () => {
    const series = buildSeries(entries, 'This year', TODAY);

    expect(series.map((point) => point.label)).toEqual([
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
    ]);
    // January's entry counts; last year's and tomorrow's do not.
    expect(series[0]?.kg).toBe(1);
    expect(series.at(-1)?.kg).toBe(32);
  });

  it('measures a range from today, never from the data', () => {
    const entries: readonly WasteEntry[] = [{ date: '2026-09-01', kg: 4 }];

    // The same entry, seen from two different "todays": the window moves, the
    // data does not.
    expect(kgOf(buildSeries(entries, 'Last 7 days', '2026-09-02'))).toEqual([0, 0, 0, 0, 0, 4, 0]);
    expect(kgOf(buildSeries(entries, 'Last 7 days', '2026-09-30'))).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('renders a flat baseline when the range holds nothing', () => {
    const series = buildSeries([], 'Last 7 days', TODAY);

    expect(kgOf(series)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(niceAxis(Math.max(...kgOf(series)))).toEqual({
      top: 5,
      ticks: [0, 1, 2, 3, 4, 5],
    });
  });
});

describe('niceAxis', () => {
  it('leaves the tallest bucket headroom under round ticks', () => {
    expect(niceAxis(98)).toEqual({ top: 100, ticks: [0, 20, 40, 60, 80, 100] });
    expect(niceAxis(46)).toEqual({ top: 50, ticks: [0, 10, 20, 30, 40, 50] });
    expect(niceAxis(1925)).toEqual({ top: 2000, ticks: [0, 500, 1000, 1500, 2000] });
  });

  it('never labels a fraction of a kilogram', () => {
    expect(niceAxis(6).ticks).toEqual([0, 2, 4, 6]);
    expect(niceAxis(12).ticks).toEqual([0, 5, 10, 15]);
    expect(niceAxis(0)).toEqual({ top: 5, ticks: [0, 1, 2, 3, 4, 5] });
  });
});

describe('the mock fixture', () => {
  it('runs from 1 January to the snapshot clock, with the KPI month intact', () => {
    expect(wasteEntries[0]?.date).toBe('2026-01-01');
    expect(wasteEntries.at(-1)?.date).toBe(MOCK_NOW);
    expect(wasteEntries.every((entry) => entry.kg > 0)).toBe(true);

    // The current month is the last monthly bucket, and it is the figure the
    // KPI card shows for "this month" (rounding the days to whole kilos moves
    // it by a few).
    const thisMonth = buildSeries(wasteEntries, 'This year', MOCK_NOW).at(-1)?.kg ?? 0;
    const drift = Math.abs(thisMonth - dashboardSummary.wasteSortedKg);
    expect(drift / dashboardSummary.wasteSortedKg).toBeLessThan(0.02);
  });

  it('has data in every month of the year so far', () => {
    const series = buildSeries(wasteEntries, 'This year', MOCK_NOW);

    expect(series.every((point) => point.kg > 0)).toBe(true);
    expect(series.at(-1)?.label).toBe('Sep');
  });
});
