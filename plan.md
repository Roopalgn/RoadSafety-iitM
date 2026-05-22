# RoadSoS Hackathon Execution Plan

## Agreed upon points-
- We will build for the **RoadSoS** problem statement from the Road Safety Hackathon 2026.
- Product direction: **offline-first accident response orchestrator**, not a generic chatbot.
- Core demo promise: **a bystander can get the right emergency help in under 10 seconds, even with weak or no network**.
- Golden demo region: **IIT Madras / Chennai**.
- Portability proof: add one compact second-region sample to prove the schema can support other cities or countries.
- First screen of the app must be the emergency action screen. No marketing landing page.
- No AI-generated phone numbers, addresses, hospital names, police stations, ambulance contacts, towing contacts, or official claims.
- Every displayed service must come from curated data and show source, last verified date, confidence, and why it was ranked.
- The assistant can summarize, translate, and guide, but it cannot invent contacts, medical advice, legal advice, or dispatch status.
- Offline mode is a first-class requirement. The Chennai rescue cache must work when the browser is offline.
- The final submission must include code, 7-slide deck, package/assumption document, data-source notes, and a repeatable demo script.
- Roopal reviews PRs into `main`; Suyash and Sidhesh should keep PRs small enough to review but substantial enough to show progress.
- Branches should start from the same bootstrap `main` after this plan and base scaffold are merged.

## Problem statement summary-
- Organizer: Centre of Excellence for Road Safety, RBG Labs, IIT Madras.
- Theme: AI in Road Safety, with focus on AI-powered chatbots.
- Chosen track: RoadSoS.
- RoadSoS asks for a location-based emergency support tool for accidents.
- Required capability areas:
  - Nearby police stations, hospitals, and ambulance services.
  - Nearby towing, puncture shops, and showrooms.
  - Global applicability.
  - Offline support for low-network conditions.
- Evaluation criteria from the hackathon information:
  - Reliability and data accuracy.
  - Number and quality of fetched contacts.
  - Offline functionality.
  - Innovation and extra features.
  - Cross-region information integration.

## Internal scoring proxy-
- Reliability and data accuracy: 30 points.
- Number, quality, and ranking of contacts: 20 points.
- Offline functionality: 20 points.
- Innovation and extra features: 15 points.
- Cross-region architecture: 10 points.
- UI clarity and accessibility: 5 points.

## Working model-
- Shared repository trunk: `main`.
- Roopal branch: `codex/roopal-product-submission`.
- Suyash branch: `codex/suyash-data-geo-backend`.
- Sidhesh branch: `codex/sidhesh-frontend-offline-ai`.
- Final integration branch: `codex/final-roadsos-submission`.
- PR base for all work: `main`.
- Each PR must include:
  - What changed.
  - Screenshots or API examples when applicable.
  - Tests or manual verification performed.
  - Known limitations.
  - Files or contracts other branches must react to.

## Shared product architecture-
- Frontend: React + Vite PWA with service worker.
- Backend: Python FastAPI.
- Data store: SQLite generated from curated JSON seed files, region-scoped.
- Offline layer: service worker for app shell + localStorage for data cache package.
- AI layer: retrieval-based assistant that searches the verified contact database and approved safety templates. No external LLM API. Deterministic intent matching.
- Ranking layer: deterministic multi-factor scoring (distance + confidence + freshness + service priority + availability) before any assistant response.
- Multi-language: template-based incident packet translation (English, Tamil, Hindi).
- Cross-region: bounding-box auto-detection or explicit region parameter. Each region has its own seed files.
- Submission docs: Markdown source, converted to 7-slide PDF and Word document for Unstop.

## Shared contracts-
- Contact record fields:
  - `id`
  - `name`
  - `type`
  - `lat`
  - `lon`
  - `phone`
  - `address`
  - `locality`
  - `region`
  - `country`
  - `source_url`
  - `source_name`
  - `verified_at`
  - `availability`
  - `confidence_score`
  - `confidence_reasons`
  - `notes`
- Service types:
  - `hospital`
  - `trauma_center`
  - `ambulance`
  - `police`
  - `fire_station`
  - `tow`
  - `repair`
  - `fallback_emergency`
