"""Tests for the retrieval-based assistant (Merge 3).

Verifies intent matching, contact retrieval, refusal logic, and
determinism. The assistant must never invent contacts.
"""

from datetime import date

import pytest

from app.core.assistant import run_assistant

TODAY = date(2026, 5, 25)

# IIT Madras coordinates.
IITM_LAT, IITM_LON = 12.9915, 80.2337

# Minimal valid contact factory.
def _contact(id: str, type: str, lat=12.99, lon=80.23, phone="044-0000", availability="24x7"):
    return {
        "id": id,
        "name": f"Test {type.title()} {id}",
        "type": type,
        "lat": lat,
        "lon": lon,
        "phone": phone,
        "address": "1 Test Road",
        "locality": "Chennai",
        "region": "Tamil Nadu",
        "country": "India",
        "source_url": "https://example.test/source",
        "source_name": "Example Source",
        "verified_at": "2026-05-20",
        "availability": availability,
        "confidence_score": 0.9,
        "confidence_reasons": ["official source"],
        "notes": None,
    }


SAMPLE_CONTACTS = [
    _contact("h1", "hospital"),
    _contact("h2", "trauma_center"),
    _contact("p1", "police"),
    _contact("a1", "ambulance", lat=None, lon=None),
    _contact("f1", "fire_station"),
    _contact("t1", "tow"),
    _contact("r1", "repair", availability="office_hours"),
]


# ---------------------------------------------------------------------------
# Intent matching — returns contacts
# ---------------------------------------------------------------------------

def test_hospital_intent_returns_hospitals():
    result = run_assistant("nearest hospital", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] is None
    types = {c["type"] for c in result["matched_contacts"]}
    assert types.issubset({"hospital", "trauma_center"})
    assert result["matched_contacts"]


def test_trauma_keyword_returns_hospitals():
    result = run_assistant("trauma centre nearby", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] is None
    assert result["matched_contacts"]


def test_ambulance_intent_returns_ambulance():
    result = run_assistant("call ambulance 108", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] is None
    assert all(c["type"] == "ambulance" for c in result["matched_contacts"])


def test_police_intent_returns_police():
    result = run_assistant("nearest police station", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] is None
    assert all(c["type"] == "police" for c in result["matched_contacts"])


def test_fire_intent_returns_fire_stations():
    result = run_assistant("fire station near me", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] is None
    assert all(c["type"] == "fire_station" for c in result["matched_contacts"])


def test_tow_intent_returns_tow_and_repair():
    result = run_assistant("my car broke down, need towing", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] is None
    types = {c["type"] for c in result["matched_contacts"]}
    assert types.issubset({"tow", "repair"})


def test_used_sources_is_verified_contacts_db():
    result = run_assistant("nearest hospital", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert "verified_contacts_db" in result["used_sources"]


# ---------------------------------------------------------------------------
# Refusal cases
# ---------------------------------------------------------------------------

def test_realtime_query_refused():
    result = run_assistant("is the ambulance coming?", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] == "realtime_availability_not_supported"
    assert result["matched_contacts"] == []


def test_eta_query_refused():
    result = run_assistant("what is the ETA?", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] == "realtime_availability_not_supported"


def test_dispatch_status_refused():
    result = run_assistant("has the ambulance been dispatched?", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] == "realtime_availability_not_supported"


def test_medical_advice_refused():
    result = run_assistant("how do I treat a broken leg?", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] == "medical_legal_advice_not_provided"
    assert result["matched_contacts"] == []


def test_diagnosis_refused():
    result = run_assistant("can you diagnose my injury?", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] == "medical_legal_advice_not_provided"


def test_legal_advice_refused():
    result = run_assistant("can I sue the other driver?", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] == "medical_legal_advice_not_provided"


def test_unknown_query_refused():
    result = run_assistant("what is the weather today?", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] == "query_outside_verified_dataset"
    assert result["matched_contacts"] == []


def test_empty_dataset_returns_no_contacts_not_crash():
    """Assistant must not crash when the contact list is empty."""
    result = run_assistant("nearest hospital", [], IITM_LAT, IITM_LON, TODAY)
    assert result["refusal_reason"] is None
    assert result["matched_contacts"] == []


# ---------------------------------------------------------------------------
# Determinism
# ---------------------------------------------------------------------------

def test_results_are_deterministic():
    """Same query must return same contacts in same order every time."""
    r1 = run_assistant("nearest hospital", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    r2 = run_assistant("nearest hospital", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    assert [c["id"] for c in r1["matched_contacts"]] == [c["id"] for c in r2["matched_contacts"]]


def test_results_without_coordinates_still_sorted():
    """When lat/lon are None, contacts must still be returned sorted by score."""
    result = run_assistant("nearest hospital", SAMPLE_CONTACTS, None, None, TODAY)
    assert result["refusal_reason"] is None
    scores = [c.get("effective_confidence", c.get("confidence_score", 0))
              for c in result["matched_contacts"]]
    assert scores == sorted(scores, reverse=True)


# ---------------------------------------------------------------------------
# Safety: assistant must never invent contacts
# ---------------------------------------------------------------------------

def test_matched_contacts_are_subset_of_input():
    """Every matched contact must come from the input dataset."""
    input_ids = {c["id"] for c in SAMPLE_CONTACTS}
    result = run_assistant("nearest hospital", SAMPLE_CONTACTS, IITM_LAT, IITM_LON, TODAY)
    for c in result["matched_contacts"]:
        assert c["id"] in input_ids, (
            f"Assistant returned contact {c['id']} not in input dataset — "
            "this would be an invented contact"
        )
