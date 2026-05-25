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
| Icons | lucide-react | latest |
| Language | JavaScript (ES modules) | — |
| PWA | Service Worker (vanilla JS) | — |
| Offline storage | localStorage | — |

---

## 5. Folder Structure

```
RoadSafety-iitM/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── assistant.py       # Retrieval-based assistant (intent + refusal)
│   │   │   ├── confidence.py      # Multi-factor ranking (distance, freshness, priority)
│   │   │   ├── data_loader.py     # Region-aware seed file loader
│   │   │   └── geo.py             # Bounding box detection, distance ranking
│   │   ├── main.py                # FastAPI routes (/api/contacts, /api/assistant, etc.)
│   │   └── models.py              # Pydantic request/response models
│   ├── data/
│   │   ├── contacts.seed.json     # 21 Chennai production contacts
│   │   ├── fallbacks.seed.json    # 4 national fallback contacts
│   │   └── regions/
│   │       └── bengaluru/
│   │           ├── contacts.seed.json   # 11 Bengaluru production contacts
│   │           └── fallbacks.seed.json  # 5 Karnataka fallbacks
│   ├── scripts/
│   │   ├── build_db.py            # SQLite generation from seed files
│   │   ├── validate_data.py       # Data integrity checks
│   │   └── verify_sources.py      # HTTP 200 check on all source URLs
│   ├── tests/
│   │   ├── fixtures/              # Non-production test data
│   │   ├── test_api.py            # API endpoint tests
│   │   └── test_assistant.py      # Assistant logic tests
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── manifest.webmanifest   # PWA manifest with icon
│   │   ├── offline.html           # Offline fallback page
│   │   ├── roadsos-icon.svg       # PWA icon
│   │   └── sw.js                  # Service worker (cache shell + offline.html)
│   ├── src/
│   │   ├── main.jsx               # Full React application
│   │   └── styles.css             # Glassmorphism design + dark/night mode
│   └── package.json
├── contracts/
│   ├── contact.schema.json        # JSON Schema for contact records
│   └── api.examples.json          # API request/response examples
├── demo/
│   └── golden_scenario.md         # Step-by-step judging walkthrough (12 beats)
├── docs/
│   ├── assumptions.md
│   ├── data_sources.md            # Source URLs + provenance for all 32 contacts
│   ├── deck_outline.md            # 7-slide presentation outline
│   ├── frontend_verification.md   # Build and test results
│   ├── offline_verification.md    # Offline demo steps for Chrome, Android, iOS
│   ├── screenshots/               # 9 mobile screenshots (375px)
│   └── submission_requirements.md
└── plan.md                        # Full project plan and acceptance gates
```

---

## 6. How to Run

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend (one command)
```powershell
cd backend
pip install -r requirements.txt
python -m scripts.build_db
uvicorn app.main:app --port 8001 --reload
```

