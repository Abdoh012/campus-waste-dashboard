# Think Outside The Box — Campus Waste Intelligence Dashboard

A responsive operations dashboard for a smart-campus waste recycling system. It gives campus operators a single view of recycling performance: live bin fill levels on a stylized campus map, hardware health alerts, student engagement analytics, and an offline-sync simulator for the ESP32 bin controllers.

This repository contains the **frontend only**. It is a [React](https://react.dev/) + [Vite](https://vite.dev/) single-page application that runs entirely on **local mock data** — no backend, server, or database is required to run it.

**Repository:** [github.com/Abdoh012/campus-waste-dashboard](https://github.com/Abdoh012/campus-waste-dashboard)

## Features

- **Bottom dock navigation** — a floating, thumb-reachable tray centred at the foot of the page at every width, with a scroll spy that keeps the section in view lit.
- **KPI overview cards** — diversion rate, waste sorted, points distributed, and active smart bins, including sparkline, mini-bar, and progress visualizations.
- **Live campus map** — a stylized CSS illustration of campus buildings with six clickable smart-bin markers. Selecting a marker reveals a fill-level tooltip, and the Healthy / Attention / Critical legend summarizes bin status.
- **Hardware health panel** — overall device health score plus a list of active alerts (camera offline, tank nearly full, servo error).
- **Analytics section** — an SVG line chart of waste sorted over time with a period selector, and a bar chart of points distributed per day.
- **Offline sync simulator** — flushes a batch of cached student-point events and updates the points totals, with loading, success, and error handling.
- **Toast notifications** for user actions (export, device inventory, map controls, chart period, sync result).
- **Responsive layout** that adapts from a wide desktop grid down to a stacked mobile view, with the bottom dock unchanged at both.

> The campus map, charts, and alert data are illustrative mock content. The sync action is simulated locally and performs no network requests.

## Technologies Used

| Area | Choice |
| --- | --- |
| UI library | React 19 |
| Build tool / dev server | Vite 8 |
| Language | JavaScript (JSX, ES modules) |
| Styling | Tailwind CSS v4 with a design-token layer (`@theme`) |
| Animation | Motion for React (`motion`) — restrained, reduced-motion-aware transitions |
| Tooling | npm, `@vitejs/plugin-react`, `@tailwindcss/vite` |

No UI framework or state-management library is used — the app relies on React state/hooks. Styling is done with Tailwind utilities that consume the project's design tokens. Motion is used only for the bottom dock's active-indicator transition and tap feedback, and it honors `prefers-reduced-motion`.

### Styling architecture

The styling follows a token-first CSS architecture:

- **`src/styles/theme.css`** — the single source of truth for design tokens, written with Tailwind v4 `@theme` blocks in three layers:
  1. **Raw color scales** (`--color-primary-*`, `--color-secondary-*`, `--color-neutral-*`, and the utility state colors) — never consumed directly by components.
  2. **Fonts** (`--font-sans`, `--font-heading`, `--font-mono`) — aliased to variables loaded by the Google Fonts `<link>` in `index.html`.
  3. **Semantic aliases** (`--color-background`, `--color-foreground`, `--color-card`, `--color-border`, `--color-primary-tint`, the `--color-sidebar-*` navigation dock, utility-state pairs, chart/text roles, and elevation) — what components actually build with.
- **`src/styles/globals.css`** — the entry stylesheet. It imports Tailwind and the token layer, sets base body typography, and themes native browser UI (scrollbars, selection).
- **`src/styles/components/campus-map.css`** — the one retained component stylesheet. The styled campus map is an absolutely positioned, transformed illustration whose geometry cannot be expressed with Tailwind utilities without heavy arbitrary values, so it lives in its own scoped file.
- **`src/styles/surfaces.js`** — a shared class recipe for the card/panel shell so the same surface utilities are not duplicated.

Component styles are written as Tailwind utilities in JSX and consume the semantic tokens (for example `bg-card`, `text-muted-foreground`, `border-border`). The original design's colors are preserved: the brand anchors (green `#46ab83`, green-dark `#27765b`, orange `#ef9f4c`, blue `#6e95dc`, purple `#a180c7`, canvas `#f4f7f4`, panel `#ffffff`, line `#e4ebe6`, ink `#10251f`) are represented byte-for-byte as tokens.

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
npm run build      # outputs a static bundle to FrontEnd/dist
npm run preview    # serves the production build locally for verification
```

The build output in `dist/` is a static site and can be hosted on any static provider.

## Project Structure

```
.
├── .gitignore
├── README.md
└── FrontEnd/                     # React + Vite application
    ├── index.html                # Vite HTML entry (mounts #root)
    ├── package.json
    ├── vite.config.js            # React + Tailwind Vite plugins
    └── src/
        ├── main.jsx              # React entry point
        ├── App.jsx               # Top-level layout and shared state
        ├── styles/               # Styling architecture
        │   ├── theme.css         # Design tokens (@theme: scales, fonts, aliases)
        │   ├── globals.css       # Entry stylesheet + base/native-UI styling
        │   ├── surfaces.js       # Shared card/panel surface class recipe
        │   └── components/
        │       └── campus-map.css  # Scoped campus-map illustration styles
        ├── components/           # One component per dashboard region (+ leaves)
        │   ├── BottomNav.jsx     # Fixed bottom dock (the only navigation)
        │   ├── Topbar.jsx
        │   ├── MetricGrid.jsx
        │   ├── CampusMap.jsx
        │   ├── HealthPanel.jsx
        │   ├── HealthAlert.jsx   # Single hardware-alert row
        │   ├── WasteChart.jsx
        │   ├── PointsChart.jsx
        │   ├── SyncBanner.jsx
        │   ├── PageFooter.jsx
        │   ├── Toast.jsx
        │   ├── Eyebrow.jsx       # Shared monospace kicker
        │   ├── TrendBadge.jsx    # Shared percentage chip
        │   └── StatusDot.jsx     # Shared status dot
        ├── data/
        │   ├── mockData.js       # All mock content used by the UI
        │   └── constants.js      # Static UI options and decorative geometry
        └── services/
            └── syncApi.js        # Simulated bulk-sync endpoint (swap for a real API)
```

## Mock Data

All content the UI renders lives in `FrontEnd/src/data/mockData.js` (navigation items, KPI values, campus bins, health alerts, chart series, and the cached sync events). Components never call a network API directly.

The offline sync is simulated in `FrontEnd/src/services/syncApi.js`. Its `syncCachedEvents(events, currentTotalPoints)` function mimics a bulk API and resolves with:

```js
{ ok: true, received, pointsAdded, newTotalPoints, syncedAt }
```

To connect a real backend later, replace the body of `syncCachedEvents` with a `POST` request that returns the same shape — the UI depends only on that contract, so no component changes are required. A corresponding note is included in the source file.

## Environment Variables

No environment variables are required. The current version runs on mock data and makes no API calls, so there are no endpoints or keys to configure. If a real API is added later, keep secrets out of source control and provide an `.env.example` documenting the variable names (the `.gitignore` already excludes `.env` files).

## Deployment

The production build is a static bundle, so it can be deployed to any static host. For example:

- **Vercel / Netlify** — set the project root to `FrontEnd`, the build command to `npm run build`, and the output directory to `dist`.
- **GitHub Pages** — build with `npm run build` and publish the `FrontEnd/dist` folder. If the site is served from a subpath, set Vite's [`base`](https://vite.dev/config/shared-options.html#base) option accordingly in `vite.config.js`.

No deployment is configured in this repository.

## Notes

- This frontend was migrated from an original plain HTML/CSS/JavaScript prototype. The visual design, responsive behavior, and colors were preserved while the styling was rebuilt on Tailwind CSS v4 with a design-token layer.
- The migration consolidated a handful of one-off, near-identical greens/greys (`#86968d`, `#87968e`, `#88968f`, `#89978f`, and similar) into shared neutral scale steps, and snapped two decorative micro-details (the eyebrow color and the notification dot) to the nearest token. All brand and structural anchors are exact.
- The application is independent of any backend and does not require a server to run.
