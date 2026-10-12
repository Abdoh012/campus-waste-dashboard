import { motion, useReducedMotion } from 'motion/react';
import { ChartColumn, Circle, Cpu, LayoutDashboard, MapPin } from 'lucide-react';
import { navItems } from '../data/mockData.js';

/**
 * Dock icons, keyed by destination id.
 *
 * The unicode glyphs the dock shipped with were drawn per-character, so no two
 * slots shared a stroke weight or an optical size. Icons are chrome, not
 * content: they live here while `mockData.navItems` stays the single source for
 * ids, hrefs and labels. `Circle` is the neutral fallback so a destination added
 * without an icon still renders a consistent slot instead of an empty one.
 */
const NAV_ICONS = {
  overview: LayoutDashboard,
  'campus-map': MapPin,
  hardware: Cpu,
  analytics: ChartColumn,
};

/** One size and one stroke weight for every slot — the family's whole point. */
const ICON_PROPS = { size: 18, strokeWidth: 1.75, 'aria-hidden': true };

/**
 * The dock's active-indicator motion.
 *
 * The accent stripe slides between slots instead of blinking, so a section
 * change reads as one continuous movement of the same plate. The spring is
 * tuned to settle around 250ms — inside the system's stated 200–300ms
 * transition window — with critical damping and no overshoot, so it stays
 * calm enough for an operator scanning mid-round.
 */
const INDICATOR_TRANSITION = { type: 'spring', stiffness: 320, damping: 32, mass: 1 };

/** Quick, slightly damped press feedback — a tap, not a bounce. */
const TAP_TRANSITION = { type: 'spring', stiffness: 650, damping: 30 };

/**
 * The bottom dock — the dashboard's only navigation.
 *
 * The dark rail's "bound spine" reading survives, but as a floating tray, not a
 * full-bleed band across the screen: a centred pine tray capped at 720px with a
 * 16px radius, 12px gutters to the screen edges, and 10px of lift above the
 * foot (safe-area aware). It reuses the card ambient shadow so it reads as a
 * shell floating over the page; the system still has exactly one ambient
 * shadow. The active slot reuses the rail's inset accent stripe, rotated to the
 * top edge and animated between slots.
 *
 * Rest, hover and current are three distinct steps rather than hover doubling
 * as the current plate: hover is a partial rail-hover wash with the glyph
 * brightening to the rail foreground, and only the current slot takes the solid
 * plate, the accent stripe, and the accent glyph. State is never carried by a
 * lift or a second shadow; the plate and the stripe do the work.
 *
 * A destination may ship `disabled: true` (no nav item does today). Such a slot
 * keeps its place in the row, drops its href and click handler, and is removed
 * from the tab order so a gated destination cannot be reached or mistaken for
 * an available one.
 *
 * Animation is presentational only: `activeId` still comes from the scroll spy
 * in App.jsx, and the anchor's href does the scrolling. Nothing here gates or
 * delays navigation. `prefers-reduced-motion` collapses the slides to instant
 * swaps and drops the tap feedback.
 */
export default function BottomNav({ activeId, onNavigate }) {
  const reduceMotion = useReducedMotion();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10" aria-label="Primary navigation">
      {/* Gutter wrapper: keeps the tray off the screen edges and up off the
          bottom edge (safe-area aware), so the dock floats instead of
          spanning the whole viewport. */}
      <div className="mx-auto w-full max-w-[720px] px-3 pb-[max(10px,env(safe-area-inset-bottom))] max-[700px]:px-2.5">
        <div className="flex items-stretch gap-2 rounded-2xl border border-sidebar-border bg-sidebar px-3 py-[7px] text-sidebar-foreground shadow-card max-[700px]:gap-1 max-[700px]:px-2">
          <ul className="flex flex-1 items-stretch gap-1">
            {navItems.map((item) => {
              const isDisabled = Boolean(item.disabled);
              const isCurrent = item.id === activeId && !isDisabled;
              const Icon = NAV_ICONS[item.id] ?? Circle;
              // Exclusive variants: only one text treatment is emitted per slot so
              // the state can never be decided by stylesheet order.
              const textTone = isDisabled
                ? 'text-sidebar-muted'
                : isCurrent
                  ? 'text-sidebar-hover-foreground'
                  : 'text-sidebar-nav hover:text-sidebar-hover-foreground';
              const iconTone = isDisabled
                ? 'text-sidebar-muted'
                : isCurrent
                  ? 'text-sidebar-accent'
                  : 'text-sidebar-icon group-hover:text-sidebar-hover-foreground';
              const slotClass = [
                'group relative flex min-h-[48px] w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] no-underline transition-colors duration-200 select-none',
                textTone,
                isDisabled
                  ? 'cursor-not-allowed opacity-45'
                  : 'hover:bg-sidebar-hover/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-accent',
              ].join(' ');

              return (
                <li key={item.id} className="flex flex-1">
                  <motion.a
                    className={slotClass}
                    href={isDisabled ? undefined : item.href}
                    aria-current={isCurrent ? 'true' : undefined}
                    aria-disabled={isDisabled ? 'true' : undefined}
                    tabIndex={isDisabled ? -1 : undefined}
                    onClick={isDisabled ? undefined : () => onNavigate(item.id)}
                    whileTap={isDisabled || reduceMotion ? undefined : { scale: 0.97 }}
                    transition={TAP_TRANSITION}
                  >
                    {isCurrent ? (
                      <motion.span
                        layoutId="bottom-nav-active"
                        className="absolute inset-0 rounded-lg bg-sidebar-hover shadow-[inset_0_3px_var(--color-sidebar-accent)]"
                        aria-hidden="true"
                        transition={reduceMotion ? { duration: 0 } : INDICATOR_TRANSITION}
                      />
                    ) : null}
                    <Icon className={`relative shrink-0 transition-colors duration-200 ${iconTone}`} {...ICON_PROPS} />
                    <span className="relative leading-none">{item.label}</span>
                  </motion.a>
                </li>
              );
            })}
          </ul>

          {/* Network status, promoted from the rail footer. The dot carries the
              state at every width; the labelled block is its arm's-length form,
              separated from the slots by an explicit 24px rail-line hairline
              rather than a full-height border. */}
          <div className="ml-1 flex shrink-0 items-center gap-3 self-center max-[700px]:ml-0 max-[700px]:gap-1.5">
            <span aria-hidden="true" className="h-6 w-px shrink-0 bg-sidebar-border max-[700px]:hidden"></span>
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-sidebar-online shadow-[0_0_0_5px_var(--color-sidebar-online-ring)]"
              aria-hidden="true"
            ></span>
            <span className="sr-only">Network online · Last sync 32 sec ago</span>
            <div aria-hidden="true" className="max-[700px]:hidden">
              <strong className="block text-[12px] font-semibold leading-none">Network online</strong>
              <small className="mt-[5px] block text-[10px] leading-none text-sidebar-muted tabular-nums">
                Last sync · 32 sec ago
              </small>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}