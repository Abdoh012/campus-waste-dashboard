import { FILL_THRESHOLDS, binTone, peakFill } from '../campusMapData';
import type { BinLocation } from '../campusMapData';
import type { BinTone } from '../types';
import { useI18n } from '../../../shared/i18n/useI18n';

/** Fill-bar colours, matching the marker and legend colours. */
const BAR_TONES: Record<BinTone, string> = {
  green: 'bg-success-500',
  yellow: 'bg-warning-500',
  red: 'bg-error-500',
  offline: 'bg-neutral-400',
};

export interface LocationPopupProps {
  location: BinLocation;
}

/**
 * Contents of the map popup for one location: the building's name and number,
 * then every bin there with a fill bar and a flag when it has filled past the
 * critical threshold (or gone silent).
 *
 * Fill percentages are set in readable ink rather than a status colour — the
 * status inks are not accessible at this size — so the bar colour and the
 * "HIGH"/"OFFLINE" flags carry the state.
 */
export default function LocationPopup({ location }: LocationPopupProps) {
  const { t, formatNumber } = useI18n();

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
          const tone = binTone(bin);
          const full = bin.fill >= FILL_THRESHOLDS.critical;
          return (
            <li key={bin.id}>
              <div className="flex items-center justify-between gap-2 font-mono text-2xs">
                <span className="text-label-strong">
                  {bin.label}
                  {full && bin.status !== 'offline' && (
                    <span className="ms-1 font-semibold text-error-text">
                      {t('map.popup.high')}
                    </span>
                  )}
                  {bin.status === 'offline' && (
                    <span className="ms-1 font-semibold text-label-muted">
                      {t('map.popup.offline')}
                    </span>
                  )}
                </span>
                <span className="font-semibold text-label-strong">
                  {formatNumber(bin.fill)}%
                </span>
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
        {t('map.popup.fullest', { fill: peakFill(location) })}
      </p>
    </div>
  );
}
