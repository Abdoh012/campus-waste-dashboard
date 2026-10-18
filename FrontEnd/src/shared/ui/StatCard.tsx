import type { ReactNode } from 'react';
import { SURFACE } from '../../styles/surfaces';

/**
 * Accent rail along the card's top edge — one per metric family.
 */
export type StatCardTone = 'primary' | 'secondary' | 'info' | 'accent';

const ACCENTS: Record<StatCardTone, string> = {
  primary: 'border-t-primary',
  secondary: 'border-t-secondary',
  info: 'border-t-info',
  accent: 'border-t-accent',
};

const CARD = `${SURFACE} relative overflow-hidden px-5 pt-4 pb-4 min-h-40 max-sm:px-3 max-sm:min-h-36`;
const HEAD = 'flex justify-between font-mono text-2xs tracking-widest text-label';
const ICON = 'font-sans text-lg text-label';
const VALUE =
  'mt-3.5 mb-2 block font-heading text-3xl font-semibold tracking-tighter max-sm:text-2xl';
const FOOT = 'flex items-center gap-2 text-xs text-label';

export interface StatCardProps {
  /** Monospace kicker above the figure, e.g. `DIVERSION RATE`. */
  label: string;
  /** Decorative glyph sitting opposite the label; hidden from assistive tech. */
  icon: ReactNode;
  tone?: StatCardTone;
  /**
   * The headline figure. Compose any unit suffix inside it, so its smaller type
   * travels with the figure instead of being re-declared at every call site.
   */
  value: ReactNode;
  /** Trend chip and supporting copy under the figure. */
  footer?: ReactNode;
  /** The metric's own visual (sparkline, meter, legend), rendered last. */
  children?: ReactNode;
}

/**
 * The dashboard's metric card.
 *
 * One shell — kicker, figure, footer — on the shared card surface, with a
 * tone-coloured top edge. Only the shell and its type scale live here; the
 * figure, footer and visual stay with the metric that owns them, so a card can
 * carry a sparkline, a progress meter, a status legend or nothing at all
 * without the shell growing a variant per case. The body is free to position
 * against the card (it is `relative` and clips its overflow).
 */
export default function StatCard({
  label,
  icon,
  tone = 'primary',
  value,
  footer,
  children,
}: StatCardProps) {
  return (
    <article className={`${CARD} border-t-2 ${ACCENTS[tone]}`}>
      <div className={HEAD}>
        <span>{label}</span>
        <span className={ICON} aria-hidden="true">
          {icon}
        </span>
      </div>

      <strong className={VALUE}>{value}</strong>

      {footer !== undefined && <div className={FOOT}>{footer}</div>}

      {children}
    </article>
  );
}
