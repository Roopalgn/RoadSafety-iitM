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
| `plan.md` with execution and merge plan | Roopal | Done (M1) |
| `docs/data_sources.md` with source-backed contact references | Suyash | Merge 2 |
| `docs/assumptions.md` with known limits | Roopal | Done (M2) |
| `demo/golden_scenario.md` with the live demo script | Roopal | Done (M2, aligned to actual app) |
| Backend: geo ranking, validation, dedupe, confidence | Suyash | Done (M1) |
| Frontend: emergency flow, offline cache, trust ledger, incident packet, bystander mode, assistant panel | Sidhesh | Done (M1) |
| Production Chennai contacts in `data/contacts.seed.json` | Suyash | Merge 2 |
| SQLite seed generation | Suyash | Merge 2 |
| Final screenshots for the deck | Sidhesh | Merge 4 |
| Final test/manual verification notes | Suyash + Sidhesh | Merge 4 |

## 7-slide deck outline

The deck must include a Welcome slide and a Thank You slide as required by the hackathon rules.

| Slide | Title | Content |
|---|---|---|
| 1 | Welcome | Team name, hackathon name, problem statement: RoadSoS |
| 2 | Problem and Solution | What happens in a road accident vs. what RoadSoS does in 10 seconds |
| 3 | Architecture | Frontend (React PWA) → Backend (FastAPI) → Curated data + Offline cache; one diagram |
| 4 | Trust and Safety Design | No-hallucination rule, trust ledger, confidence score, source badge, refusal logic |
| 5 | Offline and Resilience | Service worker, cache package, stale indicator, chaos-mode coverage |
| 6 | Demo Evidence | Screenshot or short clip of: ranked contacts, incident packet, offline mode, assistant refusal |
| 7 | Thank You | Team credits, data source acknowledgements, repository link |

## Assumptions to document before submission

- RoadSoS does not dispatch emergency services directly.
- RoadSoS does not guarantee real-time availability of any contact.
- RoadSoS does not provide medical diagnosis or legal advice.
- Contact quality depends on source freshness and manual curation cadence.
- Offline cache is scoped to the demo regions (Chennai / IIT Madras + portability sample).
- The assistant uses retrieval from curated data and approved templates only; it does not call external LLM APIs for emergency contacts.

## Software packages (confirmed after Merge 1)

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
- Browser `localStorage` for cache package (no service worker in current implementation)
- Vite dev server proxy: `/api` → `http://localhost:8001`

### No LLM API dependency
- Assistant is a guarded stub; no external AI API call is made for emergency contact data

