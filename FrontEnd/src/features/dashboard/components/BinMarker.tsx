import { locationTone } from '../campusMapData';
import type { BinLocation } from '../campusMapData';
import type { BinTone } from '../types';

/**
 * Solid marker fills. The number is set in ink, which clears 4.5:1 on all four
 * tones — white would not — and grey marks a location whose devices are silent.
 */
const MARKER_TONES: Record<BinTone, string> = {
  green: 'bg-primary-500',
  yellow: 'bg-warning-500',
  red: 'bg-error-500',
  offline: 'bg-neutral-500',
};

export interface BinMarkerProps {
  location: BinLocation;
  /** Set while this location's popup is open. */
  active?: boolean;
}

/**
 * The numbered map marker: one solid, colour-coded circle per bin location,
 * keeping its number in every colour state. The tone comes from the location's
 * most urgent bin (`locationTone`), never from a hardcoded colour.
 */
export default function BinMarker({ location, active = false }: BinMarkerProps) {
  return (
    <span
      className={[
        'grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white font-mono text-2xs font-semibold text-foreground shadow-card transition-transform duration-200 ease-out motion-reduce:transition-none',
        MARKER_TONES[locationTone(location)],
        active ? 'scale-110' : 'hover:scale-110',
      ].join(' ')}
    >
      {location.number}
    </span>
  );
}
