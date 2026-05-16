"""Validate RoadSoS contact data against the frozen contract.

Run before every data PR and in CI:

    cd backend
    python -m scripts.validate_data

Checks:
  - ``data/contacts.seed.json``  -> schema + production provenance rules
  - ``data/fallbacks.seed.json`` -> schema + production provenance rules
  - ``backend/tests/fixtures/contacts.fixture.json`` -> schema only
  - duplicate detection across production + fallback contacts

Exit code is non-zero if any production/fallback check fails, so this can
gate merges. Fixture problems are reported but do not fail the run, since
fixtures are intentionally non-production.
"""

import sys

from app.core.data_loader import (
    load_fallback_contacts,
    load_fixture_contacts,
    load_production_contacts,
)
from app.core.dedupe import dedupe_contacts
from app.core.validation import validate_collection


def _print_report(label: str, report: dict) -> None:
    status = "OK" if report["ok"] else "FAIL"
    print(f"[{status}] {label}: {report['count']} record(s)")
    for failure in report["errors"]:
        loc = f"index {failure['index']}"
        if failure.get("id"):
            loc += f" (id={failure['id']})"
        for msg in failure["errors"]:
            print(f"    - {loc}: {msg}")


def main() -> int:
    production = load_production_contacts()
    fallbacks = load_fallback_contacts()
    fixtures = load_fixture_contacts()

    prod_report = validate_collection(production, production=True)
    fb_report = validate_collection(fallbacks, production=True)
    fx_report = validate_collection(fixtures, production=False)

    _print_report("data/contacts.seed.json", prod_report)
    _print_report("data/fallbacks.seed.json", fb_report)
    _print_report("tests/fixtures/contacts.fixture.json (non-production)", fx_report)

    dedup = dedupe_contacts(production + fallbacks)
    if dedup["removed"]:
        print(f"[WARN] {len(dedup['removed'])} potential duplicate(s) in production data:")
        for item in dedup["removed"]:
            print(f"    - {item['id']} duplicate_of {item['duplicate_of']}")
    else:
        print("[OK] no duplicate production/fallback contacts")

    if not fx_report["ok"]:
        print("[WARN] fixtures failed schema validation (non-blocking)")

    blocking_ok = prod_report["ok"] and fb_report["ok"]
    print("\nRESULT:", "PASS" if blocking_ok else "FAIL")
    return 0 if blocking_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
