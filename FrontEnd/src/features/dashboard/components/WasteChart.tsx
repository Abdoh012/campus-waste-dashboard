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
import { wasteSortedByWeek } from '../mockData';
import { WASTE_PERIODS } from '../options';

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

const chartConfig = {
  kg: {
    label: 'Waste sorted (kg)',
    color: 'var(--color-chart-line)',
  },
} satisfies ChartConfig;

export default function WasteChart() {
  const [period, setPeriod] = useState<string>(WASTE_PERIODS[0]);

  const handlePeriodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setPeriod(value);
    showSuccess(`Waste chart updated to ${value.toLowerCase()}`);
  };

  return (
    <article className={`${SURFACE} p-5 max-sm:p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>DIVERSION IMPACT</Eyebrow>
          <h3 className="font-heading text-lg font-semibold tracking-tight">Waste sorted over time</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-heading text-base font-semibold max-sm:hidden">
            1,248 <small className="font-sans text-2xs font-normal text-label">kg total</small>
          </span>
          <select
            className="rounded border border-border bg-input p-2 text-2xs text-muted-foreground"
            aria-label="Waste chart period"
            value={period}
            onChange={handlePeriodChange}
          >
            {WASTE_PERIODS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <ChartContainer
        config={chartConfig}
        className="mt-4 aspect-auto h-56 w-full max-sm:h-48"
        role="img"
        aria-label="Waste sorted over time line chart"
      >
        <AreaChart
          data={wasteSortedByWeek}
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
            tickFormatter={(value: number) => `${value} kg`}
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

          {wasteSortedByWeek
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
    </article>
  );
}
