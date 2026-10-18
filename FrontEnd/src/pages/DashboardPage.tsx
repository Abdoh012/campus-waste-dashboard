import { useNavigate } from "react-router";
import BottomNav from "../features/dashboard/components/BottomNav";
import Topbar from "../features/dashboard/components/Topbar";
import MetricGrid from "../features/dashboard/components/MetricGrid";
import CampusMap from "../features/dashboard/components/CampusMap";
import WasteChart from "../features/dashboard/components/WasteChart";
import PointsChart from "../features/dashboard/components/PointsChart";
import PageFooter from "../features/dashboard/components/PageFooter";
import { useActiveSection } from "../features/dashboard/hooks/useActiveSection";
import { dashboardSummary } from "../features/dashboard/mockData";

export default function DashboardPage() {
  const { activeId, navigate } = useActiveSection();

  const goToSignIn = useNavigate();

  const totalPoints = dashboardSummary.pointsDistributed;

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-7xl px-10 pt-8 pb-28 max-lg:px-6 max-lg:pt-6 max-sm:px-4 max-sm:pt-5">
        <Topbar />

        <MetricGrid />

        <section className="mb-4">
          <CampusMap />
        </section>

        <section
          className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          id="analytics"
        >
          <WasteChart />
          <PointsChart totalPoints={totalPoints} />
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
