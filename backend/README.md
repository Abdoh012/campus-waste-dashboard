# Think Outside The Box — API Backend

Express + MongoDB (Mongoose) service behind the **Think Outside The Box**
campus smart-bin monitoring system. It authenticates dashboard operators,
serves bin state to the frontend, and ingests live readings pushed by the
ESP32 devices in the physical bins.

The frontend (a separate app) is the only dashboard client: it never talks to
an ESP32 — everything it shows comes through this API.

## Endpoints

All responses are JSON. Errors always use the shape `{ "message": string }`.

### `POST /api/auth/login`

Dashboard sign-in. No auth required.

| | |
| --- | --- |
| Body | `{ "email": string, "password": string }` |
| 200 | `{ "token": string, "user": { "_id": string, "email": string } }` |
| 400 | `{ "message": "Email and password are required" }` |
| 401 | `{ "message": "Invalid email or password" }` |

The `token` is a JWT (HS256, `JWT_EXPIRES_IN`, default 7 days). The frontend
stores it and sends `Authorization: Bearer <token>` on every other request.

### `GET /api/bins` — auth

Bin list for the dashboard (stable order by `deviceId`).

```json
[
  {
    "_id": "671f2a1b9c4e8d0012a4f3b1",
    "deviceId": "ESP32-BIN-03",
    "name": "Student Union Bin",
    "stationId": "STN-NORTH",
    "wasteType": "liquids",
    "location": { "building": "Student Union", "lat": 30.8574, "lng": 29.57264 },
    "fillLevel": 87,
    "status": "critical",
    "fillStatus": "critical",
    "connectivity": "online",
    "lastKnown": false,
    "isStale": false,
    "lastSyncAt": "2026-10-15T10:44:27.000Z"
  }
]
```

`status` is the legacy field with the read-time offline override (kept for
existing consumers). `fillStatus`, `connectivity`, `lastKnown` and `isStale`
are the additive, truthful axes: an offline container keeps its `fillStatus`
and reports `lastKnown: true` instead of being flattened to `offline`.
`wasteType` is the optional material classification (`"paper"`, `"plastic"` or
`"liquids"`); it is `null` for legacy or not-yet-classified containers and is
never inferred from a device name or id.

The example coordinates are approximate **demo** positions on the BATU campus,
not surveyed physical bin installations. The four additional approved stations
in `scripts/campus-stations.js` are also approximate anchors inside the
OSM-mapped campus envelope; they are not surveyed building coordinates.

### `GET /api/stations` — auth

One entry per physical station: its single authoritative location and its
containers. Incomplete stations carry an explicit `integrity` report rather
than being hidden.

```json
[
  {
    "_id": "671f2a1b9c4e8d0012a4f3b9",
    "stationId": "STN-NORTH",
    "name": "North Gate Station",
    "location": { "building": "North Gate", "lat": 30.8574, "lng": 29.57024 },
    "severity": "critical",
    "connectivity": "partial",
    "lastSyncAt": "2026-10-15T10:44:27.000Z",
    "containers": [
      {
        "_id": "671f2a1b9c4e8d0012a4f3b1",
        "deviceId": "ESP32-BIN-01",
        "name": "North Gate · Paper",
        "stationId": "STN-NORTH",
        "wasteType": "paper",
        "fillLevel": 87,
        "fillStatus": "critical",
        "connectivity": "offline",
        "lastSyncAt": "2026-10-15T10:14:27.000Z",
        "lastKnown": true,
        "isStale": true
      }
    ],
    "integrity": { "expected": 3, "actual": 3, "valid": true, "issues": [] }
  }
]
```

### `GET /api/stations/:stationId` — auth

One station by its stable `stationId`; `404 { "message": "Station not found" }`
otherwise.

### `GET /api/bins/:id` — auth

One bin by Mongo `_id`: the list shape **plus** `createdAt` / `updatedAt`.
Unknown or malformed ids → `404 { "message": "Bin not found" }`.

### `PUT /api/bins/:deviceId/status` — device ingest

How an ESP32 pushes a reading. Addressed by `deviceId` (the id printed on
the device), **not** Mongo `_id`.

