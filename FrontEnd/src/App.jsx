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
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Topbar showToast={showToast} />

        <MetricGrid totalPoints={totalPoints} />

        <section className="content-grid">
          <CampusMap showToast={showToast} />
          <HealthPanel showToast={showToast} />
        </section>

        <section className="analytics-grid" id="analytics">
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
