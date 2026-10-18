import type { ReactNode } from "react";
import type { StatCardTone } from "../../shared/ui/StatCard";
import StatusDot from "../../shared/ui/StatusDot";
import type { TrendTone } from "../../shared/ui/TrendBadge";
import type { Translate, TranslatePlural } from "../../shared/i18n/catalog";
import type { Stats } from "@/shared/hooks/useStats";

export interface Metric {
  id: string;
  label: string;
  icon: string;
  tone: StatCardTone;
  value: string;
  unit?: string;
  badge: { tone: TrendTone; text: string } | undefined;
  note: string;
  visual: ReactNode;
}

/**
 * The four overview cards, built from the active translations. Labels, notes,
 * units and the bins legend are localized; the figures are still the snapshot
 * values in `mockData` until the API wiring lands.
 */
export function buildMetricCards(
  t: Translate,
  tn: TranslatePlural,
  formatNumber: (value: number) => string,
  stats: Stats, // بارامتر جديد
): readonly Metric[] {
  return [
    {
      id: "active-bins",
      label: t("metric.activeBins"),
      icon: "◎",
      tone: "accent",
      value: String(stats.bins.total - stats.bins.offline),
      unit: ` / ${stats.bins.total}`,
      badge: { tone: "neutral", text: `${stats.bins.operationalPct}%` },
      note: t("metric.note.operational"),
      visual: (
        <div className="mt-5 flex gap-2.5 text-2xs text-label">
          <span>
            <StatusDot tone="green" />
            {tn("bins.healthy", stats.bins.healthy)}
          </span>
          <span>
            <StatusDot tone="yellow" />
            {tn("bins.attention", stats.bins.attention)}
          </span>
        </div>
      ),
    },
    {
      id: "points-distributed",
      label: t("metric.pointsDistributed"),
      icon: "✧",
      tone: "info",
      value: formatNumber(stats.points.totalPoints),
      badge: undefined, // مفيش trend حقيقي عندك دلوقتي — سيبها أو اشتغل عليها لاحقًا
      note: t("metric.note.thisMonth"),
      visual: null,
    },
    {
      id: "critical-bins",
      label: t("metric.criticalBins"), // مفتاح ترجمة جديد
      icon: "⚠",
      tone: "primary",
      value: String(stats.bins.critical),
      unit: ` / ${stats.bins.total}`,
      badge: undefined,
      note: t("metric.note.needsAttention"),
      visual: null,
    },
    {
      id: "students-participating",
      label: t("metric.studentsParticipating"), // مفتاح ترجمة جديد
      icon: "◈",
      tone: "secondary",
      value: String(stats.points.studentCount),
      badge: undefined,
      note: t("metric.note.allTime"),
      visual: null,
    },
  ];
}
