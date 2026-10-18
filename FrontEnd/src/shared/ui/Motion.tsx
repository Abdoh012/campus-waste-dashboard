import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { ComponentType, RefAttributes } from "react";

/**
 * The elements `Motion` can render: every HTML tag Framer Motion knows.
 *
 * Deliberately HTML-only. `HTMLMotionProps` is typed against
 * `HTMLElementTagNameMap`, so an SVG tag such as `path` would need
 * `SVGMotionProps` instead and would have to be narrowed separately. SVG shapes
 * are rare here and keep their DOM structure intact by animating through
 * `motion.*` directly — see the dock's tray outline in `BottomNav`.
 */
export type MotionTag = keyof HTMLElementTagNameMap & keyof typeof motion;

/**
 * Props for `Motion`.
 *
 * Everything Framer Motion accepts on `motion.<element>` arrives untouched:
 * `initial`, `animate`, `exit`, `variants`, `transition`, `whileHover`,
 * `whileTap`, `whileInView`/`viewport`, `layout`, the gesture props, plus the
 * element's own HTML attributes, event handlers, `children` and `ref`. `as`
 * selects which element is rendered and defaults to `"div"`, so `<Motion as="a">`
 * types `href`/`aria-current` as anchor props while `<Motion as="span">` types
 * them as span props.
 */
export type MotionProps<Tag extends MotionTag = "div"> = HTMLMotionProps<Tag> &
  RefAttributes<HTMLElementTagNameMap[Tag]> & {
    /** The semantic element to render. Defaults to `"div"`. */
    as?: Tag;
  };

/**
 * A motion-capable element, named after the semantic tag you give it.
 *
 * `Motion` is the project's entry point for Framer Motion: it picks the
 * underlying `motion.<tag>` for the `as` you pass and renders nothing else, so
 * there is no wrapper element — the DOM and the accessibility tree stay exactly
 * what the component wrote (`<Motion as="a">` is an anchor, `<Motion as="span">`
 * is a span).
 *
 * The capital-M name is deliberately distinct from the lowercase `motion`
 * export it wraps: both can be imported in one file — `Motion` for HTML
 * elements, `motion` for the SVG shapes `Motion` does not cover — without
 * shadowing either.
 *
 * `AnimatePresence`, variants, staggered children, layout animations and
 * `prefers-reduced-motion` behave exactly as they do on `motion.*`; this wrapper
 * only chooses the element.
 */
export default function Motion<Tag extends MotionTag = "div">({
  as,
  ...props
}: MotionProps<Tag>) {
  // `motion[tag]` is a union of per-element components, but `MotionProps<Tag>`
  // already pins the props to that element, so this cast narrows the component
  // only. The assertion on the spread is type-level too — `as` was destructured
  // off, so the runtime object already satisfies `MotionProps<Tag>` — and works
  // around TypeScript being unable to reduce the generic `Omit<..., "as">` rest
  // type. No `any` is involved.
  const Component = motion[as ?? "div"] as ComponentType<MotionProps<Tag>>;

  return <Component {...(props as MotionProps<Tag>)} />;
}
