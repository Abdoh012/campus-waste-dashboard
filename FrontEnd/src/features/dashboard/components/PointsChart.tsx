import { Bar, BarChart, Cell, ReferenceLine, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../../../components/ui/chart';
import type { ChartConfig } from '../../../components/ui/chart';
import Eyebrow from '../../../shared/ui/Eyebrow';
import TrendBadge from '../../../shared/ui/TrendBadge';
import { SURFACE } from '../../../styles/surfaces';
import { pointsByDay } from '../mockData';

/** See `WasteChart`: ticks are SVG text, and ChartContainer owns their colour. */
const AXIS_TICK = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
} as const;

const chartConfig = {
  height: {
    label: 'Points earned',
    color: 'var(--color-bar-active)',
  },
} satisfies ChartConfig;

export interface PointsChartProps {
  totalPoints: number;
}

export default function PointsChart({ totalPoints }: PointsChartProps) {
  return (
    <article className={`${SURFACE} p-5 max-sm:p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>STUDENT ENGAGEMENT</Eyebrow>
          <h3 className="font-heading text-lg font-semibold tracking-tight">Points distributed</h3>
        </div>
        <button className="cursor-pointer border-0 bg-transparent text-xs tracking-widest text-label-muted" type="button" aria-label="More options">
          •••
        </button>
      </div>

      <div className="mt-5 mb-2 flex items-baseline gap-3">
        <strong className="font-heading text-3xl font-semibold tracking-tighter">{totalPoints.toLocaleString()}</strong>
        <TrendBadge tone="up">↑ 18.4%</TrendBadge>
        <small className="ml-auto block text-2xs text-label">vs. previous period</small>
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-40 w-full"
        role="img"
        aria-label="Points distributed bar chart"
      >
        <BarChart data={pointsByDay} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          {/* Bars are drawn as a share of the plot height, so the domain is fixed at 0–100
              and the value axis itself stays hidden — as it was before. */}
          <YAxis dataKey="height" domain={[0, 100]} hide />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={{ stroke: 'var(--color-bar-border)' }}
            tickMargin={8}
            tick={AXIS_TICK}
          />
          <ReferenceLine y={25} stroke="var(--color-bar-grid)" strokeDasharray="3 3" />
          <ReferenceLine y={75} stroke="var(--color-bar-grid)" strokeDasharray="3 3" />
          <ChartTooltip content={<ChartTooltipContent />} />

          <Bar
            dataKey="height"
            fill="var(--color-bar)"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          >
            {pointsByDay.map((bar) => (
              <Cell
                key={bar.day}
                fill={bar.active ? 'var(--color-bar-active)' : 'var(--color-bar)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-3 flex justify-between text-2xs text-label">
        <span>
          <i className="mr-1 inline-block h-2 w-2 rounded-xs bg-bar-active"></i>Points earned from sorting
        </span>
        <span>Goal: 6,000</span>
      </div>
    </article>
  );
}
