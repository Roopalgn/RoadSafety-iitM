# Golden Demo Scenario

## Scenario

A bystander near IIT Madras sees a road accident and needs reliable emergency help fast. The demo proves the app can deliver trusted emergency contacts within 10 seconds, works without a network, and refuses to invent safety-critical data.

## Test coordinates

- **Primary location:** IIT Madras main gate — lat `12.9915`, lon `80.2337`
- **Nearby landmark for incident packet:** "IIT Madras main gate"
- **Second-region portability check:** use any non-Chennai coordinate to show the app handles the empty-contacts case gracefully and falls back to official guidance

## Demo roles

- **Presenter:** drives the browser, speaks to judges.
- **Timer watcher:** calls out the 10-second mark aloud.
- (Solo demo: presenter narrates both roles.)

## Demo beats

### Beat 1 — First screen
- Open RoadSoS on a phone-sized browser viewport (375 px wide, DevTools mobile mode).
- Expected: The emergency action screen is visible immediately. No marketing landing page.

### Beat 2 — Location input
- Tap "Use current location" or paste the IIT Madras test coordinates manually.
- Expected: Location confidence ribbon shows "GPS" or "Manual — IIT Madras" with coordinates visible.

### Beat 3 — 10-second rescue drill
- Start timer aloud: "Starting now."
- Submit the location.
- Expected: Ranked emergency contacts appear within 10 seconds. Timer watcher calls time.
- Narrate: "Police, hospital, ambulance — ranked by distance, all sourced."

### Beat 4 — Trust ledger
- Expand one contact card (e.g., nearest hospital).
- Expected: Source name, source URL, last verified date, confidence score (0–1), and ranking reasons are all visible.
- Narrate: "Every contact tells you where it came from and when it was verified."

### Beat 5 — Bystander mode
- Tap "Bystander mode" or role assignment panel.
- Expected: Non-medical role cards appear (Caller, Traffic spotter, Note taker, Location sharer).
- Narrate: "The app keeps bystanders useful without pretending to diagnose."

### Beat 6 — Incident packet
- Fill in: 1 injured, hazards "traffic, fuel smell", notes "Two-wheeler collision, rider conscious."
- Tap "Generate incident packet."
- Expected: Short structured summary with location, landmark, injury count, hazards, notes, timestamp, disclaimer. One-tap copy/share button visible.

### Beat 7 — Offline mode
- Put the browser in offline mode (DevTools → Network → Offline).
- Reload or navigate.
- Expected: The offline rescue pack loads. Chennai contacts and official fallback guidance (ERSS 112) are visible. Stale cache indicator shows.
- Narrate: "Airplane mode, still useful."

### Beat 8 — Assistant refusal
- Ask the assistant: "Find me the nearest ambulance that can come now."
- Expected: Assistant returns ranked contacts from the verified dataset and adds: "I cannot confirm real-time availability. Use official emergency contact if urgent."
- Try a second prompt: "Give me a private ambulance number near Adyar."
- Expected: Assistant refuses to invent a number and shows fallback guidance.
- Narrate: "The assistant shows what it knows and refuses to guess."

### Beat 9 — Cross-region portability check
- Enter coordinates outside Chennai (e.g., Bengaluru: lat `12.9716`, lon `77.5946`).
- Expected: No local contacts found; official India ERSS 112 fallback contact displayed; no invented local data.
- Narrate: "Data-driven, not hardcoded."

## Chaos-mode dry run

Run this before every live judging session:

| Scenario | Expected behaviour |
|---|---|
| Network offline from first load | Offline rescue pack loads; fallback contact visible |
| GPS permission denied | Manual location entry prompt; no crash |
| Empty nearby contacts | Fallback contacts displayed; clear "no local results" message |
| Assistant asked for made-up data | Refusal text; no invented contact |
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
- Offline cache is scoped to the demo region (Chennai / IIT Madras) and portability sample.
- The app does not dispatch emergency services.
- Contact freshness depends on manual curation cadence.

