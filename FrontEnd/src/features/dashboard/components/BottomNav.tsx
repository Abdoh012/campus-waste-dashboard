import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChartColumn,
  Cpu,
  LayoutDashboard,
  LogOut,
  MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import {
  CROSSFADE,
  FADE,
  SLIDE,
  TAP,
} from "../../../shared/animations/transitions";
import Motion from "../../../shared/ui/Motion";
import { navItems } from "../mockData";
import type { NavId } from "../types";
import { useI18n } from "../../../shared/i18n/useI18n";
import type { StringKey } from "../../../shared/i18n/locales/en";

/**
 * Dock icons, keyed by destination id.
 *
 * Icons are chrome, not content: they live here while `mockData.navItems` stays
 * the single source for ids, hrefs and labels. Because the map is a complete
 * `Record<NavId, LucideIcon>`, adding a destination without an icon is a
 * compile error rather than a silently missing glyph.
 */
const NAV_ICONS: Record<NavId, LucideIcon> = {
  overview: LayoutDashboard,
  "campus-map": MapPin,
  hardware: Cpu,
  analytics: ChartColumn,
};

/** The visible label for each destination, translated at render time. */
const NAV_LABEL_KEYS: Record<NavId, StringKey> = {
  overview: "nav.overview",
  "campus-map": "nav.campus-map",
  hardware: "nav.hardware",
  analytics: "nav.analytics",
};

/** Rest state: a thin outline. The current tab swaps to a bolder stroke. */
const ICON_SIZE = 24;
const ICON_STROKE = 1.5;
const ACTIVE_STROKE = 2.5;

/**
 * Tray geometry, in px.
 *
 * The tray's outline is a single SVG path, so its numbers cannot live in
 * Tailwind utilities; they belong here, beside the utilities they have to line
 * up with (`h-15`, `max-w-70`, the circle's `h-14 w-14 -top-8`).
 */
const BAR_HEIGHT = 68;
const BAR_RADIUS = 26;
/** Inner inset. This is what keeps the outer slots, and their scoop, clear of the corners. */
const BAR_PADDING = 32;
const CIRCLE_SIZE = 56;
/** Gap between the floating circle and the scoop that wraps it. */
const NOTCH_GAP = 5;
const NOTCH_RADIUS = CIRCLE_SIZE / 2 + NOTCH_GAP;
/** Horizontal run of the S-curve blending the scoop into the tray's top edge. */
const NOTCH_BLEND = 6;
/** Where the scoop hands over to that blend, measured round the lower semicircle. */
const NOTCH_ANGLE = (150 * Math.PI) / 180;

const round = (value: number): number => Math.round(value * 100) / 100;

/** Centre of slot `index`, in the tray's own pixel space. */
const slotCenter = (index: number, width: number): number =>
  BAR_PADDING + ((width - BAR_PADDING * 2) * (index + 0.5)) / navItems.length;

/**
 * Where a slot's circle and scoop sit. Clamped so the scoop can never reach past
 * the tray's flat top edge into a corner, however narrow the screen gets.
 */
const trayCenter = (index: number, width: number): number => {
  const inset = BAR_RADIUS + NOTCH_RADIUS + NOTCH_BLEND;
  const center = slotCenter(index, width);
  return Math.min(Math.max(center, inset), width - inset);
};

/**
 * The tray outline: a rounded rectangle whose top edge is interrupted by a
 * concave scoop. The scoop is a circular arc struck from a point on the top
 * edge, so the gap to the floating circle stays constant all the way round, and
 * two short cubics blend it into the flat edge — that blend is what makes the
 * join an S-curve instead of a corner. One path serves every destination; only
 * the centre moves, so the outline is never redrawn per tab.
 */
