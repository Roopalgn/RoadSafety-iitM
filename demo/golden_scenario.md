# Golden Demo Scenario

## Scenario

A bystander near IIT Madras sees a road accident and needs reliable emergency help fast. The demo proves the app can deliver trusted emergency contacts within 10 seconds, works without a network, and refuses to invent safety-critical data.

## Setup before demo

- Start backend: `cd backend && uvicorn app.main:app --reload --port 8000`
- Start frontend: `cd frontend && npm run dev` (Vite proxies `/api` → `http://localhost:8000`)
- Open browser at `http://localhost:5173` in DevTools mobile mode (375 px wide)

## Test coordinates

- **Primary location:** IIT Madras main gate — lat `12.9915`, lon `80.2337`
- **Nearby landmark for incident packet:** "IIT Madras main gate"
- **Second-region portability:** Bengaluru / Koramangala — lat `12.9716`, lon `77.5946` — should return Bengaluru-specific contacts (Victoria Hospital, Nimhans, Koramangala Police, etc.)
- **Unknown region test:** lat `28.6139`, lon `77.2090` (Delhi — no region data) — should return national fallbacks only (ERSS 112, 108, 100)

## Demo roles

- **Presenter:** drives the browser, speaks to judges.
- **Timer watcher:** watches the timer card in the top-right of the app and calls out the elapsed time aloud.
- (Solo demo: presenter narrates both roles.)

## Demo beats

### Beat 1 — First screen
- Open RoadSoS on a phone-sized viewport.
- Expected: The rescue drill screen is the first and only viewport. No marketing page. The status row shows three pills: "No hallucinated contacts", online/offline state, and cache status.

### Beat 2 — Location input
- The lat/lon fields default to IIT Madras (`12.9915`, `80.2337`) and landmark "IIT Madras main gate".
- Optionally tap "Use GPS" to capture live location. If GPS is denied, manual fields remain active.
- Expected: Location confidence ribbon (status row) shows "Online API mode" or "Offline rescue mode".

### Beat 3 — 10-second rescue drill
- Say aloud: "Starting now."
- Tap **Start rescue drill**.
- Expected: The timer card shows elapsed seconds live. Ranked emergency contacts appear. Timer stops.
- Narrate: "Police, hospital, ambulance — ranked by distance, all sourced. Timer card proves it."

### Beat 4 — Trust ledger
- Click **Trust ledger and ranking reasons** on any contact card.
- Expected: Expandable `<details>` opens showing distance, confidence score, source name, verification date, and ranking reasons.
- Narrate: "Every contact tells you where it came from and when it was last verified."

### Beat 5 — Bystander mode
- Scroll to the **Bystander mode** card (always visible, no tap needed).
- Expected: Four role cards: Caller, Traffic spotter, Note taker, Location sharer — each with a plain instruction.
- Narrate: "The app keeps bystanders useful without pretending to diagnose."

### Beat 6 — Incident packet
- The incident packet form defaults to 1 injured, hazards "traffic, fuel smell", notes "Two-wheeler collision. Rider conscious."
- Tap **Generate packet** (uses backend when online, generates locally when offline).
- Tap **Copy packet**.
- Expected: Short structured summary with location, landmark, injury count, hazards, notes, timestamp, medical disclaimer. Clipboard copy confirmed.

### Beat 7 — Offline mode
- First tap **Refresh cache** while online to store the rescue pack in localStorage.
- Then put the browser in offline mode (DevTools → Network → Offline).
- Tap **Start rescue drill** again.
- Expected: Cached contacts or ERSS 112 fallback load immediately. Warning box shows "Using cached rescue pack from [timestamp]." Status row switches to "Offline rescue mode".
- Narrate: "Airplane mode, still useful. Cache was stored from the previous online session."

### Beat 8 — Smart assistant retrieval
- Type "nearest hospital" in the assistant panel.
- Tap **Ask guarded assistant**.
- Expected: Backend returns ranked hospitals near the coordinates with source citations. The UI shows mini contact cards below the answer with `used_sources: ["verified_contacts_db"]` badge. No refusal — this is a supported query.
- Narrate: "Ask about hospitals, police, fire, ambulance — the assistant retrieves from our verified dataset."