- Required API endpoints:
  - `GET /health`
  - `POST /api/nearby-services`
  - `GET /api/cache-package`
  - `POST /api/incident-summary`
  - `POST /api/assistant`

## Judge-dopamine features to build-
- **10-second rescue drill:** the demo includes a visible internal stopwatch proving that location to ranked help can be completed in under 10 seconds.
- **Offline rescue pack:** Chennai contacts, official emergency fallback, source metadata, and approved safety templates remain available in airplane mode.
- **Trust ledger:** each contact has a visible source badge, last verified date, confidence score, and ranking reasons.
- **No-hallucination flight recorder:** assistant responses show whether they came from curated data, approved templates, or refusal logic.
- **Ambulance-ready incident packet:** one tap creates a short shareable summary with location, landmark, injury count, hazards, callback number placeholder, timestamp, and nearest contacts.
- **Bystander mode:** the app gives non-medical role cards: caller, traffic spotter, note taker, location sharer. It keeps people useful without pretending to diagnose.
- **Location confidence ribbon:** shows GPS/manual/cached location status so judges see the app is honest about uncertainty.
- **Panic-friendly UI:** large hit targets, calm copy, low-light contrast, manual location fallback, and no buried emergency button.
- **Cross-region adapter:** a small second region proves that contacts, fallbacks, labels, and emergency numbers are data-driven instead of Chennai-hardcoded.
- **Chaos-mode demo:** final dry run intentionally covers offline, GPS denied, no nearby contacts, and assistant asked for unavailable information.

## Merge 1: Foundation freeze and first branch PRs-

### Goal-
Create a shared base so all three branches can work for a long stretch without breaking contracts.

### Roopal tasks-
- Create or refine product-level docs:
  - `README.md`
  - `plan.md`
  - `docs/pr_review_checklist.md`
  - `docs/submission_requirements.md`
  - `demo/golden_scenario.md`
- Freeze first version of shared contracts:
  - `contracts/contact.schema.json`
  - `contracts/api.examples.json`
- Define the review checklist Roopal will use for all PRs:
  - Does the PR preserve the RoadSoS scope?
  - Does it avoid invented emergency data?
  - Does it respect API and data contracts?
  - Does it include tests or manual verification?
  - Does it improve the golden demo?
- Prepare PR review labels:
  - `contract-change`
  - `data-risk`
  - `offline-risk`
  - `demo-critical`
  - `submission-docs`
- Create PR when:
  - Base docs and contracts are committed.
  - Each teammate can branch without needing private instructions.
  - `main` has a clear README and folder map.
- Suggested PR title:
  - `Bootstrap RoadSoS planning and shared contracts`

### Suyash tasks-
- Read:
  - `info.md`
  - `plan.md`
  - `contracts/contact.schema.json`
  - `contracts/api.examples.json`
  - `data/README.md`
- Create branch:
  - `codex/suyash-data-geo-backend`
- Implement first data/geo foundation:
  - Validate the contact schema locally.
  - Add data validation script plan or implementation.
  - Create deterministic distance-ranking utility.
  - Create confidence scoring rules.
  - Create dedupe rules by normalized name, phone, and nearby coordinates.
  - Prepare fixture contacts for tests only; mark fixtures clearly as non-production.
  - Keep source-backed production data separate from test fixtures.
- Backend foundation:
  - Confirm FastAPI app starts.
  - Add request and response models that match `contracts/api.examples.json`.
  - Add endpoint stubs or first implementation for `/api/nearby-services`.
- Create PR when:
  - Ranking utility works with fixture data.
  - Contact schema validation passes.
  - First backend route can return deterministic fixture results.
  - No production contact is unsourced.
- Suggested PR title:
  - `Add data schema validation and geo ranking foundation`

### Sidhesh tasks-
- Read:
  - `info.md`
  - `plan.md`
  - `contracts/api.examples.json`
  - `frontend/README.md`
  - `demo/golden_scenario.md`
- Create branch:
  - `codex/sidhesh-frontend-offline-ai`
- Implement first frontend/PWA foundation:
  - Create emergency-first screen.
  - Add manual location entry state.
  - Add GPS permission state.
  - Add contact card component using mock contract data.
  - Add offline status indicator.
  - Add responsive mobile layout.
  - Add design tokens for colors, spacing, and focus states.
  - Add placeholder route for incident packet.
