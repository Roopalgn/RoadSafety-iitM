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
| `docs/data_sources.md` with source-backed contact references | Suyash | Done (M2), Bengaluru added M3 |
| `docs/assumptions.md` with known limits | Roopal | Done (M2) |
| `demo/golden_scenario.md` with the live demo script | Roopal | Done (M3, 12 beats) |
| Backend: geo ranking, validation, dedupe, confidence | Suyash | Done (M1) |
| Backend: retrieval-based assistant, cross-region, multi-factor ranking | Suyash | Merge 3 |
| Frontend: emergency flow, offline cache, trust ledger, incident packet, bystander mode, assistant panel | Sidhesh | Done (M1) |
| Frontend: service worker, region selector, dark mode, multi-language packet | Sidhesh | Merge 3 |
| Production Chennai contacts (20+) in `data/contacts.seed.json` | Suyash | Merge 3 |
| Production Bengaluru contacts (5-8) in `data/regions/bengaluru/` | Suyash | Merge 3 |
| SQLite seed generation | Suyash | Done (M2) |
| 7-slide deck (Markdown outline) | Roopal | Done (M3 outline) |
| 7-slide deck (PDF final) | Roopal | Merge 4 |
| Word submission document | Roopal | Merge 4 |
| Final screenshots for the deck | Sidhesh | Merge 4 |
| Source URL verification script | Suyash | Merge 4 |
| Final test/manual verification notes | Suyash + Sidhesh | Merge 4 |

## 7-slide deck outline

The deck must include a Welcome slide and a Thank You slide as required by the hackathon rules.

| Slide | Title | Content |
|---|---|---|
| 1 | Welcome | Team name, hackathon name, problem statement: RoadSoS. One-line pitch: "The right emergency help in under 10 seconds, even offline." |
| 2 | The Golden-Hour Problem | What happens in a road accident today: wrong hospital, no phone number, delayed response. Contrast with RoadSoS: 10-second ranked results, all source-backed. |
| 3 | RoadSoS in Action | Screenshot: ranked contacts at IIT Madras with timer < 10s. Annotated trust ledger badges: source, confidence, distance. |
| 4 | Architecture | Offline-first PWA (service worker + localStorage) → FastAPI backend → Curated SQLite (no LLM for contacts). Deterministic ranking: distance + confidence + freshness + priority. Retrieval-only assistant. |
| 5 | Reliability and Trust | Screenshot: trust ledger expanded. No-hallucination badge. Data freshness indicator. Cross-region switch (Chennai → Bengaluru). Source URL verification. |
| 6 | Innovation Showcase | 10-second drill with live timer. Installable PWA. Multi-language packet (Tamil). Bystander mode. Dark/night mode. Chaos-mode resilience: GPS denied, offline, unknown region. |
| 7 | Thank You | Team: Roopal (PM/docs), Suyash (data/backend), Sidhesh (frontend/PWA). Repo link. "Every contact is source-backed, every refusal is honest." |

## Assumptions to document before submission

- RoadSoS does not dispatch emergency services directly.
- RoadSoS does not guarantee real-time availability of any contact.
- RoadSoS does not provide medical diagnosis or legal advice.
- Contact quality depends on source freshness and manual curation cadence.
- Offline cache is scoped to the demo regions (Chennai + Bengaluru).
- The assistant uses deterministic keyword/intent matching against the verified contact database and approved safety templates only; it does not call external LLM APIs for emergency contacts.
- Multi-language support uses template-based keyword substitution (~20 emergency terms), not full NLP translation.
- Cross-region auto-detection uses bounding boxes; coordinates outside known regions receive national fallbacks only.
- Bengaluru is a portability proof (5-8 contacts); Chennai is the primary deep dataset (20+ contacts).
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
- Service worker (custom or Workbox — Sidhesh M3) for app shell caching
- Browser `localStorage` for data cache package
- Vite dev server proxy: `/api` → `http://localhost:8000`

### Cross-region architecture
- Region-scoped seed files: `data/contacts.seed.json` (Chennai), `data/regions/bengaluru/contacts.seed.json`
- Backend `region` query parameter with bounding-box auto-detection
- Each region has its own SQLite build and cache package

### Assistant layer
- Deterministic keyword/intent matching (no external LLM API)
- Searches verified contact database and approved safety templates
- Returns `matched_contacts` with source citations for supported queries
- Returns `refusal_reason` for unsupported queries (real-time, medical, legal, out-of-scope)

### Multi-language
- Template-based keyword substitution for incident packets
- Supported: English (full), Tamil (emergency terms), Hindi (emergency terms)
- ~20 key phrases: injury, hazard, location, ambulance, police, fire, help, accident, hospital, etc.

### No LLM API dependency
- Assistant is retrieval-based against curated local data; no external AI API call is made for emergency contact data

