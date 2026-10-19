import { useState } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../features/dashboard/components/BottomNav";
import Topbar from "../features/dashboard/components/Topbar";
import MetricGrid from "../features/dashboard/components/MetricGrid";
import CampusMap from "../features/dashboard/components/CampusMap";
import WasteChart from "../features/dashboard/components/WasteChart";
import PointsChart from "../features/dashboard/components/PointsChart";
import PageFooter from "../features/dashboard/components/PageFooter";
import { useActiveSection } from "../features/dashboard/hooks/useActiveSection";
import { useFillHistory } from "../features/dashboard/hooks/useFillHistory";
import { useDailyPoints } from "../features/dashboard/hooks/useDailyPoints";
import { WASTE_PERIODS } from "../features/dashboard/options";
import type { WastePeriod } from "../features/dashboard/options";
import { useStats } from "../shared/hooks/useStats";
import type { HistoryPeriod } from "../services/historyApi";

/** The chart's display periods map onto the API's period values. */
const HISTORY_PERIOD_BY_WASTE_PERIOD: Record<WastePeriod, HistoryPeriod> = {
  "Last 30 days": "last30",
  "Last 7 days": "last7",
  "This year": "year",
};

export default function DashboardPage() {
  const { activeId, navigate } = useActiveSection();
  const [wastePeriod, setWastePeriod] = useState<WastePeriod>(WASTE_PERIODS[0]);

  const goToSignIn = useNavigate();

  // One stats request feeds both the KPI cards and the points-card total.
  const { stats, loading: statsLoading, error: statsError } = useStats();
  const fillHistory = useFillHistory(HISTORY_PERIOD_BY_WASTE_PERIOD[wastePeriod]);
  const dailyPoints = useDailyPoints("last7");

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-7xl px-10 pt-8 pb-28 max-lg:px-6 max-lg:pt-6 max-sm:px-4 max-sm:pt-5">
        <Topbar />

        <MetricGrid
          stats={stats}
          loading={statsLoading}
          error={statsError}
        />

        <section className="mb-4">
          <CampusMap />
        </section>

        <section
          className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          id="analytics"
        >
          <WasteChart
            period={wastePeriod}
            onPeriodChange={setWastePeriod}
            data={fillHistory.data}
            loading={fillHistory.loading}
            error={fillHistory.error}
          />
          <PointsChart
            totalPoints={stats?.points.totalPoints ?? null}
            data={dailyPoints.data}
            loading={dailyPoints.loading}
            error={dailyPoints.error}
          />
        </section>

        <PageFooter />
      </main>

      <BottomNav
        activeId={activeId}
        onNavigate={navigate}
        onLogout={() => goToSignIn("/")}
      />
    </div>
  );
}