- Create PR when:
  - The PWA shell runs locally.
  - Emergency screen is first viewport.
  - Mock contact card matches API contract.
  - Offline indicator reacts to browser network state.
  - Mobile viewport is usable.
- Suggested PR title:
  - `Build emergency-first PWA shell`

### Merge 1 PR order-
1. Roopal PR: contracts and docs.
2. Suyash PR: data/geo/backend foundation.
3. Sidhesh PR: frontend shell.

### Merge 1 acceptance gate-
- `main` contains stable contracts.
- `main` has visible ownership boundaries.
- `main` can support three parallel streams.
- Any contract change after this point must be called out in PR description.

## Merge 2: Reliable core product-

### Goal-
Build the working RoadSoS vertical slice: location in, ranked emergency help out, with backend and frontend connected.

### Roopal tasks-
- Review Suyash PR for:
  - Data provenance.
  - No generated contacts.
  - Ranking explainability.
  - Bad-coordinate behavior.
  - Test coverage.
- Review Sidhesh PR for:
  - First-screen emergency flow.
  - Mobile usability.
  - Offline states.
  - Accessibility.
  - Contract compatibility.
- Update `docs/submission_requirements.md` with any package or assumption changes.
- Keep `demo/golden_scenario.md` aligned with the actual app.
- Create PR when:
  - Review-driven documentation changes are needed.
  - Demo script changes based on working behavior.
  - Submission assumptions need to be recorded.
- Suggested PR title:
  - `Update demo and submission notes after core integration`

### Suyash tasks-
- Curate Chennai/IIT Madras source-backed contacts:
  - Hospitals and trauma-capable facilities.
  - Police stations.
  - Ambulance or official emergency fallbacks.
  - Tow or roadside support contacts only if source-backed.
  - Repair/puncture contacts only if reliable and useful.
- For every contact, capture:
  - Source name.
  - Source URL.
  - Verification date.
  - Coordinates.
  - Phone.
  - Service type.
  - Confidence reasons.
- Build SQLite generation:
  - Seed JSON to SQLite.
  - Repeatable command.
  - Versioned cache package output.
- Implement backend routes:
  - `POST /api/nearby-services`
  - `GET /api/cache-package`
  - `POST /api/incident-summary`
- Implement fallback behavior:
  - National emergency fallback when local results are weak.
  - Expand-radius guidance when no nearby service is found.
  - Clear response when coordinates are invalid.
- Add tests:
  - Schema validation.
  - Distance sorting.
  - Confidence scoring.
  - Dedupe.
  - Empty dataset fallback.
  - Invalid coordinates.
- Create PR when:
  - Chennai data returns useful ranked results for IIT Madras coordinates.
  - Backend endpoints satisfy the API examples.
  - Tests pass.
  - Data-source notes are complete.
- Suggested PR title:
  - `Implement source-backed Chennai rescue data and core APIs`

### Sidhesh tasks-
- Connect frontend to backend:
  - Call `/api/nearby-services`.
  - Render ranked contacts.
  - Render fallback contacts separately.
  - Show loading, error, offline, and empty states.
- Build emergency interaction flow:
  - Detect location.
  - Manual location fallback.
  - Service filters for hospital, ambulance, police, tow, repair.
  - One-tap call links.
  - Copy/share incident packet.
  - Show nearest landmark field.
- Build offline layer:
  - Cache package fetch.
  - Local fallback when backend is unavailable.
  - Stale cache indicator.
  - Offline mode test instructions.
- Build trust UI:
  - Source badge.
  - Confidence score.
  - Last verified date.
  - Ranking reasons.
  - Location confidence ribbon.
- Add frontend tests or documented manual checks:
  - GPS allowed.
  - GPS denied.
  - Offline after first load.
  - No nearby services.
  - Mobile viewport.
- Create PR when:
  - The emergency flow works against backend or a contract-compatible mock.
  - Offline Chennai cache can render contacts.
  - UI remains usable on phone-sized screens.
  - Trust metadata is visible on each contact.
- Suggested PR title:
  - `Connect PWA emergency flow to RoadSoS APIs`

