# Think Outside The Box — Campus Waste Intelligence Dashboard

A responsive operations dashboard for a smart-campus waste recycling system. It gives campus operators a single view of recycling performance: live bin fill levels on a stylized campus map, hardware health alerts, student engagement analytics, and an offline-sync simulator for the ESP32 bin controllers.

This repository contains the **frontend only**. It is a [React](https://react.dev/) + [Vite](https://vite.dev/) single-page application that runs entirely on **local mock data** — no backend, server, or database is required to run it.

## Features

- **Sidebar navigation** with anchor links to each dashboard section.
- **KPI overview cards** — diversion rate, waste sorted, points distributed, and active smart bins, including sparkline, mini-bar, and progress visualizations.
- **Live campus map** — a stylized CSS illustration of campus buildings with six clickable smart-bin markers. Selecting a marker reveals a fill-level tooltip, and the Healthy / Attention / Critical legend summarizes bin status.
- **Hardware health panel** — overall device health score plus a list of active alerts (camera offline, tank nearly full, servo error).
- **Analytics section** — an SVG line chart of waste sorted over time with a period selector, and a bar chart of points distributed per day.
- **Offline sync simulator** — flushes a batch of cached student-point events and updates the points totals, with loading, success, and error handling.
- **Toast notifications** for user actions (export, device inventory, map controls, chart period, sync result).
- **Responsive layout** that adapts from a full desktop sidebar layout down to a stacked mobile view.

> The campus map, charts, and alert data are illustrative mock content. The sync action is simulated locally and performs no network requests.

## Technologies Used

| Area | Choice |
| --- | --- |
| UI library | React 19 |
| Build tool / dev server | Vite 8 |
| Language | JavaScript (JSX, ES modules) |
| Styling | Plain CSS (the original project stylesheet, reused) |
| Tooling | npm, `@vitejs/plugin-react` |

No UI framework, state-management library, or CSS preprocessor is used — the app relies on React state/hooks and the existing stylesheet.

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (required by Vite 8)
- **npm** 10 or newer

## Installation and Local Development

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/<your-repo>.git

# 2. Move into the frontend app
cd <your-repo>/FrontEnd

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
    ├── vite.config.js
    └── src/
        ├── main.jsx              # React entry point
        ├── App.jsx               # Top-level layout and shared state
        ├── styles.css            # Existing dashboard visual system
        ├── components/           # One component per dashboard region
        │   ├── Sidebar.jsx
        │   ├── Topbar.jsx
        │   ├── MetricGrid.jsx
        │   ├── CampusMap.jsx
        │   ├── HealthPanel.jsx
        │   ├── WasteChart.jsx
        │   ├── PointsChart.jsx
        │   ├── SyncBanner.jsx
        │   ├── PageFooter.jsx
        │   └── Toast.jsx
        ├── data/
        │   └── mockData.js       # All mock content used by the UI
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

- This frontend was migrated from an original plain HTML/CSS/JavaScript prototype. The visual design, responsive behavior, and the existing stylesheet were preserved.
- The application is independent of any backend and does not require a server to run.
