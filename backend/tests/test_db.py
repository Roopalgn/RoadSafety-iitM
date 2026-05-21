"""Tests for the SQLite database build script (Merge 2).

Verifies that ``scripts/build_db.py`` produces a valid, versioned SQLite
database from the seed JSON files, and that ``data_loader.load_contacts_from_db``
reads it back correctly.
"""

import tempfile
from pathlib import Path

import pytest

from app.core.data_loader import (
    OFFLINE_CACHE_VERSION,
    load_contacts_from_db,
    load_fallback_contacts,
    load_production_contacts,
)
from app.core.validation import validate_collection
from scripts.build_db import CACHE_VERSION, build


@pytest.fixture()
def tmp_db(tmp_path):
    """Build a fresh database in a temp directory and return its path."""
    db_path = tmp_path / "roadsos.db"
    version_path = tmp_path / "cache_version.txt"
    rc = build(db_path, version_path)
    assert rc == 0, "build_db must succeed with valid seed data"
    return db_path, version_path


def test_build_creates_db_file(tmp_db):
    db_path, _ = tmp_db
    assert db_path.exists(), "build_db must create the SQLite file"


def test_build_writes_version_file(tmp_db):
    _, version_path = tmp_db
    assert version_path.exists()
    assert version_path.read_text(encoding="utf-8").strip() == CACHE_VERSION


def test_cache_version_matches_data_loader():
    """CACHE_VERSION in build_db must stay in sync with OFFLINE_CACHE_VERSION."""
    assert CACHE_VERSION == OFFLINE_CACHE_VERSION


def test_db_contains_production_contacts(tmp_db):
    db_path, _ = tmp_db
    contacts = load_contacts_from_db(db_path)
    assert contacts, "Database must contain production contacts"
    # Must not contain fixture IDs.
    ids = [c["id"] for c in contacts]
    assert not any(i.startswith("fixture-") for i in ids)


def test_db_contacts_match_seed(tmp_db):
    """Row count in DB must match the seed JSON."""
    db_path, _ = tmp_db
    seed = load_production_contacts()
    db_contacts = load_contacts_from_db(db_path)
    assert len(db_contacts) == len(seed), (
        f"DB has {len(db_contacts)} contacts but seed has {len(seed)}"
    )


def test_db_fallbacks_match_seed(tmp_db):
    db_path, _ = tmp_db
    seed_fallbacks = load_fallback_contacts()
    db_fallbacks = load_contacts_from_db(db_path, fallbacks_only=True)
    assert len(db_fallbacks) == len(seed_fallbacks)


def test_db_contacts_pass_schema_validation(tmp_db):
    db_path, _ = tmp_db
    contacts = load_contacts_from_db(db_path)
    report = validate_collection(contacts, production=True)
    assert report["ok"], report["errors"]


def test_db_confidence_reasons_deserialised(tmp_db):
    """confidence_reasons must come back as a list, not a JSON string."""
    db_path, _ = tmp_db
    contacts = load_contacts_from_db(db_path)
    for c in contacts:
        assert isinstance(c["confidence_reasons"], list), (
            f"{c['id']}: confidence_reasons must be a list"
        )
        assert c["confidence_reasons"], f"{c['id']}: confidence_reasons must not be empty"


def test_db_missing_returns_empty(tmp_path):
    """load_contacts_from_db must return [] gracefully when DB does not exist."""
    missing = tmp_path / "nonexistent.db"
    assert load_contacts_from_db(missing) == []


def test_build_is_repeatable(tmp_path):
    """Running build twice must produce the same result (idempotent)."""
    db1 = tmp_path / "first.db"
    db2 = tmp_path / "second.db"
    v1 = tmp_path / "v1.txt"
    v2 = tmp_path / "v2.txt"
    build(db1, v1)
    build(db2, v2)
    c1 = sorted(c["id"] for c in load_contacts_from_db(db1))
    c2 = sorted(c["id"] for c in load_contacts_from_db(db2))
    assert c1 == c2, "Repeated builds must produce identical contact sets"
