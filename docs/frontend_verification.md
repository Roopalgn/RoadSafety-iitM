# Frontend Verification Notes

## Merge 3 / Merge 4 Sidhesh checklist

- Service worker: `frontend/public/sw.js` caches app shell, manifest, and `offline.html`.
- Install prompt: status row includes **Install PWA** and a manifest icon is present.
- Region selector: location card includes Auto detect, Chennai, and Bengaluru modes; the selected region is sent in API requests for backend compatibility.
- Assistant UI: quick asks are present, source/refusal flight recorder is visible, and matched contacts render when backend or frontend retrieval has verified contacts.
- Multi-language packet: incident packet supports English, Tamil, and Hindi keyword-template output.
- Dark/night mode: app respects `prefers-color-scheme: dark` and includes a manual **Night demo** toggle for judging.
- Chaos controls: backend-down, no-local-results, and GPS-denied scenarios are available.
- Loading skeleton: contact cards show shimmer placeholders during API calls.
- Haptics: call links request `navigator.vibrate(35)` on supported mobile browsers.

## Commands run

```powershell
cd frontend
npm run build
```

```powershell
cd backend
python -m scripts.validate_data
python -m pytest tests --basetemp .pytest-basetemp -p no:cacheprovider
```

Results on 2026-05-25:

- Frontend production build: passed.
- Data validation: passed with the existing duplicate fallback warnings for `108` and `1033`.
- Backend tests: `122 passed`.

## Lighthouse target

- Target: 90+ Performance, Accessibility, Best Practices, and PWA.
- If Lighthouse is unavailable locally, capture Chrome DevTools Lighthouse results manually and paste the scores into the final PR comment.

## Screenshot set

Screenshots should be stored in `docs/screenshots/`:

- `01-rescue-drill.png`
- `02-trust-ledger.png`
- `03-offline-mode.png`
- `04-region-selector.png`
- `05-assistant-retrieval.png`
- `06-assistant-refusal.png`
- `07-incident-tamil.png`
- `08-dark-mode.png`
- `09-pwa-install.png`

The current set was refreshed at 375px mobile width and checked for the named
proof states: expanded trust ledger, offline warning, region selector, assistant
retrieval/refusal, Tamil packet output, dark mode, and PWA install surface.
