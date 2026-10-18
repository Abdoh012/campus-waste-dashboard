import type { HardwareAlert } from "../types";

const ICON_TONES: Record<HardwareAlert["tone"], string> = {
  critical: "bg-error-bg text-error-fg",
  warning: "bg-warning-bg text-warning-fg",
};

export interface HealthAlertProps {
  alert: HardwareAlert;
}

/**
 * A single hardware-health alert row.
 */
export default function HealthAlert({ alert }: HealthAlertProps) {
  return (
    <div className="flex items-start gap-2.5 border-b border-border py-4">
      <div
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
          ICON_TONES[alert.tone]
        }`}
      >
        {alert.icon}
      </div>
      <div className="min-w-0 flex-1">
        <strong className="text-xs">{alert.title}</strong>
        <p className="my-1 text-2xs text-muted-foreground">{alert.location}</p>
        <small className="text-2xs text-label-muted">{alert.meta}</small>
      </div>
      <span className="shrink-0 text-xl leading-none text-label-subtle">›</span>
    </div>
  );
}
