# RoadSoS

Offline-first accident response assistant for the Road Safety Hackathon 2026 by CoERS, RBG Labs, IIT Madras.

RoadSoS helps a bystander move from location to trusted emergency contacts in under 10 seconds, even with no network. Every contact is source-backed. The assistant refuses to invent emergency information.

## Chosen problem statement

RoadSoS: a location-based emergency support tool for accidents.

## Quick start

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m scripts.build_db
uvicorn app.main:app --port 8000
```

```bash
# Frontend
cd frontend
npm install
npm run dev
```

API docs available at `http://localhost:8000/docs` after starting the backend.

## Repository map

| Path | Contents |
|------|----------|
| `plan.md` | Team execution plan, merge points, task ownership |
| `info.md` | Hackathon problem statement summary |
| `contracts/` | Shared schemas and API examples |
| `data/` | Source-backed emergency contacts and fallbacks |
| `data/regions/` | Additional region seed files (Bengaluru) |
| `backend/` | FastAPI service |
| `frontend/` | React/Vite PWA |
| `docs/` | Submission, review, and assumptions documents |
| `demo/` | Golden scenario and live judging script |

## Contact counts (Merge 4 freeze)

| Region | Production contacts | Fallbacks |
|--------|-------------------|-----------|
| Chennai / Tamil Nadu | 21 | 4 |
| Bengaluru / Karnataka | 11 | 5 |
| **Total** | **32** | **9** |

Service types covered: `hospital`, `trauma_center`, `ambulance`, `police`, `fire_station`, `tow`, `repair`, `fallback_emergency`.

## Branches

- `data-geo-backend` — Suyash: data, geo ranking, backend APIs
- `codex/sidhesh-frontend-offline-ai` — Sidhesh: PWA, offline, UI
- `codex/roopal-product-submission` — Roopal: docs, deck, review

## Safety rules

- Do not generate emergency phone numbers, addresses, or service names with AI.
- Production contacts must be source-backed and include verification metadata.
- Assistant responses cite curated data or approved templates only.
- If the app cannot verify something, it says so and shows official fallback guidance.

## Demo script

See `demo/golden_scenario.md` for the full judging walkthrough.
