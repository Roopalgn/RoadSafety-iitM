"""Verify that every source_url in production seed files returns HTTP 200.

Run from the ``backend/`` directory:

    python -m scripts.verify_sources

Checks every ``source_url`` in:
  - ``data/contacts.seed.json``
  - ``data/fallbacks.seed.json``
  - ``data/regions/*/contacts.seed.json``
  - ``data/regions/*/fallbacks.seed.json``

Reports HTTP status for each URL. Flags 4xx/5xx and connection errors.
Exit code is non-zero if any URL fails.

Note: this script makes real outbound HTTP requests. Run it manually before
a data PR, not in automated CI (network availability is not guaranteed in CI).
"""

import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

from app.core.data_loader import (
    load_fallback_contacts,
    load_production_contacts,
    _REGION_DIRS,
)
from app.core.paths import data_dir

_TIMEOUT_S = 10
_USER_AGENT = "RoadSoS-source-verifier/1.0 (data integrity check)"


def _check_url(url: str) -> tuple[int | None, str]:
    """Return (status_code, message). status_code is None on connection error."""
    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT_S) as resp:
            return resp.status, "OK"
    except urllib.error.HTTPError as e:
        return e.code, str(e.reason)
    except urllib.error.URLError as e:
        return None, str(e.reason)
    except Exception as e:  # noqa: BLE001
        return None, str(e)


def _collect_all_contacts() -> list[dict]:
    """Collect production + fallback contacts from all regions."""
    contacts = []
    contacts.extend(load_production_contacts(region="chennai"))
    contacts.extend(load_fallback_contacts(region="chennai"))
    for region in _REGION_DIRS:
        if region == "chennai":
            continue
        contacts.extend(load_production_contacts(region=region))
        contacts.extend(load_fallback_contacts(region=region))
    return contacts


def main() -> int:
    contacts = _collect_all_contacts()

    # Deduplicate URLs so we don't hammer the same domain repeatedly.
    seen: dict[str, str] = {}  # url -> contact id
    for c in contacts:
        url = (c.get("source_url") or "").strip()
        if url and url not in seen:
            seen[url] = c.get("id", "?")

    print(f"Checking {len(seen)} unique source URL(s) across all regions...\n")

    failures: list[tuple[str, str, int | None, str]] = []
    for url, contact_id in seen.items():
        status, msg = _check_url(url)
        if status == 200:
            print(f"  [200 OK]  {url}")
        elif status is not None:
            print(f"  [{status} FAIL] {url}  (contact: {contact_id})")
            failures.append((contact_id, url, status, msg))
        else:
            print(f"  [ERR]     {url}  (contact: {contact_id}) — {msg}")
            failures.append((contact_id, url, None, msg))
        # Small delay to avoid hammering servers.
        time.sleep(0.3)

    print()
    if failures:
        print(f"RESULT: FAIL — {len(failures)} URL(s) did not return 200:")
        for cid, url, status, msg in failures:
            label = str(status) if status else "ERR"
            print(f"  [{label}] {cid}: {url} — {msg}")
        return 1

    print(f"RESULT: PASS — all {len(seen)} URL(s) returned 200.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
