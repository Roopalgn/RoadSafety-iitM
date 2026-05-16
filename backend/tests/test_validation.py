"""Contract schema + production-rule validation tests."""

import json

from app.core.data_loader import (
    load_fallback_contacts,
    load_fixture_contacts,
    load_production_contacts,
)
from app.core.paths import contact_schema_path
from app.core.validation import (
    validate_collection,
    validate_contact,
    validate_production_contact,
)


def _valid_contact():
    return {
        "id": "test-hospital-1",
        "name": "Test Hospital",
        "type": "hospital",
        "lat": 12.99,
        "lon": 80.23,
        "phone": "044-0000-0000",
        "address": "1 Test Road",
        "locality": "Chennai",
        "region": "Tamil Nadu",
        "country": "India",
        "source_url": "https://example.test/source",
        "source_name": "Example Source",
        "verified_at": "2026-05-01",
        "availability": "24x7",
        "confidence_score": 0.9,
        "confidence_reasons": ["official directory"],
        "notes": None,
    }


def test_schema_file_exists():
    assert contact_schema_path().exists()


def test_valid_contact_passes():
    assert validate_contact(_valid_contact()) == []


def test_bad_type_rejected():
    bad = _valid_contact()
    bad["type"] = "spaceship"
    assert validate_contact(bad)


def test_bad_date_format_rejected():
    bad = _valid_contact()
    bad["verified_at"] = "16-05-2026"
    errors = validate_contact(bad)
    assert any("verified_at" in e for e in errors)


def test_bad_uri_rejected():
    bad = _valid_contact()
    bad["source_url"] = "not-a-url"
    errors = validate_contact(bad)
    assert any("source_url" in e for e in errors)


def test_out_of_range_confidence_rejected():
    bad = _valid_contact()
    bad["confidence_score"] = 1.5
    assert validate_contact(bad)


def test_production_rules_flag_missing_source():
    bad = _valid_contact()
    bad["source_url"] = ""
    errors = validate_production_contact(bad)
    assert any("source_url" in e for e in errors)


def test_collection_detects_duplicate_ids():
    report = validate_collection([_valid_contact(), _valid_contact()])
    assert not report["ok"]
    assert any("duplicate id" in e for f in report["errors"] for e in f["errors"])


def test_production_seed_files_are_valid():
    # Production contacts seed starts empty; that is valid.
    prod = validate_collection(load_production_contacts(), production=True)
    assert prod["ok"], prod["errors"]
    fb = validate_collection(load_fallback_contacts(), production=True)
    assert fb["ok"], fb["errors"]


def test_fixtures_match_schema():
    report = validate_collection(load_fixture_contacts(), production=False)
    assert report["ok"], report["errors"]


def test_fixtures_are_marked_non_production():
    raw = json.dumps(load_fixture_contacts()).lower()
    assert "fixture" in raw and "not real" in raw
