"""Load seed and fixture contact data from disk.

Production data lives in ``data/*.seed.json``. Test fixtures live under
``backend/tests/fixtures/`` and are never silently treated as production.

Merge 2: production contacts are now populated with source-backed Chennai
data. The SQLite database (``data/roadsos.db``) is the versioned cache
package built by ``scripts/build_db.py``. JSON seed files remain the
source of truth; SQLite is a derived artefact.
"""

import json
import sqlite3
from typing import Any

from .paths import data_dir, fixtures_dir

# Bump in sync with scripts/build_db.py CACHE_VERSION.
OFFLINE_CACHE_VERSION = "merge2-chennai-data-0"


def _read_json_array(path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def load_production_contacts() -> list[dict[str, Any]]:
    """Source-backed local contacts from ``data/contacts.seed.json``."""
    return _read_json_array(data_dir() / "contacts.seed.json")


def load_fallback_contacts() -> list[dict[str, Any]]:
    """Official national/region emergency fallbacks (source-backed)."""
    return _read_json_array(data_dir() / "fallbacks.seed.json")


def load_fixture_contacts() -> list[dict[str, Any]]:
    """Non-production demo contacts. NOT source-backed. Tests/demo only."""
    return _read_json_array(fixtures_dir() / "contacts.fixture.json")


def load_contacts_from_db(
    db_path=None, *, fallbacks_only: bool = False
) -> list[dict[str, Any]]:
    """Load contacts from the SQLite cache database.

    Falls back gracefully to an empty list if the database does not exist
    (e.g. before ``scripts/build_db.py`` has been run).

    Args:
        db_path: Path to the SQLite file. Defaults to ``data/roadsos.db``.
        fallbacks_only: If True, return only fallback contacts.
    """
    path = db_path or (data_dir() / "roadsos.db")
    if not path.exists():
        return []

    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        if fallbacks_only:
            rows = conn.execute(
                "SELECT * FROM contacts WHERE is_fallback = 1"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM contacts WHERE is_fallback = 0"
            ).fetchall()
    finally:
        conn.close()

    result: list[dict[str, Any]] = []
    for row in rows:
        record = dict(row)
        # Deserialise confidence_reasons from JSON string back to list.
        try:
            record["confidence_reasons"] = json.loads(record["confidence_reasons"])
        except (json.JSONDecodeError, TypeError):
            record["confidence_reasons"] = []
        # Remove the SQLite-only column before returning.
        record.pop("is_fallback", None)
        result.append(record)
    return result


def resolve_service_contacts(
    *, allow_fixtures: bool
) -> dict[str, Any]:
    """Pick the contact set the API should rank over.

    Priority order:
      1. Production JSON seed (source of truth).
      2. SQLite cache (if seed is somehow unavailable but DB exists).
      3. Fixtures (only when ``allow_fixtures`` is True and production is empty).
      4. Empty list with a clear warning.

    Returns ``{"contacts", "is_fixture", "warnings"}``.
    """
    production = load_production_contacts()
    if production:
        return {"contacts": production, "is_fixture": False, "warnings": []}

    # Fallback to SQLite if JSON seed is missing (e.g. deployed without seed).
    db_contacts = load_contacts_from_db()
    if db_contacts:
        return {
            "contacts": db_contacts,
            "is_fixture": False,
            "warnings": [
                "Serving contacts from SQLite cache (JSON seed not found)."
            ],
        }

    if allow_fixtures:
        fixtures = load_fixture_contacts()
        if fixtures:
            return {
                "contacts": fixtures,
                "is_fixture": True,
                "warnings": [
                    "FIXTURE DATA: results are non-production test fixtures, "
                    "not source-backed contacts. Do not use for real dispatch."
                ],
            }

    return {
        "contacts": [],
        "is_fixture": False,
        "warnings": [
            "No production local contacts available. Use the official fallback contacts."
        ],
    }