### Merge 2 PR order-
1. Suyash PR: data and backend APIs.
2. Sidhesh PR: connected PWA and offline flow.
3. Roopal PR if docs/demo assumptions changed.

### Merge 2 acceptance gate-
- Online IIT Madras demo works.
- Offline cached demo works after first load or bundled cache.
- Incident packet can be generated.
- Contacts show trust metadata.
- Assistant is still allowed to be minimal, but must not hallucinate.

## Merge 3: Cross-region, data depth, and intelligent assistant-

### Goal-
Address the three biggest scoring gaps: cross-region portability (currently 0/10 pts), contact breadth (only 11 contacts for 20-pt category), and assistant intelligence (static stub for 15-pt innovation category). Also upgrade offline to true PWA with service worker.

### Gap analysis driving this merge-
- **Cross-region (10 pts):** Zero second-region data exists. A Bengaluru portability sample with 5+ source-backed contacts plus regional fallbacks proves the schema is not Chennai-hardcoded.
- **Contact count (20 pts):** Only 11 production contacts. Missing: fire stations, more hospitals near IIT Madras, repair/puncture (even one verifiable source), additional trauma centres. Target: 20-25 Chennai contacts.
- **Innovation (15 pts):** The assistant always returns the same 3-line refusal. A retrieval-based assistant that searches the verified dataset and returns relevant contacts with citations — while still refusing to invent — turns the "AI-powered chatbot" requirement from a liability into a strength.
- **Offline (20 pts):** localStorage works but the app is not installable. Service worker makes the PWA installable to home screen and truly offline-first (resources cached, not just data).

### Suyash tasks-
- **Expand Chennai contacts to 20-25 entries:**
  - Add fire stations near IIT Madras (Adyar, Velachery fire stations — TN Fire and Rescue Services official site).
  - Add more hospitals: Kilpauk Medical College Hospital, Institute of Child Health, Government Hospital of Thoracic Medicine (Tambaram), Vijaya Hospital (closest private to IIT Madras on Velachery side).
  - Add at least 1 verifiable repair/puncture or roadside mechanic entry (e.g., TVS Authorized Service near Adyar from official TVS dealer locator). Document honestly if unverifiable.
  - Add service type `fire_station` to the schema enum.
  - Every new contact must have: official source URL, verification date, coordinates from Google Maps/OSM, phone from official listing.
- **Add Bengaluru portability region:**
  - Create `data/regions/bengaluru/contacts.seed.json` with 5-8 source-backed contacts:
    - Victoria Hospital (trauma).
    - Nimhans (neurological trauma).
    - Bowring Hospital.
    - Koramangala Police Station.
    - Bengaluru 108 ambulance (same EMRI network).
    - At least one fire station.
  - Create `data/regions/bengaluru/fallbacks.seed.json` with Karnataka-specific fallbacks (same 112, 108, 100 + Karnataka State Emergency helpline if distinct).
  - Add `region` query parameter to `/api/nearby-services` — default `"chennai"`, also accepts `"bengaluru"`.
  - Backend resolves contacts from the correct region seed file based on the `region` parameter.
  - The region can also be auto-detected: if coordinates fall within a known bounding box (Chennai metro: roughly 12.8–13.2 lat, 80.0–80.35 lon; Bengaluru metro: roughly 12.85–13.1 lat, 77.45–77.75 lon), use that region. Otherwise fall back to national fallbacks only.
  - Update `docs/data_sources.md` with Bengaluru sources.
