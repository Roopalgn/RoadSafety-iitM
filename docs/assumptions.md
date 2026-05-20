# Assumptions

## Scope

- RoadSoS is built for the RoadSoS track only; DriveLegal and RoadWatch features are explicitly out of scope.
- The primary demo region is IIT Madras / Chennai (coordinates: lat 12.9915, lon 80.2337).
- A small second-region portability sample is included to show the schema is not Chennai-hardcoded.

## Data

- Production emergency contacts must be curated manually from reliable, verifiable public sources.
- AI may summarize user-provided incident details but must not create emergency contacts, phone numbers, or addresses.
- Every production contact requires `source_url`, `source_name`, `verified_at`, and `confidence_reasons`.
- Contacts with no reliable coordinates are excluded from distance ranking or have `lat`/`lon` set to `null`.
- Test fixtures must live outside production seed files and be clearly marked as non-production.
- The offline cache is scoped to the curated demo region; it does not cover all of India.

## Backend and assistant

- The assistant uses retrieval from `contacts.seed.json`, `fallbacks.seed.json`, and approved safety templates only.
- The assistant does not call external LLM APIs for emergency contact data.
- If the assistant cannot verify something from curated data, it says so and shows official fallback guidance.
- RoadSoS does not dispatch emergency services.
- RoadSoS does not guarantee real-time availability of any listed contact.
- RoadSoS does not provide medical diagnosis, triage advice, or legal advice.

## Offline

- The offline layer uses browser `localStorage` to store the `/api/cache-package` response. This is simpler and more broadly compatible than a service worker and sufficient for the demo scenario.
- The user must tap **Refresh cache** at least once while online to populate the local store. The app always falls back to ERSS 112 if no cache exists.
- Stale cache is shown with a visible timestamp indicator; it does not silently serve old data.
- The first offline version prioritises the Chennai / IIT Madras region (and fixture data until real contacts land in Merge 2).
- Offline incident packet generation works locally without a backend call.

## Scoring and evaluation

- Exact judge point weights are not public; `plan.md` uses an internal scoring proxy based on the stated evaluation criteria in `info.md`.
- The 10-second drill target is a UX goal for the polished demo, not a contractual guarantee for all network conditions.