| | |
| --- | --- |
| Body | `{ "fillLevel": number(0–100), "capturedAt"?: ISO string or epoch-ms }` |
| 200 | `{ "deviceId", "fillLevel", "status", "lastSyncAt" }` |
| 400 | `{ "message": … }` invalid `fillLevel` / `capturedAt` |
| 404 | `{ "message": "Device not found" }` |
| 401 | `{ "message": "Invalid device key" }` — only when `DEVICE_INGEST_KEY` is set |

Notes:

- `status` is **computed server-side** from `fillLevel` (it is not part of
  the body) and echoed back in the response.
- `lastSyncAt` is taken from `capturedAt` (device clock); omitted → server
  time.
- Bins are pre-registered documents (seed script / database) — the ingest
  route only updates existing devices.

### `GET /api/health` — no auth

Liveness: `{ "status": "ok", "uptime": seconds }`.

## Status rules

**Fill-derived** — set on every ingest:

| fillLevel | status |
| --- | --- |
| 0–49 | `healthy` |
| 50–74 | `attention` |
| 75–100 | `critical` |

**Offline override** — applied on **reads** (`GET /api/bins`, `GET
/api/bins/:id`): if a bin has never synced or `lastSyncAt` is older than
`OFFLINE_THRESHOLD_MINUTES` (default 5), it reports `offline` regardless of
the stored fill-derived status. Nothing is written back, so a device that
starts reporting again resumes its real status immediately.

Thresholds live in `src/lib/status.js`; the read-time override is applied in
`src/lib/dto.js`.

## Stations, containers and connectivity

The hardware contract verified from this repository is: **one reading per
`deviceId` per request** (`PUT /api/bins/:deviceId/status`). There is no
firmware or device documentation in the repository, so the physical
arrangement of ESP32s is *not* established here. The model therefore keeps the
existing device identity and adds a stable `stationId` grouping rather than
inventing hardware identifiers.

Architecture: a **`Station` document owns one authoritative location**; each
`Bin` document is one independently monitored container that points at its
station through `stationId`. A valid station has exactly three containers, but
that invariant is enforced in the application/service layer (reported through
`integrity`), **not** as a database constraint, so migration and partial data
remain possible.

Two independent axes are computed on read in `src/lib/stations.js`:

| Axis | Values |
| --- | --- |
| Fill severity | `healthy` (<50), `attention` (50–74), `critical` (≥75), `unknown` |
| Connectivity | `online`, `offline`, `never-connected` |

- A stale container can be both `offline` **and** `critical`; its last known
  severity is never erased.
- A never-connected container has `fillLevel: null` and `fillStatus: unknown`
  — it is never fabricated as 0% full.
- Station severity is the highest known container severity (unknown values do
  not contribute).
- Station connectivity is `online` when all containers are online, `partial`
  when some are, and `offline` when none are.
- `GET /api/stats` adds `stations` and `containers` summaries while keeping the
  legacy `bins` and `points` blocks for compatibility. Station severity and
  connectivity counts only include valid stations; incomplete stations are
  counted separately.

### Material classification

Each station is expected to hold three separately monitored containers: one
`paper`, one `plastic` and one `liquids`. `wasteType` is an **optional field on
the container document** (`models/Bin.js`), deliberately separate from the
sensor reading. It is validated against the supported set
(`src/lib/waste-types.js`) and exposed on both the container DTO and the legacy
bin DTO. The ingest contract is unchanged: one request still updates one
device's single `fillLevel`, and no material is inferred from a device name or
id.

`stationIntegrity` treats classification as follows:

- A fully unclassified **legacy** station (all `wasteType: null`) stays
  structurally valid, so old records do not disappear from station KPIs.
- Once any container is classified, the station is expected to have exactly one
  of each material. Missing materials are reported as `missing-waste-type` and
  duplicates as `duplicate-waste-type`, making the station `valid: false`.
- An explicitly unsupported value is reported as `invalid-waste-type` and is
  normalised to `null` in DTOs rather than being silently classified.

Historical `ScanEvent` and `Student.awards` records keep their `deviceId`;
`stationId` is an optional additive field on both, so no backfill is required.