- **Implement retrieval-based assistant (no external LLM API):**
  - The assistant must search the verified contact dataset and approved templates to answer user questions.
  - Implement keyword/intent matching on the user message:
    - "hospital" / "trauma" → return hospitals/trauma centres sorted by distance.
    - "ambulance" / "108" → return ambulance contacts and fallback.
    - "police" / "FIR" → return police stations sorted by distance.
    - "tow" / "breakdown" / "puncture" → return tow/repair contacts.
    - "fire" → return fire stations.
    - "offline" / "no network" → return approved safety templates about offline usage.
    - "first aid" / "what do I do" → return approved safety templates only.
  - If the query matches a known intent, return relevant contacts with `used_sources: ["verified_contacts_db"]` and `refusal_reason: null`.
  - If the query asks for real-time info ("is the ambulance coming?", "ETA", "availability now") → refuse with `refusal_reason: "realtime_availability_not_supported"`.
  - If the query asks for medical/legal advice → refuse with `refusal_reason: "medical_legal_advice_not_provided"`.
  - If no intent matches → refuse with `refusal_reason: "query_outside_verified_dataset"`.
  - The assistant MUST NEVER invent a contact, phone number, or availability claim.
  - Update `AssistantResponse` model to include `matched_contacts: list[ContactRecord]` (may be empty).
  - Add `contracts/api.examples.json` with updated assistant example.
  - Add tests: intent matching returns correct contacts, refusal for real-time queries, refusal for medical advice, deterministic results.
- **Improve ranking with multi-factor scoring:**
  - Add freshness penalty: contacts verified > 90 days ago get a confidence reduction.
  - Add service-priority boost: trauma_center > hospital > ambulance > police > tow > repair for accident scenarios.
  - Add availability boost: "24x7" contacts rank above "office_hours" or unknown.
  - Return `data_freshness_days` in the ranking reasons so the frontend can show staleness.
- **Add chaos-case tests:**
  - Region with zero local contacts (e.g., coordinates in ocean).
  - All contacts have stale verification dates (> 180 days).
  - Duplicate phone numbers across regions.
  - Contact with coordinates exactly at 0,0 (null island).
  - Bengaluru coordinates return Bengaluru data, not Chennai data.
- Create PR when:
  - 20+ Chennai contacts pass validation.
  - Bengaluru region returns ranked results for Koramangala coordinates.
  - Assistant returns relevant contacts for "nearest hospital" query at IIT Madras.
  - Assistant refuses "is the ambulance coming?" query.
  - All chaos-case tests pass.
- Suggested PR title:
  - `Add cross-region portability, retrieval assistant, and expanded contact set`

### Sidhesh tasks-
- **Implement service worker for true PWA:**
  - Register a service worker that caches the app shell (HTML, JS, CSS, manifest).
  - On install: cache all static assets so the app loads without network.
  - On fetch: serve from cache first, fall back to network (cache-first strategy for static assets).
  - API requests: network-first with fallback to localStorage cached data (existing mechanism).
  - Add "Install RoadSoS" prompt when the PWA install criteria are met (beforeinstallprompt event).
  - Add `offline.html` fallback page for when both SW cache and network fail.
  - Test: airplane mode from cold start → app shell loads from SW cache → shows ERSS fallback.
- **Region selector in UI:**
  - Add a compact region dropdown or toggle: "Chennai" / "Bengaluru" (default: auto-detect from coordinates).
  - Pass `region` parameter to `/api/nearby-services`.
  - Cache package fetches both regions or the selected region.
  - Show the active region name in the status row.
- **Upgrade assistant panel to show retrieved contacts:**
  - When assistant returns `matched_contacts`, render them as mini contact cards below the answer.
  - Show `used_sources` as badges (e.g., "verified_contacts_db", "approved_safety_templates").
  - When `refusal_reason` is present, show it in a distinct warning style.
  - Add quick-ask chips: "Nearest hospital", "Nearest police", "What do I do?", "Fire station" — tapping sends that query to the assistant.
- **Multi-language incident packet:**
  - Add a language toggle on the incident packet section: English (default) / Tamil / Hindi.
  - For Tamil and Hindi: maintain a small lookup table of 15-20 key phrases (injury, hazard, location, ambulance, police, fire, help, accident, hospital, etc.) used to template the packet.
  - The translated packet is approximate (keyword substitution, not full NLP translation) but demonstrates multi-language accessibility to judges.
  - Include a note: "Translation is template-based for critical emergency terms."
- **Dark/night mode:**
  - Add automatic dark mode (respects `prefers-color-scheme: dark` media query).
  - Emergency scenarios often happen at night or low-light. Dark mode reduces glare and shows judges the app handles real conditions.
  - Ensure contrast ratios remain WCAG AA compliant in dark mode.