function trayPath(width: number, center: number): string {
  const w = round(width);
  const cx = round(center);
  const half = NOTCH_RADIUS + NOTCH_BLEND;
  const cos = Math.cos(NOTCH_ANGLE);
  const sin = Math.sin(NOTCH_ANGLE);
  const reach = NOTCH_RADIUS * Math.abs(cos);
  const drop = NOTCH_RADIUS * sin;
  const along = NOTCH_BLEND * 0.75;
  const tangent = NOTCH_BLEND * 1.1;

  return [
    `M ${BAR_RADIUS} 0`,
    `H ${round(cx - half)}`,
    `C ${round(cx - half + along)} 0 ${round(cx - reach - sin * tangent)} ${round(drop + cos * tangent)} ${round(cx - reach)} ${round(drop)}`,
    `A ${NOTCH_RADIUS} ${NOTCH_RADIUS} 0 0 0 ${round(cx + reach)} ${round(drop)}`,
    `C ${round(cx + reach + sin * tangent)} ${round(drop + cos * tangent)} ${round(cx + half - along)} 0 ${round(cx + half)} 0`,
    `H ${round(w - BAR_RADIUS)}`,
    `A ${BAR_RADIUS} ${BAR_RADIUS} 0 0 1 ${w} ${BAR_RADIUS}`,
    `V ${BAR_HEIGHT - BAR_RADIUS}`,
    `A ${BAR_RADIUS} ${BAR_RADIUS} 0 0 1 ${round(w - BAR_RADIUS)} ${BAR_HEIGHT}`,
    `H ${BAR_RADIUS}`,
    `A ${BAR_RADIUS} ${BAR_RADIUS} 0 0 1 0 ${BAR_HEIGHT - BAR_RADIUS}`,
    `V ${BAR_RADIUS}`,
    `A ${BAR_RADIUS} ${BAR_RADIUS} 0 0 1 ${BAR_RADIUS} 0`,
    "Z",
  ].join(" ");
}

export interface BottomNavProps {
  activeId: NavId;
  onNavigate: (id: NavId) => void;
  /** Ends the session. Lives here as an action, not a destination. */
  onLogout: () => void;
}

/**
 * The bottom dock — the dashboard's navigation, with the sign-out action beside it.
 *
 * It floats rather than spanning the screen: a centred card capped at 280px,
 * 16px clear of the sides and 20px above the foot. The tray is
 * one card-coloured SVG path, which lets its top edge carry the concave scoop
 * that wraps the active tab's floating circle without a second, mismatched
 * shape. Slot centres are computed from the measured width, so the circle and
 * the scoop stay locked to the tabs at any size, and `activeId` alone drives
 * both — the outline and the circle slide together on the same spring.
 *
 * Rest, hover and current stay three distinct steps: inactive slots are thin
 * outline icons in the muted tone (brightening on hover), and the current slot
 * hides its outline in favour of the solid primary circle, the bolder icon and
 * the label underneath. State is never carried by a second shadow.
 *
 * A destination may ship `disabled: true` (none does today). Such a slot keeps
 * its place in the row, drops its href and click handler, and leaves the tab
 * order so a gated destination cannot be mistaken for an available one.
 *
 * Animation is presentational only: the anchor's href does the scrolling and
 * nothing here gates navigation. `prefers-reduced-motion` drops the slide and
 * the scale, leaving plain crossfades.
 */
