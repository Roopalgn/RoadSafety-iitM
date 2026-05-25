# Golden Demo Scenario

## Scenario

A bystander near IIT Madras sees a road accident and needs reliable emergency help fast. The demo proves the app can deliver trusted emergency contacts within 10 seconds, works with weak/no network after the rescue pack is warmed, and refuses to invent safety-critical data.

## Setup before demo

- Start backend: `cd backend && python -m uvicorn app.main:app --host localhost --port 8001 --reload`
- Start frontend: `cd frontend && npm run dev -- --host localhost --port 5174`
- The Vite dev server proxies `/api` and `/health` to `http://localhost:8001`.
- Open browser at `http://localhost:5174` in DevTools mobile mode (375 px wide).

## Test coordinates

- Primary location: IIT Madras main gate - lat `12.9915`, lon `80.2337`.
- Nearby landmark for incident packet: `IIT Madras main gate`.
- Unknown/low-coverage region test: lat `28.6139`, lon `77.2090` should keep national fallbacks visible if no local ranked contacts exist.
- Portability target: Bengaluru / Koramangala - lat `12.9716`, lon `77.5946` - should become a region-specific dataset once the second-region seed lands.

## Demo roles

- Presenter: drives the browser, speaks to judges.
- Timer watcher: watches the timer card in the top-right of the app and calls out the elapsed time aloud.
- Solo demo: presenter narrates both roles.

## Demo beats

### Beat 1 - First screen

- Open RoadSoS on a phone-sized viewport.
- Expected: The rescue drill screen is the first viewport. No marketing page. The status row shows no-hallucination, online/offline state, cache status, and service-worker status.

### Beat 2 - Location input

- The lat/lon fields default to IIT Madras (`12.9915`, `80.2337`) and landmark `IIT Madras main gate`.
- Optionally tap `Use GPS` to capture live location. If GPS is denied, manual fields remain active.
- Expected: Location confidence ribbon shows GPS, manual, or cached location context.

### Beat 3 - 10-second rescue drill

- Say aloud: `Starting now.`
- Tap `Start rescue drill`.
- Expected: The timer card shows elapsed seconds live. Ranked emergency contacts appear. Timer stops.
- Narrate: `Police, hospital, ambulance - ranked by distance, all sourced. Timer card proves it.`

### Beat 4 - Trust ledger

- Click `Trust ledger and ranking reasons` on any contact card.
- Expected: Expandable details show distance, confidence score, source name, verification date, and ranking reasons.
- Narrate: `Every contact tells you where it came from and when it was last verified.`

### Beat 5 - Bystander mode and radar

- Scroll to the `Bystander mode` card.
- Expected: Four role cards are visible: Caller, Traffic spotter, Note taker, Location sharer. The radar preview marks the nearest returned contacts.
- Narrate: `The app keeps bystanders useful without pretending to diagnose.`

### Beat 6 - Emergency presets

- Tap `Medical emergency`, `Police support`, or `Vehicle recovery`.
- Expected: The selected service filters update immediately and the severity field changes to match the scenario.
- Narrate: `One tap shifts the search intent without hiding the trust ledger.`

### Beat 7 - Incident packet

- Confirm the incident packet form includes injured count, severity, callback number, vehicle type, road side, hazards, and notes.
- Tap `Generate packet`.
- Tap `Copy packet` or `Share packet`.
- Expected: Short structured summary includes location, landmark, injury count, severity, hazards, callback, nearest contacts, timestamp, and medical disclaimer.

### Beat 8 - Offline mode

- First tap `Refresh cache` while online to store the rescue pack in localStorage and warm the service-worker app shell.
- Then put the browser in offline mode (DevTools -> Network -> Offline).
- Tap `Start rescue drill` again.
- Expected: Cached contacts or ERSS 112 fallback load immediately. Warning box shows cached/stale context. Status row switches to offline rescue mode.
- Narrate: `Airplane mode, still useful. Cache was stored from the previous online session.`

### Beat 9 - Assistant refusal and flight recorder

- Type `Can an ambulance come now?` in the assistant panel, or use the default question.
- Tap `Ask guarded assistant`.
- Expected: Backend returns a guarded answer/refusal. The UI shows source/refusal trace in the flight recorder.
- Narrate: `The assistant admits what it cannot do. It never invents live availability.`

### Beat 10 - Chaos rehearsal

- Turn on `Simulate backend down`, then tap `Start rescue drill`.
- Turn on `Simulate no local results`, then tap `Start rescue drill`.
- Expected: Backend-down falls back to cache or official ERSS; no-result keeps official fallbacks visible with a warning.
- Narrate: `We can rehearse failure without corrupting the data.`

### Beat 11 - Cross-region / unknown-region check

- Change lat to `28.6139`, lon to `77.2090`, or use Bengaluru coordinates if second-region data is present.
- Tap `Start rescue drill`.
- Expected: If no local ranked contacts match, warning text explains the gap and official fallback contacts remain visible.
- Narrate: `The schema is data-driven; unsupported regions fail safely instead of inventing contacts.`

## Chaos-mode dry run

Run this before every live judging session:

| Scenario | Expected behaviour |
|---|---|
| Network offline after `Refresh cache` was tapped | Cached rescue pack loads from localStorage; stale timestamp shown; app shell can reload after first visit |
| Network offline, no prior cache | ERSS 112 fallback contact visible; clear no-local-results warning; no crash |
| GPS permission denied | Manual lat/lon fields remain active; no crash |
| Empty nearby contacts or `Simulate no local results` | Fallback contacts displayed; clear no-local-results message |
| Backend unavailable or `Simulate backend down` | Cached contacts or ERSS fallback visible; no crash |
| Assistant asked for made-up or real-time data | Refusal text plus flight recorder refusal reason; no invented contact |
| Invalid coordinates entered | Validation error; no crash |

## Pass criteria

- Location to ranked help in under 10 seconds on the polished demo.
- Offline path returns cached or fallback guidance with a visible cache indicator.
- Service worker serves the app shell after the app has been opened once.
- Every displayed contact shows source, verified date, confidence score, and ranking reasons.
- No invented emergency contact appears anywhere.
- Bystander role cards are accessible.
- Incident packet generates without backend (offline path).
- Assistant refuses clearly for real-time / medical / legal queries.
- The demo repeats without manual database edits.

## Known limitations to state honestly

- Real-time ambulance availability is not confirmed; app shows last-verified static data.
- Contact freshness depends on manual curation cadence; staleness is shown transparently.
- Offline cache uses service worker for app shell and localStorage for data. Cache persists across page loads but not across browser data clears.
- The app does not dispatch emergency services.
- Assistant behavior is guarded and retrieval/refusal-oriented; it is not an external LLM and must not answer outside verified data/templates.
- Full second-region depth, dark mode, and multi-language packets remain follow-up work unless their dedicated M3 implementation PR lands first.
