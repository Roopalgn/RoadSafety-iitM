# RoadSoS — Submission Document
## Road Safety Hackathon 2026 | IIT Madras | Unstop

---

## 1. Team Details

| Role | Name | Responsibilities |
|---|---|---|
| Product / Docs | Roopal | Requirements, plan, demo scripting, submission artifacts |
| Data / Backend | Suyash | Data curation, FastAPI, geo ranking, assistant, cross-region |
| Frontend / PWA | Sidhesh | React PWA, service worker, offline UX, dark mode, multi-language |

**Repository:** https://github.com/Roopalgn/RoadSafety-iitM

---

## 2. Problem Statement

Road accidents in India cause over 1.5 lakh deaths annually (MoRTH 2022). During the critical "golden hour," bystanders waste precious minutes searching Google for emergency contacts — finding outdated listings, wrong numbers, and no guidance on what to do next.

**RoadSoS solves this with three guarantees:**
1. The right verified contact is ranked and surfaced in under 10 seconds.
2. The app works even with no network (offline-first PWA).
3. The AI assistant never invents a phone number or availability claim.

---

## 3. Solution Overview

RoadSoS is a location-aware emergency response Progressive Web App. A bystander at an accident scene can:

1. **Enter or auto-detect location** (GPS or manual lat/lon)
2. **Run a 10-second rescue drill** — ranked verified emergency contacts appear instantly
3. **View trust metadata** — source URL, verification date, confidence score for every contact
4. **Generate an incident packet** — structured summary with injury count, vehicle type, severity, and nearest contacts; available in English, Tamil, and Hindi
5. **Use the guarded assistant** — ask "nearest hospital" and get verified contacts; ask "is the ambulance coming?" and get an honest refusal with reason
6. **Work offline** — service worker caches the app shell; data cache persists across network loss
7. **Use bystander mode** — role cards (Caller, Traffic Spotter, Note Taker, Location Sharer) keep everyone useful
8. **Apply emergency presets** — one-tap filter for Medical emergency, Police support, Vehicle recovery

---

## 4. Technology Stack

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

## 5. Repository Structure

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
│   │   ├── main.py                 # FastAPI routes + XSS sanitization + middleware
│   │   └── models.py               # Pydantic request/response models
│   ├── scripts/
│   │   ├── build_db.py             # SQLite generation from seed files
│   │   ├── validate_data.py        # Data integrity checks (no fixture leakage)
│   │   └── verify_sources.py       # HTTP 200 check on all source URLs
│   ├── tests/
│   │   ├── fixtures/               # Non-production test data (isolated from production)
│   │   ├── test_api.py             # API endpoint tests (122 total)
│   │   ├── test_assistant.py       # Assistant logic and refusal tests
│   │   ├── test_confidence.py      # Confidence scoring tests
│   │   ├── test_db.py              # Database integration tests
│   │   ├── test_dedupe.py          # Deduplication logic tests
│   │   ├── test_geo.py             # Geo/bounding box detection tests
│   │   └── test_validation.py      # JSON Schema validation tests
│   ├── conftest.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── manifest.webmanifest    # PWA manifest (name, icons, display mode)
│   │   ├── offline.html            # Offline fallback page
│   │   ├── roadsos-icon.svg        # PWA icon
│   │   └── sw.js                   # Service worker (cache first, offline.html fallback)
│   ├── src/
│   │   ├── main.jsx                # Full React application
│   │   └── styles.css              # Glassmorphism design, dark/night mode
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── data/
│   ├── contacts.seed.json          # 21 Chennai production contacts
│   ├── fallbacks.seed.json         # 4 national fallbacks (112, 108, 100, 1033)
│   └── regions/
│       ├── bengaluru/              # 11 Bengaluru contacts + 5 Karnataka fallbacks
│       ├── delhi/                  # Delhi region seed data
│       ├── gurgaon/                # Gurgaon region seed data
│       ├── hyderabad/              # Hyderabad region seed data
│       ├── kolkata/                # Kolkata region seed data
│       ├── lucknow/                # Lucknow region seed data
│       ├── mumbai/                 # Mumbai region seed data
│       └── pune/                   # Pune region seed data
├── contracts/
│   ├── contact.schema.json         # JSON Schema for contact records
│   └── api.examples.json           # API request/response examples
├── demo/
│   └── golden_scenario.md          # 12-beat judging walkthrough
├── docs/
│   ├── assumptions.md
│   ├── data_sources.md             # Source URLs + provenance for all contacts
│   ├── deck_outline.md             # 7-slide presentation outline
│   ├── offline_verification.md     # Offline demo steps
│   ├── submission_requirements.md  # Hackathon requirements checklist
│   └── submission_word_document.md # This document
├── .env.example
├── render.yaml                     # Render.com backend deployment
└── vercel.json                     # Vercel frontend deployment
```

---

## 6. How to Run

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
```powershell
cd backend
pip install -r requirements.txt
python -m scripts.build_db
uvicorn app.main:app --port 8000 --reload
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in Chrome. Backend API at **http://localhost:8000**. Swagger docs at **http://localhost:8000/docs**.

