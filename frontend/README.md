# Frontend

React/Vite emergency-first PWA flow for RoadSoS.

## Commands

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:8001`.
Set `VITE_API_BASE_URL` only when the frontend is served without that proxy.

## Demo flow

- The first viewport is the rescue drill, not a marketing page.
- Default manual location is IIT Madras main gate: `12.9915, 80.2337`.
- `Start rescue drill` calls `POST /api/nearby-services`.
- Service filters let the demo narrow results to hospital, trauma, ambulance, police, tow, or repair.
- `Refresh cache` stores `GET /api/cache-package` in local storage for offline fallback.
- Cache version and cache age are visible before the drill starts.
- The app registers `public/sw.js` so the shell can reload after it has been opened once.
- Ranked contacts show distance, source, verification date, confidence, and ranking reasons.
- Official fallback contacts are always shown separately.
- Incident packet generation works with the backend when online and locally when offline, with copy/share actions.
- The guarded assistant panel refuses to invent live availability or emergency contacts and shows a small flight recorder.
- The location ribbon shows whether the demo uses manual, GPS, or cached location context.
- Chaos rehearsal controls can simulate backend outage and no-result states without changing backend data.

## Manual checks before PR

- Online API available: ranked source-backed contacts render and warning text is visible.
- Backend unavailable: UI falls back to cached package or ERSS 112 without crashing.
- Browser offline after `Refresh cache`: cached contacts or fallback messaging are visible.
- GPS denied: manual location remains usable.
- Filter chips: disabling one service type removes it from the next backend query.
- Incident packet: generate, copy, and share fallback all remain usable.
- Chaos controls: backend-down mode falls back to cache/ERSS; no-result mode keeps fallbacks visible.
- Service worker: after one successful load, reload in offline mode still shows the app shell.
- Mobile viewport: call buttons, trust ledger, and incident packet controls remain tappable.

## Ownership

Sidhesh owns the mobile-first emergency flow, offline cache, trust UI, and assistant experience. Contract changes must be coordinated through `contracts/`.

