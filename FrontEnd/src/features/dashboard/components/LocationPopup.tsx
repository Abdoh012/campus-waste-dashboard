import { binTone } from '../campusMapData';
import type {
  BinLocation,
  ContainerConnectivity,
  FillStatus,
  StationConnectivity,
  WasteType,
} from '../campusMapData';
import type { BinTone } from '../types';
import { useI18n } from '../../../shared/i18n/useI18n';
import type { StringKey } from '../../../shared/i18n/locales/en';

/** Fill-bar colours, matching the marker and legend colours. */
const BAR_TONES: Record<BinTone, string> = {
  green: 'bg-success-500',
  yellow: 'bg-warning-500',
  red: 'bg-error-500',
  offline: 'bg-neutral-400',
};

const SEVERITY_KEYS: Record<FillStatus, StringKey> = {
  healthy: 'map.severity.healthy',
  attention: 'map.severity.attention',
  critical: 'map.severity.critical',
  unknown: 'map.severity.unknown',
};

const CONNECTIVITY_KEYS: Record<ContainerConnectivity, StringKey> = {
  online: 'map.connectivity.online',
  offline: 'map.connectivity.offline',
  'never-connected': 'map.connectivity.never-connected',
};

const STATION_CONNECTIVITY_KEYS: Record<StationConnectivity, StringKey> = {
  online: 'map.connectivity.online',
  partial: 'map.connectivity.partial',
  offline: 'map.connectivity.offline',
};

const SEVERITY_INK: Record<FillStatus, string> = {
  healthy: 'text-label-strong',
  attention: 'text-label-strong',
  critical: 'text-error-text',
  unknown: 'text-label-muted',
};

const WASTE_TYPE_KEYS: Record<WasteType, StringKey> = {
  paper: 'map.wasteType.paper',
  plastic: 'map.wasteType.plastic',
  liquids: 'map.wasteType.liquids',
};

/**
 * Locale-aware relative time. The API sends ISO timestamps; this intentionally
 * does not treat a station's `lastSyncAt` as the current time, so a stale value
 * reads as "30 minutes ago" rather than "just now".
 */
function relativeTime(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;

  const seconds = Math.round((time - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absolute < 60) return format.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return format.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(hours, 'hour');
  return format.format(Math.round(hours / 24), 'day');
}

export interface LocationPopupProps {
  location: BinLocation;
}

/**
 * Contents of the station popup: the station's name and number, its aggregated
 * fill severity and connectivity, and every container with its last known fill,
 * fill severity, connectivity and reading freshness.
 *
 * Fill and connectivity are deliberately separate. A critical container that
 * has gone offline reads "Last known 88% · 30 minutes ago" and keeps its red
 * severity; an offline station is not allowed to erase the collection risk.
 */
export default function LocationPopup({ location }: LocationPopupProps) {
  const { t, locale, formatNumber } = useI18n();

  return (
    <div className="w-64 font-sans text-foreground">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-heading text-sm font-semibold tracking-tight">
          {location.name}
        </h4>
        <span className="font-mono text-2xs text-label">{location.number}</span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-2xs">
        <span
          className={`rounded border border-border px-1.5 py-0.5 ${SEVERITY_INK[location.severity]}`}
        >
          {t(SEVERITY_KEYS[location.severity])}
        </span>
        <span className="rounded border border-border px-1.5 py-0.5 text-label">
          {t(STATION_CONNECTIVITY_KEYS[location.connectivity])}
        </span>
      </div>

      {!location.integrity.valid && (
        <p className="mt-1.5 font-mono text-2xs text-error-text">
          {t('map.popup.incomplete', {
            actual: location.integrity.actual,
            expected: location.integrity.expected,
          })}
        </p>
      )}

      <ul className="mt-2.5 flex flex-col gap-2.5">
        {location.bins.map((bin) => {
          const tone = binTone(bin);
          const time = relativeTime(bin.lastSyncAt, locale);
          const freshness =
            bin.connectivity === 'never-connected'
              ? null
              : bin.lastKnown
                ? t('map.popup.lastKnown', {
                    fill: bin.fill === null ? t('map.popup.noReading') : formatNumber(bin.fill),
                    time: time ?? t('map.popup.noReading'),
                  })
                : bin.connectivity === 'offline'
                  ? t('map.popup.offlineNoReading')
                  : t('map.popup.current', { time: time ?? t('map.popup.noReading') });

          return (
            <li key={bin.id}>
              <div className="flex items-center justify-between gap-2 font-mono text-2xs">
                <span className="text-label-strong">
                  {bin.wasteType
                    ? t(WASTE_TYPE_KEYS[bin.wasteType])
                    : t('map.popup.unclassified')}
                  <span className="ms-1 text-label-muted">· {bin.label}</span>
                </span>
                <span className="font-semibold text-label-strong">
                  {bin.fill === null
                    ? t('map.popup.noReading')
                    : `${formatNumber(bin.fill)}%`}
                </span>
              </div>
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                <span
                  className={`block h-full rounded-full ${BAR_TONES[tone]}`}
                  style={{ width: `${bin.fill ?? 0}%` }}
                />
              </span>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 font-mono text-2xs">
                <span className={SEVERITY_INK[bin.fillStatus]}>
                  {t(SEVERITY_KEYS[bin.fillStatus])} · {t(CONNECTIVITY_KEYS[bin.connectivity])}
                </span>
                {bin.connectivity === 'never-connected' ? (
                  <span className="text-label-muted">
                    {t('map.popup.neverConnected')}
                  </span>
                ) : freshness ? (
                  <span className="text-label-muted">{freshness}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-2 border-t border-border pt-1.5 font-mono text-2xs text-label">
        {t('map.popup.stationSeverity', {
          severity: t(SEVERITY_KEYS[location.severity]),
        })}
      </p>
    </div>
  );
}