### Verify data integrity
```powershell
cd backend
python -m scripts.validate_data
python -m pytest tests -v
```

---

## 7. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check + version info |
| `POST` | `/api/nearby-services` | Ranked emergency contacts by coordinates + radius |
| `GET` | `/api/cache-package?region=chennai` | Offline cache bundle |
| `POST` | `/api/incident-summary` | Generate structured incident packet |
| `POST` | `/api/assistant` | Guarded retrieval assistant |

### Example: Nearby Services Request
```json
{
  "lat": 12.9915,
  "lon": 80.2337,
  "radius_km": 8,
  "service_types": ["hospital", "ambulance"],
  "location_source": "gps",
  "region": "auto"
}
```

---

## 8. Software Packages

### Backend (`backend/requirements.txt`)
| Package | Version | Purpose |
|---|---|---|
| fastapi | 0.115.6 | REST API framework |
| uvicorn[standard] | 0.34.0 | ASGI server |
| pydantic | 2.10.4 | Request/response validation |
| jsonschema | 4.23.0 | JSON Schema contract validation |
| pytest | 8.3.4 | Test runner |
| httpx | 0.28.1 | Async HTTP client for API tests |

### Frontend (`frontend/package.json`)
| Package | Version | Purpose |
|---|---|---|
| react | latest | UI framework |
| react-dom | latest | React DOM renderer |
| leaflet | 1.9.4 | Interactive maps |
| lucide-react | latest | Emergency icon set |
| vite | latest | Build tool and dev server |
| @vitejs/plugin-react | latest | React JSX transform |

**No external LLM API packages.** The assistant is fully retrieval-based using the curated contact database.

---

## 9. Assumptions

### Scope
- RoadSoS is built for the RoadSoS track only.
- The primary demo region is IIT Madras / Chennai (lat `12.9915`, lon `80.2337`).
- Additional regions (Bengaluru, Delhi, Mumbai, Hyderabad, Pune, Kolkata, Gurgaon, Lucknow) are included with their own seed files.
- Coordinates outside all known region bounding boxes receive national fallbacks only.

### Data
- Production emergency contacts must be curated manually from verifiable public sources.
- AI may structure user-provided incident details but **must not** create emergency contacts, phone numbers, or addresses.
- Every production contact requires: `source_url`, `source_name`, `verified_at`, `confidence_reasons`.
- Contacts with no reliable coordinates have `lat`/`lon` set to `null` (not excluded, but shown in fallbacks).
- Test fixtures live outside production seed files, clearly isolated in `tests/fixtures/`.
- The offline cache covers curated demo regions; it does not cover all of India.

### Backend and Assistant
- The assistant searches curated contacts, official fallbacks, and approved safety templates only.
- The assistant does **not** call external LLM APIs for emergency contact data.
- If the assistant cannot match a query to verified data, it refuses with a clear `refusal_reason`.
- Real-time queries (ETA, dispatch status, "is the ambulance coming?") are **always refused**.
- Medical diagnosis, triage advice, and legal advice are **always refused**.
- RoadSoS does **not** dispatch emergency services.
- RoadSoS does **not** guarantee real-time availability of any listed contact.
- Ranking is deterministic: distance → confidence → freshness → service priority → availability.

### Offline
- Two-tier offline: (1) service worker caches the app shell; (2) localStorage stores `/api/cache-package` response.
- User must tap **Refresh cache** at least once while online.
- If no cache exists, ERSS 112 is always shown as the minimum fallback.

---

## 10. Data Sources

**Total production contacts: 21 Chennai + 11 Bengaluru + additional city seeds + 4 national fallbacks**

All contacts verified as of **2026-05-20**.

### National Fallbacks
| Contact | Phone | Source |
|---|---|---|
| ERSS (all emergencies) | 112 | 112.gov.in |
| Ambulance (108) | 108 | emri.in |
| Police Emergency | 100 | tnpolice.gov.in |
| NHAI Highway Helpline | 1033 | nhai.gov.in |

### Chennai — Hospitals / Trauma Centres (10)
| Contact | Type | Phone | Source |
|---|---|---|---|
| AIIMS Madras | trauma_center | 044-22289999 | aiimsmadras.edu.in |
| Apollo Hospitals Greams Road | trauma_center | 044-28290200 | apollohospitals.com |
| Rajiv Gandhi Govt General Hospital | hospital | 044-25305000 | rggh.tn.gov.in |
| Government Stanley Medical College | hospital | 044-25281201 | stanleymedicalcollege.ac.in |
| Fortis Malar Hospital | hospital | 044-42892222 | fortishealthcare.com |
| Sri Ram Hospital Adyar | hospital | 044-24420555 | justdial (verified) |
| Kilpauk Medical College Hospital | hospital | 044-26421111 | tnhealth.tn.gov.in |
| Institute of Child Health | hospital | 044-25305050 | tnhealth.tn.gov.in |
| Vijaya Hospital (Vadapalani) | hospital | 044-22431111 | vijayahospital.com |
| Govt Hospital of Thoracic Medicine | hospital | 044-22262001 | tnhealth.tn.gov.in |

