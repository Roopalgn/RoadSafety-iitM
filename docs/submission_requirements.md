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
| `README.md` with setup instructions | Roopal | Scaffold done |
| `plan.md` with execution and merge plan | Roopal | Done |
| `docs/data_sources.md` with source-backed contact references | Suyash | In progress |
| `docs/assumptions.md` with known limits | Roopal | Done |
| `demo/golden_scenario.md` with the live demo script | Roopal | Done |
| Final screenshots for the deck | Sidhesh | Pending |
| Final test/manual verification notes | Suyash + Sidhesh | Pending |

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

## Software packages (to be finalised before submission)

- Frontend: React, Vite, workbox (or custom service worker)
- Backend: Python, FastAPI, uvicorn, jsonschema, sqlite3 (stdlib)
- Data tooling: Python jsonschema for seed validation
- No LLM API dependency for contact data

