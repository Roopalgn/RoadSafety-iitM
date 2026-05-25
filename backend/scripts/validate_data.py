"""Validate RoadSoS contact data against the frozen contract.

Run before every data PR and in CI:

    cd backend
    python -m scripts.validate_data

Checks:
  - ``data/contacts.seed.json``  -> schema + production provenance rules
  - ``data/fallbacks.seed.json`` -> schema + production provenance rules
  - ``data/regions/*/contacts.seed.json`` -> schema + production provenance rules
  - ``data/regions/*/fallbacks.seed.json`` -> schema + production provenance rules
  - ``backend/tests/fixtures/contacts.fixture.json`` -> schema only
  - duplicate detection across production + fallback contacts
  - freshness audit: contacts verified > 30 days before submission date are flagged

Exit code is non-zero if any production/fallback check fails, so this can
gate merges. Fixture problems are reported but do not fail the run, since
fixtures are intentionally non-production.
"""

import sys
from datetime import date

from app.core.data_loader import (
    load_fallback_contacts,
    load_fixture_contacts,
    load_production_contacts,
    _REGION_DIRS,
)
from app.core.dedupe import dedupe_contacts
from app.core.validation import validate_collection

# Submission deadline. Contacts verified more than 30 days before this are flagged.
_SUBMISSION_DATE = date(2026, 5, 31)
_FRESHNESS_THRESHOLD_DAYS = 30


def _print_report(label: str, report: dict) -> None:
    status = "OK" if report["ok"] else "FAIL"
    print(f"[{status}] {label}: {report['count']} record(s)")
    for failure in report["errors"]:
        loc = f"index {failure['index']}"
        if failure.get("id"):
            loc += f" (id={failure['id']})"
        for msg in failure["errors"]:
            print(f"    - {loc}: {msg}")


def _freshness_audit(contacts: list[dict], label: str) -> list[str]:
    """Flag contacts whose verified_at is more than _FRESHNESS_THRESHOLD_DAYS
    before the submission date."""
    flagged = []
    for c in contacts:
        verified_str = c.get("verified_at", "")
        try:
            verified = date.fromisoformat(verified_str)
        except (ValueError, TypeError):
            flagged.append(
                f"  {c.get('id', '?')}: verified_at missing or unparseable ('{verified_str}')"
            )
            continue
        age = (_SUBMISSION_DATE - verified).days
        if age > _FRESHNESS_THRESHOLD_DAYS:
            flagged.append(
                f"  {c.get('id', '?')}: verified {age} days before submission "
                f"(verified_at={verified_str}) — re-verify or flag as stale"
            )
    return flagged


def main() -> int:
    all_production: list[dict] = []
    all_fallbacks: list[dict] = []
    blocking_ok = True

    # --- Chennai (root) ---
    production = load_production_contacts(region="chennai")
    fallbacks = load_fallback_contacts(region="chennai")
    fixtures = load_fixture_contacts()

    prod_report = validate_collection(production, production=True)
    fb_report = validate_collection(fallbacks, production=True)
    fx_report = validate_collection(fixtures, production=False)

    _print_report("data/contacts.seed.json", prod_report)
    _print_report("data/fallbacks.seed.json", fb_report)
    _print_report("tests/fixtures/contacts.fixture.json (non-production)", fx_report)

    if not prod_report["ok"] or not fb_report["ok"]:
        blocking_ok = False

    all_production.extend(production)
    all_fallbacks.extend(fallbacks)

    # --- Additional regions ---
    for region in _REGION_DIRS:
        if region == "chennai":
            continue
        reg_contacts = load_production_contacts(region=region)
        reg_fallbacks = load_fallback_contacts(region=region)

        rc_report = validate_collection(reg_contacts, production=True)
        rf_report = validate_collection(reg_fallbacks, production=True)

        _print_report(f"data/regions/{region}/contacts.seed.json", rc_report)
        _print_report(f"data/regions/{region}/fallbacks.seed.json", rf_report)

        if not rc_report["ok"] or not rf_report["ok"]:
            blocking_ok = False

        all_production.extend(reg_contacts)
        all_fallbacks.extend(reg_fallbacks)

    # --- Duplicate check across all production + fallback contacts ---
    dedup = dedupe_contacts(all_production + all_fallbacks)
    if dedup["removed"]:
        print(f"[WARN] {len(dedup['removed'])} potential duplicate(s) in production data:")
        for item in dedup["removed"]:
            print(f"    - {item['id']} duplicate_of {item['duplicate_of']}")
    else:
        print("[OK] no duplicate production/fallback contacts")

    # --- Freshness audit ---
    stale_prod = _freshness_audit(all_production, "production")
    stale_fb = _freshness_audit(all_fallbacks, "fallbacks")
    stale_all = stale_prod + stale_fb
    if stale_all:
        print(f"[WARN] {len(stale_all)} contact(s) may need re-verification before submission:")
        for line in stale_all:
            print(line)
    else:
        print(f"[OK] all contacts verified within {_FRESHNESS_THRESHOLD_DAYS} days of submission date")

    # --- Fixture leak check ---
    fixture_ids = {c.get("id", "") for c in fixtures}
    prod_ids = {c.get("id", "") for c in all_production}
    leaked = fixture_ids & prod_ids
    if leaked:
        print(f"[FAIL] fixture ID(s) found in production data: {leaked}")
        blocking_ok = False
    else:
        print("[OK] no fixture data in production paths")

    if not fx_report["ok"]:
        print("[WARN] fixtures failed schema validation (non-blocking)")

    # --- Summary ---
    total = len(all_production)
    print(f"\n[INFO] Total production contacts: {total} "
          f"(Chennai: {len(production)}, "
          + ", ".join(
              f"{r}: {len(load_production_contacts(region=r))}"
              for r in _REGION_DIRS if r != "chennai"
          ) + ")")

    print("\nRESULT:", "PASS" if blocking_ok else "FAIL")
    return 0 if blocking_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
