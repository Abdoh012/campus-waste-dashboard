export default function SyncBanner({ pendingEvents, syncing, onSync }) {
  return (
    <section className="mb-5 flex items-center gap-3.5 rounded-lg border border-dashed border-sync-border bg-sync-bg px-[17px] py-3.5 max-[700px]:flex-wrap max-[700px]:items-start">
      <div className="text-[25px] text-primary">↻</div>
      <div>
        <strong className="text-[12px]">Offline sync simulator</strong>
        <p className="mt-1 mb-0 text-[10px] text-muted-foreground">
          Test the ESP32 reconnect flow by sending cached student-point events to the dashboard.
        </p>
      </div>
      <div className="ml-auto text-right max-[700px]:ml-0">
        <span className="block font-heading text-[18px] font-semibold">{pendingEvents}</span>
        <small className="font-mono text-[9px] text-label">events queued</small>
      </div>
      <button
        className="cursor-pointer rounded-[5px] border-0 bg-sync-button px-[13px] py-2.5 text-[11px] text-white hover:bg-sync-button-hover max-[700px]:ml-auto"
        type="button"
        onClick={onSync}
        disabled={syncing}
      >
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
