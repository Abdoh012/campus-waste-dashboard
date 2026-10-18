import StatCard from '../../../shared/ui/StatCard';
import TrendBadge from '../../../shared/ui/TrendBadge';
import { metricCards } from '../metricCards';

const UNIT = 'font-sans text-xs font-medium tracking-normal text-label';

export default function MetricGrid() {
  return (
    <section
      className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5"
      id="overview"
    >
      {metricCards.map((metric) => (
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
            <>
              <TrendBadge tone={metric.badge.tone}>{metric.badge.text}</TrendBadge>
              <span>{metric.note}</span>
            </>
          }
        >
          {metric.visual}
        </StatCard>
      ))}
    </section>
  );
}
