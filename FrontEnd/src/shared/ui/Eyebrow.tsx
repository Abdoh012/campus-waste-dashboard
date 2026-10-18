import type { ReactNode } from 'react';

/**
 * Color register for the kicker. `default` matches the dashboard's decorative
 * tint; `strong` is a darker neutral that clears 4.5:1 on the light surfaces,
 * for kickers that sit above functional content (such as a form).
 */
export type EyebrowTone = 'default' | 'strong';

const TONES: Record<EyebrowTone, string> = {
  default: 'text-eyebrow',
  strong: 'text-label-strong',
};

export interface EyebrowProps {
  children: ReactNode;
  tone?: EyebrowTone;
  className?: string;
}

/**
 * The small monospace kicker used above headings throughout the dashboard.
 */
export default function Eyebrow({
  children,
  tone = 'default',
  className = '',
}: EyebrowProps) {
  return (
    <p
      className={`m-0 mb-2 font-mono text-2xs tracking-widest ${TONES[tone]} ${className}`}
    >
      {children}
    </p>
  );
}
