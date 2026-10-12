import { useCallback, useEffect, useRef, useState } from 'react';
import BottomNav from './components/BottomNav.jsx';
import Topbar from './components/Topbar.jsx';
import MetricGrid from './components/MetricGrid.jsx';
import CampusMap from './components/CampusMap.jsx';
import HealthPanel from './components/HealthPanel.jsx';
import WasteChart from './components/WasteChart.jsx';
import PointsChart from './components/PointsChart.jsx';
import SyncBanner from './components/SyncBanner.jsx';
import PageFooter from './components/PageFooter.jsx';
import Toast from './components/Toast.jsx';
import { cachedSyncEvents, dashboardSummary, navItems } from './data/mockData.js';
import { syncCachedEvents } from './services/syncApi.js';

const TOAST_DURATION_MS = 3200;

/** Time a tapped destination is held before the scroll spy takes the wheel back. */
const NAV_PIN_MS = 900;

/**
 * Scroll spy for the bottom dock.
 *
 * Rule: the active destination is kept for as long as its own section is still
 * in view; only once it leaves does the first in-view destination in nav order
 * take over. Holding the incumbent is what lets a tapped destination stick on
 * desktop, where "Map" and "Hardware" share one band and therefore one offset —
 * a plain "topmost section wins" spy could never light "Hardware" there.
 *
 * A tap pins its destination for NAV_PIN_MS so the smooth scroll cannot make
 * the highlight flicker through the sections it passes on the way.
 */
function useActiveSection() {
  const [activeId, setActiveId] = useState(navItems[0].id);
  const activeRef = useRef(activeId);
  const visibleRef = useRef(null);
  const pinRef = useRef(null);
  const pinTimerRef = useRef(null);

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return undefined;

    const targets = navItems
      .map((item) => ({ id: item.id, el: document.getElementById(item.href.slice(1)) }))
      .filter((target) => target.el);

    if (!targets.length) return undefined;

    const visible = new Set();
    visibleRef.current = visible;

    const settle = () => {
      if (pinRef.current) return;
      if (visible.has(activeRef.current)) return;
      const next = targets.find((target) => visible.has(target.id));
      if (next) setActiveId(next.id);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = targets.find((candidate) => candidate.el === entry.target);
          if (!target) return;
          if (entry.isIntersecting) visible.add(target.id);
          else visible.delete(target.id);
        });
        settle();
      },
      // Keep the floating dock (and the circle it lifts above its edge) out of
      // the measurement band.
      { rootMargin: '0px 0px -110px 0px' },
    );

    targets.forEach((target) => observer.observe(target.el));

    return () => {
      observer.disconnect();
      visibleRef.current = null;
    };
  }, []);

  useEffect(() => () => clearTimeout(pinTimerRef.current), []);

  const navigate = useCallback((id) => {
    setActiveId(id);
    pinRef.current = id;
    clearTimeout(pinTimerRef.current);
    pinTimerRef.current = setTimeout(() => {
      pinRef.current = null;
      const visible = visibleRef.current;
      if (!visible || visible.has(id)) return;
      const next = navItems.find((item) => visible.has(item.id));
      if (next) setActiveId(next.id);
    }, NAV_PIN_MS);
  }, []);

  return { activeId, navigate };
}

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);
  const { activeId, navigate } = useActiveSection();

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
    <div className="min-h-screen">
      {/* Bottom padding clears the fixed dock so the sync banner and footer are
          never hidden behind it: 68px tray + 14px lift + the 28px the current
          tab's circle rises above the tray's edge. */}
      <main className="mx-auto w-full max-w-[1600px] px-10 pt-8 pb-[112px] max-[1100px]:px-6 max-[1100px]:pt-[26px] max-[700px]:px-[15px] max-[700px]:pt-[22px] max-[700px]:pb-[calc(112px_+_env(safe-area-inset-bottom))]">
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

      <BottomNav activeId={activeId} onNavigate={navigate} />
      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
