# AGENTS.md

Campus waste intelligence dashboard. **Frontend-only** React 19 + Vite 8 SPA that runs on local mock data — no backend, no network calls.

## Layout & boundaries

- The app lives in `FrontEnd/`, **not** at the repo root. Run all npm commands from there.
- `BackEnd/` exists on disk but is **git-ignored and off-limits**: do not read, modify, refactor, or commit anything under it. Never stage it (it is excluded by `.gitignore`; leave that line alone until the maintainer removes it).
- Treat this as a frontend-only repo even though `BackEnd/` is present.

## Commands (run in `FrontEnd/`)

```bash
npm install        # deps (committed package-lock.json)
npm run dev        # dev server on http://localhost:5173
npm run build      # production build -> FrontEnd/dist
npm run preview    # serve the built bundle on port 4173
```

- **npm only.** A stray untracked `FrontEnd/pnpm-lock.yaml` may exist; ignore/delete it and do not introduce pnpm/yarn lockfiles.
- **No test, lint, typecheck, or formatter scripts exist.** `npm run build` is the only verification gate — run it after any change.
- Node `^20.19.0 || >=22.12.0` (Vite 8 requirement).

## Architecture

- Entry: `index.html` → `src/main.jsx` → `src/App.jsx` (holds shared state: points total, pending sync events, toast, `handleSync`).
- `src/components/*.jsx` — one component per dashboard region, plus leaves `Eyebrow`, `TrendBadge`, `StatusDot`, `HealthAlert`.
- `src/data/mockData.js` — all rendered content (nav, KPIs, bins, alerts, chart series, cached sync events). Components never fetch directly.
- `src/data/constants.js` — static UI options and decorative geometry (no domain data).
- `src/services/syncApi.js` — simulated `syncCachedEvents(events, currentTotalPoints)`; resolves `{ ok, received, pointsAdded, newTotalPoints, syncedAt }`. Swap the body for a real `POST /api/sync` returning the same shape; no component changes needed. Keep the error-toast text `Sync failed · check the connection and try again`.

## Styling (Tailwind v4 + design tokens)

- Tailwind v4 wired through `@tailwindcss/vite` (see `vite.config.js`). No `tailwind.config.js` — config lives in CSS.
- `src/styles/theme.css` is the **single source of truth for tokens** (`@theme`): raw color scales → fonts → semantic aliases. Its header comments define the rules (raw scales are never consumed directly; components use semantic tokens like `bg-card`, `text-muted-foreground`, `border-border`).
- **Add or change color via a token in `theme.css`, never a hardcoded hex or a new palette.** The brand/structural anchors are byte-for-byte from the original design; preserve them.
- `src/styles/globals.css` is the entry stylesheet (`@import`s Tailwind, `theme.css`, and the map CSS; sets base body + native-UI theming).
- `src/styles/components/campus-map.css` is the one retained component stylesheet (the map's transforms/pattern can't be expressed in Tailwind).
- `src/styles/surfaces.js` exports the shared `SURFACE` card recipe — reuse it instead of repeating surface utilities.
- Fonts load via the Google Fonts `<link>` in `index.html` and are aliased in `globals.css` `:root` (no `next/font`). Don't hardcode font families in the token layer.
- `body { font-size: 14px; line-height: normal }` is intentional (Tailwind preflight's `1.5` would shift layout). Prefer font-size-only utilities over paired line-height utilities.

## Conventions & gotchas

- JSX + ES modules, plain JavaScript — **no TypeScript, no state library** (React hooks only).
- Preserve existing visual design, responsive breakpoints, and edge-case behavior (notably the `max-[700px]` / `max-[1100px]` breakpoints).
- Git: repo is published at https://github.com/Abdoh012/campus-waste-dashboard (branch `main`). **Do not force-push or rewrite remote history.**
- README must continue to state the app uses mock data and needs no running backend.

## References

- `README.md` — features, token architecture overview, setup, deployment.
- Styling rules: header comments in `FrontEnd/src/styles/theme.css`.
