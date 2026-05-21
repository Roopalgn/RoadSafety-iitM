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
- `Refresh cache` stores `GET /api/cache-package` in local storage for offline fallback.
- Ranked contacts show distance, source, verification date, confidence, and ranking reasons.
- Official fallback contacts are always shown separately.
- Incident packet generation works with the backend when online and locally when offline.
- The guarded assistant panel refuses to invent live availability or emergency contacts.

## Manual checks before PR

- Online API available: ranked fixture contacts render and warning text is visible.
- Backend unavailable: UI falls back to cached package or ERSS 112 without crashing.
- Browser offline: stale cache/fallback messaging is visible.
- GPS denied: manual location remains usable.
- Mobile viewport: call buttons, trust ledger, and incident packet controls remain tappable.

## Ownership

Sidhesh owns the mobile-first emergency flow, offline cache, trust UI, and assistant experience. Contract changes must be coordinated through `contracts/`.