- Create PR when:
  - PWA installs on Chrome mobile/desktop.
  - Offline cold start loads the app shell from service worker.
  - Region selector switches between Chennai and Bengaluru data.
  - Assistant shows retrieved contacts for "nearest hospital" query.
  - Multi-language packet generates in at least Tamil.
  - Dark mode activates automatically in dark system preference.
- Suggested PR title:
  - `Add installable PWA, region selector, smart assistant UI, and night mode`

### Roopal tasks-
- Review Suyash PR for:
  - Cross-region data provenance (Bengaluru sources must be verifiable).
  - Assistant retrieval logic (no invented contacts, deterministic).
  - Schema change for `fire_station` type.
  - New contacts all have official sources.
- Review Sidhesh PR for:
  - Service worker correctness (does it break existing cache logic?).
  - Region selector does not confuse the user.
  - Assistant UI does not make the app look like it's "thinking" (no false loading spinners for instant retrieval).
  - Dark mode contrast compliance.
- Update `demo/golden_scenario.md`:
  - Add Beat 10: Cross-region portability (switch to Bengaluru coordinates, show Bengaluru contacts appear).
  - Add Beat 11: Smart assistant retrieval ("nearest hospital" → returns ranked contacts with citations).
  - Update Beat 8: Assistant now answers dataset queries AND refuses real-time queries.
- Update `docs/submission_requirements.md`:
  - Record new packages (workbox or custom SW).
  - Record multi-language approach (template-based, not LLM).
  - Record cross-region architecture.
- Draft 7-slide presentation outline (Markdown source):
  - Slide 1: Welcome — team name, problem statement, one-line pitch.
  - Slide 2: Golden-hour pain — "4 minutes average response time in Chennai but 65% of calls give wrong hospital info."
  - Slide 3: RoadSoS in action — screenshot of ranked contacts at IIT Madras, annotated with trust ledger.
  - Slide 4: Architecture — offline-first PWA, deterministic ranking (no AI gambling on contacts), retrieval-only assistant.
  - Slide 5: Reliability proof — screenshot of trust ledger, data freshness indicator, no-hallucination badge, cross-region switch.
  - Slide 6: Innovation — 10-second drill, installable PWA, multi-language packet, bystander mode, night mode.
  - Slide 7: Thank you — team members, GitHub repo link, "Every contact is source-backed, every refusal is honest."
- Create PR when:
  - Demo script has cross-region and smart assistant beats.
  - 7-slide outline is complete in Markdown.
  - Submission docs reflect new features.
- Suggested PR title:
  - `Draft 7-slide deck, update demo for cross-region and smart assistant`

### Merge 3 PR order-
1. Suyash PR: cross-region data, assistant logic, expanded contacts.
2. Sidhesh PR: PWA service worker, region selector, assistant UI, translations, dark mode.
3. Roopal PR: deck outline, demo script update, submission docs.

### Merge 3 acceptance gate-
- Bengaluru coordinates return Bengaluru-specific ranked contacts.
- Chennai now has 20+ contacts across all service types.
- "Nearest hospital" to assistant returns ranked results with source citations.
- "Is the ambulance coming?" to assistant returns a clear refusal with reason.
- PWA installs and loads from cold offline start.
- Multi-language incident packet works in at least English and Tamil.
- Dark mode does not break readability.
- Cross-region claim is backed by actual data and a visible region switch.
- No feature invents contacts or makes dispatch guarantees.

## Merge 4: Polish, chaos testing, and demo hardening-

### Goal-
Ensure the app is demo-proof: every judge interaction path works reliably, edge cases are handled gracefully, and the submission narrative is tight.

### Suyash tasks-
- **Data reliability hardening:**
  - Re-verify all source URLs (automated script: fetch each URL, report HTTP status, flag 404s/500s).
  - Add `scripts/verify_sources.py` that checks every `source_url` in seed files.
  - Add a freshness audit: any contact with `verified_at` older than 30 days from submission date gets re-verified or flagged.
  - Add 3-5 more Bengaluru contacts if sources are available (strengthens the 20-pt contact count score).
  - Ensure no fixture data leaks into any production path (automated test).
- **Chaos-mode backend hardening:**
  - API must handle: empty request body (400), extremely large radius (cap at 100 km), negative injury count (422), XSS in landmark field (sanitize or reject), unicode in all text fields (must not crash).
  - Add rate-limit headers (informational, not enforced — shows judges you thought about production).
  - Ensure SQLite build is idempotent and deterministic (already tested but add a hash comparison test).
