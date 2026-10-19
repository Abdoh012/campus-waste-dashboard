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
    "location": { "building": "Student Union", "lat": 30.8574, "lng": 29.57264 },
    "fillLevel": 87,
    "status": "critical",
    "lastSyncAt": "2026-10-15T10:44:27.000Z"
  }
]
```

The example coordinates are approximate **demo** positions on the BATU campus,
not surveyed physical bin installations.

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

## Installation

Prerequisites: Node.js ≥ 20.19, npm ≥ 10, a running MongoDB (v7 tested).

```bash
cd backend
npm install
cp .env.example .env       # then edit — at minimum set JWT_SECRET
npm run seed               # creates the admin + six sample bins
npm start                  # API on http://localhost:5000/api
```

The seed prints the admin password (generated unless `SEED_ADMIN_PASSWORD`
is set) — log in with `admin@batu.edu.eg` / that password.

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
offline override, ingest validation, CORS preflight). They need a MongoDB —
they run against `TEST_MONGODB_URI`
(default `mongodb://127.0.0.1:27017/campus_waste_test`, dropped afterwards)
and **skip with an explanation** if none is reachable.

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
│   │   └── status.js      # fill→status rules, staleness, ISO helpers
│   ├── middleware/
│   │   ├── auth.js        # JWT bearer guard + optional device key
│   │   └── error.js       # 404 + central { message } error renderer
│   ├── models/
│   │   ├── Bin.js         # deviceId, location, fillLevel, status, lastSyncAt
│   │   └── User.js        # operator credentials
│   └── routes/
│       ├── auth.js        # POST /login
│       ├── bins.js        # GET /, GET /:id, PUT /:deviceId/status
│       └── index.js       # /api mount + health
├── scripts/seed.js        # dev admin + sample bins (idempotent)
└── test/api.test.js       # contract integration tests (node:test)
```