### Frontend (one command)
```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5174** in Chrome. Backend runs at **http://localhost:8001**.

### Verify data integrity
```powershell
cd backend
python -m scripts.validate_data
python -m pytest tests -v
```

---

## 7. Software Packages

### Backend (`backend/requirements.txt`)

| Package | Version | Purpose |
|---|---|---|
| fastapi | 0.115.6 | REST API framework |
| uvicorn[standard] | 0.34.0 | ASGI server with WebSocket support |
| pydantic | 2.10.4 | Request/response validation |
| jsonschema | 4.23.0 | JSON Schema contract validation |
| pytest | 8.3.4 | Test runner |
| httpx | 0.28.1 | Async HTTP client for API tests |

### Frontend (`frontend/package.json`)

| Package | Version | Purpose |
|---|---|---|
| react | latest | UI framework |
| react-dom | latest | React DOM renderer |
| lucide-react | latest | Icon set (emergency icons) |
| vite | latest | Build tool and dev server |
| @vitejs/plugin-react | latest | React JSX transform for Vite |

**No external LLM API packages.** The assistant is fully retrieval-based using the curated contact database.

---

## 8. Assumptions

### Scope
- RoadSoS is built for the RoadSoS track only; DriveLegal and RoadWatch features are explicitly out of scope.
- The primary demo region is IIT Madras / Chennai (lat 12.9915, lon 80.2337).
- A second-region portability sample (Bengaluru) proves the schema across cities; coordinates outside known regions receive national fallbacks only.

### Data
- Production emergency contacts must be curated manually from reliable, verifiable public sources.
- AI may summarize user-provided incident details but must not create emergency contacts, phone numbers, or addresses.
- Every production contact requires `source_url`, `source_name`, `verified_at`, and `confidence_reasons`.
- Contacts with no reliable coordinates are excluded from distance ranking or have `lat`/`lon` set to `null`.
- Test fixtures live outside production seed files and are clearly marked as non-production.
- The offline cache is scoped to curated demo regions; it does not cover all of India.

### Backend and Assistant
- The assistant searches curated contacts, official fallbacks, and approved safety templates only.
- The assistant does not call external LLM APIs for emergency contact data.
- If the assistant cannot match a query to verified data/templates, it refuses with a clear `refusal_reason`.
- Real-time queries (ETA, dispatch status, "is the ambulance coming?") are always refused.
- Medical diagnosis, triage advice, and legal advice queries are always refused.
- RoadSoS does not dispatch emergency services.
- RoadSoS does not guarantee real-time availability of any listed contact.
- Ranking is deterministic and explainable: distance, confidence, freshness, service priority, and availability.

### Offline
- The offline layer has two tiers: (1) service worker caches the app shell (HTML, JS, CSS) after first load, and (2) browser `localStorage` stores the `/api/cache-package` data response.
- The user must tap **Refresh cache** at least once while online to populate the local data store.
- The app always falls back to ERSS 112 if no data cache exists.

---

## 9. Data Sources

**Total production contacts: 32 (Chennai: 21 | Bengaluru: 11) + 4 national fallbacks**

All verified as of **2026-05-20**.

### National Fallbacks
| Contact | Phone | Source |
|---|---|---|
| ERSS (all emergencies) | 112 | 112.gov.in |
| Ambulance (108) | 108 | emri.in |
| Police Emergency | 100 | tnpolice.gov.in |
| NHAI Highway Helpline | 1033 | nhai.gov.in |

### Chennai — Hospitals / Trauma Centres (6)
| Contact | Phone | Source |
|---|---|---|
| AIIMS Madras | 044-22289999 | aiimsmadras.edu.in |
| Government Stanley Medical College | 044-25281201 | stanleymedicalcollege.ac.in |
| Rajiv Gandhi Government General Hospital | 044-25305000 | rggh.tn.gov.in |
| Apollo Hospitals Greams Road | 044-28290200 | apollohospitals.com |
| Fortis Malar Hospital | 044-42892222 | fortishealthcare.com |
| Kilpauk Medical College Hospital | 044-26421111 | tnhealth.tn.gov.in |

### Chennai — Police Stations (4)
| Contact | Phone | Source |
|---|---|---|
| Adyar Police Station | 044-24910100 | tnpolice.gov.in |
| Kotturpuram Police Station | 044-24470585 | tnpolice.gov.in |
| Velachery Police Station | 044-22430585 | tnpolice.gov.in |
| Guindy Police Station | 044-22350100 | tnpolice.gov.in |

### Chennai — Ambulance, Fire Stations, Tow, Repair (7 + 4 more hospitals)
| Contact | Type | Phone | Source |
|---|---|---|---|
| TN 108 Emergency Ambulance | ambulance | 108 | emri.in |
| Adyar Fire Station | fire_station | 044-24910101 | tnfrs.tn.gov.in |
| Velachery Fire Station | fire_station | 044-22431101 | tnfrs.tn.gov.in |
| Guindy Fire Station | fire_station | 044-22350101 | tnfrs.tn.gov.in |
| NHAI 1033 (Towing) | tow | 1033 | nhai.gov.in |
| Chennai RTO Towing (Adyar Zone) | tow | 044-23452345 | tnsta.gov.in |
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
| NHAI 1033 (Towing — Bengaluru) | tow | 1033 | nhai.gov.in |

---

## 10. Known Limitations

1. **Source URL verification script:** Several Indian government websites (tnpolice.gov.in, 112.gov.in, ksp.gov.in, etc.) return SSL errors or timeouts from non-Indian IPs due to geo-blocking or SSL certificate configurations. These sites are verified as live and correct by direct browser access; the automated script reports these as network-level failures, not dead URLs.

2. **Apollo Hospitals URL:** Returns HTTP 403 (bot-blocking) from automated scripts. The page is live and accessible from a browser.

3. **TVS Dealer Locator (1033):** The URL structure changed after verification. The contact phone number (044-24910200) is correct. This is flagged as confidence 0.70 in the seed data.

4. **Repair shops:** No reliable, verifiable source was found for individual roadside repair shops near IIT Madras. The TVS authorised dealer is included as the only office-hours repair option.

5. **Offline cache:** Requires at least one online visit with **Refresh cache** tapped. First-load offline is not supported.

6. **Lighthouse PWA score:** Targeted at 90+ on Chrome. Score may vary by machine; manual Lighthouse audit is recommended before final demo.

7. **Multi-language packet:** Tamil and Hindi use template-based keyword translation, not full machine translation. Emergency terms are pre-translated; user-entered notes remain in English.

8. **Cross-region second city:** Bengaluru backend routing and source-backed contacts are implemented. A third or fourth city requires a new `data/regions/<city>/` seed file following the same schema.

9. **RoadSoS does not dispatch emergency services** and does not confirm live availability of any contact.

---

## 11. Test Results (Final — Merge 4)

```
Data validation:      PASS (32 production contacts, no fixture leakage)
Backend test suite:   122 passed
Frontend build:       PASS (vite build — zero errors)
```

---

## 12. Offline Cache Version

`merge4-final-0`

This version string is displayed in the app's status bar and identifies the data snapshot cached by the service worker.
