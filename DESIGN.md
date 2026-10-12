---
name: Think Outside The Box — Campus Waste Intelligence
description: Operational campus recycling dashboard — bin fill, hardware health, and student points for operators on the move.
colors:
  # Primary — the brand green
  canopy-green: "#46ab83"
  canopy-green-deep: "#27765b"
  canopy-green-hover: "#397a5d"
  seedling-tint: "#e2f4e8"
  seedling-line: "#d1ebdc"
  # Secondary — the warm accent
  harvest-amber: "#ef9f4c"
  harvest-amber-tint: "#f8d6ad"
  # Tertiary — decorative violet
  iris-violet: "#a180c7"
  # Auxiliary accents
  sky-blue: "#6e95dc"
  sun-gold: "#e6a54d"
  live-green: "#48b37c"
  live-halo: "#c5ecd7"
  # Neutral — structural green-grays
  chalk: "#f4f7f4"
  panel-white: "#ffffff"
  hairline: "#e4ebe6"
  mist: "#f3f6f4"
  input-frost: "#fafcfb"
  moss: "#87968e"
  sage: "#a0aaa5"
  fog: "#b2bcb7"
  slate-green: "#718078"
  fern: "#62766d"
  pine-ink: "#10251f"
  # Utility states
  success-tint: "#e4f5ea"
  success-strong: "#3b936d"
  warning-tint: "#fff1d3"
  warning-strong: "#c58d25"
  error-tint: "#fbe6e1"
  error-strong: "#d86456"
  info-tint: "#e8eef8"
  info-strong: "#4f7cc0"
  # Navigation dock — the dark pine base at the foot of the page (the
  # `--color-sidebar-*` token family; the name is kept for compatibility)
  rail-foreground: "#e7f1eb"
  rail-muted: "#7d9b90"
  rail-line: "#29453c"
  rail-hover: "#1c3c32"
typography:
  display:
    fontFamily: "Space Grotesk, DM Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Space Grotesk, DM Sans, sans-serif"
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Space Grotesk, DM Sans, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "normal"
    letterSpacing: "normal"
  label:
    fontFamily: "DM Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  panel: "10px"
  pill: "20px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "13px"
  lg: "17px"
  xl: "25px"
components:
  surface-panel:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.pine-ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.pine-ink}"
    textColor: "{colors.rail-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  button-sync:
    backgroundColor: "#2b7e5f"
    textColor: "{colors.panel-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 13px"
  button-outline:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.canopy-green-hover}"
    rounded: "{rounded.sm}"
    padding: "9px"
  chip-live:
    backgroundColor: "{colors.seedling-tint}"
    textColor: "{colors.canopy-green-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 11px"
  chip-trend-up:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success-strong}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 5px"
  select-period:
    backgroundColor: "{colors.input-frost}"
    textColor: "{colors.slate-green}"
    rounded: "{rounded.sm}"
    padding: "7px"
  nav-item-active:
    backgroundColor: "{colors.rail-hover}"
    textColor: "{colors.rail-foreground}"
    rounded: "{rounded.lg}"
    padding: "6px 8px"
    minHeight: "48px"
  bin-marker:
    backgroundColor: "{colors.canopy-green}"
    textColor: "{colors.panel-white}"
    rounded: "{rounded.full}"
    size: "31px"
  toast:
    backgroundColor: "#16362a"
    textColor: "#eaf7ef"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: Think Outside The Box — Campus Waste Intelligence

## Overview

**Creative North Star: "The Field Logbook"**

This is an operator's logbook, not a control-room wall. Every surface behaves like a page in a durable field record: ruled by hairline borders, lit softly, and written in a tight, engineered hand. The dashboard's job is to be *readable while walking* — a phone in one hand during a campus round — so it favors legibility at arm's length over density and ornament. Panels are calm and evenly weighted; nothing shouts, and nothing is disguised. The honesty of the offline-cache → sync → ledger loop is treated as a design value: state is stated plainly in text and color, never dressed up as live.

The palette carries the logbook's two moods. A single botanical green family owns the product's own surfaces and its primary, "everything is fine" state, while warm amber, blue, and violet are spent sparingly as accents that each mean something specific — amber for waste volume, blue for information and engagement, violet for the active-bin count. The canvas is a pale green-tinted paper rather than clinical white, and the dark pine dock along the foot of the page reads like the logbook's bound spine.

