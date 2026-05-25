"""Load seed and fixture contact data from disk.

Production data lives in ``data/*.seed.json`` (Chennai default) and
``data/regions/<region>/`` for additional regions. Test fixtures live under
``backend/tests/fixtures/`` and are never silently treated as production.

Merge 3: multi-region support added. ``resolve_service_contacts`` now accepts
an optional ``region`` key. Auto-detection uses bounding boxes when no region
is specified. Bengaluru region data lives in ``data/regions/bengaluru/``.
"""

import json
import sqlite3
from typing import Any

from .paths import data_dir, fixtures_dir

# Bump in sync with scripts/build_db.py CACHE_VERSION.
OFFLINE_CACHE_VERSION = "merge4-final-0"

# ---------------------------------------------------------------------------
# Region bounding boxes for auto-detection.
# Format: (lat_min, lat_max, lon_min, lon_max)
# ---------------------------------------------------------------------------
_REGION_BBOXES: dict[str, tuple[float, float, float, float]] = {
    "chennai": (12.8, 13.2, 80.0, 80.35),
    "bengaluru": (12.85, 13.1, 77.45, 77.75),
}

# Supported region keys and their seed file directories.
_REGION_DIRS: dict[str, Any] = {
    "chennai": None,          # None means root data/ directory
    "bengaluru": "bengaluru",
}


def detect_region(lat: float, lon: float) -> str | None:
    """Return the region key if coordinates fall within a known bounding box.

    Returns None if coordinates do not match any known region (caller should
    fall back to national fallbacks only).
    """
    for region, (lat_min, lat_max, lon_min, lon_max) in _REGION_BBOXES.items():
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return region
    return None


def _read_json_array(path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def _region_data_dir(region: str):
    """Return the Path for a region's seed directory."""
    subdir = _REGION_DIRS.get(region)
    if subdir is None:
        return data_dir()
    return data_dir() / "regions" / subdir


def load_production_contacts(region: str = "chennai") -> list[dict[str, Any]]:
    """Source-backed local contacts for the given region."""
    return _read_json_array(_region_data_dir(region) / "contacts.seed.json")


def load_fallback_contacts(region: str = "chennai") -> list[dict[str, Any]]:
    """Official emergency fallbacks for the given region.

    For Chennai (default) uses the root fallbacks.seed.json.
    For other regions, uses the region-specific fallbacks.seed.json if it
    exists, otherwise falls back to the root national fallbacks.
    """
    region_path = _region_data_dir(region) / "fallbacks.seed.json"
    if region_path.exists():
        return _read_json_array(region_path)
    # Fall back to root national fallbacks.
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
    *, allow_fixtures: bool, region: str = "chennai"
) -> dict[str, Any]:
    """Pick the contact set the API should rank over.

    Priority order:
      1. Production JSON seed for the requested region (source of truth).
      2. SQLite cache (if seed is somehow unavailable but DB exists) — Chennai only.
      3. Fixtures (only when ``allow_fixtures`` is True and production is empty).
      4. Empty list with a clear warning.

    Returns ``{"contacts", "is_fixture", "warnings"}``.
    """
    production = load_production_contacts(region=region)
    if production:
        return {"contacts": production, "is_fixture": False, "warnings": []}

    # Fallback to SQLite if JSON seed is missing (Chennai only, legacy path).
    if region == "chennai":
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
            f"No production local contacts available for region '{region}'. "
            "Use the official fallback contacts."
        ],
    }
