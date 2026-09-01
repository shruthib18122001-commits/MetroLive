# MetroLive — LA Transit Tracker

Mobile-first web app for live LA Metro arrival predictions. Search a stop, see
when the next vehicles arrive and whether they're running early / on time / late,
and favourite the stops you use.

> **Status: work in progress.** Being built in phases. Phase 1 (the
> backend-for-frontend) is complete; the UI, client state, performance,
> accessibility, test, and ship phases follow. A full README with architecture
> notes, screenshots, Lighthouse scores, and a live URL lands in the ship phase.

## Stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS · React Router v6 ·
TanStack Query · Zustand · Vitest + Testing Library · Playwright ·
Vercel serverless functions

## Layout

| Path | What lives here |
| --- | --- |
| `src/components` | Presentational components |
| `src/routes` | Page-level route components |
| `src/lib` | Pure functions (no React) — feed decode/filter/shape |
| `src/store` | Zustand stores (favorites) |
| `src/types` | Types shared by the client and the serverless API |
| `api` | Vercel serverless functions (`/api/arrivals`) |
| `e2e` | Playwright specs |

## Data source

Arrivals come from LA Metro's **GTFS-realtime TripUpdates** feed, served through
Swiftly and decoded with `gtfs-realtime-bindings`. The feed requires an API key —
request one via the Swiftly form linked from
[developer.metro.net/api](https://developer.metro.net/api/), then:

```bash
cp .env.example .env.local
# set SWIFTLY_API_KEY=...
```

Without a key, the pure pipeline can still be exercised against the committed
protobuf fixtures: `npm run demo:arrivals`.

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # typecheck + production build
npm run test       # Vitest (unit + component)
npm run test:e2e   # Playwright (needs: npx playwright install)
npm run lint       # ESLint
```

## API

### `GET /api/arrivals?stopId=<id>`

`200` → `Arrival[]`, ascending by arrival time:

```jsonc
[
  {
    "routeId": "720",
    "routeName": "720",
    "headsign": "",
    "scheduledTime": "2026-01-15T18:01:00.000Z",
    "predictedTime": "2026-01-15T18:05:00.000Z",
    "delaySeconds": 240,
    "status": "late" // 'early' | 'ontime' | 'late' | 'unknown'
  }
]
```

Non-2xx → `{ "error": { "code": "...", "message": "..." } }`
(`MISSING_STOP_ID` 400, `METHOD_NOT_ALLOWED` 405, `NOT_CONFIGURED` 500,
`UPSTREAM_ERROR` / `DECODE_FAILED` 502, `UPSTREAM_UNAVAILABLE` 504).

Edge-cached ~20s (`Cache-Control: s-maxage=20`).