### Development-only station association

The real device-to-station and device-to-material mapping is unknown, so the six
seeded demo bins are **not** assigned automatically. Two illustrative demo
stations (`STN-NORTH`, `STN-LIBRARY`) and an explicit six-device fixture — one
`paper`, one `plastic` and one `liquids` per station — live in
`scripts/demo-stations.js` for local development and tests only.

```bash
node scripts/assign-demo-stations.js          # dry run — prints the plan, writes nothing
node scripts/assign-demo-stations.js --apply  # creates missing stations + fills missing stationId/wasteType
```

The script is idempotent, never creates bins, and never touches fill levels,
statuses, history or student data. Before writing it refuses to run unless
`MONGODB_URI` names a single **local** (`127.0.0.1` / `localhost` / `::1`)
development database and `NODE_ENV` is not production-like (a missing
`NODE_ENV` is not treated as proof of safety). It also aborts, changing
nothing, if a target station already exists with a different name/location, a
target bin is already assigned to a different station, or a bin already carries
a different non-null `wasteType` — it will not overwrite real metadata, move a
container between stations, or reclassify a container. Re-running a seed script
against a database that already has the demo records is a no-op.

### Approved additional campus stations

The four approved station anchors are kept separate from the synthetic history
fixture in `scripts/campus-stations.js`:

| Station id | Area | Approximate anchor |
| --- | --- | --- |
| `STN-SOUTH` | South-west entrance / administration / parking | `30.856775, 29.571783` |
| `STN-TEACHING` | Educational building | `30.858328, 29.571184` |
| `STN-UNION` | Cafeteria / student activity | `30.858062, 29.571884` |
| `STN-WORKSHOPS` | Workshops / laboratories | `30.857362, 29.572167` |

Each station has three containers (`ESP32-BIN-07` … `ESP32-BIN-18`), one each of
`paper`, `plastic` and `liquids`. The coordinates are **approximate anchors**
inside the OSM-mapped campus envelope, not surveyed building entrances. They
still need field verification of the official boundary, gates, building
entrances, bin pads, power/network access and collection-truck access.

The containers carry **synthetic demo live state** stamped by the demo seeder
from `CAMPUS_MOCK_STATE` in `scripts/campus-stations.js`: a fixed fill level per
device, a `lastSyncAt` minutes before the run's clock, and the fill-derived
status. It is demo data for the dashboard — never presented as a measurement
from physical ESP32 hardware — and these twelve devices deliberately have no
`ScanEvent` rows, so the 30-day fill chart and the points totals stay the
six-bin demo slice. Re-running `npm run seed` or
`seed-campus-demo.js --confirm-seed-campus` re-stamps the twelve containers
(refreshing the online window) alongside the original six demo bins. The map
already renders one marker per station, so no map component, style or
coordinate data was changed. The ids sort after `STN-NORTH`, which keeps the
existing marker numbering stable (03–06 are appended).

For the remote `CAMPUS` database, use the guarded, additive one-off:

```bash
node scripts/add-campus-stations.js --confirm-add-campus-stations
```

It refuses unless both `MONGODB_URI` and the connected database are exactly
`CAMPUS`, all five expected collections exist, the two existing demo stations
are present, and the fixture is structurally valid. It creates only missing
stations/containers, never overwrites an existing station or container
assignment, and stamps only the twelve approved containers' demo live state. It
verifies 6 stations / 18 containers afterwards and aborts if the admin
`_id`/password hash, the student count or the scan-event count changed.
Re-running is a no-op for existing records while the approved 6/18 layout is
unchanged.

`npm run seed` also creates these four stations and twelve containers locally,
so local development shows the same fleet as `CAMPUS`.

## Installation

Prerequisites: Node.js ≥ 20.19, npm ≥ 10, a running MongoDB (v7 tested).

```bash
cd backend
npm install
cp .env.example .env       # then edit — at minimum set JWT_SECRET
npm run seed               # creates missing admin, demo and approved stations/containers
npm start                  # API on http://localhost:5000/api
```

