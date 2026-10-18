import { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
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
import { isWastePeriod, WASTE_PERIODS } from '../options';
import type { WastePeriod } from '../options';
import { wasteInPeriod } from '../wasteSeries';

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

/** Stable period values; only the option labels are translated. */
const PERIOD_KEYS: Record<WastePeriod, StringKey> = {
  'Last 30 days': 'waste.period.last30',
  'Last 7 days': 'waste.period.last7',
  'This year': 'waste.period.thisYear',
};

export default function WasteChart() {
  const { t, formatNumber } = useI18n();
  const [period, setPeriod] = useState<WastePeriod>(WASTE_PERIODS[0]);

  const chartConfig = {
    kg: {
      label: t('waste.seriesLabel'),
      color: 'var(--color-chart-line)',
    },
  } satisfies ChartConfig;

  // The period picks the points, and the line, its markers and the header total
  // all read from that one selection.
  const points = wasteInPeriod(period);
  const totalKg = points.reduce((total, point) => total + point.kg, 0);

  const handlePeriodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (!isWastePeriod(value)) return;
    setPeriod(value);
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
            {formatNumber(totalKg)}{' '}
            <small className="font-sans text-2xs font-normal text-label">
              {t('waste.totalUnit')}
            </small>
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

      {points.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto h-56 w-full max-sm:h-48"
          role="img"
          aria-label={t('waste.title')}
          dir="ltr"
        >
          <AreaChart
            data={points}
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
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={AXIS_TICK}
            />
            <YAxis
              dataKey="kg"
              type="number"
              domain={[0, 200]}
              ticks={[0, 50, 100, 150, 200]}
              tickFormatter={(value: number) =>
                `${formatNumber(value)} ${t('metric.unit.kg')}`
              }
              tickLine={false}
              axisLine={false}
              width={52}
              tick={AXIS_TICK}
            />
            <ChartTooltip content={<ChartTooltipContent color="var(--color-chart-line)" />} />

            <Area
              dataKey="kg"
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

            {points
              .filter((point) => point.emphasised)
              .map((point) => (
                <ReferenceDot
                  key={point.week}
                  x={point.week}
                  y={point.kg}
                  r={5}
                  fill="var(--color-card)"
                  stroke="var(--color-chart-line)"
                  strokeWidth={3}
                />
              ))}
          </AreaChart>
        </ChartContainer>
      ) : (
        // A window can outrun the snapshot (see `MOCK_NOW`): keep the panel's
        // height and say so, rather than drawing axes with nothing in them.
        <p className="mt-4 grid h-56 w-full place-items-center rounded border border-dashed border-border text-2xs text-muted-foreground max-sm:h-48">
          {t('waste.empty')}
        </p>
      )}
    </article>
  );
}
