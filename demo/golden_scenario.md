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
- **Second-region portability check:** use any non-Chennai coordinate (e.g., Bengaluru: lat `12.9716`, lon `77.5946`) to show the app handles the empty-contacts case gracefully and falls back to ERSS 112

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

### Beat 8 — Assistant refusal
- Type "Can an ambulance come now?" in the assistant panel (default question).
- Tap **Ask guarded assistant**.
- Expected: Backend returns the guarded stub answer plus `refusal_reason: assistant_layer_not_implemented`. The UI shows the refusal reason.
- Narrate: "The assistant admits what it cannot do. It never invents live availability."

### Beat 9 — Cross-region portability check
- Change lat to `12.9716`, lon to `77.5946` (Bengaluru).
- Tap **Start rescue drill**.
- Expected: `services` is empty (no Chennai fixture contacts match), warning box says "No ranked local services within radius", ERSS 112 fallback always visible.
- Narrate: "Data-driven, not hardcoded to Chennai."

## Chaos-mode dry run

Run this before every live judging session:

| Scenario | Expected behaviour |
|---|---|
| Network offline after "Refresh cache" was tapped | Cached rescue pack loads from localStorage; stale timestamp shown; status row shows "Offline rescue mode" |
| Network offline, no prior cache | ERSS 112 fallback contact visible; clear "no local results" warning; no crash |
| GPS permission denied | Manual lat/lon fields remain active; no crash |
| Empty nearby contacts (non-Chennai coords) | Fallback contacts displayed; clear "no local results" message |
| Assistant asked for made-up data | Refusal text; `refusal_reason` shown; no invented contact |
| Invalid coordinates entered | Validation error; no crash |

## Pass criteria

- Location to ranked help in under 10 seconds on the polished demo.
- Offline path returns fallback guidance with a visible stale-cache indicator.
- Every displayed contact shows source, verified date, and confidence score.
- No invented emergency contact appears anywhere.
- Bystander role cards are accessible.
- Incident packet generates without backend (offline path).
- The demo repeats without manual database edits.

## Known limitations to state honestly

- Real-time ambulance availability is not confirmed; app shows last-verified static data.
- Offline cache uses browser localStorage, not a service worker. Cache persists across page loads but not across browser data clears.
- Production local contacts (`data/contacts.seed.json`) are still empty; ranked contacts currently come from clearly-labelled non-production fixtures until Suyash's M2 data PR lands.
- The app does not dispatch emergency services.
- Assistant layer is a guarded stub; full retrieval-augmented response lands in a later merge.
- Contact freshness depends on manual curation cadence.

