# Data

Production emergency contacts must be curated from source-backed public information. Do not add AI-generated contacts to production data.

## Files

- `contacts.seed.json` - production local contacts. Starts empty until Suyash curates source-backed records.
- `fallbacks.seed.json` - official fallback emergency contacts and country-level profiles.

## Production contact rules

- Every contact must match `contracts/contact.schema.json`.
- Every contact must include `source_url`, `source_name`, `verified_at`, and `confidence_reasons`.
- If a contact has no reliable coordinates, exclude it from distance ranking or mark coordinates as `null`.
- Test fixtures must live outside production seed files or be clearly marked as fixtures.

## Test fixtures

Non-production demo/test contacts live in
`backend/tests/fixtures/contacts.fixture.json`. They are intentionally fake
(names contain `FIXTURE`/`NOT REAL`, placeholder phone numbers, an
`example.test` source) and must never be promoted into the seed files.

## Validation

Validate seed and fixture data against the contract before any data PR:

```powershell
cd backend
python -m scripts.validate_data
```

The script enforces the schema plus production provenance rules and exits
non-zero on failure, so it can gate merges.

