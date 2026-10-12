# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Campus facilities / sustainability operators** — the primary and only confirmed audience. They run the day-to-day recycling operation on a physical campus: keeping bins serviced, watching bin fill levels, reacting to hardware faults, and reporting on recycling performance.

Their job with this dashboard: get a fast, trustworthy read on the state of the campus recycling system — which bins need attention, what hardware is failing, how much waste has been sorted, and how the student points program is doing — **while moving around campus during daily rounds, on a phone**. A desktop workstation is the secondary setting, used for a longer review.

## Product Purpose

A single view of campus recycling performance for the operator who owns it. It answers four questions in one screen: how the campus is performing (KPIs), where the problem bins are (live campus map), what hardware is broken (health alerts), and how the student engagement program is tracking (analytics + points).

Success means an operator can leave this screen knowing exactly which bin to walk to and why — and can flush the point events that the bins captured while offline.

## Positioning

An **offline-first bridge between ESP32 smart bins and campus operations**. The bins cache student-point events locally while disconnected; this dashboard surfaces the cached/pending backlog and flushes it to the points total through a simulated bulk-sync endpoint. A neighboring recycling-analytics dashboard could copy the charts and KPIs, but not the honest offline-cache → sync → points-ledger loop tied to identifiable physical devices.

## Operating Context

- **Mobile-first, on the move.** Used during campus rounds on a phone; the layout collapses to a stacked view (the app's `max-[700px]` behavior) as the real working state, not a degraded fallback. Desktop is the secondary review setting.
- **Physical world the UI points at:** six mapped bin locations (North Gate, Science Hall, Student Union, Arts Center, Rec Center, Library), each an ESP32 controller with a camera, liquid tank, and servo mechanism — the three things the health alerts actually report on.
- **Student points program** runs alongside the hardware: students earn points per sorted item, and those events are the payload the sync flushes.
- **Frontend-only repository.** React 19 + Vite 8 SPA that runs entirely on local mock data — no backend, server, or database. The app was migrated from an original plain HTML/CSS/JavaScript prototype; visual design, responsive behavior, and colors were preserved while styling was rebuilt on Tailwind CSS v4 with a design-token layer.
- A `BackEnd/` directory exists on disk but is **git-ignored and off-limits** — treat the repo as frontend-only.

## Capabilities and Constraints

**Capabilities (all currently rendered from mock data):** sidebar anchor navigation; KPI cards (diversion rate, waste sorted, points distributed, active smart bins) with sparkline / mini-bar / progress visuals; a stylized, clickable campus map with fill-level tooltips and a Healthy / Attention / Critical legend; a hardware health score and alert list; an SVG time-series chart with a period selector; a points-per-day bar chart; an offline sync action with loading / success / error handling; toast notifications; responsive desktop↔mobile layout.

**Technical constraints:**

- JSX + ES modules, plain JavaScript — **no TypeScript and no state-management library**; React hooks only.
- Tailwind v4 via `@tailwindcss/vite`; **no `tailwind.config.js`** — configuration lives in CSS.
- Color must be added or changed **through a token in `src/styles/theme.css`**, never a hardcoded hex or a new palette.
- The sync contract is `syncCachedEvents(events, currentTotalPoints)` resolving `{ ok, received, pointsAdded, newTotalPoints, syncedAt }`; swapping in a real `POST /api/sync` returning the same shape requires **no component changes**. The error toast text `Sync failed · check the connection and try again` is fixed.
- `npm run build` is the only verification gate — there are **no test, lint, typecheck, or formatter scripts**.
- Repo is published; **do not force-push or rewrite remote history**. The README must keep stating that the app uses mock data and needs no running backend.

**Undecided / not yet established:** whether the six bins, the "12 pending events", and the KPI values are anything other than illustrative; whether a real ESP32 fleet, backend, or student roster exists (an Arduino project archive sits in the repo root, but its production status is unconfirmed); authentication, roles, and multi-campus support (none exist).

## Brand Commitments

- **Product name: "Think Outside The Box"** — binding, used in the page title and README.
- **The topbar greeting "Good morning, BATU"** — binding; a confirmed operator/organization identifier, not a placeholder.
- **The brand palette, preserved byte-for-byte** (these are the design-token anchors): green `#46ab83`, green-dark `#27765b`, orange `#ef9f4c`, blue `#6e95dc`, purple `#a180c7`, canvas `#f4f7f4`, panel `#ffffff`, line `#e4ebe6`, ink `#10251f`. The neutral scale and utility-state colors are supporting values.
- **Typefaces:** DM Sans (body), Space Grotesk (headings), DM Mono (monospace kickers), loaded via a Google Fonts `<link>`.

## Evidence on Hand

- **There is no production evidence, and future work must not invent any.** The campus map, chart series, KPI values, bin fill levels, health alerts, and cached sync events are all illustrative mock content in `FrontEnd/src/data/mockData.js`.
- **No** real customers, testimonials, case studies, benchmarks, pricing, or deployment exist. No API endpoints or keys are configured, and no deployment is set up.
- Physical artifacts present in the repo root but not integrated into the app: an Arduino project archive (`ei-ramzi_helal-project-1-arduino-1.0.1-impulse-#1.zip`) and a generated image (`Gemini_Generated_Image_pn3cg1pn3cg1pn3c.jpg`). The `.gitignore` excludes `BackEnd/`.

## Product Principles

1. **Honesty about connectivity.** Cached, pending, and simulated data must never be dressed up as live. The offline → pending → synced loop is the product's reason to exist, so its state has to be legible at a glance.
2. **Built for the phone, in motion.** Scannable at arm's length during a round; the desktop view is a convenience, not the design target.
3. **Every alert points at a real bin.** Status and health information is only useful if it tells the operator which physical device to walk to and what is wrong with it.
4. **Preserve the incumbent identity.** The brand anchors, responsive behavior, and existing copy are the product's visual truth; refine around them rather than re-skinning them.
5. **Keep the mock-data contract intact.** Components render from `src/data/mockData.js` and the `syncApi` contract until a real API exists; a backend swap must not require component changes.
