# RoadSoS

**Offline-first accident response assistant — Road Safety Hackathon 2026, IIT Madras.**

A bystander at an accident scene can get the right verified emergency contact in under 10 seconds, even with no network. Every contact is source-backed. The assistant refuses to invent emergency information.

---

## Quick start (under 2 minutes)

### Prerequisites
- Python 3.11+ and Node.js 18+

### Backend
```powershell
cd backend
pip install -r requirements.txt
python -m scripts.build_db
uvicorn app.main:app --port 8001 --reload
```

### Frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5174** in Chrome. Backend API docs at **http://localhost:8001/docs**.

### Verify data and tests
```powershell
cd backend
python -m scripts.validate_data
python -m pytest tests -v
```

---

## Chosen problem statement

**RoadSoS** — a location-based emergency support tool for road accidents.

---

## Repository map

| Path | Contents |
|------|----------|
| `plan.md` | Team execution plan, merge points, acceptance gates |
| `info.md` | Hackathon problem statement summary |
| `contracts/` | Shared JSON schemas and API examples |
| `data/` | Source-backed emergency contact seed files |
| `data/regions/bengaluru/` | Bengaluru region seed files |
| `backend/` | FastAPI service — ranking, geo, assistant, chaos tests |
| `frontend/` | React/Vite PWA with service worker and dark mode |
| `docs/` | Submission document, deck outline, assumptions, data sources |
| `docs/screenshots/` | 9 mobile screenshots (375px) for the submission deck |
| `demo/` | Golden scenario — 12-beat judging walkthrough |

---

## Contact counts (Merge 4 freeze — `merge4-final-0`)

| Region | Production contacts | Fallbacks |
|--------|-------------------|-----------|
| Chennai / Tamil Nadu | 21 | 4 |
| Bengaluru / Karnataka | 11 | 5 |
| **Total** | **32** | **9** |

Service types: `hospital`, `trauma_center`, `ambulance`, `police`, `fire_station`, `tow`, `repair`, `fallback_emergency`.

All contacts verified against official government and hospital websites as of **2026-05-20**.

---

## Key features

| Feature | Detail |
|---|---|
| 10-second rescue drill | Live timer card; ranked contacts appear in under 10 s |
| Trust ledger | Source URL, verification date, confidence score on every card |
| Offline-first PWA | Service worker caches app shell; localStorage caches data pack |
| Installable | PWA manifest + icon; Chrome install prompt works on desktop and Android |
| Guarded assistant | Retrieves verified contacts; refuses real-time / medical / legal queries |
| Multi-language packet | Incident packet in English, Tamil, and Hindi (template-based) |
| Cross-region | Bengaluru bounding box auto-detected; separate verified contacts loaded |
| Night mode | Auto `prefers-color-scheme: dark` + manual Night demo toggle |
| Chaos rehearsal | Simulate backend down, no local results, GPS denied |

---

## Safety rules

- Do not generate emergency phone numbers, addresses, or service names with AI.
- Production contacts must be source-backed with `source_url`, `source_name`, and `verified_at`.
- The assistant searches curated contacts and approved templates only — no external LLM API.
- If the app cannot verify something, it says so and shows official fallback guidance (ERSS 112).

---

## Submission documents

| Document | Path |
|---|---|
| 7-slide deck outline | [docs/deck_outline.md](docs/deck_outline.md) |
| Word submission document | [docs/submission_word_document.md](docs/submission_word_document.md) |
| Assumptions | [docs/assumptions.md](docs/assumptions.md) |
| Data sources | [docs/data_sources.md](docs/data_sources.md) |
| Offline verification steps | [docs/offline_verification.md](docs/offline_verification.md) |
| Demo script (12 beats) | [demo/golden_scenario.md](demo/golden_scenario.md) |

---

## Test results (Merge 4 final)

```
python -m scripts.validate_data   →  PASS  (32 contacts, no fixture leakage)
python -m pytest tests -v         →  122 passed
npm run build                     →  ✓ built in 711ms, 0 errors
```