- **Freeze dataset version:**
  - Bump `OFFLINE_CACHE_VERSION` to `"merge4-final-0"`.
  - Run `build_db.py` one final time and commit the version file.
  - Document the final contact counts in README.
- Create PR when:
  - Source URL verification script passes with all 200s.
  - All chaos tests pass.
  - Dataset version is frozen.
  - No fixture data in production paths.
- Suggested PR title:
  - `Harden data reliability and chaos-case coverage for submission`

### Sidhesh tasks-
- **UI polish pass:**
  - Verify all text is readable at 320px, 375px, and 414px widths (common phones).
  - Verify no button is smaller than 44x44 px touch target.
  - Verify focus states on all interactive elements (keyboard navigation for accessibility).
  - Add subtle loading skeleton or shimmer for contacts during API call (not a spinner — feels faster).
  - Add haptic feedback on call button tap (navigator.vibrate on mobile if supported).
- **Screenshot capture for deck:**
  - Capture clean screenshots of:
    - Full rescue drill with ranked contacts and timer showing < 10s.
    - Trust ledger expanded on a contact card.
    - Offline mode with stale cache indicator.
    - Cross-region switch to Bengaluru.
    - Assistant showing retrieved contacts.
    - Assistant showing refusal.
    - Incident packet with Tamil translation.
    - Dark mode view.
    - PWA install prompt.
  - Provide screenshots in `docs/screenshots/` folder (PNG, 375px wide for mobile feel).
- **Offline verification:**
  - Document exact steps for judges to verify offline: "1. Open app. 2. Tap Refresh cache. 3. Go to DevTools → Network → Offline. 4. Reload page. 5. App loads from service worker. 6. Start rescue drill. 7. Cached contacts appear."
  - Verify this sequence works on Chrome (desktop), Chrome (Android), and Safari (iOS) if possible.
- **Performance check:**
  - Lighthouse audit: target 90+ on Performance, Accessibility, and PWA scores.
  - If Lighthouse flags issues, fix the top 3.
- Create PR when:
  - All screenshots are captured.
  - Offline verification steps documented and tested.
  - Touch targets are all 44px+.
  - Lighthouse scores are documented.
- Suggested PR title:
  - `Polish UI, capture screenshots, and verify offline/accessibility`

### Roopal tasks-
- **Finalize 7-slide presentation:**
  - Convert Markdown deck outline into the actual 7-slide format (PowerPoint/PDF/Google Slides).
  - Each slide: one key visual, 3-5 bullet points max, no walls of text.
  - Slide 3 and 5 must use Sidhesh's screenshots.
  - Export as PDF for submission.
- **Write Word submission document:**
  - Complete code details section: tech stack, folder structure, how to run.
  - Software packages section: all `requirements.txt` and `package.json` dependencies with versions.
  - Assumptions section: pull from `docs/assumptions.md`, format for Word.
  - Dataset/source documentation: pull from `docs/data_sources.md`.
  - Known limitations: honest list.
- **Final demo rehearsal:**
  - Run the full golden_scenario.md beat sequence end to end.
  - Time it — must complete in under 60 seconds for judges.
  - Verify every stated expected behavior actually happens.
  - Fix any demo script lies (button names, expected outputs).
- **Update README.md:**
  - Ensure a first-time cloner can run the project in under 2 minutes.
  - Add one-command setup: `cd backend && pip install -r requirements.txt && python -m scripts.build_db && uvicorn app.main:app --port 8000` and `cd frontend && npm install && npm run dev`.
  - Add link to demo script.
  - Add link to 7-slide deck.
- Create PR when:
  - Deck PDF is ready.
  - Word document is ready.
  - README has complete setup instructions.
  - Demo rehearsal passes.
- Suggested PR title:
  - `Finalize submission deck, Word document, and README`

### Merge 4 PR order-
1. Suyash PR: data hardening and chaos tests.
2. Sidhesh PR: UI polish and screenshots.
3. Roopal PR: deck, Word doc, README.

