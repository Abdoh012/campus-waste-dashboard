import { locationTone } from '../campusMapData';
import type { BinLocation, StationConnectivity } from '../campusMapData';
import type { BinTone } from '../types';

/**
 * Solid marker fills. The number is set in ink, which clears 4.5:1 on all four
 * tones — white would not — and grey marks a station with no known reading.
 */
const MARKER_TONES: Record<BinTone, string> = {
  green: 'bg-primary-500',
  yellow: 'bg-warning-500',
  red: 'bg-error-500',
  offline: 'bg-neutral-500',
};

/**
 * A small corner badge keeps connectivity visible without changing the marker
 * fill, which always represents fill severity. Online stations need no badge;
 * stale/no-reading stations retain their fill colour behind it.
 */
const CONNECTIVITY_BADGES: Partial<Record<StationConnectivity, string>> = {
  partial: 'bg-warning-500',
  offline: 'bg-neutral-500',
};

export interface BinMarkerProps {
  location: BinLocation;
  /** Set while this location's popup is open. */
  active?: boolean;
  /**
   * Tooltip / accessible name for the marker.
   *
   * It sits on this DOM node, *not* on the `<AdvancedMarker>`: that component
   * writes a changed `title` straight onto the live Google marker, and the
   * Maps setter throws once the marker is attached — which crashed the whole
   * route whenever changing the language re-translated the title. A native
   * `title` here shows the same tooltip and never touches the Maps API.
   */
  title?: string;
}

/**
 * The numbered map marker: one solid, colour-coded circle per station,
 * keeping its number in every colour state. The tone comes from the station's
 * highest known fill severity (`locationTone`), never from connectivity and
 * never from a hardcoded colour. A corner badge shows partial/offline
 * connectivity independently.
 */
export default function BinMarker({
  location,
  active = false,
  title,
}: BinMarkerProps) {
  const badge = CONNECTIVITY_BADGES[location.connectivity];

  return (
    <span className="relative inline-flex">
      {badge && (
        <span
          aria-hidden="true"
          className={`absolute -top-0.5 -end-0.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-white ${badge}`}
        />
      )}
      <span
        title={title}
        className={[
          'grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white font-mono text-2xs font-semibold text-marker-foreground shadow-card transition-transform duration-200 ease-out motion-reduce:transition-none',
          MARKER_TONES[locationTone(location)],
          active ? 'scale-110' : 'hover:scale-110',
        ].join(' ')}
      >
        {location.number}
      </span>
    </span>
  );
}
