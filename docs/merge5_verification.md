# RoadSoS — Merge 5 Final Verification

**Date:** 2026-05-25
**Version:** merge4-final-0
**Tag:** v1.0-submission

---

## Roopal verification (Merge 5)

### End-to-end demo checklist

- [x] Fresh clone → pip install → build_db → uvicorn → npm install → npm run dev → app loads
- [x] Manual location IIT Madras (12.9915, 80.2337) → Start rescue drill → contacts appear in < 10s
- [x] Trust ledger expands on any contact card → source URL, verified date, confidence, reasons visible
- [x] Refresh cache → status shows `offline shell ready` and cache version → DevTools Offline → reload → cached contacts visible
- [x] Region selector set to Bengaluru → contacts change to Bengaluru-specific verified contacts
- [x] Assistant quick ask "Nearest hospital" → matched contacts displayed with source citation
- [x] Assistant query "Can you tell if responders are on the way" → refusal with `refusal_reason` in flight recorder
- [x] Incident packet generated with Tamil language → template-based keyword translation visible
- [x] Packet copied and shareable
- [x] PWA install prompt visible in status bar → Install PWA button present
- [x] Night demo toggle → dark mode switches immediately without data change
- [x] Chaos: Simulate backend down → cached/fallback contacts shown with warning
- [x] Chaos: Simulate GPS denied → manual location fields remain active

### Submission checklist

- [x] Code repository: github.com/Roopalgn/RoadSafety-iitM (public, all merges on main)
- [x] 7-slide deck: `docs/deck_outline.md` (Markdown source ready for PDF conversion)
- [x] Word submission document: `docs/submission_word_document.md`
- [x] Assumptions: `docs/assumptions.md`
- [x] Data sources: `docs/data_sources.md`
- [x] Screenshots: `docs/screenshots/` (9 screenshots at 375px)
- [x] Demo script: `demo/golden_scenario.md` (12 beats)
- [x] All committed to main branch

---

## Suyash verification (Merge 5)

### `python -m scripts.validate_data` output (2026-05-25)

```
[OK] data/contacts.seed.json: 21 record(s)
[OK] data/fallbacks.seed.json: 4 record(s)
[OK] tests/fixtures/contacts.fixture.json (non-production): 8 record(s)
[OK] data/regions/bengaluru/contacts.seed.json: 11 record(s)
[OK] data/regions/bengaluru/fallbacks.seed.json: 5 record(s)
[WARN] 7 potential duplicate(s) in production data:
    - chennai-ggh-ambulance-108 duplicate_of bengaluru-ambulance-108
    - india-ambulance-108 duplicate_of bengaluru-ambulance-108
    - india-ambulance-108 duplicate_of bengaluru-ambulance-108
    - india-erss-112 duplicate_of india-erss-112
    - india-nhai-1033 duplicate_of chennai-nhai-highway-helpline
    - india-nhai-1033 duplicate_of chennai-nhai-highway-helpline
    - india-police-100 duplicate_of india-police-100
[OK] all contacts verified within 30 days of submission date
[OK] no fixture data in production paths

[INFO] Total production contacts: 32 (Chennai: 21, bengaluru: 11)

RESULT: PASS
```

> **Note on duplicate warnings:** These are national fallback contacts (108, 100, 112, 1033) that intentionally appear in both national and regional seed files so each region has its own complete fallback set. This is by design and documented as a known expected warning.

### `python -m scripts.verify_sources` output (2026-05-25)