`npm run seed` is additive: it creates only records that are missing, so
existing bins keep their readings, coordinates, station associations and
material classifications. It creates the two synthetic-history demo stations
and the four approved campus stations, then stamps the twelve approved
containers with their demo fill/sync state. An existing admin password is never
re-hashed. `npm run seed -- --reset` deletes **only** the six history demo
device ids and recreates them; no other bin is touched. The script refuses to
run unless `MONGODB_URI` is a single local development host (see
`src/lib/db-target.js`).

The admin password is printed only when it was generated; when it comes from
`SEED_ADMIN_PASSWORD` it is applied only at first creation and never printed.
Log in with `admin@batu.edu.eg` and that password.

### Rich demo history

`scripts/demo-history.js` is a pure, deterministic 30-day fixture: five connected
containers × 30 daily `ScanEvent`s (150 rows), five `STU-DEMO-*` students and 29
awards, plus the exact KPI and chart aggregates it must produce. Awards map 1:1 to
scans, so every student's `points` equals the sum of their `awards`.

`scripts/demo-history-apply.js` writes that fixture against the current
connection, scoped to the six demo device ids and the demo student ids. It updates
only their live fill/sync state and replaces only their history and ledgers, so
re-running is idempotent and never touches unrelated records. Use it in local
development after `npm run seed`:

```js
import { applyDemoHistory, checkDemoHistory } from './scripts/demo-history-apply.js';
await applyDemoHistory();
await checkDemoHistory();
```

For the remote `CAMPUS` database there is a dedicated guarded one-off:

```bash
node scripts/seed-campus-demo.js --confirm-seed-campus
```

It refuses unless both `MONGODB_URI` and the connected database are exactly
`CAMPUS`, all five expected collections exist, and the six demo bins are already
present with their reviewed station/material assignment. It captures the single
admin `_id` and password hash before and after (aborting on any change) and never
drops a database or collection.

This seeder owns only the **six-device / two-station synthetic history slice**.
It does not create the four approved campus stations; those are added once with
`add-campus-stations.js` (above). It does re-stamp their demo fill/sync state
on every run, so a single command refreshes the whole six-station fleet's
online window right before a demo. `checkDemoHistory` scopes its
station/container summary to the demo fixture ids, so additional real fleet
stations cannot make the history check fail.

Connectivity in the demo is wall-clock relative: a container reads `online` only
for `OFFLINE_THRESHOLD_MINUTES` (default 5) after its `lastSyncAt`. Re-run the
seed shortly before a demo to refresh the timestamps.

The dashboard's **Export report** button downloads a CSV built client-side from
`/api/stats`, `/api/stations`, `/api/stats/fill-history?period=last30` and
`/api/stats/points-daily?period=last7`; it needs no extra endpoint or permission.

Development with auto-restart:

```bash
npm run dev                # node --watch
```

## Environment variables

All optional in development (working defaults); see `.env.example`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | Listen port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/campus_waste` | Database |
| `JWT_SECRET` | dev fallback (warns) | **Required in production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CORS_ORIGIN` | `*` | `*` or comma-separated allowlist |
| `OFFLINE_THRESHOLD_MINUTES` | `5` | Silence before a bin reads `offline` |
| `DEVICE_INGEST_KEY` | *(empty)* | Optional `X-Device-Key` for ingest |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | `admin@batu.edu.eg` / *(generated)* | Seed script |

## Tests

Integration tests cover the full contract (login, auth guard, bin shapes,
offline override, ingest validation, CORS preflight, station grouping, station
and container KPIs, and history still working after station association).
They need a MongoDB — they run against `TEST_MONGODB_URI`
(default `mongodb://127.0.0.1:27017/campus_waste_test`, dropped afterwards)
and **skip with an explanation** if none is reachable. The station/container
domain and KPI arithmetic are also covered by database-free unit tests with a
controlled clock (`test/stations.test.js`).

```bash
npm test
```

## Frontend integration notes

- The dashboard should send `Authorization: Bearer <token>` to
  `/api/bins*` and treat any `401` as “session expired → back to /login”.
