# Think Outside The Box — Campus Waste Intelligence Dashboard

A responsive operations dashboard for a smart-campus waste recycling system. It gives campus operators a single view of recycling performance: live bin fill levels on an interactive Google Map of the campus, hardware health alerts, student engagement analytics, and an offline-sync simulator for the ESP32 bin controllers.

This repository contains the **frontend only**. It is a [React](https://react.dev/) + [Vite](https://vite.dev/) single-page application that runs entirely on **local mock data** — no backend, server, or database is required to run it.

**Repository:** [github.com/Abdoh012/campus-waste-dashboard](https://github.com/Abdoh012/campus-waste-dashboard)

## Features

- **Operator sign-in** — a focused sign-in screen for the operations dashboard, with labelled fields, inline validation, a password reveal toggle, keyboard focus management, and a pending submit state. It is presentational only: there is no backend, so no credentials are verified and nothing is persisted.
- **Bottom dock navigation** — a floating, thumb-reachable tray centred at the foot of the page at every width, whose active slot changes only when you pick one: scrolling never moves the highlight.
- **KPI overview cards** — diversion rate, waste sorted, points distributed, and active smart bins, including sparkline, mini-bar, and progress visualizations.
- **Live campus map** — a real Google Map centred on Borg El Arab Technological University, with six numbered bin markers. Each marker takes its colour from the fullest of its three bins, and hovering (desktop) or tapping (touch) opens a popup listing all three bins with fill bars. A Healthy / Attention / Critical legend states the thresholds, and the map keeps the map-view and zoom controls it always had.
- **Hardware health panel** — overall device health score plus a list of active alerts (camera offline, tank nearly full, servo error).
- **Analytics section** — a waste-sorted-over-time area chart with a period selector, and a points-per-day bar chart, both built on [shadcn/ui charts](https://ui.shadcn.com/charts) (Recharts) and coloured from the project's own tokens.
- **Offline sync simulator** — flushes a batch of cached student-point events and updates the points totals, with loading, success, and error handling.
- **Toast notifications** for user actions (export, device inventory, map controls, chart period, sync result), delivered through Sonner with success/error/info variants.
- **Responsive layout** that adapts from a wide desktop grid down to a stacked mobile view, with the bottom dock unchanged at both.

> The bin locations, charts, and alert data are illustrative mock content — the map is centred on the university's real coordinates, but the individual bin positions have not been verified against the physical bins. The sync action is simulated locally and performs no network requests; the only external request the app makes is loading the Google Maps library.

## Technologies Used

| Area | Choice |
| --- | --- |
| UI library | React 19 |
| Build tool / dev server | Vite 8 |
| Language | TypeScript (strict, `.ts`/`.tsx`) |
| Styling | Tailwind CSS v4 with a design-token layer (`@theme`) |
| Animation | Motion for React (`motion`) — restrained, reduced-motion-aware transitions |
| Mapping | Google Maps JavaScript API, via the `@vis.gl/react-google-maps` React wrapper |
| Charts | Recharts, through the shadcn/ui chart primitives in `src/components/ui/chart.tsx` |
| Tooling | npm, `@vitejs/plugin-react`, `@tailwindcss/vite` |

No state-management library is used — the app relies on React state and hooks. shadcn/ui ownership in the repo is limited to the primitives in `src/components/ui` (`chart.tsx` for the Recharts wrappers, `input.tsx` behind the sign-in field); the bottom dock is hand-built from one card path, and so is everything else. Styling is done with Tailwind utilities that consume the project's design tokens. Motion drives the dock's indicator — the circle and the tray's scoop travel together — plus the press feedback, and it honors `prefers-reduced-motion`.

The source is organized into a small layered/feature structure (`pages`, `features/*`, `components/ui`, `shared/ui`, `services`, `styles`). See [`FrontEnd/ARCHITECTURE.md`](FrontEnd/ARCHITECTURE.md) for the directory responsibilities, dependency rules, and where new files belong.

### Styling architecture

The styling follows a token-first CSS architecture:

- **`src/styles/theme.css`** — the single source of truth for design tokens, written with Tailwind v4 `@theme` blocks in three layers:
  1. **Raw color scales** (`--color-primary-*`, `--color-secondary-*`, `--color-neutral-*`, and the utility state colors) — never consumed directly by components.
  2. **Fonts** (`--font-sans`, `--font-heading`, `--font-mono`) — aliased to variables loaded by the Google Fonts `<link>` in `index.html`.
  3. **Semantic aliases** (`--color-background`, `--color-foreground`, `--color-card`, `--color-border`, `--color-primary-tint`, the `--color-sidebar-*` family kept from the original dark rail, utility-state pairs, chart/text roles, and elevation) — what components actually build with.
- **`src/styles/globals.css`** — the entry stylesheet. It imports Tailwind and the token layer, sets base body typography, and themes native browser UI (scrollbars, selection).
- **`src/styles/surfaces.ts`** — a shared class recipe for the card/panel shell so the same surface utilities are not duplicated.

Component styles are written as Tailwind utilities in TSX and consume the semantic tokens (for example `bg-card`, `text-muted-foreground`, `border-border`). The original design's colors are preserved: the brand anchors (green `#46ab83`, green-dark `#27765b`, orange `#ef9f4c`, blue `#6e95dc`, purple `#a180c7`, canvas `#f4f7f4`, panel `#ffffff`, line `#e4ebe6`, ink `#10251f`) are represented byte-for-byte as tokens.

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (required by Vite 8)
- **npm** 10 or newer

## Installation and Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Abdoh012/campus-waste-dashboard.git

# 2. Move into the frontend app
cd campus-waste-dashboard/FrontEnd

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

The app is served at `http://localhost:5173` by default.

## Production Build

```bash
cd FrontEnd
npm run typecheck  # tsc --noEmit (strict type check)
npm run build      # type-checks, then outputs a static bundle to FrontEnd/dist
npm run preview    # serves the production build locally for verification
```

The build output in `dist/` is a static site and can be hosted on any static provider.

## Tests

```bash
cd FrontEnd
npm run test    # vitest run
```

The suite covers the waste chart's bucketing (`FrontEnd/src/features/dashboard/wasteSeries.test.ts`): entries summed per bucket, zero-filled gaps, each range's boundaries, and the y-axis scale. It runs on the plain TypeScript modules, so no browser or map key is needed.

## Project Structure

```
.
├── .gitignore
├── README.md
└── FrontEnd/                     # React + Vite + TypeScript application
    ├── index.html                # Vite HTML entry (mounts #root)
    ├── .env.example              # Documented environment variables (Google Maps key)
    ├── package.json
    ├── tsconfig.json             # Strict TypeScript config
    ├── vite.config.js            # React + Tailwind Vite plugins (plain-JS config)
    ├── ARCHITECTURE.md           # Directory responsibilities + dependency rules
    └── src/
        ├── main.tsx              # React entry point
        ├── App.tsx               # App shell: sign-in gate + notification stack; renders the active page
        ├── vite-env.d.ts         # Typed Vite environment variables
        ├── pages/                # One component per screen
        │   ├── LoginPage.tsx     # Operator sign-in screen
        │   └── DashboardPage.tsx # Operations dashboard screen
        ├── components/
        │   └── ui/               # shadcn/ui primitives
        │       ├── chart.tsx     # ChartContainer / Tooltip / Legend (Recharts)
        │       └── input.tsx     # Used by the sign-in form's TextField
        ├── features/
        │   ├── dashboard/        # The dashboard feature (everything it owns)
        │   │   ├── components/   # One component per dashboard region
        │   │   │   ├── BottomNav.tsx    # Fixed bottom dock (the only navigation)
        │   │   │   ├── Topbar.tsx
        │   │   │   ├── MetricGrid.tsx
        │   │   │   ├── CampusMap.tsx    # Map panel: header, controls, legend
        │   │   │   ├── BinsMap.tsx      # The Google Map, markers and popup
        │   │   │   ├── BinMarker.tsx    # Numbered marker, tone from fill data
        │   │   │   ├── LocationPopup.tsx # Three-bin popup contents
        │   │   │   ├── MapNotice.tsx    # Loading / missing-key / error state
        │   │   │   ├── HealthAlert.tsx  # Single hardware-alert row
        │   │   │   ├── WasteChart.tsx   # Waste-sorted area chart
        │   │   │   ├── PointsChart.tsx  # Points-per-day bar chart
        │   │   │   └── PageFooter.tsx
        │   │   ├── hooks/
        │   │   │   └── useActiveSection.ts  # Dock's active destination (explicit selection)
        │   │   ├── types.ts      # Dashboard domain models
        │   │   ├── mockData.ts   # Typed mock content used by the UI
        │   │   ├── campusMapData.ts # Map models, mock bin locations, tone rules
        │   │   ├── metricCards.tsx  # Overview metric descriptors (Metric[])
        │   │   └── options.ts    # Static UI options
        │   └── auth/             # The sign-in feature
        │       ├── components/
        │       │   ├── LoginForm.tsx    # Credential form + inline validation
        │       │   └── TextField.tsx    # Labelled field with error message
        │       └── types.ts      # Form-state + validation models
        ├── shared/
        │   ├── ui/               # Cross-feature presentational primitives
        │   │   ├── BrandLockup.tsx # Brand mark + wordmark
        │   │   ├── Eyebrow.tsx     # Shared monospace kicker
        │   │   ├── TrendBadge.tsx  # Shared percentage chip
        │   │   ├── StatusDot.tsx   # Shared status dot
        │   │   ├── StatCard.tsx    # Shared overview card (icon, value, trend, visual)
        │   │   ├── notifications.ts # Notification API (showSuccess/showError/showInfo) over Sonner
        │   │   └── Motion.tsx      # Typed motion wrapper (polymorphic `as`)
        │   └── animations/
        │       └── transitions.ts  # Shared motion timings (slide, crossfade, tap)
        ├── services/
        │   └── syncApi.ts        # Simulated bulk-sync endpoint + its contract
        └── styles/
            ├── theme.css         # Design tokens (@theme: scales, fonts, aliases)
            ├── globals.css       # Entry stylesheet + base/native-UI styling
            └── surfaces.ts       # Shared card/panel surface class recipe
```

See [`FrontEnd/ARCHITECTURE.md`](FrontEnd/ARCHITECTURE.md) for the layer dependency rules and where new files belong.

## Mock Data

All content the UI renders lives in two typed modules: `FrontEnd/src/features/dashboard/mockData.ts` (navigation items, KPI values, health alerts, the generated day-by-day waste series, and the cached sync events) and `FrontEnd/src/features/dashboard/campusMapData.ts` (the map's models, the six mock bin locations with their coordinates, and the marker-tone thresholds). Shared models live in `FrontEnd/src/features/dashboard/types.ts`. Components never call a network API directly.

The waste chart buckets that series per selected range in `FrontEnd/src/features/dashboard/wasteSeries.ts`: daily buckets for "Last 30 days" and "Last 7 days", a bucket per month for "This year", missing days filled with zero. The series is generated from `MOCK_NOW`, the snapshot's fixed date, so no window depends on the visitor's clock.

To move the map onto real data, replace `binLocations` and `CAMPUS_CENTER` in `campusMapData.ts` with an API response of the same shape — nothing else in the map needs to change. Each location carries exactly three bins, and the marker colour is derived from the fullest of them (below 50% green, 50–79% amber, 80% and above red), so no marker colour is hardcoded in a component.

The offline sync is simulated in `FrontEnd/src/services/syncApi.ts`. Its `syncCachedEvents(events, currentTotalPoints)` function mimics a bulk API and resolves with:

```ts
{ ok: true, received, pointsAdded, newTotalPoints, syncedAt }
```

To connect a real backend later, replace the body of `syncCachedEvents` with a `POST` request that returns the same shape — the UI depends only on that contract, so no component changes are required. A corresponding note is included in the source file.

## Environment Variables

The app reads its configuration from Vite environment variables (see `FrontEnd/.env.example`). Copy that file to `FrontEnd/.env.local`, which is git-ignored, and fill it in.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes, for the map | Google Maps JavaScript API key. Without it the map panel shows a styled setup notice instead of a map. |
| `VITE_GOOGLE_MAPS_MAP_ID` | No | A Google Maps Map ID. Advanced markers (the numbered bin markers) require one; without it the app falls back to Google's documented `DEMO_MAP_ID`, which is fine locally but not for production. |

For a quick local start, Google's [**Maps Demo Key**](https://developers.google.com/maps/documentation/javascript/demo-key) needs no billing account: sign in, accept the terms, and paste the key it shows you. It covers map rendering, advanced markers and info windows — everything this map uses — under a daily quota with no risk of charges, but it is for prototyping only and not for production.

For a production key, create or pick a Google Cloud project, **enable billing on it**, enable the **Maps JavaScript API**, then create an API key under *APIs & Services → Credentials* and restrict it to the Maps JavaScript API and to the origins you serve the app from (`http://localhost:5173` for `npm run dev`). Each Maps product has a monthly free allowance before per-request charges apply — check the [current pricing list](https://developers.google.com/maps/billing-and-pricing/pricing).

Vite inlines `VITE_*` values into the bundle, so the key is public — restrict it rather than trying to hide it. Everything else in the dashboard runs on mock data with no key at all.

## Deployment

The production build is a static bundle, so it can be deployed to any static host. For example:

- **Vercel / Netlify** — set the project root to `FrontEnd`, the build command to `npm run build`, and the output directory to `dist`. Add `VITE_GOOGLE_MAPS_API_KEY` (and optionally `VITE_GOOGLE_MAPS_MAP_ID`) as environment variables in the host's project settings.
- **GitHub Pages** — build with `npm run build` and publish the `FrontEnd/dist` folder. If the site is served from a subpath, set Vite's [`base`](https://vite.dev/config/shared-options.html#base) option accordingly in `vite.config.js`.

No deployment is configured in this repository.

## Notes

- This frontend was migrated from an original plain HTML/CSS/JavaScript prototype. The visual design, responsive behavior, and colors were preserved while the styling was rebuilt on Tailwind CSS v4 with a design-token layer.
- The migration consolidated a handful of one-off, near-identical greens/greys (`#86968d`, `#87968e`, `#88968f`, `#89978f`, and similar) into shared neutral scale steps, and snapped two decorative micro-details (the eyebrow color and the notification dot) to the nearest token. All brand and structural anchors are exact.
- The application is independent of any backend and does not require a server to run.
- The interactive map replaced an earlier CSS illustration of the campus, and the hand-authored SVG chart paths were replaced with data-driven Recharts charts. The map panel kept its layout, controls, legend and status colours; only the drawing itself changed.