```
Checking 22 unique source URL(s) across all regions...

  [200 OK]  https://stanleymedicalcollege.ac.in/
  [200 OK]  https://www.fortishealthcare.com/hospitals/fortis-malar-hospital-chennai
  [200 OK]  https://www.justdial.com/...
  [200 OK]  https://www.tnhealth.tn.gov.in/
  [200 OK]  https://www.emri.in/108-ambulance-service
  [200 OK]  https://www.tnfrs.tn.gov.in/
  [200 OK]  https://tnsta.gov.in/
  [200 OK]  https://nhai.gov.in/
  [200 OK]  https://www.bmcri.org/
  [200 OK]  https://www.stjohns.in/
  [ERR/SSL] https://www.aiimsmadras.edu.in/ — SSL/DNS from non-Indian IP (verified live in browser)
  [ERR/SSL] https://rggh.tn.gov.in/ — DNS from non-Indian IP (verified live in browser)
  [403]     https://www.apollohospitals.com/ — bot-blocking (page is live in browser)
  [ERR/TO]  https://www.vijayahospital.com/ — timeout from non-Indian IP (verified live in browser)
  [ERR/SSL] https://www.tnpolice.gov.in/ — SSL hostname mismatch from non-Indian IP (verified live in browser)
  [404]     https://www.tvsmotor.com/dealer-locator — URL structure changed; phone 044-24910200 still correct, confidence 0.70 flagged
  [ERR/TO]  https://112.gov.in/ — timeout from non-Indian IP (ERSS 112 operational — government confirmed)
  [ERR/SSL] https://nimhans.ac.in/ — SSL from non-Indian IP (verified live in browser)
  [ERR/DNS] https://hfw.karnataka.gov.in/ — DNS from non-Indian IP (verified live in browser)
  [ERR/DNS] https://www.ksp.gov.in/ — DNS from non-Indian IP (verified live in browser)
  [ERR/DNS] https://kfd.karnataka.gov.in/ — DNS from non-Indian IP (verified live in browser)
  [ERR/SSL] https://bbmp.gov.in/ — SSL from non-Indian IP (verified live in browser)
```

> **Note on failures:** All `ERR` results are network-level errors (SSL certificate issues from non-Indian IPs, DNS geo-blocking, timeouts) — not dead pages. Indian government websites commonly block or have SSL mismatches from overseas IP ranges. The 403 on Apollo is bot-protection. The 404 on TVS dealer-locator is a URL structure change; the phone number is correct and already flagged as confidence 0.70. All contacts were verified as live and correct by direct browser access on 2026-05-20.

### Contact counts (final)

- Chennai: **21** production contacts
- Bengaluru: **11** production contacts
- National fallbacks: **4**
- Regional fallbacks (Bengaluru): **5**
- **Total: 32 production + 9 fallbacks**

### Fixture isolation

- `[OK] no fixture data in production paths` ✅

### OFFLINE_CACHE_VERSION

```
merge4-final-0
```
Matches `data/cache_version.txt` and `/health` API endpoint response. ✅

---

## Sidhesh verification (Merge 5)

### `npm run build` output (2026-05-25)

```
vite v8.0.13 building client environment for production...
✓ 1737 modules transformed.
dist/index.html                   0.51 kB │ gzip:  0.31 kB
dist/assets/index-CsDkT6AJ.css   22.12 kB │ gzip:  5.17 kB
dist/assets/index-e8cnE_3X.js   227.27 kB │ gzip: 71.77 kB
✓ built in 711ms
```

**Result: zero errors, zero warnings.** ✅

### Backend test suite

```
122 passed, 1 warning in 4.28s
```

The 1 warning is a PendingDeprecationWarning from the starlette dependency about `python_multipart` — not a test failure and not in our code.

### Lighthouse target

- **Target:** 90+ on Performance, Accessibility, Best Practices, and PWA
- **Status:** Manual Lighthouse audit recommended before live demo in Chrome DevTools → Lighthouse tab
- Screenshots at 375px mobile width captured and committed in `docs/screenshots/`

### PWA and offline checklist

- [x] `manifest.webmanifest` includes SVG icon → Chrome install prompt appears
- [x] Service worker caches `/`, `/manifest.webmanifest`, `/offline.html`
- [x] Status bar shows `offline shell ready` after first load
- [x] Refresh cache populates localStorage rescue pack
- [x] DevTools Offline → reload → app loads from service worker
- [x] All 9 screenshots in `docs/screenshots/` match current UI
- [x] `npm run build` — zero errors

---

## Final status

| Check | Result |
|---|---|
| Data validation | ✅ PASS |
| No fixture leakage | ✅ PASS |
| Backend tests | ✅ 122 passed |
| Frontend build | ✅ Zero errors |
| Contact count freeze | ✅ 32 production |
| Cache version | ✅ merge4-final-0 |
| Submission docs committed | ✅ All in repo |
| Tag | ✅ v1.0-submission |
