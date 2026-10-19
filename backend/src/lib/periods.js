/**
 * Shared period resolution for the history endpoints.
 *
 * Every boundary is a UTC calendar boundary. `last7` and `last30` include
 * today's partial bucket; the range always ends at the server's "now".
 * `last7` / `last30` aggregate per day, `year` aggregates per month.
 */

export const HISTORY_PERIODS = Object.freeze(['last7', 'last30', 'year']);

const DAY_MS = 86_400_000;

/** UTC midnight for the calendar day containing `date`. */
function startOfUtcDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function isHistoryPeriod(value) {
  return HISTORY_PERIODS.includes(value);
}

/**
 * @param {'last7'|'last30'|'year'} period
 * @param {Date} [now]
 * @returns {{
 *   period: 'last7'|'last30'|'year',
 *   from: Date,
 *   to: Date,
 *   timezone: 'UTC',
 *   bucket: 'day'|'month',
 *   bucketFormat: string
 * }}
 */
export function resolveHistoryPeriod(period, now = new Date()) {
  const today = startOfUtcDay(now);

  let from;
  if (period === 'last7') {
    from = new Date(today.getTime() - 6 * DAY_MS);
  } else if (period === 'last30') {
    from = new Date(today.getTime() - 29 * DAY_MS);
  } else {
    from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  }

  const monthly = period === 'year';

  return {
    period,
    from,
    to: now,
    timezone: 'UTC',
    bucket: monthly ? 'month' : 'day',
    bucketFormat: monthly ? '%Y-%m' : '%Y-%m-%d',
  };
}
