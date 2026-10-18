/**
 * Static UI options and decorative geometry for the dashboard.
 *
 * This is presentation configuration, not domain data (that lives in
 * `mockData.ts`). Keeping it out of the components means each component renders
 * data rather than declaring its own constants.
 */

export const MAP_VIEWS = ['Campus view', 'Satellite'] as const;
export type MapView = (typeof MAP_VIEWS)[number];

export const WASTE_PERIODS = ['Last 30 days', 'Last 7 days', 'This year'] as const;
/** The waste chart's period selector value; `wasteSeries.ts` owns its window. */
export type WastePeriod = (typeof WASTE_PERIODS)[number];

/** Narrows the `<select>`'s string value back to the option union. */
export const isWastePeriod = (value: string): value is WastePeriod =>
  WASTE_PERIODS.some((option) => option === value);

/** Bar heights (px) for the diversion-rate sparkline. */
export const SPARKLINE_HEIGHTS: readonly number[] = [8, 12, 10, 16, 14, 20, 17, 23, 25];

/** Bar heights (px) for the waste-sorted mini bars. */
export const MINI_BAR_HEIGHTS: readonly number[] = [8, 13, 10, 17, 14, 19, 16, 21, 19, 22, 20, 23];
