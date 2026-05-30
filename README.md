# RoadSoS — Road Accident Emergency Response Platform

> **168,000 Indians die in road accidents every year. 50,000 are preventable — if help arrives within the golden hour. Only 20.6% of victims reach a hospital in time.**

RoadSoS is an **offline-first accident response Progressive Web App** that surfaces verified, distance-ranked emergency contacts in under 10 seconds — even with zero network. No AI-generated phone numbers. No hallucinated hospitals. Every contact is source-backed, confidence-scored, and distance-ranked.

> **Why no LLM for contacts?** Competitors use Gemini/Claude and risk hallucinating fake hospitals in life-or-death moments. We use deterministic retrieval on source-verified data. Safety-critical systems don't gamble.

**Repository:** https://github.com/Roopalgn/RoadSafety-iitM  
**Hackathon:** Road Safety Hackathon 2026 | IIT Madras | Unstop

---

## Team

| Role | Name | Responsibilities |
|---|---|---|
| Product / Docs | Roopal | Requirements, plan, demo scripting, submission artifacts |
| Data / Backend | Suyash | Data curation, FastAPI, geo ranking, assistant, cross-region |
| Frontend / PWA | Sidhesh | React PWA, service worker, offline UX, dark mode, multi-language |

---

## Quick Start (under 2 minutes)

### Prerequisites
- Python **3.11+** and Node.js **18+**

### 1. Backend
```powershell
cd backend
pip install -r requirements.txt
python -m scripts.build_db
uvicorn app.main:app --port 8000 --reload
```

### 2. Frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in Chrome. Backend API docs at **http://localhost:8000/docs**.

### 3. Verify data and run tests
```powershell
cd backend
python -m scripts.validate_data
python -m pytest tests -v
```

---

## Key Features

| Feature | Detail |
|---|---|
| **10-second rescue drill** | Live timer card; ranked contacts appear in under 10 s |
| **Trust ledger** | Source URL, verification date, confidence score on every contact card |
| **Offline-first PWA** | Service worker caches app shell; localStorage caches data pack |
| **Installable** | PWA manifest + icon; Chrome install prompt works on desktop and Android |
| **Guarded assistant** | Retrieves verified contacts; refuses real-time / medical / legal queries |
| **Multi-language packet** | Incident packet in English, Tamil, and Hindi (template-based) |
| **Cross-region support** | 9 cities: Chennai, Bengaluru, Delhi, Mumbai, Hyderabad, Pune, Kolkata, Gurgaon, Lucknow |
| **Night mode** | Auto `prefers-color-scheme: dark` + manual Night demo toggle |
| **Chaos rehearsal** | Simulate backend down, no local results, GPS denied — all safely |
| **Bystander mode** | Role cards (Caller, Traffic spotter, Note taker, Location sharer) |
| **Emergency presets** | One-tap filter: Medical emergency, Police support, Vehicle recovery |

---

## Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| API framework | FastAPI | 0.115.6 |
| ASGI server | Uvicorn (standard) | 0.34.0 |
| Data validation | Pydantic | 2.10.4 |
| Schema validation | jsonschema | 4.23.0 |
| Test framework | pytest | 8.3.4 |
| HTTP test client | httpx | 0.28.1 |
| Language | Python | 3.11+ |
| Database | SQLite (generated from JSON seeds) | — |

### Frontend
| Component | Technology | Version |
|---|---|---|
| UI framework | React | latest |
| Build tool | Vite | latest |
| Map library | Leaflet | 1.9.4 |
| Icons | lucide-react | latest |
| Language | JavaScript (ES modules) | — |
| PWA | Service Worker (vanilla JS) | — |
| Offline storage | localStorage | — |

---

## Repository Map

