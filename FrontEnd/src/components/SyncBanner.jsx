export default function SyncBanner({ pendingEvents, syncing, onSync }) {
  return (
    <section className="sync-banner">
      <div className="sync-banner-icon">↻</div>
      <div>
        <strong>Offline sync simulator</strong>
        <p>Test the ESP32 reconnect flow by sending cached student-point events to the dashboard.</p>
      </div>
      <div className="sync-count">
        <span>{pendingEvents}</span>
        <small>events queued</small>
      </div>
      <button className="sync-button" type="button" onClick={onSync} disabled={syncing}>
        {syncing ? (
          <>
            Syncing cached events <span>…</span>
          </>
        ) : (
          <>
            Sync cached data <span>→</span>
          </>
        )}
      </button>
    </section>
  );
}
