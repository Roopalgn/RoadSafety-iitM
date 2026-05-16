"""De-duplication rule tests."""

from app.core.dedupe import dedupe_contacts, normalize_name, normalize_phone


def test_normalize_phone_strips_formatting():
    assert normalize_phone("+91 044-2257 4802") == normalize_phone("04422574802")
    assert normalize_phone("112") == "112"  # short code preserved
    assert normalize_phone(None) == ""


def test_normalize_name():
    assert normalize_name("  Apollo  Hospital!! ") == "apollo hospital"
    assert normalize_name(None) == ""


def test_dedupe_by_phone_keeps_higher_confidence():
    contacts = [
        {"id": "low", "name": "A Clinic", "phone": "044-1", "confidence_score": 0.4},
        {"id": "high", "name": "A Clinic Annex", "phone": "0441", "confidence_score": 0.9},
    ]
    result = dedupe_contacts(contacts)
    assert [c["id"] for c in result["contacts"]] == ["high"]
    assert result["removed"][0]["id"] == "low"
    assert result["removed"][0]["duplicate_of"] == "high"


def test_dedupe_by_name_and_proximity():
    contacts = [
        {
            "id": "a",
            "name": "City Hospital",
            "phone": "111",
            "lat": 12.9900,
            "lon": 80.2300,
            "confidence_score": 0.8,
        },
        {
            "id": "b",
            "name": "city hospital",
            "phone": "222",
            "lat": 12.99003,
            "lon": 80.23003,
            "confidence_score": 0.7,
        },
    ]
    result = dedupe_contacts(contacts)
    assert len(result["contacts"]) == 1
    assert result["contacts"][0]["id"] == "a"


def test_same_name_far_apart_not_merged():
    contacts = [
        {"id": "a", "name": "Care Hospital", "phone": "1", "lat": 12.99, "lon": 80.23, "confidence_score": 0.8},
        {"id": "b", "name": "Care Hospital", "phone": "2", "lat": 13.20, "lon": 80.30, "confidence_score": 0.8},
    ]
    result = dedupe_contacts(contacts)
    assert len(result["contacts"]) == 2


def test_dedupe_is_order_independent():
    contacts = [
        {"id": "low", "name": "X", "phone": "9", "confidence_score": 0.3},
        {"id": "high", "name": "X dup", "phone": "9", "confidence_score": 0.9},
    ]
    forward = dedupe_contacts(contacts)["contacts"]
    backward = dedupe_contacts(list(reversed(contacts)))["contacts"]
    assert [c["id"] for c in forward] == [c["id"] for c in backward] == ["high"]