```
RoadSafety-iitM/
├── .github/
│   └── workflows/
│       └── ci.yml                  # CI: backend tests + frontend build on every push
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── assistant.py        # Retrieval-based assistant (intent + refusal)
│   │   │   ├── confidence.py       # Multi-factor ranking (distance, freshness, priority)
│   │   │   ├── data_loader.py      # Region-aware seed file loader
│   │   │   ├── dedupe.py           # Duplicate contact collapsing
│   │   │   ├── geo.py              # Bounding box detection, distance ranking
│   │   │   ├── paths.py            # Path resolution utilities
│   │   │   └── validation.py       # JSON Schema contract validation
│   │   ├── main.py                 # FastAPI routes + middleware
│   │   └── models.py               # Pydantic request/response models
│   ├── scripts/
│   │   ├── build_db.py             # SQLite generation from seed files
│   │   ├── validate_data.py        # Data integrity checks (no fixture leakage)
│   │   └── verify_sources.py       # HTTP 200 check on all source URLs
│   ├── tests/
│   │   ├── fixtures/               # Non-production test data (clearly isolated)
│   │   ├── test_api.py             # API endpoint tests
│   │   ├── test_assistant.py       # Assistant logic and refusal tests
│   │   ├── test_confidence.py      # Confidence scoring tests
│   │   ├── test_db.py              # Database tests
│   │   ├── test_dedupe.py          # Deduplication tests
│   │   ├── test_geo.py             # Geo/bounding box tests
│   │   └── test_validation.py      # Schema validation tests
│   ├── conftest.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── manifest.webmanifest    # PWA manifest with icon
│   │   ├── offline.html            # Offline fallback page
│   │   ├── roadsos-icon.svg        # PWA icon
│   │   └── sw.js                   # Service worker (cache shell + offline.html)
│   ├── src/
│   │   ├── main.jsx                # Full React application (single-file architecture)
│   │   └── styles.css              # Glassmorphism design + dark/night mode
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── data/
│   ├── contacts.seed.json          # 21 Chennai production contacts
│   ├── fallbacks.seed.json         # 4 national fallback contacts (112, 108, 100, 1033)
│   └── regions/
│       ├── bengaluru/              # 11 Bengaluru contacts + 5 Karnataka fallbacks
│       ├── delhi/                  # Delhi region contacts
│       ├── gurgaon/                # Gurgaon region contacts
│       ├── hyderabad/              # Hyderabad region contacts
│       ├── kolkata/                # Kolkata region contacts
│       ├── lucknow/                # Lucknow region contacts
│       ├── mumbai/                 # Mumbai region contacts
│       └── pune/                   # Pune region contacts
├── contracts/
│   ├── contact.schema.json         # JSON Schema for contact records
│   └── api.examples.json           # API request/response examples
├── demo/
│   └── golden_scenario.md          # Step-by-step judging walkthrough (12 beats)
├── docs/
│   ├── assumptions.md              # Explicit scope, data, and safety assumptions
│   ├── data_sources.md             # Source URLs + provenance for all contacts
│   ├── deck_outline.md             # 7-slide presentation outline
│   ├── offline_verification.md     # Offline demo steps for Chrome / Android / iOS
│   ├── submission_word_document.md # Full submission document
│   └── submission_requirements.md # Hackathon requirements checklist
├── .env.example                    # Environment variable template
├── .gitignore
├── render.yaml                     # Render.com deployment config
├── vercel.json                     # Vercel frontend deployment config
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns version and cache version |
| `POST` | `/api/nearby-services` | Ranked emergency contacts by lat/lon + radius |
| `GET` | `/api/cache-package` | Full offline cache bundle (contacts + fallbacks + templates) |
| `POST` | `/api/incident-summary` | Generate structured incident packet from user fields |
| `POST` | `/api/assistant` | Guarded retrieval assistant (refuses out-of-scope queries) |

Full interactive docs at **http://localhost:8000/docs** (Swagger UI).

---

## Contact Coverage

| Region | Production Contacts | Fallbacks |
|---|---|---|
| Chennai / Tamil Nadu | 21 | 4 national |
| Bengaluru / Karnataka | 11 | 5 Karnataka |
| Delhi | region seed | national |
| Mumbai | region seed | national |
| Hyderabad | region seed | national |
| Pune | region seed | national |
| Kolkata | region seed | national |
| Gurgaon | region seed | national |
| Lucknow | region seed | national |

**Service types covered:** `hospital`, `trauma_center`, `ambulance`, `police`, `fire_station`, `tow`, `repair`, `fallback_emergency`

All contacts verified against official government and hospital websites as of **2026-05-20**.

---

## Safety Guarantees

- **No LLM for contacts.** AI is used only to structure user-provided incident narrative — never to create phone numbers, hospital names, or availability claims.
- **Every contact is source-backed.** Required fields: `source_url`, `source_name`, `verified_at`, `confidence_reasons`.
- **Deterministic ranking.** Contacts are ranked by distance, confidence score, freshness, service priority, and availability — fully explainable, no black box.
- **Honest refusals.** The assistant refuses real-time queries (ETA, dispatch), medical advice, and legal advice with a clear `refusal_reason` field.
- **ERSS 112 always visible.** If no data cache exists or region is unknown, the national ERSS 112 fallback is always shown.

---

## Deployment

The app can be deployed for free:
- **Backend:** [Render.com](https://render.com) — `render.yaml` is included
- **Frontend:** [Vercel](https://vercel.com) — `vercel.json` is included

---

## Test Results

```
python -m scripts.validate_data   →  PASS  (all contacts, no fixture leakage)
python -m pytest tests -v         →  122 passed
npm run build                     →  ✓ built, 0 errors
```

---

## Known Limitations

1. Several Indian government websites (tnpolice.gov.in, 112.gov.in, ksp.gov.in) return SSL errors from non-Indian IPs due to geo-blocking. Verified as live via direct browser access.
2. Apollo Hospitals URL returns HTTP 403 from automated scripts (bot-blocking). Page is live.
3. RoadSoS **does not dispatch** emergency services and **does not guarantee** real-time availability.
4. Offline cache requires at least one online visit with **Refresh cache** tapped.
5. Multi-language packet uses template-based translation — user-entered notes remain in English.

---

## Demo

See [`demo/golden_scenario.md`](demo/golden_scenario.md) for the full 12-beat judging walkthrough.

**Demo coordinates:** IIT Madras main gate — `lat: 12.9915`, `lon: 80.2337`
