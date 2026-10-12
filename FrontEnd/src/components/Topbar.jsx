export default function Topbar({ showToast }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">THURSDAY, SEPTEMBER 17, 2026</p>
        <h2>
          Good morning, BATU <span className="sun">✦</span>
        </h2>
      </div>
      <div className="topbar-actions">
        <div className="live-pill">
          <span className="pulse-dot"></span>Live operations
        </div>
        <button className="icon-button" type="button" aria-label="Notifications">
          <span className="notification-dot"></span>♧
        </button>
        <button
          className="export-button"
          type="button"
          onClick={() => showToast('Report export prepared · campus-ops-sept-17.csv')}
        >
          Export report <span>↗</span>
        </button>
      </div>
    </header>
  );
}
