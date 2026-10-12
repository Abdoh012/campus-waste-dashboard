import Eyebrow from './Eyebrow.jsx';
import HealthAlert from './HealthAlert.jsx';
import { dashboardSummary, healthAlerts } from '../data/mockData.js';
import { SURFACE } from '../styles/surfaces.js';

export default function HealthPanel({ showToast }) {
  return (
    <aside className={`${SURFACE} p-5 pb-[15px] max-[700px]:p-[15px]`} id="hardware">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>DEVICE MONITORING</Eyebrow>
          <h3 className="font-heading text-[19px] font-semibold tracking-[-0.035em]">Hardware health</h3>
        </div>
        <button className="cursor-pointer border-0 bg-transparent text-[13px] tracking-[2px] text-label-muted" type="button" aria-label="More options">
          •••
        </button>
      </div>

      <div className="flex items-end justify-between border-b border-border pt-5 pb-4">
        <div>
          <span className="font-heading text-[32px] font-semibold">{dashboardSummary.healthScore}</span>
          <small className="ml-[3px] font-sans text-[10px] text-label">/100 health score</small>
        </div>
        <span className="rounded bg-primary-tint px-2 py-1.5 font-mono text-[10px] text-success-fg">Good standing</span>
      </div>

      <div className="pt-0.5 pb-1.5">
        {healthAlerts.length === 0 ? (
          <p className="m-0 py-4 text-[10px] text-label-muted">All devices reporting normally.</p>
        ) : (
          healthAlerts.map((alert) => <HealthAlert key={alert.id} alert={alert} />)
        )}
      </div>

      <button
        className="mt-2 w-full cursor-pointer rounded-[5px] border border-outline-border bg-card p-[9px] text-[11px] text-primary-hover"
        type="button"
        onClick={() => showToast(`Device inventory is healthy · ${dashboardSummary.registeredDevices} devices registered`)}
      >
        View all {dashboardSummary.registeredDevices} devices <span className="pl-[7px]">→</span>
      </button>
    </aside>
  );
}
