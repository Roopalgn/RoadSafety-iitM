# Backend

FastAPI service for RoadSoS. Owned by the data/geo/backend branch (Suyash).

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Layout

- `app/main.py` - API routes (`/health`, `/api/nearby-services`,
  `/api/cache-package`, `/api/incident-summary`, `/api/assistant`).
- `app/models.py` - request/response models mirroring `contracts/api.examples.json`.
- `app/core/` - deterministic, offline data/geo utilities:
  - `geo.py` - haversine distance + fixed-order distance ranking.
  - `confidence.py` - explainable confidence scoring rules.
  - `dedupe.py` - normalized name/phone + proximity de-duplication.
  - `validation.py` - contract schema + production-provenance checks.
  - `data_loader.py` - seed/fixture loading with production-first resolution.
- `scripts/validate_data.py` - data validation CLI / merge gate.
- `tests/` - pytest suite. `tests/fixtures/` holds clearly-marked
  non-production demo data.

## Commands

```powershell
cd backend
python -m pytest -q            # run the test suite
python -m scripts.validate_data  # validate seed/fixture data (exit != 0 on failure)
```

## Merge 1 status

Production local contacts are still empty (curated Chennai data lands in
Merge 2). Until then `/api/nearby-services` and `/api/cache-package` fall
back to fixture data and return a loud `FIXTURE DATA` warning so fixture
results can never be mistaken for verified contacts. The official `112`
fallback is real and always served.

## Contract changes

`app/models.py` mirrors `contracts/`. Any change to request/response shapes
is a contract change and must be called out in the PR description.