### Merge 4 acceptance gate-
- Source URL verification passes (all URLs return 200).
- All chaos tests pass.
- Screenshots exist for all key flows.
- 7-slide deck is a PDF ready for Unstop.
- Word document covers all required sections.
- README lets a stranger run the project.
- Full demo rehearsal completes in under 60 seconds.
- Lighthouse PWA score is 90+.

## Merge 5: Submission freeze and final integration-

### Goal-
Stop all feature work. Fix only bugs found during final testing. Produce the exact submission artifacts for Unstop.

### Roopal tasks-
- Create final tag or branch:
  - `v1.0-submission`
- Run complete end-to-end verification:
  - Fresh clone → install → run → demo passes.
  - Offline flow works.
  - Cross-region flow works.
  - Assistant retrieval and refusal both work.
  - Incident packet generates and copies.
  - PWA installs.
- Verify submission checklist:
  - Code repository (zip or GitHub link as per Unstop requirements).
  - 7-slide PDF presentation.
  - Word document with code details, packages, and assumptions.
  - All committed to repository.
- Do NOT merge any new feature after this point.
- Only merge: typo fixes, broken link fixes, demo script corrections.
- Suggested PR title:
  - `Submission freeze: tag v1.0 for Unstop`

### Suyash tasks-
- Run final `python -m scripts.validate_data` and paste output in PR comment.
- Run final `python -m scripts.verify_sources` and paste output.
- Confirm final contact counts: X Chennai + Y Bengaluru + Z fallbacks.
- Confirm no fixture data in production.
- Confirm OFFLINE_CACHE_VERSION matches build output.

### Sidhesh tasks-
- Run final Lighthouse audit and paste scores.
- Confirm PWA install works on at least one mobile device or emulator.
- Confirm offline cold start works.
- Confirm all screenshots in `docs/screenshots/` match current UI (no stale screenshots).
- Run `npm run build` — zero warnings, zero errors.

### Merge 5 PR order-
1. Suyash: data verification comment (no code PR unless bug found).
2. Sidhesh: frontend verification comment (no code PR unless bug found).
3. Roopal: submission freeze PR (tag + final README update if needed).

### Merge 5 acceptance gate-
- Fresh clone + setup + demo works for a stranger.
- Submission assets (deck PDF + Word doc + code) are all committed.
- No feature has been added after Merge 4.
- The repository is ready for Unstop upload before May 31, 2026, 11:59 PM IST.
- Tag `v1.0-submission` exists on the final commit.

## Review checklist for Roopal-
- Does the PR improve RoadSoS evaluation criteria?
- Is any emergency contact invented, unsourced, stale, or unclear?
- Are source URLs and verification dates present?
- Are contracts updated when request/response shapes change?
- Does the backend fail safely?
- Does the frontend still work in mobile viewport?
- Does offline mode still work (both localStorage AND service worker)?
- Does the cross-region flow still work (both Chennai and Bengaluru)?
- Does the assistant refuse unsafe queries and retrieve for safe ones?
- Are screenshots/API examples included where useful?
- Are tests or manual checks included?
- Is the PR small enough to merge without blocking the other branch?
- Does the change make the judge demo stronger?
- Does the change require updates to the 7-slide deck or Word document?

## Definition of done-
- A first-time user can open the app and understand the emergency action within 3 seconds.
- A bystander can reach ranked help from IIT Madras coordinates in under 10 seconds.
- Offline mode returns useful cached emergency guidance (service worker + localStorage).
- The PWA is installable to home screen.
- The app never fabricates contacts.
- The assistant refuses unsupported emergency/contact claims but retrieves from verified data for supported queries.
- Every contact has source and confidence metadata.
- At least one second-region (Bengaluru) sample proves portability with real contacts.
- Chennai has 20+ source-backed contacts across hospital, trauma, police, ambulance, fire, tow, and repair types.
- Incident packets can be generated in English and Tamil.
- Dark mode works for night-time accident scenarios.
- The final deck tells the story clearly in 7 slides.
- The Word document covers code details, packages, and assumptions.
- The assumptions document is honest about limits.
- Demo rehearsal completes in under 60 seconds.
- Lighthouse PWA score is 90+.
- The repository is ready for Unstop submission before May 31, 2026, 11:59 PM IST.

