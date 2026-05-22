# RoadSoS — 7-Slide Presentation Outline

> Source file for the final PDF deck. Convert to PowerPoint/Google Slides for submission.
> Rule: Welcome and Thank You slides are mandatory per hackathon guidelines.

---

## Slide 1: Welcome

**Title:** RoadSoS — The Right Help in Under 10 Seconds

- Team: Roopal (PM/Docs), Suyash (Data/Backend), Sidhesh (Frontend/PWA)
- Hackathon: Road Safety Hackathon 2026, IIT Madras
- Problem Statement: RoadSoS — Location-based emergency support for road accidents
- One-line pitch: **"A bystander can get the right emergency help in under 10 seconds, even with no network."**

---

## Slide 2: The Golden-Hour Problem

**Title:** Every Second Counts — But Today's Systems Fail Bystanders

- 65% of accident bystanders cannot reach the right hospital on the first call (NCRB 2023)
- Average emergency response in Indian metros: 14-20 minutes; golden hour lost to wrong numbers
- Bystanders search Google → get outdated listings → call wrong hospital → lose critical minutes
- **RoadSoS solves this:** Verified contacts ranked by distance, available in 10 seconds, works offline

**Visual:** Split screen — "Today" (confused bystander, wrong numbers) vs. "With RoadSoS" (ranked contacts, timer < 10s)

---

## Slide 3: RoadSoS in Action

**Title:** From Accident to Help in 10 Seconds

- Screenshot: IIT Madras rescue drill — ranked contacts with timer card showing < 10 seconds
- Annotated callouts:
  - Trust ledger badge: source name, verification date, confidence score
  - Distance ranking: closest first
  - Service type chips: Hospital, Police, Ambulance, Tow
  - One-tap call button
- Incident packet: structured summary ready to share with emergency services

**Visual:** Annotated mobile screenshot (375px, dark background for contrast)

---

## Slide 4: Architecture — Offline-First, No AI Gambling

**Title:** Deterministic Ranking, Not LLM Luck

- **Frontend:** React PWA with service worker → installable, loads offline
- **Backend:** Python FastAPI → deterministic multi-factor ranking
- **Data:** Curated SQLite from source-backed JSON seeds (20+ Chennai, 5-8 Bengaluru)
- **Ranking formula:** distance + confidence + freshness + service priority + availability
- **Assistant:** Retrieval-only — searches verified database, refuses what it doesn't know
- **Offline:** Service worker caches app shell; localStorage caches data package
- **No external LLM API** — every contact comes from curated, source-verified data

**Visual:** Architecture diagram: User → PWA (SW cache) → FastAPI → SQLite ← Curated Seeds

---

## Slide 5: Reliability and Trust

**Title:** Every Contact Is Source-Backed, Every Refusal Is Honest

- **Trust ledger:** source URL, verified date, confidence score, ranking reasons — visible on every card
- **No-hallucination rule:** assistant NEVER invents a contact, phone number, or availability claim
- **Freshness penalty:** stale contacts (> 90 days) get reduced confidence — transparency built in
- **Data verification:** `scripts/verify_sources.py` checks all source URLs return HTTP 200
- **Cross-region proof:** switch to Bengaluru → different verified contacts appear → not Chennai-hardcoded
- **Chaos resilience:** GPS denied, offline, ocean coordinates, stale data — all handled gracefully

**Visual:** Trust ledger expanded screenshot + cross-region switch comparison

---

## Slide 6: Innovation Showcase

**Title:** Beyond the Basics — Features That Save Minutes

| Feature | Judge Impact |
|---|---|
| 10-second rescue drill with live timer | Proves speed claim visually |
| Installable PWA (service worker) | True offline, home screen shortcut |
| Multi-language incident packet (Tamil) | Accessibility in regional emergency |
| Bystander mode role cards | Keeps non-medical helpers useful |
| Dark/night mode (auto) | Realistic accident scenario (night) |
| Retrieval assistant with citations | "AI-powered" without hallucination risk |
| Cross-region portability (Bengaluru) | Proves scalable architecture |

**Visual:** Grid of 4 mini-screenshots: PWA install, Tamil packet, dark mode, assistant retrieval

---

## Slide 7: Thank You

**Title:** Thank You — RoadSoS Team

- **Roopal** — Product management, documentation, demo scripting, submission artifacts
- **Suyash** — Data curation, backend APIs, geo ranking, retrieval assistant, cross-region
- **Sidhesh** — Frontend PWA, service worker, offline UX, dark mode, multi-language

**Repository:** github.com/Roopalgn/RoadSafety-iitM

**Closing statement:** *"Every contact is source-backed. Every refusal is honest. Every second counts."*

---

## Conversion notes

- Export as PDF (landscape, 16:9 aspect ratio)
- Maximum 5 bullet points per slide
- Use screenshots from `docs/screenshots/` (captured in Merge 4)
- Fonts: system sans-serif, minimum 24pt for body text
- Colors: match app theme (calm blue/green for trust, red accents for emergency)
