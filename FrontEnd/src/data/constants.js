/**
 * Static UI options and decorative geometry.
 *
 * Kept out of the components (and out of mockData.js, which holds domain data)
 * so the components render data without declaring any inline constants.
 */

export const MAP_VIEWS = ['Campus view', 'Satellite'];

export const WASTE_PERIODS = ['Last 30 days', 'Last 7 days', 'This year'];

/** Bar heights (px) for the diversion-rate sparkline. */
export const SPARKLINE_HEIGHTS = [8, 12, 10, 16, 14, 20, 17, 23, 25];

/** Bar heights (px) for the waste-sorted mini bars. */
export const MINI_BAR_HEIGHTS = [8, 13, 10, 17, 14, 19, 16, 21, 19, 22, 20, 23];