- Cross-origin setup: `CORS_ORIGIN` already allows the Authorization,
  Content-Type and X-Device-Key headers. Direct calls
  (`VITE_API_BASE_URL=http://localhost:5000/api`) work out of the box; a
  Vite dev proxy to `http://localhost:5000` works too.
- Poll `GET /api/bins` every 30–60 s for near-real-time fill levels; the
  data is only as fresh as each device's pushes (see offline rule above).

## Security notes

- Passwords stored as bcrypt hashes; login runs a dummy compare for unknown
  emails so response timing doesn't reveal which addresses exist.
- JWT is HS256 with an env secret; production refuses to start without one.
- MongoDB startup logs print only the database name; URI/password substrings
  are redacted from driver errors and connection-failure messages.
- `PUT /api/bins/:deviceId/status` is **unauthenticated by default** because
  the device contract has no auth header — intended for a trusted campus
  LAN. Set `DEVICE_INGEST_KEY` to require `X-Device-Key` on that route if
  the network isn't trusted. Further hardening (per-device credentials,
  rate limiting, helmet) is a natural next step.

## Project structure

```
backend/
├── server.js              # entry: connect Mongo, listen, graceful shutdown
├── src/
│   ├── app.js             # Express app (CORS, JSON, /api, error handling)
│   ├── env.js             # env config + validation
│   ├── lib/
│   │   ├── dto.js         # exact response shapes (+ offline override)
│   │   ├── errors.js      # ApiError → { message } middleware contract
│   │   ├── points.js      # atomic Student.awards ledger
│   │   ├── stats.js       # bin/point/station/container summaries
│   │   ├── stations.js    # station/container domain rules + DTOs
│   │   ├── status.js      # fill→status rules, staleness, ISO helpers
│   │   └── waste-types.js # supported container materials + validation
│   ├── middleware/
│   │   ├── auth.js        # JWT bearer guard + optional device key
│   │   └── error.js       # 404 + central { message } error renderer
│   ├── models/
│   │   ├── Bin.js         # container: deviceId, stationId, wasteType, fillLevel, status
│   │   ├── ScanEvent.js   # per-device scan history
│   │   ├── Station.js     # station: stationId, name, authoritative location
│   │   ├── Student.js     # points balance + embedded awards ledger
│   │   └── User.js        # operator credentials
│   └── routes/
│       ├── auth.js        # POST /login
│       ├── bins.js        # GET /, GET /:id, PUT /:deviceId/status
│       ├── stations.js    # GET /, GET /:stationId
│       └── index.js       # /api mount + health
├── scripts/
│   ├── add-campus-stations.js    # guarded CAMPUS-only add of the four approved stations
│   ├── assign-demo-stations.js  # safe dev association (dry-run default; conflict-aborting)
│   ├── campus-stations.js       # approved four-station fixture + pure planning/validation
│   ├── campus-stations-apply.js # additive, never-connected apply/verify for that fixture
│   ├── demo-history.js          # pure 30-day demo fixture + expected aggregates
│   ├── demo-history-apply.js    # scoped, idempotent apply/verify for that fixture
│   ├── demo-stations.js         # dev-only station fixture + mapping
│   ├── reset-campus-demo.js     # guarded destructive reset/recreate of the CAMPUS demo
│   ├── seed-campus-demo.js      # guarded CAMPUS-only one-off for the rich demo
│   ├── station-association.js   # pure conflict/plan logic for the association script
│   ├── seed-plan.js             # pure "create only missing demo bins" planning
│   └── seed.js                  # dev admin + demo/approved stations + bins (additive)
├── test/
│   ├── api.test.js        # contract integration tests (node:test)
│   ├── campus-stations.test.js       # pure fixture + planner conflict tests
│   ├── campus-stations-apply.test.js # DB integration: add, verify, idempotency
│   ├── db-target.test.js  # safe-target guards for scripts/tests
│   ├── demo-history.test.js       # pure fixture + aggregate arithmetic
│   ├── demo-history-apply.test.js # DB integration: apply, verify, idempotency
│   ├── seed-plan.test.js  # seed preserves existing bins
│   ├── station-association.test.js  # association conflict rules
│   └── stations.test.js   # pure domain + KPI fixture tests
```
