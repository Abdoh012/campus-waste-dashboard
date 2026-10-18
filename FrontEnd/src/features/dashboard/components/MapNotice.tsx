import { KeyRound, LoaderCircle, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

export type MapNoticeTone = 'loading' | 'config' | 'error';

const ICONS: Record<MapNoticeTone, ReactNode> = {
  loading: <LoaderCircle className="animate-spin motion-reduce:animate-none" size={18} />,
  config: <KeyRound size={18} />,
  error: <TriangleAlert size={18} />,
};

const TONES: Record<MapNoticeTone, string> = {
  loading: 'text-label',
  config: 'text-warning-fg',
  error: 'text-error-text',
};

export interface MapNoticeProps {
  tone: MapNoticeTone;
  title: string;
  detail: string;
  /** Extra classes for placement, e.g. `absolute inset-0` over a loading map. */
  className?: string;
}

/**
 * The map area's non-map states: still loading, missing API key, or the Maps
 * API failed to load. Keeps the panel's shape so the layout never jumps, and
 * replaces the map entirely rather than leaving a broken one behind.
 */
export default function MapNotice({
  tone,
  title,
  detail,
  className = '',
}: MapNoticeProps) {
  return (
    <div
      className={`grid h-full w-full place-items-center bg-muted px-6 text-center ${className}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <div className="flex max-w-xs flex-col items-center gap-2">
        <span className={TONES[tone]}>{ICONS[tone]}</span>
        <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <p className="text-xs text-label-strong">{detail}</p>
      </div>
    </div>
  );
}
