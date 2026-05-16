"""Load seed and fixture contact data from disk.

Production data lives in ``data/*.seed.json``. Test fixtures live under
``backend/tests/fixtures/`` and are never silently treated as production.
When production local contacts are empty (the Merge 1 state), the loader
can fall back to fixtures **only when explicitly asked**, and the caller is
responsible for warning that the results are not source-backed.
"""

import json
from typing import Any

from .paths import data_dir, fixtures_dir

OFFLINE_CACHE_VERSION = "merge1-foundation-0"


def _read_json_array(path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def load_production_contacts() -> list[dict[str, Any]]:
    """Source-backed local contacts. Empty until curated in Merge 2."""
    return _read_json_array(data_dir() / "contacts.seed.json")


def load_fallback_contacts() -> list[dict[str, Any]]:
    """Official national/region emergency fallbacks (source-backed)."""
    return _read_json_array(data_dir() / "fallbacks.seed.json")


def load_fixture_contacts() -> list[dict[str, Any]]:
    """Non-production demo contacts. NOT source-backed. Tests/demo only."""
    return _read_json_array(fixtures_dir() / "contacts.fixture.json")


def resolve_service_contacts(
    *, allow_fixtures: bool
) -> dict[str, Any]:
    """Pick the contact set the API should rank over.

    Returns ``{"contacts", "is_fixture", "warnings"}``. Production data is
    always preferred. Fixtures are only used when ``allow_fixtures`` is true
    and production is empty, and always come with a loud warning so fixture
    results can never be mistaken for verified data.
    """
    production = load_production_contacts()
    if production:
        return {"contacts": production, "is_fixture": False, "warnings": []}

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
            "No production local contacts yet. Curated Chennai data lands in Merge 2."
        ],
    }
