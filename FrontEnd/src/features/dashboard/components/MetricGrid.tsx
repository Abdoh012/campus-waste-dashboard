import { useMemo } from "react";
import StatCard from "../../../shared/ui/StatCard";
import TrendBadge from "../../../shared/ui/TrendBadge";
import { useI18n } from "../../../shared/i18n/useI18n";
import type { Stats } from "../../../shared/hooks/useStats";
import { buildMetricCards } from "../metricCards";
import { buildContainerAlerts } from "../containerAlerts";

const UNIT = "font-sans text-xs font-medium tracking-normal text-label";

export interface MetricGridProps {
  stats: Stats | null;
  loading: boolean;
  error: string | null;
}

export default function MetricGrid({ stats, loading, error }: MetricGridProps) {
  const { t, tn, formatNumber } = useI18n();

  const cards = useMemo(
    () => (stats ? buildMetricCards(t, tn, formatNumber, stats) : []),
    [t, tn, formatNumber, stats],
  );

  const alerts = useMemo(
    () => (stats ? buildContainerAlerts(t, stats.containers) : []),
    [t, stats],
  );

  if (loading) {
    return (
      <section className="mb-4 text-sm text-label" id="overview">
        {t("metric.loading")}
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section className="mb-4 text-sm text-label" id="overview">
        {t("metric.error")}
      </section>
    );
  }

  return (
    <>
      <section
        className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5"
        id="overview"
      >
        {cards.map((metric) => (
          <StatCard
            key={metric.id}
            label={metric.label}
            icon={metric.icon}
            tone={metric.tone}
            value={
              <>
                {metric.value}
                {metric.unit !== undefined && (
                  <span className={UNIT}>{metric.unit}</span>
                )}
              </>
            }
            footer={
              metric.badge || metric.note ? (
                <>
                  {metric.badge && (
                    <TrendBadge tone={metric.badge.tone}>
                      {metric.badge.text}
                    </TrendBadge>
                  )}
                  {metric.note && <span>{metric.note}</span>}
                </>
              ) : undefined
            }
          >
            {metric.visual}
          </StatCard>
        ))}
      </section>

      {alerts.length > 0 && (
        <section
          className="mb-4 flex flex-col gap-1 text-2xs text-warning-fg"
          id="overview-alerts"
          role="status"
        >
          {alerts.map((alert) => (
            <p key={alert} className="flex items-start gap-1.5">
              <span aria-hidden="true">⚠</span>
              <span>{alert}</span>
            </p>
          ))}
        </section>
      )}
    </>
  );
}
