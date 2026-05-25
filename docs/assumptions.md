# Assumptions

## Scope

- RoadSoS is built for the RoadSoS track only; DriveLegal and RoadWatch features are explicitly out of scope.
- The primary demo region is IIT Madras / Chennai (coordinates: lat 12.9915, lon 80.2337).
- A second-region portability sample (Bengaluru, 5-8 contacts) proves the schema works across cities.
- Cross-region auto-detection uses bounding boxes; coordinates outside known regions receive national fallbacks only.

## Data

- Production emergency contacts must be curated manually from reliable, verifiable public sources.
- AI may summarize user-provided incident details but must not create emergency contacts, phone numbers, or addresses.
- Every production contact requires `source_url`, `source_name`, `verified_at`, and `confidence_reasons`.
- Contacts with no reliable coordinates are excluded from distance ranking or have `lat`/`lon` set to `null`.
- Test fixtures must live outside production seed files and be clearly marked as non-production.
- The offline cache is scoped to the curated demo region; it does not cover all of India.

## Backend and assistant

- The assistant uses deterministic keyword/intent matching to search `contacts.seed.json`, `fallbacks.seed.json`, and approved safety templates.
- Supported intents: hospital, trauma, ambulance, police, fire, tow, breakdown, puncture, offline help, first aid.
- The assistant does not call external LLM APIs for emergency contact data.
- If the assistant cannot match a query to its verified dataset, it refuses with a clear `refusal_reason`.
- Real-time queries (ETA, dispatch status, "is the ambulance coming?") are always refused.
- Medical diagnosis, triage advice, and legal advice queries are always refused.
- RoadSoS does not dispatch emergency services.
- RoadSoS does not guarantee real-time availability of any listed contact.
- Multi-factor ranking: distance + confidence + freshness + service priority + availability. Contacts verified > 90 days ago get a confidence penalty.

## Offline

- The offline layer has two tiers: (1) service worker caches the app shell (HTML, JS, CSS) for cold offline start, and (2) browser `localStorage` stores the `/api/cache-package` data response.
- The PWA is installable to home screen via the service worker and web manifest.
- The user must tap **Refresh cache** at least once while online to populate the data store. The app always falls back to ERSS 112 if no data cache exists.
- Stale cache is shown with a visible timestamp indicator; it does not silently serve old data.
- The offline data covers Chennai and Bengaluru demo regions (not all of India).
- Offline incident packet generation works locally without a backend call.
- Multi-language incident packets (Tamil, Hindi) work offline using template-based keyword substitution.

## Scoring and evaluation

- Exact judge point weights are not public; `plan.md` uses an internal scoring proxy based on the stated evaluation criteria in `info.md`.
- The 10-second drill target is a UX goal for the polished demo, not a contractual guarantee for all network conditions.

