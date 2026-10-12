const ICON_TONES = {
  critical: 'bg-error-bg text-error-fg',
  warning: 'bg-warning-bg text-warning-fg',
};

/**
 * A single hardware-health alert row.
 */
export default function HealthAlert({ alert }) {
  return (
    <div className="grid grid-cols-[29px_1fr_12px] items-start gap-2.5 border-b border-border py-4">
      <div
        className={`grid h-[25px] w-[25px] place-items-center rounded-full text-[12px] font-bold ${
          ICON_TONES[alert.tone] ?? ICON_TONES.critical
        }`}
      >
        {alert.icon}
      </div>
      <div>
        <strong className="text-[11px]">{alert.title}</strong>
        <p className="my-1 text-[10px] text-muted-foreground">{alert.location}</p>
        <small className="text-[9px] text-label-muted">{alert.meta}</small>
      </div>
      <span className="text-[22px] leading-[19px] text-label-subtle">›</span>
    </div>
  );
}
