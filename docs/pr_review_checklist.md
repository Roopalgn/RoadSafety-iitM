# PR Review Checklist

Use this checklist before merging any RoadSoS branch into `main`. Roopal is the designated reviewer for all PRs.

## PR labels

Apply one or more labels when opening or reviewing a PR.

| Label | Apply when |
|---|---|
| `contract-change` | Any edit to `contracts/contact.schema.json` or `contracts/api.examples.json` |
| `data-risk` | New or modified contacts in `data/contacts.seed.json` or `data/fallbacks.seed.json` |
| `offline-risk` | Changes to service worker, cache package, IndexedDB logic, or offline state |
| `demo-critical` | Changes that affect the golden demo flow in `demo/golden_scenario.md` |
| `submission-docs` | Changes to `docs/`, `README.md`, `plan.md`, or the 7-slide deck source |

A PR may carry multiple labels. A `contract-change` PR must be reviewed by all teammates before merge.

## Scope

- The PR supports the RoadSoS accident emergency workflow.
- The PR does not drift into DriveLegal or RoadWatch features.
- The first screen remains emergency-first.

## Safety

- No AI-generated emergency contacts are added to production data.
- Every production contact has source URL, source name, verification date, and confidence reasons.
- The assistant does not invent contacts, dispatch status, medical advice, or legal claims.
- Fallback guidance is clearly marked as fallback guidance.

## Contracts

- Contract changes are labelled `contract-change` and documented in the PR description.
- API examples still match frontend expectations.
- Data fields still match `contracts/contact.schema.json`.
- If a field is added or renamed, the PR description notes which other branches must update.

## Offline

- Offline behaviour is preserved or improved.
- Cached data has a visible version or freshness indicator.
- Stale or missing cache states are handled clearly.

## Verification

- Tests or manual checks are listed in the PR body.
- Mobile viewport (375 px) is checked for frontend changes.
- Backend endpoint examples are included for backend changes.
- Data validation output is included for data changes.

## Demo value

- The change strengthens or preserves the golden demo in `demo/golden_scenario.md`.
- The change can be explained to judges in one sentence.
- Any limitation is documented honestly in `docs/assumptions.md`.

## Merge checklist (Roopal to tick before merging)

- [ ] All checklist sections above are satisfied.
- [ ] PR body includes "What changed", "Verification performed", and "Known limitations".
- [ ] If `contract-change` label is present, all teammates have acknowledged the change.
- [ ] No invented emergency data was introduced.
- [ ] `demo/golden_scenario.md` pass criteria are still achievable after this merge.

