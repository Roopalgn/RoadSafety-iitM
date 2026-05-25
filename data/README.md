# Data

Production emergency contacts must be curated from source-backed public information. Do not add AI-generated contacts to production data.

## Files

- `contacts.seed.json` - production local contacts curated from source-backed records.
- `fallbacks.seed.json` - official fallback emergency contacts and country-level profiles.

## Production contact rules

- Every contact must match `contracts/contact.schema.json`.
- Every contact must include `source_url`, `source_name`, `verified_at`, and `confidence_reasons`.
- If a contact has no reliable coordinates, exclude it from distance ranking or mark coordinates as `null`.
- Test fixtures must live outside production seed files or be clearly marked as fixtures.

