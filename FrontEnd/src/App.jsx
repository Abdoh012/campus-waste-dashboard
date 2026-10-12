import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import MetricGrid from './components/MetricGrid.jsx';
import CampusMap from './components/CampusMap.jsx';
import HealthPanel from './components/HealthPanel.jsx';
import WasteChart from './components/WasteChart.jsx';
import PointsChart from './components/PointsChart.jsx';
import SyncBanner from './components/SyncBanner.jsx';
import PageFooter from './components/PageFooter.jsx';
import Toast from './components/Toast.jsx';
import { cachedSyncEvents, dashboardSummary } from './data/mockData.js';
import { syncCachedEvents } from './services/syncApi.js';

const TOAST_DURATION_MS = 3200;

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  const [totalPoints, setTotalPoints] = useState(dashboardSummary.pointsDistributed);
  const [pendingEvents, setPendingEvents] = useState(dashboardSummary.pendingSyncEvents);
  const [syncing, setSyncing] = useState(false);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncCachedEvents(cachedSyncEvents, totalPoints);
      setTotalPoints(result.newTotalPoints);
      setPendingEvents(0);
      showToast(`Sync complete · ${result.received} events added ${result.pointsAdded} points`);
    } catch (error) {
      console.error('Error syncing cached events:', error);
      showToast('Sync failed · check the connection and try again');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen max-[700px]:block">
      <Sidebar />

      <main className="ml-[248px] grow max-w-[1600px] px-10 pt-8 pb-[22px] max-[1100px]:px-6 max-[1100px]:py-[26px] max-[700px]:m-0 max-[700px]:w-full max-[700px]:px-[15px] max-[700px]:py-[22px]">
        <Topbar showToast={showToast} />

        <MetricGrid totalPoints={totalPoints} />

        <section className="mb-4 grid grid-cols-[minmax(0,1.8fr)_minmax(280px,0.85fr)] gap-4 max-[1100px]:grid-cols-1">
          <CampusMap showToast={showToast} />
          <HealthPanel showToast={showToast} />
        </section>

        <section className="mb-4 grid grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)] gap-4 max-[1100px]:grid-cols-1 max-[700px]:gap-2.5" id="analytics">
          <WasteChart showToast={showToast} />
          <PointsChart totalPoints={totalPoints} />
        </section>

        <SyncBanner pendingEvents={pendingEvents} syncing={syncing} onSync={handleSync} />
        <PageFooter />
      </main>

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
