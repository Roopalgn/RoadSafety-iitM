# Submission Requirements

Based on the hackathon information in `info.md`, Stage 1 needs:

- Complete solution code.
- 7-slide presentation including Welcome and Thank You slides.
- Complete code details.
- Software packages used.
- Assumptions document.
- One submission through Unstop for the RoadSoS topic.

## RoadSoS package checklist

| Item | Owner | Status |
|---|---|---|
| `README.md` with setup instructions | Roopal | Done (M1) |
| `plan.md` with execution and merge plan | Roopal | Done (M1, rewritten M3) |
| `docs/data_sources.md` with source-backed contact references | Suyash | Done (M2) |
| `docs/assumptions.md` with known limits | Roopal | Done (M2, updated for service worker) |
| `demo/golden_scenario.md` with the live demo script | Roopal | Done (M3, aligned to current app) |
| Backend: geo ranking, validation, dedupe, confidence | Suyash | Done (M1/M2) |
| Backend: retrieval-based assistant, cross-region, multi-factor ranking | Suyash | Merge 3/4 follow-up |
| Frontend: emergency flow, offline cache, trust ledger, incident packet, bystander mode, assistant panel | Sidhesh | Done (M2) |
| Frontend: service worker, demo readiness, chaos controls, presets, richer packet | Sidhesh | Done in this PR |
| Frontend: region selector, dark mode, multi-language packet | Sidhesh | Done in this PR; backend region data still Suyash-owned |
| Production Chennai contacts in `data/contacts.seed.json` | Suyash | Done (M2) |
| Second-region production contacts | Suyash | Merge 3/4 follow-up |
| SQLite seed generation | Suyash | Done (M2) |
| 7-slide deck (Markdown outline) | Roopal | Done (M3 outline) |
| 7-slide deck (PDF final) | Roopal | Done (M4 — docs/deck_outline.md) |
| Word submission document | Roopal | Done (M4 — docs/submission_word_document.md) |
| Final screenshots for the deck | Sidhesh | Done in this PR |
| Source URL verification script | Suyash | Done (M4 — backend/scripts/verify_sources.py) |
| Final test/manual verification notes | Suyash + Sidhesh | Done (M5 — docs/merge5_verification.md) |

## 7-slide deck outline

The deck must include a Welcome slide and a Thank You slide as required by the hackathon rules.

| Slide | Title | Content |
|---|---|---|
| 1 | Welcome | Team name, hackathon name, problem statement: RoadSoS. One-line pitch: `The right emergency help in under 10 seconds, even offline.` |
| 2 | The Golden-Hour Problem | What happens in a road accident today: wrong hospital, no phone number, delayed response. Contrast with RoadSoS: 10-second ranked results, all source-backed. |
| 3 | RoadSoS in Action | Screenshot: ranked contacts at IIT Madras with timer under 10s. Annotated trust ledger badges: source, confidence, distance. |
| 4 | Architecture | Offline-first PWA (service worker + localStorage) -> FastAPI backend -> curated data. Deterministic ranking and retrieval/guardrail assistant. |
| 5 | Reliability and Trust | Screenshot: trust ledger expanded. No-hallucination badge. Data freshness indicator. Source URL verification. |
| 6 | Innovation Showcase | 10-second drill with live timer. Installable PWA. Incident packet. Bystander mode. Chaos-mode resilience: backend down, offline, no results. |
| 7 | Thank You | Team: Roopal (PM/docs), Suyash (data/backend), Sidhesh (frontend/PWA). Repo link. `Every contact is source-backed, every refusal is honest.` |

## Assumptions to document before submission

- RoadSoS does not dispatch emergency services directly.
- RoadSoS does not guarantee real-time availability of any contact.
- RoadSoS does not provide medical diagnosis or legal advice.
- Contact quality depends on source freshness and manual curation cadence.
- Offline cache is scoped to curated demo regions.
- The assistant uses verified contact data and approved safety templates only; it does not call external LLM APIs for emergency contacts.
- Cross-region UI auto-detection, multi-language packet output, and Bengaluru source-backed contacts are all implemented and verified.
- Service worker caches the app shell; data freshness depends on the last online cache refresh.

## Software packages (confirmed after Merge 2)

### Backend (`backend/requirements.txt`)
- `fastapi==0.115.6`
- `uvicorn[standard]==0.34.0`
- `pydantic==2.10.4`
- `jsonschema==4.23.0`
- `pytest==8.3.4`
- `httpx==0.28.1`

### Frontend (`frontend/package.json`)
- `react`, `react-dom` (latest)
- `vite`, `@vitejs/plugin-react` (latest)
- `lucide-react` (latest)

### Offline layer
- `frontend/public/sw.js` caches the app shell and cache-package response after first load.
- Browser `localStorage` stores the curated `/api/cache-package` rescue pack.
- Vite dev server proxy: `/api` and `/health` -> `http://localhost:8001`

### Assistant layer
- Searches verified contacts and approved safety templates.
- Returns source/refusal trace fields that the frontend displays in the flight recorder.
- Returns `refusal_reason` for unsupported queries such as real-time dispatch, medical, legal, or out-of-scope requests.

### No LLM API dependency
- Assistant is retrieval/guardrail-based against curated local data; no external AI API call is made for emergency contact data.