### Chennai — Police, Fire, Ambulance, Tow, Repair (11)
| Contact | Type | Phone | Source |
|---|---|---|---|
| TN 108 Emergency Ambulance | ambulance | 108 | emri.in |
| Adyar Police Station | police | 044-24910100 | tnpolice.gov.in |
| Kotturpuram Police Station | police | 044-24470585 | tnpolice.gov.in |
| Velachery Police Station | police | 044-22430585 | tnpolice.gov.in |
| Guindy Police Station | police | 044-22350100 | tnpolice.gov.in |
| Adyar Fire Station | fire_station | 044-24910101 | tnfrs.tn.gov.in |
| Velachery Fire Station | fire_station | 044-22431101 | tnfrs.tn.gov.in |
| Guindy Fire Station | fire_station | 044-22350101 | tnfrs.tn.gov.in |
| Chennai RTO Towing (Adyar Zone) | tow | 044-23452345 | tnsta.gov.in |
| NHAI Highway Helpline | tow | 1033 | nhai.gov.in |
| TVS Authorised Service (Adyar) | repair | 044-24910200 | tvsmotor.com |

### Bengaluru (11 contacts)
| Contact | Type | Phone | Source |
|---|---|---|---|
| Victoria Hospital (BMCRI) | trauma_center | 080-26701150 | bmcri.org |
| NIMHANS | trauma_center | 080-46110007 | nimhans.ac.in |
| St. John's Medical College Hospital | hospital | 080-22065000 | stjohns.in |
| Bowring & Lady Curzon Hospital | hospital | 080-25561902 | hfw.karnataka.gov.in |
| Koramangala Police Station | police | 080-22943232 | ksp.gov.in |
| HSR Layout Police Station | police | 080-22943300 | ksp.gov.in |
| Karnataka 108 Ambulance | ambulance | 108 | emri.in |
| Koramangala Fire Station | fire_station | 080-22943101 | kfd.karnataka.gov.in |
| Indiranagar Fire Station | fire_station | 080-25200101 | kfd.karnataka.gov.in |
| BBMP Towing Helpline | tow | 080-22221188 | bbmp.gov.in |
| NHAI 1033 (Bengaluru) | tow | 1033 | nhai.gov.in |

Full provenance with coordinates and notes: [`docs/data_sources.md`](docs/data_sources.md)

---

## 11. Known Limitations

1. **SSL geo-blocking:** Several Indian government websites (tnpolice.gov.in, 112.gov.in, ksp.gov.in) block non-Indian IPs. Verified as live via direct browser access; automated `verify_sources.py` may report failures.
2. **Apollo Hospitals:** Returns HTTP 403 from automated scripts (bot-blocking). Page is live and accessible from browser.
3. **TVS Dealer Locator:** URL structure changed post-verification. Phone number (044-24910200) is correct. Confidence set to 0.70.
4. **Repair shops:** No reliable, verifiable source exists for individual roadside repair shops near IIT Madras. TVS dealer included as the only verifiable repair option.
5. **Offline cache:** Requires at least one online session with **Refresh cache** tapped. First-load offline is not supported.
6. **Multi-language packet:** Tamil and Hindi use template-based keyword translation, not full machine translation. User-entered notes remain in English.
7. **No real dispatch:** RoadSoS surfaces verified contacts but does not dispatch emergency services or confirm live availability.
8. **City seed depth:** Chennai and Bengaluru have fully verified contacts. Newly added cities (Delhi, Mumbai, etc.) have regional seed data at varying depth.

---

## 12. Test Results

```
python -m scripts.validate_data   →  PASS (all contacts, no fixture leakage)
python -m pytest tests -v         →  122 passed
npm run build                     →  ✓ built, 0 errors
```

---

## 13. Offline Cache Version

`merge4-final-0`

This version string is displayed in the app's status bar and identifies the data snapshot cached by the service worker.

---

## 14. Safety Rules (Non-Negotiable)

- Do not generate emergency phone numbers, addresses, or service names with AI.
- Production contacts must be source-backed with `source_url`, `source_name`, and `verified_at`.
- The assistant searches curated contacts and approved templates only — no external LLM API calls.
- If the app cannot verify something, it says so and shows official fallback guidance (ERSS 112).
- ERSS 112 is always visible regardless of network or cache state.
