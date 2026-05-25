# RoadSoS Comprehensive Gap Analysis

This document audits the current RoadSoS repository against the product plan, RoadSoS evaluation criteria, and the leaderboard-worthy demo target.

## Executive Summary

RoadSoS now has a credible vertical slice: source-backed Chennai contacts, deterministic ranking, FastAPI endpoints, a mobile-first React flow, incident packet generation, guarded assistant refusal, app-shell offline caching, and demo chaos controls. The largest remaining gap is that the project still feels like a strong hackathon prototype rather than a fully operated emergency product. The next improvements should increase offline guarantees, data coverage, ranking intelligence, automated verification, and submission readiness.

## Critical Gaps

### Offline Reliability

- The frontend stores the cache package in `localStorage` and registers a lightweight service worker for the app shell, but first-load offline is still not supported.
- Offline rescue depends on the user opening the app and refreshing the cache at least once before the network drops.
- Cache freshness is visible, but there is no hard stale threshold or expiry policy.
- The offline cache is not version-migrated if the contact schema changes.
- Offline fallback is still mostly manual-tested; there is no automated browser offline test.

### Assistant Guardrails

- `/api/assistant` is still a guarded stub.
- The assistant does not retrieve nearby contacts or approved templates yet.
- The UI now shows a lightweight source/refusal flight recorder, but the backend still needs richer template IDs and retrieval evidence.
- It cannot answer safe template questions such as what bystanders should do while waiting.
- It cannot distinguish `unknown`, `known but not live-confirmed`, and `unsupported request` with enough nuance.

### Data Coverage And Accuracy

- Chennai coverage is useful but still thin for a real emergency product.
- Repair/puncture contacts are absent or too sparse for a convincing vehicle-recovery flow.
- Ambulance coverage relies mostly on state/national fallback numbers.
- Towing coverage is sparse and zone-level.
- No second-region sample is present yet, so global/cross-region claims are not proven in data.
- Several source URLs are broad homepages rather than contact-specific source pages.
- No automated source URL availability checker is wired into tests.
- No manual verification workflow exists for stale or unreachable contacts.
- No confidence downgrade is applied for broad directory sources versus direct official contact pages beyond the manually curated score.

### Ranking Quality

- Ranking is primarily distance then confidence; service priority is not yet explicit.
- A trauma center farther away can rank behind a closer lower-capability hospital even when injury severity is high.
- Availability scoring is not modeled beyond text fields.
- No `why first` short label exists for fast reading.
- No mode-specific ranking exists for hospital-only, police-only, highway incidents, nighttime, or severe injury cases.

### Frontend Product Experience

- The current PR adds a lightweight contact radar, but not a real map, route preview, or route-safe landmark trail.
- The current PR adds rehearsable chaos controls for backend-down and no-result states; GPS-denied still needs a dedicated visual toggle or browser test.
- Install prompt and service-worker status are visible, but there is no full PWA install analytics or manifest icon polish yet.
- A structured demo checklist is now inside the app, but it is not persisted across sessions.
- Contact cards do not yet show source IDs or cache version.
- Service filters now include medical, police, and vehicle recovery presets, but preset ranking is still handled mostly by filters rather than backend scoring.
- Incident packet now captures callback number, vehicle type, road side, severity, and nearest contacts, but it is not exported as QR/SMS format yet.
- Share action depends on browser capability and has no visible fallback reason.
- No screenshots or automated visual checks are committed.

### Backend And API

- No CORS policy is configured for non-proxy deployments.
- No API endpoint exposes dataset statistics for UI trust summary.
- No endpoint exposes schema/cache version metadata independently.
- No endpoint validates a proposed contact before adding it to seed data.
- No rate limiting or abuse protection exists.
- No structured error response contract exists beyond FastAPI defaults.
- SQLite generation exists, but deployment/runtime use of SQLite versus JSON is not fully documented.

### Testing And Quality

- Backend tests are solid, but frontend tests are absent.
- No Playwright or browser automation verifies mobile layout and offline mode.
- No CI workflow runs backend tests, data validation, and frontend build.
- No accessibility audit is automated.
- No performance budget is tracked for the 10-second drill.
- No test enforces `no AI-generated contacts` beyond data validation rules.
- No test ensures every displayed frontend contact renders trust metadata.

### Submission Assets

- The 7-slide deck is outlined but not built.
- Final screenshots are missing.
- A package/assumptions Word document is not generated.
- Demo recording or GIF is missing.
- README setup is usable, but root-level one-command local run instructions would help judges.
- Known limitations are documented, but not summarized in a judge-friendly one-pager.

### Operations And Deployment

- No production deployment target is configured.
- No environment-specific config story exists beyond Vite proxy/dev ports.
- No health dashboard or operational status page exists.
- No dataset update cadence or owner checklist exists.
- No lightweight admin/editor path exists for adding verified contacts.

## Highest-Leverage Improvements

1. Add second-region data and fallback behavior.
2. Add frontend browser tests for online, offline, GPS denied, no results, and mobile viewport.
3. Add data/source URL audit automation.
4. Add service-priority ranking for injury severity and highway incidents.
5. Add richer assistant retrieval with template IDs and contact IDs.
6. Add service-worker/cache version migration and stale-cache expiry policy.
7. Add a real map/route preview and optional nearby route landmarks.
8. Build the 7-slide deck and final submission document from repo docs.
9. Add CI for backend tests, data validation, and frontend build.
10. Add an owner workflow for weekly contact verification.

## Current PR Focus

This PR closes the highest demo-impact frontend gaps that fit safely in one review:

- Service-worker app-shell caching.
- Clearer offline rescue-pack behavior.
- Assistant flight-recorder trace UI.
- Demo readiness checklist and coverage snapshot.
- Emergency presets for medical, police, and vehicle recovery flows.
- Backend-down/no-result chaos rehearsal controls.
- Richer ambulance-ready incident packet fields.
- A more expressive, less static frontend visual system.
- A durable gap list for later team work.