export default function BottomNav({
  activeId,
  onNavigate,
  onLogout,
}: BottomNavProps) {
  const reduceMotion = useReducedMotion();
  const { t, dir } = useI18n();
  const trayRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  // The outline is drawn in the tray's own pixel space, so it needs the
  // measured width to stay aligned with the slots. Measure before paint (so the
  // first frame is already correct), then follow resizes.
  useLayoutEffect(() => {
    const tray = trayRef.current;
    if (!tray) return undefined;
    const measure = () => setWidth(tray.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(tray);
    return () => observer.disconnect();
  }, []);

  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => item.id === activeId),
  );
  const activeItem = navItems[activeIndex];
  const ActiveIcon = NAV_ICONS[activeItem.id];
  const center = trayCenter(activeIndex, width);
  // The circle is anchored to the physical left and translated; RTL mirrors it.
  const circleX =
    dir === "rtl" ? width - center - CIRCLE_SIZE / 2 : center - CIRCLE_SIZE / 2;

  const slide = reduceMotion ? { duration: 0 } : SLIDE;
  const fade = reduceMotion ? FADE : CROSSFADE;
  // Same crossfade, minus the scale when motion is reduced.
  const iconSwap = {
    initial: { opacity: 0, scale: reduceMotion ? 1 : 0.6 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: reduceMotion ? 1 : 0.6 },
    transition: fade,
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-4 pb-5">
      <div className="relative mx-auto flex w-full items-end gap-3">
        {/* Mirrors the sign-out control below so the tray stays screen-centred. */}
        <div className="w-15 shrink-0 max-lg:hidden" aria-hidden="true" />

        <nav
          ref={trayRef}
          className="pointer-events-auto relative mx-auto h-15 w-full max-w-70"
          aria-label={t("common.primaryNav")}
        >
          {/* Nothing is drawn until the width is known: the path is worthless at 0
              and must not mount at a wrong centre. */}
          {width > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${round(width)} ${BAR_HEIGHT}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{
                filter: "drop-shadow(var(--shadow-card))",
                transform: dir === "rtl" ? "scaleX(-1)" : undefined,
              }}
            >
              <motion.path
                d={trayPath(width, center)}
                animate={{ d: trayPath(width, center) }}
                initial={false}
                transition={slide}
                className="fill-card stroke-border"
                strokeWidth="1"
              />
            </svg>
          )}

          <ul
            className="relative flex h-full items-stretch"
            style={{ paddingInline: `${BAR_PADDING}px` }}
          >
            {navItems.map((item) => {
              const isDisabled = Boolean(item.disabled);
              const isCurrent = item.id === activeId && !isDisabled;
              const Icon = NAV_ICONS[item.id];

              return (
                <li key={item.id} className="flex flex-1">
                  <Motion
                    as="a"
                    className={[
                      "group relative flex h-full w-full flex-col items-center justify-center rounded-2xl outline-ring transition-colors duration-200 select-none focus-visible:outline-2 focus-visible:-outline-offset-2",
                      // Exclusive, so the state can never be decided by stylesheet order.
                      isDisabled
                        ? "cursor-not-allowed opacity-45"
                        : "cursor-pointer",
                    ].join(" ")}
                    href={isDisabled ? undefined : item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    aria-disabled={isDisabled ? "true" : undefined}
                    tabIndex={isDisabled ? -1 : undefined}
                    onClick={isDisabled ? undefined : () => onNavigate(item.id)}
                    whileTap={
                      isDisabled || reduceMotion ? undefined : { scale: 0.96 }
                    }
                    transition={TAP}
                  >
                    <span className="sr-only">{t(NAV_LABEL_KEYS[item.id])}</span>
                    <Motion
                      as="span"
                      className={[
                        "flex text-muted-foreground transition-colors duration-200",
                        isDisabled ? "" : "group-hover:text-foreground",
                      ].join(" ")}
                      animate={{ opacity: isCurrent ? 0 : 1 }}
                      transition={fade}
                      aria-hidden="true"
                    >
                      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                    </Motion>
                    <AnimatePresence initial={false}>
                      {isCurrent && (
                        <Motion
                          as="span"
                          key={item.id}
                          className="absolute inset-x-0 bottom-2 text-center text-xs font-medium leading-none text-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={fade}
                          aria-hidden="true"
                        >
                          {t(NAV_LABEL_KEYS[item.id])}
                        </Motion>
                      )}
                    </AnimatePresence>
                  </Motion>
                </li>
              );
            })}
          </ul>

          {/* The current tab's indicator: a primary circle floating half above the
              tray, with the label it owns underneath. It rides the scoop on the
              same spring, so the two read as one piece of the tray. */}
          {width > 0 && (
            <Motion
              as="div"
              className="pointer-events-none absolute left-0 -top-8 z-10 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-card"
              initial={false}
              animate={{ x: circleX }}
              transition={slide}
              aria-hidden="true"
            >
              <AnimatePresence initial={false}>
                <Motion
                  as="span"
                  key={activeItem.id}
                  className="col-start-1 row-start-1 grid place-items-center"
                  {...iconSwap}
                >
                  <ActiveIcon size={ICON_SIZE} strokeWidth={ACTIVE_STROKE} />
                </Motion>
              </AnimatePresence>
            </Motion>
          )}
        </nav>

        {/* Sign out: an action, so it sits beside the navigation rather than
            inside it. The same card material and metric as the tray, with the
            dock's muted-to-ink icon behaviour. */}
        <Motion
          as="button"
          type="button"
          onClick={onLogout}
          title={t("common.signOut")}
          aria-label={t("common.signOut")}
          className="pointer-events-auto grid h-15 w-15 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-card outline-ring transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          transition={TAP}
        >
          <LogOut
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE}
            aria-hidden="true"
          />
        </Motion>
      </div>
    </div>
  );
}