### Beat 9 — Assistant refusal for real-time queries
- Type "Is the ambulance coming?" in the assistant panel.
- Tap **Ask guarded assistant**.
- Expected: Backend returns a clear refusal with `refusal_reason: "realtime_availability_not_supported"`. No contact cards. Warning-style UI.
- Narrate: "The assistant admits what it cannot do. It never invents live availability or dispatch status."

### Beat 10 — Cross-region portability
- Change lat to `12.9716`, lon to `77.5946` (Bengaluru / Koramangala).
- Select **Bengaluru** from the region selector (or let auto-detect trigger).
- Tap **Start rescue drill**.
- Expected: Bengaluru-specific contacts appear — Victoria Hospital, Nimhans, Koramangala Police Station, etc. All with Karnataka sources. Region label shows "Bengaluru".
- Narrate: "Switch region, get region-specific verified contacts. Not hardcoded to Chennai."

### Beat 11 — Multi-language incident packet
- Switch to the incident packet section.
- Toggle language to **Tamil**.
- Tap **Generate packet**.
- Expected: Incident packet generates with Tamil keywords for critical terms (accident, hospital, police, injury, help). English structure preserved, key nouns translated.
- Narrate: "Template-based translation for emergency terms. Works without internet or an LLM."

### Beat 12 — PWA install and dark mode
- Show the **Install RoadSoS** prompt (or browser install icon in address bar).
- Trigger dark mode (system preference or toggle).
- Expected: App installs to home screen. Dark mode activates with full readability and WCAG AA contrast.
- Narrate: "Installable PWA. Night-time accident scenario? Dark mode is automatic."

## Chaos-mode dry run

Run this before every live judging session:

| Scenario | Expected behaviour |
|---|---|
| Network offline after "Refresh cache" was tapped | Cached rescue pack loads from service worker + localStorage; stale timestamp shown; status row shows "Offline rescue mode" |
| Network offline, no prior cache | App shell loads from service worker; ERSS 112 fallback contact visible; clear "no local results" warning; no crash |
| Cold start in airplane mode (PWA installed) | Service worker serves app shell; localStorage serves cached contacts or ERSS fallback |
| GPS permission denied | Manual lat/lon fields remain active; no crash |
| Empty nearby contacts (non-Chennai/Bengaluru coords) | National fallback contacts displayed; clear "no local results" message |
| Assistant asked "nearest hospital" | Retrieval returns ranked hospitals with source citations |
| Assistant asked for real-time info | Clear refusal with reason; no invented contact |
| Assistant asked for medical advice | Clear refusal with `medical_legal_advice_not_provided` reason |
| Invalid coordinates entered | Validation error; no crash |
| Region switch Chennai → Bengaluru | Contacts change to Bengaluru-specific results |
| Multi-language packet (Tamil) | Key emergency terms appear in Tamil |

## Pass criteria

- Location to ranked help in under 10 seconds on the polished demo.
- Offline path returns fallback guidance with a visible stale-cache indicator.
- Service worker serves app shell on cold offline start.
- Every displayed contact shows source, verified date, and confidence score.
- No invented emergency contact appears anywhere.
- Bystander role cards are accessible.
- Incident packet generates without backend (offline path).
- Assistant retrieves relevant contacts for supported queries.
- Assistant refuses clearly for real-time / medical / legal queries.
- Cross-region switch shows different, verifiable contacts.
- Multi-language packet generates in Tamil.
- PWA is installable.
- Dark mode is readable.
- The demo repeats without manual database edits.
- Full demo (Beats 1-12) completes in under 60 seconds.

## Known limitations to state honestly

- Real-time ambulance availability is not confirmed; app shows last-verified static data.
- Contact freshness depends on manual curation cadence; staleness is shown transparently.
- Offline cache uses service worker for app shell and localStorage for data. Cache persists across page loads but not across browser data clears.
- The app does not dispatch emergency services.
- Assistant uses deterministic keyword/intent matching against the verified dataset — not an external LLM. It will not answer questions outside its verified data.
- Multi-language translation is template-based (keyword substitution for ~20 emergency terms), not full NLP translation.
- Bengaluru is a portability proof with 5-8 contacts; it is not as deep as the Chennai dataset.
- Cross-region auto-detection uses bounding boxes; coordinates outside known regions get national fallbacks only.

