# RoadSoS

Offline-first accident response assistant for the Road Safety Hackathon 2026 by CoERS, RBG Labs, IIT Madras.

RoadSoS helps a bystander move from location to trusted emergency contacts quickly, even when the network is weak. The product is designed around source-backed contacts, deterministic ranking, offline rescue cache, and a guarded assistant that refuses to invent emergency information.

## Chosen problem statement

RoadSoS: a location-based emergency support tool for accidents.

## Repository map

- `plan.md` - team execution plan, merge points, task ownership, and review gates.
- `info.md` - hackathon information and original problem statement summary.
- `contracts/` - shared schemas and API examples all branches must follow.
- `data/` - source-backed emergency data, fallbacks, and data notes.
- `backend/` - FastAPI service scaffold.
- `frontend/` - React/Vite PWA scaffold.
- `docs/` - submission, review, and assumptions documents.
- `demo/` - golden scenario and live judging script.

## Branches

- `codex/roopal-product-submission`
- `codex/suyash-data-geo-backend`
- `codex/sidhesh-frontend-offline-ai`
- `codex/final-roadsos-submission`

All implementation branches should start from the same bootstrap `main`.

## Safety rules

- Do not generate emergency phone numbers, addresses, or service names with AI.
- Production contacts must be source-backed and include verification metadata.
- Assistant responses must cite curated data or approved templates.
- If the app cannot verify something, it should say so and show official fallback guidance.

## Current product state

This repository now contains the RoadSoS vertical slice: FastAPI ranking/data APIs, source-backed Chennai contacts, offline cache package support, and a React/Vite emergency-first PWA. Roopal can review PRs against `plan.md` and `docs/pr_review_checklist.md` while Suyash and Sidhesh continue improving data reliability and demo UX.

