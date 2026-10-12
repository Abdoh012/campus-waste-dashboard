import { dashboardSummary, healthAlerts } from '../data/mockData.js';

export default function HealthPanel({ showToast }) {
  return (
    <aside className="panel health-panel" id="hardware">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">DEVICE MONITORING</p>
          <h3>Hardware health</h3>
        </div>
        <button className="more-button" type="button" aria-label="More options">
          •••
        </button>
      </div>

      <div className="health-summary">
        <div className="health-score">
          <span>{dashboardSummary.healthScore}</span>
          <small>/100 health score</small>
        </div>
        <span className="status-badge">Good standing</span>
      </div>

      <div className="health-list">
        {healthAlerts.length === 0 ? (
          <p className="health-empty">All devices reporting normally.</p>
        ) : (
          healthAlerts.map((alert) => (
            <div key={alert.id} className={`health-alert ${alert.tone}`}>
              <div className="alert-icon">{alert.icon}</div>
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.location}</p>
                <small>{alert.meta}</small>
              </div>
              <span className="alert-arrow">›</span>
            </div>
          ))
        )}
      </div>

      <button
        className="outline-button"
        type="button"
        onClick={() => showToast(`Device inventory is healthy · ${dashboardSummary.registeredDevices} devices registered`)}
      >
        View all {dashboardSummary.registeredDevices} devices <span>→</span>
      </button>
    </aside>
  );
}
