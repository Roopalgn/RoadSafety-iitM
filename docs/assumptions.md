# Assumptions

## Scope

- RoadSoS is built for the RoadSoS track only; DriveLegal and RoadWatch features are explicitly out of scope.
- The primary demo region is IIT Madras / Chennai (coordinates: lat 12.9915, lon 80.2337).
- A second-region portability sample is a target for proving the schema across cities; coordinates outside known regions receive national fallbacks only.

## Data

- Production emergency contacts must be curated manually from reliable, verifiable public sources.
- AI may summarize user-provided incident details but must not create emergency contacts, phone numbers, or addresses.
- Every production contact requires `source_url`, `source_name`, `verified_at`, and `confidence_reasons`.
- Contacts with no reliable coordinates are excluded from distance ranking or have `lat`/`lon` set to `null`.
- Test fixtures must live outside production seed files and be clearly marked as non-production.
- The offline cache is scoped to curated demo regions; it does not cover all of India.

## Backend and assistant

- The assistant searches curated contacts, official fallbacks, and approved safety templates only.
- The assistant does not call external LLM APIs for emergency contact data.
- If the assistant cannot match a query to verified data/templates, it refuses with a clear `refusal_reason`.
- Real-time queries (ETA, dispatch status, `is the ambulance coming?`) are always refused.
- Medical diagnosis, triage advice, and legal advice queries are always refused.
- RoadSoS does not dispatch emergency services.
- RoadSoS does not guarantee real-time availability of any listed contact.
- Ranking must stay deterministic and explainable: distance, confidence, freshness, service priority, and availability are the intended ranking signals.

## Offline

- The offline layer has two tiers: (1) service worker caches the app shell (HTML, JS, CSS) after first load, and (2) browser `localStorage` stores the `/api/cache-package` data response.
- The PWA can be installed when the browser exposes the install prompt and manifest requirements are satisfied.
- The user must tap **Refresh cache** at least once while online to populate the local data store. The app always falls back to ERSS 112 if no data cache exists.
- Stale cache is shown with a visible timestamp indicator; it does not silently serve old data.
- Offline incident packet generation works locally without a backend call.

## Scoring and evaluation

- Exact judge point weights are not public; `plan.md` uses an internal scoring proxy based on the stated evaluation criteria in `info.md`.
- The 10-second drill target is a UX goal for the polished demo, not a contractual guarantee for all network conditions.