The result is deliberately flat and tactile: solid fills, crisp 1px borders, small radii, and quick 200–300ms transitions. It feels confident and operational — closer to a well-made field instrument than to a marketing page. **Key Characteristics:**

- Pale green-tinted canvas; white paper panels separated by hairline borders.
- One botanical green as the structural brand color; amber / blue / violet as meaning-bearing accents.
- Space Grotesk headings set tight with negative tracking; DM Mono uppercase kickers labeling every block.
- A single ambient card shadow — depth never escalates.
- Small radii (4–10px); only the live status chip is a pill.
- Phone-first: the ≤700px stacked layout is the primary working state, not a fallback.
- One navigation, at every width: a dark pine dock pinned to the foot of the page.

## Colors

A botanical-operational palette: one green family does the structural work, three secondary accents carry distinct meanings, and a green-tinted neutral set keeps the whole screen on the same paper.

### Primary
- **Canopy Green** (#46ab83): the brand green. Primary fills, the diversion-rate accent bar, healthy bin markers, the three-bar logo mark, and the default focus ring.
- **Pine Green** (#27765b): the deep green for text on tinted surfaces and outline-button labels (`primary-text` / `primary-hover` family). The interactive green voice.
- **Seedling Tint** (#e2f4e8): the pale green surface for badges and the "Good standing" chip. Used with **Seedling Line** (#d1ebdc) as its border on active states.

### Secondary
- **Harvest Amber** (#ef9f4c): the warm accent for waste-sorted metrics and the KPI card's amber top rule. Paired with **Harvest Amber Tint** (#f8d6ad) for the mini-bars.

### Tertiary
- **Iris Violet** (#a180c7): decorative accent reserved for the active-smart-bins metric.

### Neutral
- **Chalk** (#f4f7f4): the application canvas — a green-tinted off-white, never pure white.
- **Panel White** (#ffffff): card and panel surfaces.
- **Hairline** (#e4ebe6): the 1px border that separates every surface; the system's main structural device.
- **Mist** (#f3f6f4): secondary button fills and inset wells.
- **Input Frost** (#fafcfb): the default field / select background.
- **Moss** (#87968e) and **Sage** (#a0aaa5): the mid green-grays for labels and secondary mono text.
- **Fog** (#b2bcb7): the faintest label tier (chevrons, tertiary captions).
- **Slate Green** (#718078) and **Fern** (#62766d): darker label steps for select text and strong labels.
- **Pine Ink** (#10251f): the ink. Body text, headings, the dark navigation dock, and the Export button fill.

### Named Rules
**The Token-Only Rule.** Color enters the UI through a named token in `src/styles/theme.css` — never a literal hex written into a component. Adding color means adding a token.

**The Green-Owns-Structure Rule.** The canopy-green family marks the product's own chrome and its primary/healthy state. Amber, blue, and violet are reserved for secondary meaning (waste, information/engagement, active bins) and stay rare.

## Typography

**Display Font:** Space Grotesk (with DM Sans, sans-serif)
**Body Font:** DM Sans (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** DM Mono (with ui-monospace, SFMono-Regular, monospace)

**Character:** A tight, engineered pairing. Space Grotesk carries the numbers and headings with aggressive negative tracking so figures read as measured data; DM Mono's uppercase kickers give each block a labeled, logbook quality; DM Sans keeps the running UI text quiet and neutral.

### Hierarchy
- **Display** (600, 30px, line-height 1, -0.04em): KPI values and hero figures. Drops to 25px on phone.
- **Headline** (600, 25px, -0.04em): the topbar greeting. 21px on phone.
- **Title** (600, 19px, -0.035em): every panel heading.
- **Body** (400, 14px, line-height normal): all running text and controls. The base `body` uses `line-height: normal` deliberately — Tailwind's preflight 1.5 would shift the whole layout.
- **Label** (500, 10px DM Mono, 0.12em, uppercase): the eyebrow kicker above each panel title. Related mono uses tighten to 0.08em / 0.06em, and 9px for axis ticks and the footer.
- **Dock label** (400, 11px DM Sans): the four navigation slots. The 18px glyph carries recognition; the word confirms it. Dock labels are UI text, so they are set in DM Sans, never the mono.

### Named Rules
**The Negative-Tracking Rule.** Space Grotesk is always set tight (-0.035 to -0.04em). Default tracking reads as un-engineered and is off-system.

**The Kicker Rule.** Every panel opens with a DM Mono uppercase eyebrow (10px / 0.12em). It is the label for the block, not decoration; omit it and the logbook loses its indexing.

## Layout

A single-region app shell. The main column is centred, capped at **1600px**, and padded **32px 40px 88px** — the deep bottom padding is the dock's clearance, so the sync banner and footer are never hidden behind it. A dark pine dock floats in a centred tray at the foot of the viewport at every width: capped at **720px**, rounded **16px**, with **12px** gutters to the screen edges and **10px** of lift above the bottom edge plus `env(safe-area-inset-bottom)`; the tray reuses the card ambient shadow so it reads as a floating shell rather than a band stretched edge-to-edge. Work happens in three descending bands:

- **KPI strip** — 4 equal columns, 14px gap, cards min-height 156px with a 3px semantic top rule (green / amber / blue / violet).
- **Map + hardware health** — two columns at `1.8fr / 0.85fr`, 16px gap.
- **Analytics** — two columns at `1.55fr / 0.9fr`, 16px gap.

Section rhythm is tight and even: 16px bottom margins between bands, 14–16px gutters within them, 20px panel padding (**15px** on phone). Density is "arm's length" — generous tap targets, few rows, whitespace doing the grouping work with borders.

**Responsive.** Two breakpoints drive everything. At **≤1100px** the KPI strip drops to 2 columns and both two-column bands collapse to one. At **≤700px** — the primary working state, not a degraded one — the topbar's brand lockup takes its own row above the greeting, page padding tightens to 15px, panels to 15px, gutters to 10px, the campus map shortens from 357px to 300px, and the dock's network readout collapses to its status dot alone. The dock itself never moves: it is the one constant across both breakpoints.

## Elevation & Depth

The system is **flat with exactly one ambient shadow**. Surfaces sit level on the canvas and are defined primarily by 1px hairline borders; a single soft, wide card shadow gives the white panels a slight lift off the green paper. The only other shadow in the system belongs to the transient toast. Nothing elevates on hover or focus — state is communicated by color and border, not by raising the element. The dock floats as a centred pine tray: it reuses the same card ambient shadow rather than a new one, so the One-Shadow Rule holds and the tray reads as one more flat surface, separated from the canvas by its hairline border.

### Shadow Vocabulary
- **card** (`box-shadow: 0 14px 34px rgba(35, 73, 58, 0.06)`): all panels. Very low opacity, wide spread — presence without weight.
- **toast** (`box-shadow: 0 8px 30px #16362a44`): the floating notification only.

### Named Rules
**The One-Shadow Rule.** There is one ambient shadow for surfaces and one for the toast. No element gains a second shadow or lifts on hover; separation is the border's job.

## Shapes

Small, precise geometry. Panels use a **10px** radius; the dock tray **16px** with **8px** slots; the sync banner **8px**; chips, small buttons, bars, and inputs **4px**; the toast and Export button **6px**. Only the live-status chip breaks the pattern with a **20px** pill, and status dots / bin markers are perfect circles.

Borders are the recurring silhouette: 1px hairline on every panel and control, a 1px hairline around the dock tray, 2px on the illustrated campus-map buildings, a 3px semantic top rule on KPI cards, a 3px white ring around each bin marker, and a dashed 1px border on the offline-sync banner. The active dock slot and the map markers use small directional offsets (an inset 3px accent stripe on the slot's **top** edge — the rail's left-edge stripe, rotated; a hover scale to 1.17).

### Named Rules
**The Small-Radius Rule.** Corners stay between 4px and 10px. Do not round panels into soft cards or pill the UI — the 20px pill is reserved for the live-status chip alone.

## Components

### Buttons
- **Shape:** small radii — Export 6px, sync 4px, outline 4px.
- **Primary (Export report):** pine-ink fill, pale-green text, 10×14px padding; the trailing ↗ is accented in **Export Accent** (#96d4b5). It is the one dark, weighty action.
- **Sync:** a solid **#2b7e5f** fill with white text, 10×13px padding; disabled while syncing (label swaps to "Syncing cached events …").
- **Outline (View all devices):** white fill, green text, 1px **#cfe2d7** border, full width.
- **Hover / Focus:** background shifts within 200ms; focus is a clear outline offset from the edge. No lift, no shadow change.

### Chips
- **Live operations:** the only pill (20px radius) — seedling tint, a 6px live-green dot with a 3px halo, 10px DM Mono at 0.06em.
- **Trend badges:** 4px radius, 10px DM Mono semibold. Up = success tint/strong; neutral = **#edf1ef** on **#6a8177**. Used in every KPI footer and the points chart.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** Panel White on Chalk.
- **Shadow Strategy:** the single ambient card shadow (see Elevation & Depth).
- **Border:** 1px Hairline; KPI cards add a 3px semantic top rule.
- **Internal Padding:** 20px desktop / 15px phone; KPI cards 19/18/15px.

### Inputs / Fields
- **Style:** Input Frost background, 1px Hairline border, 4px radius, 7px padding, 10px text in Slate Green. Native `<select>` and buttons are themed, not replaced.
- **Focus:** a visible brand ring at the edge.
- **Disabled:** reduced-opacity fill (the sync button while pending).

### Navigation
A **bottom dock** floating in a centred pine tray is the only navigation at every width — capped at **720px**, **16px** radius, **12px** edge gutters, **10px** above the foot (`env(safe-area-inset-bottom)` aware), on the same soft card shadow; the product has no left rail. Four equal slots, each an 18px lucide-drawn glyph above an **11px** label, all four sharing one 1.75px stroke weight, at least 44px in both directions so a thumb reaches any region one-handed mid-round. The dock's inner row is capped at 720px and centred; its slots are 8px radius, default text the muted rail tint, hover filling a partial rail-hover wash (60%) while the glyph brightens to the rail foreground, and the **active** slot — and only the active slot — carrying an inset **3px** green stripe on its top edge over the solid rail-hover plate, with its glyph stepped from the rail icon tone to rail-accent. That stripe is a single shared element: on a section change it slides to the next slot (critically damped, ≈250ms, no overshoot) rather than blinking, and collapses to an instant swap under `prefers-reduced-motion`. At the row's right end, behind a 24px rail-line hairline, sits the "Network online" pulse with its last-sync line; at ≤700px only the dot remains. The `SMART CAMPUS OS` eyebrow, the three-bar mark, and the two-line Space Grotesk wordmark live in the **topbar lockup** on the pale canvas — re-toned for the light ground (brand green mark, standard eyebrow, ink wordmark) — and the old admin identity row is now a single 31px initials disc beside the notifications button. Which slot is active is decided by a scroll spy, not by the last click: a destination stays lit while its own section is still in view, and only once it leaves does the first in-view destination in dock order take over.

### Signature Component — Campus Map
The product's one bespoke illustration, and the reason a component stylesheet survives. A 357px (300px phone) panel with a patterned green surface, absolutely positioned and rotated roads, lawns, and buildings drawn in DM Mono at 8–9px, and six circular bin markers (31px, 3px white ring) colored by fill state — canopy green, amber, or error red. Markers scale to 1.17 on hover/focus; selecting one reveals a dark tooltip (pine #17372c) that reports the bin and its fill level, with the percentage in amber.

## Do's and Don'ts

### Do:
- **Do** route every color through a token in `src/styles/theme.css`; components consume semantic tokens, never raw hex.
- **Do** keep panels at 10px radius with the single ambient shadow and a 1px Hairline border.
- **Do** set headings in Space Grotesk 600 with negative tracking (-0.035 to -0.04em) and open each panel with a DM Mono uppercase kicker (10px / 0.12em).
- **Do** treat the ≤700px stacked layout as the primary working state and verify it first.
- **Do** keep the foot dock the only navigation at every width, and keep every slot's target at least 44×44px with real `env(safe-area-inset-bottom)` clearance.
- **Do** color state semantically and consistently: canopy green = healthy/primary, amber = attention, error red = critical, sky blue = information, iris violet = active bins.
- **Do** keep body line-height `normal` at 14px; do not reintroduce Tailwind's paired line-height utilities, which shift the layout.

### Don't:
- **Don't** add gradients, glows, glassmorphism, or saturated "tech SaaS" chrome — the system is flat, botanical, and operational.
- **Don't** introduce a second surface shadow or lift cards/buttons on hover.
- **Don't** re-introduce a left rail, a horizontal scroll nav, or any second navigation surface beside the dock.
- **Don't** hardcode a hex value in a component or extend the palette without a token.
- **Don't** dress cached, pending, or simulated data up as live.
- **Don't** round panels into soft cards or pill anything except the live-status chip.
