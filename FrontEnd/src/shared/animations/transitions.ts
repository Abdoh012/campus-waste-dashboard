import type { Transition } from "motion/react";

/**
 * The project's canned transitions — how long things take to move.
 *
 * Pulled out of the dock so the next animated component reuses the same feel
 * instead of inventing a second, slightly different spring. Only timings live
 * here: variants and per-component choreography depend on local state
 * (`BottomNav`'s icon swap, for instance, folds in `prefers-reduced-motion`)
 * and stay beside the component that owns that state.
 */

/** The slide: the system's 350–450ms window, with a slight overshoot. */
export const SLIDE: Transition = { type: "spring", duration: 0.42, bounce: 0.2 };
/** Crossfades: quick enough to ride along with the slide. */
export const CROSSFADE: Transition = { duration: 0.18, ease: "easeOut" };
/** The reduced-motion fallback — a plain fade, nothing more. */
export const FADE: Transition = { duration: 0.15, ease: "easeOut" };
/** Quick, slightly damped press feedback — a tap, not a bounce. */
export const TAP: Transition = { type: "spring", stiffness: 650, damping: 30 };
