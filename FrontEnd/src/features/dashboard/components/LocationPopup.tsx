import { FILL_THRESHOLDS, fillTone, peakFill } from '../campusMapData';
import type { BinLocation } from '../campusMapData';
import type { BinTone } from '../types';

/** Fill-bar colours, matching the marker and legend colours. */
const BAR_TONES: Record<BinTone, string> = {
  green: 'bg-success-500',
  yellow: 'bg-warning-500',
  red: 'bg-error-500',
};

export interface LocationPopupProps {
  location: BinLocation;
}

/**
 * Contents of the map popup for one bin location: the location's name and
 * number, then all three bins with a fill bar each and a flag on the ones that
 * have filled past the critical threshold.
 *
 * Fill percentages are set in readable ink rather than a status colour — the
 * status inks are not accessible at this size — so the bar colour and the
 * "HIGH" flag carry the state.
 */
export default function LocationPopup({ location }: LocationPopupProps) {
  return (
    <div className="w-48 font-sans text-foreground">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-heading text-sm font-semibold tracking-tight">
          {location.name}
        </h4>
        <span className="font-mono text-2xs text-label">{location.number}</span>
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {location.bins.map((bin) => {
          const tone = fillTone(bin.fill);
          const full = bin.fill >= FILL_THRESHOLDS.critical;
          return (
            <li key={bin.id}>
              <div className="flex items-center justify-between gap-2 font-mono text-2xs">
                <span className="text-label-strong">
                  {bin.label}
                  {full && (
                    <span className="ml-1 font-semibold text-error-text">HIGH</span>
                  )}
                </span>
                <span className="font-semibold text-label-strong">{bin.fill}%</span>
              </div>
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                <span
                  className={`block h-full rounded-full ${BAR_TONES[tone]}`}
                  style={{ width: `${bin.fill}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-2 border-t border-border pt-1.5 font-mono text-2xs text-label">
        Fullest bin {peakFill(location)}%
      </p>
    </div>
  );
}
