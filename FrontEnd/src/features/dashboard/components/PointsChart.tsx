import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../components/ui/chart";
import type { ChartConfig } from "../../../components/ui/chart";
import Eyebrow from "../../../shared/ui/Eyebrow";
import { SURFACE } from "../../../styles/surfaces";
import { useI18n } from "../../../shared/i18n/useI18n";
import type { ApiError } from "../../../services/apiClient";
import type { DailyPointsResponse } from "../../../services/historyApi";

/** See `WasteChart`: ticks are SVG text, and ChartContainer owns their colour. */
const AXIS_TICK = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
} as const;

const CHART_STATE =
  "mt-5 grid h-40 w-full place-items-center rounded border border-dashed border-border text-2xs text-muted-foreground";

export interface PointsChartProps {
  /** All-time total from `GET /api/stats`; `null` while that request is loading. */
  totalPoints: number | null;
  data: DailyPointsResponse | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Daily point awards from the durable ledger. The header total is the
 * all-time balance from `/api/stats`, which may include awards from before the
 * daily ledger existed; the bars include only recorded award events.
 */
export default function PointsChart({
  totalPoints,
  data,
  loading,
  error,
}: PointsChartProps) {
  const { t, formatNumber, formatDate } = useI18n();

  const chartConfig = {
    points: {
      label: t("points.seriesLabel"),
      color: "var(--color-bar-active)",
    },
  } satisfies ChartConfig;

  const bars = (data?.points ?? []).map((point, index, all) => ({
    date: point.date,
    label: formatDate(new Date(`${point.date}T00:00:00Z`), {
      weekday: "short",
      timeZone: "UTC",
    }),
    points: point.points,
    active: index === all.length - 1,
  }));

  return (
    <article className={`${SURFACE} p-5 max-sm:p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>{t("points.eyebrow")}</Eyebrow>
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            {t("points.title")}
          </h3>
        </div>
      </div>

      <div className="mt-5 mb-2 flex items-baseline gap-3">
        <strong className="font-heading text-3xl font-semibold tracking-tighter">
          {totalPoints === null ? "—" : formatNumber(totalPoints)}
        </strong>
        <small className="ms-auto block text-2xs text-label">
          {t("points.allTime")}
        </small>
      </div>

      {loading ? (
        <p className={CHART_STATE}>{t("points.loading")}</p>
      ) : error ? (
        <p className={CHART_STATE}>{t("points.error")}</p>
      ) : bars.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-40 w-full"
          role="img"
          aria-label={t("points.title")}
          dir="ltr"
        >
          <BarChart
            data={bars}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <YAxis dataKey="points" domain={[0, "dataMax"]} hide />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--color-bar-border)" }}
              tickMargin={8}
              tick={AXIS_TICK}
            />
            <ChartTooltip content={<ChartTooltipContent />} />

            <Bar
              dataKey="points"
              fill="var(--color-bar)"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
              isAnimationActive={false}
            >
              {bars.map((bar) => (
                <Cell
                  key={bar.date}
                  fill={
                    bar.active ? "var(--color-bar-active)" : "var(--color-bar)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (
        <p className={CHART_STATE}>{t("points.empty")}</p>
      )}

      <div className="mt-3 flex justify-between text-2xs text-label">
        <span>
          <i className="me-1 inline-block h-2 w-2 rounded-xs bg-bar-active"></i>
          {t("points.legend")}
        </span>
      </div>
    </article>
  );
}
