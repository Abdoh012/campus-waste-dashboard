import type { ChangeEvent } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../../../components/ui/chart';
import type { ChartConfig } from '../../../components/ui/chart';
import Eyebrow from '../../../shared/ui/Eyebrow';
import { showSuccess } from '../../../shared/ui/notifications';
import { SURFACE } from '../../../styles/surfaces';
import { useI18n } from '../../../shared/i18n/useI18n';
import type { StringKey } from '../../../shared/i18n/locales/en';
import type { ApiError } from '../../../services/apiClient';
import type {
  FillHistoryResponse,
  HistoryBucket,
} from '../../../services/historyApi';
import { isWastePeriod, WASTE_PERIODS } from '../options';
import type { WastePeriod } from '../options';

/**
 * ChartContainer already colours axis ticks with the project's secondary-text
 * token, so this only pins the mono micro-label font the design uses for axes.
 * Recharts renders ticks as SVG text, which is why the values are SVG attributes
 * rather than Tailwind classes.
 */
const AXIS_TICK = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
} as const;

/** One chart per page, so a fixed gradient id is safe (as it was before). */
const AREA_GRADIENT_ID = 'wasteAreaGradient';

const CHART_STATE =
  'mt-4 grid h-56 w-full place-items-center rounded border border-dashed border-border text-2xs text-muted-foreground max-sm:h-48';

/** Stable period values; only the option labels are translated. */
const PERIOD_KEYS: Record<WastePeriod, StringKey> = {
  'Last 30 days': 'waste.period.last30',
  'Last 7 days': 'waste.period.last7',
  'This year': 'waste.period.thisYear',
};

type FormatDate = (value: Date, options?: Intl.DateTimeFormatOptions) => string;

/** Turn an API bucket (`2026-10-18` or `2026-10`) into a short axis label. */
function bucketLabel(
  bucket: string,
  unit: HistoryBucket,
  formatDate: FormatDate,
): string {
  if (unit === 'month') {
    return formatDate(new Date(`${bucket}-01T00:00:00Z`), {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  return formatDate(new Date(`${bucket}T00:00:00Z`), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export interface WasteChartProps {
  period: WastePeriod;
  onPeriodChange: (period: WastePeriod) => void;
  data: FillHistoryResponse | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Average bin fill level over time. The series is a percentage; it is never
 * converted to weight. Only buckets that contain real ScanEvents are plotted.
 */
export default function WasteChart({
  period,
  onPeriodChange,
  data,
  loading,
  error,
}: WasteChartProps) {
  const { t, formatNumber, formatDate } = useI18n();

  const chartConfig = {
    fillLevel: {
      label: t('waste.seriesLabel'),
      color: 'var(--color-chart-line)',
    },
  } satisfies ChartConfig;

  const points = data?.points ?? [];
  const bucket = data?.bucket ?? 'day';

  const chartPoints = points.map((point) => ({
    label: bucketLabel(point.bucket, bucket, formatDate),
    fillLevel: point.avgFillLevel,
  }));

  const samples = points.reduce((total, point) => total + point.sampleCount, 0);
  const weightedTotal = points.reduce(
    (total, point) => total + point.avgFillLevel * point.sampleCount,
    0,
  );
  const average =
    samples > 0 ? Math.round((weightedTotal / samples) * 10) / 10 : null;

  const handlePeriodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (!isWastePeriod(value)) return;
    onPeriodChange(value);
    showSuccess(
      t('waste.updatedToast', { period: t(PERIOD_KEYS[value]).toLowerCase() }),
    );
  };

  return (
    <article className={`${SURFACE} p-5 max-sm:p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>{t('waste.eyebrow')}</Eyebrow>
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            {t('waste.title')}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-heading text-base font-semibold max-sm:hidden">
            {average === null ? (
              '—'
            ) : (
              <>
                {formatNumber(average)}{' '}
                <small className="font-sans text-2xs font-normal text-label">
                  {t('waste.averageUnit')}
                </small>
              </>
            )}
          </span>
          <select
            className="rounded border border-border bg-input p-2 text-2xs text-muted-foreground"
            aria-label={t('waste.periodAria')}
            value={period}
            onChange={handlePeriodChange}
          >
            {WASTE_PERIODS.map((option) => (
              <option key={option} value={option}>
                {t(PERIOD_KEYS[option])}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className={CHART_STATE}>{t('waste.loading')}</p>
      ) : error ? (
        <p className={CHART_STATE}>{t('waste.error')}</p>
      ) : chartPoints.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto h-56 w-full max-sm:h-48"
          role="img"
          aria-label={t('waste.title')}
          dir="ltr"
        >
          <AreaChart
            data={chartPoints}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-area)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--color-chart-area)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="var(--color-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tick={AXIS_TICK}
            />
            <YAxis
              dataKey="fillLevel"
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value: number) => `${formatNumber(value)}%`}
              tickLine={false}
              axisLine={false}
              width={52}
              tick={AXIS_TICK}
            />
            <ChartTooltip content={<ChartTooltipContent color="var(--color-chart-line)" />} />

            <Area
              dataKey="fillLevel"
              type="monotone"
              stroke="var(--color-chart-line)"
              strokeWidth={3}
              fill={`url(#${AREA_GRADIENT_ID})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: 'var(--color-card)',
                stroke: 'var(--color-chart-line)',
                strokeWidth: 3,
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <p className={CHART_STATE}>{t('waste.empty')}</p>
      )}
    </article>
  );
}
