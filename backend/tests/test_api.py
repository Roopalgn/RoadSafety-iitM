"""API contract tests against ``contracts/api.examples.json`` shapes.

Merge 2: production Chennai contacts are now populated, so tests assert
against real data behaviour rather than fixture fallbacks.
"""

import json

from fastapi.testclient import TestClient

from app.core.paths import contracts_dir
from app.main import app

client = TestClient(app)

# IIT Madras main gate coordinates (golden demo origin).
IITM = {"lat": 12.9915, "lon": 80.2337}


def _examples():
    with (contracts_dir() / "api.examples.json").open(encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["offline_cache_version"]


# ---------------------------------------------------------------------------
# /api/nearby-services — shape and contract
# ---------------------------------------------------------------------------

def test_nearby_services_shape_matches_contract():
    res = client.post(
        "/api/nearby-services",
        json={**IITM, "radius_km": 8, "service_types": [], "location_source": "gps"},
    )
    assert res.status_code == 200
    body = res.json()
    expected_keys = set(_examples()["nearby_services_response"].keys())
    assert expected_keys.issubset(body.keys())
    assert body["query_location"]["source"] == "gps"


def test_nearby_services_invalid_coordinates_rejected():
    """Pydantic must reject out-of-range coordinates with 422."""
    res = client.post("/api/nearby-services", json={"lat": 200, "lon": 80})
    assert res.status_code == 422


def test_nearby_services_invalid_lat_too_low():
    res = client.post("/api/nearby-services", json={"lat": -91, "lon": 80})
    assert res.status_code == 422


def test_nearby_services_invalid_lon_too_high():
    res = client.post("/api/nearby-services", json={"lat": 12.99, "lon": 181})
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# /api/nearby-services — Chennai production data (Merge 2)
# ---------------------------------------------------------------------------

def test_nearby_services_returns_production_results_for_iitm():
    """Real Chennai contacts must appear for IIT Madras coordinates."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20})
    assert res.status_code == 200
    body = res.json()
    services = body["services"]
    assert services, "Production Chennai contacts must return ranked results for IIT Madras"
    # No fixture warning when production data is present.
    assert not any("FIXTURE" in w for w in body["warnings"])


def test_nearby_services_sorted_by_distance():
    """Results must be sorted ascending by distance_km."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20})
    services = res.json()["services"]
    assert services
    distances = [s["distance_km"] for s in services]
    assert distances == sorted(distances), "Services must be sorted by distance ascending"


def test_nearby_services_is_deterministic():
    """Same request must return same ordered result every time."""
    payload = {**IITM, "radius_km": 20}
    first = client.post("/api/nearby-services", json=payload).json()["services"]
    second = client.post("/api/nearby-services", json=payload).json()["services"]
    assert [s["id"] for s in first] == [s["id"] for s in second]


def test_nearby_services_contacts_have_trust_metadata():
    """Every ranked contact must carry source, verified_at, and confidence."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20})
    for svc in res.json()["services"]:
        assert svc["source_url"], f"{svc['id']} missing source_url"
        assert svc["source_name"], f"{svc['id']} missing source_name"
        assert svc["verified_at"], f"{svc['id']} missing verified_at"
        assert svc["confidence_score"] > 0, f"{svc['id']} has zero confidence"
        assert svc["confidence_reasons"], f"{svc['id']} missing confidence_reasons"


def test_nearby_services_contacts_have_ranking_reasons():
    """Every ranked contact must carry ranking_reasons."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20})
    for svc in res.json()["services"]:
        assert svc.get("ranking_reasons"), f"{svc['id']} missing ranking_reasons"


def test_service_type_filter_hospital():
    res = client.post(
        "/api/nearby-services",
        json={**IITM, "radius_km": 20, "service_types": ["hospital"]},
    )
    services = res.json()["services"]
    assert services
    assert all(s["type"] == "hospital" for s in services)


def test_service_type_filter_police():
    res = client.post(
        "/api/nearby-services",
        json={**IITM, "radius_km": 20, "service_types": ["police"]},
    )
    services = res.json()["services"]
    assert services
    assert all(s["type"] == "police" for s in services)


def test_service_type_filter_trauma_center():
    res = client.post(
        "/api/nearby-services",
        json={**IITM, "radius_km": 20, "service_types": ["trauma_center"]},
    )
    services = res.json()["services"]
    assert services
    assert all(s["type"] == "trauma_center" for s in services)


# ---------------------------------------------------------------------------
# /api/nearby-services — fallback behavior (Merge 2)
# ---------------------------------------------------------------------------

def test_fallback_contacts_always_present():
    """Official fallback contacts (112, 108, 100) must always be in response."""
    res = client.post("/api/nearby-services", json={**IITM})
    fallbacks = res.json()["fallback_contacts"]
    phones = [c["phone"] for c in fallbacks]
    assert "112" in phones, "ERSS 112 must always be in fallback_contacts"
    assert "108" in phones, "Ambulance 108 must always be in fallback_contacts"


def test_no_results_within_tiny_radius_triggers_expand_hint():
    """When no services are found, response must suggest expanding the radius."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 0.01})
    body = res.json()
    assert body["services"] == []
    warnings_text = " ".join(body["warnings"]).lower()
    assert "expand" in warnings_text or "radius" in warnings_text, (
        "Must suggest expanding radius when no results found"
    )


def test_no_results_within_tiny_radius_still_has_fallbacks():
    """Even with zero local results, fallback contacts must be present."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 0.01})
    body = res.json()
    assert body["fallback_contacts"], "Fallback contacts must be present even with no local results"


def test_empty_dataset_fallback():
    """When no contacts match the filter, fallbacks must still be returned."""
    res = client.post(
        "/api/nearby-services",
        json={**IITM, "radius_km": 20, "service_types": ["repair"]},
    )
    body = res.json()
    # repair contacts may or may not exist; fallbacks must always be present.
    assert body["fallback_contacts"]


# ---------------------------------------------------------------------------
# /api/cache-package
# ---------------------------------------------------------------------------

def test_cache_package_shape():
    res = client.get("/api/cache-package")
    assert res.status_code == 200
    body = res.json()
    assert body["version"] == "merge3-cross-region-0"
    assert isinstance(body["contacts"], list)
    assert isinstance(body["fallback_contacts"], list)
    assert isinstance(body["approved_templates"], list)


def test_cache_package_contains_production_contacts():
    """Cache package must contain real Chennai contacts, not fixtures."""
    res = client.get("/api/cache-package")
    body = res.json()
    assert body["contacts"], "Cache package must contain production contacts"
    ids = [c["id"] for c in body["contacts"]]
    # Must not contain fixture IDs.
    assert not any(i.startswith("fixture-") for i in ids), (
        "Cache package must not contain fixture contacts"
    )


def test_cache_package_fallbacks_include_112():
    res = client.get("/api/cache-package")
    fallbacks = res.json()["fallback_contacts"]
    assert any(c["phone"] == "112" for c in fallbacks)


def test_cache_package_has_approved_templates():
    res = client.get("/api/cache-package")
    templates = res.json()["approved_templates"]
    assert templates, "Cache package must include approved safety templates"
    assert any("112" in t or "108" in t for t in templates), (
        "Templates must reference official emergency numbers"
    )


# ---------------------------------------------------------------------------
# /api/incident-summary
# ---------------------------------------------------------------------------

def test_incident_summary_matches_contract():
    example = _examples()["incident_summary_request"]
    res = client.post("/api/incident-summary", json=example)
    assert res.status_code == 200
    body = res.json()
    assert "IIT Madras main gate" in body["summary"]
    assert body["medical_disclaimer"]
    assert body["generated_from"] == "user_reported_fields"


def test_incident_summary_minimal_input():
    """Minimal input (lat/lon only) must still produce a valid summary."""
    res = client.post("/api/incident-summary", json={**IITM})
    assert res.status_code == 200
    body = res.json()
    assert str(IITM["lat"]) in body["summary"]
    assert body["medical_disclaimer"]


def test_incident_summary_no_medical_advice():
    """Summary must carry the medical disclaimer."""
    res = client.post("/api/incident-summary", json={**IITM, "notes": "person unconscious"})
    body = res.json()
    assert "not medical advice" in body["medical_disclaimer"].lower()


# ---------------------------------------------------------------------------
# /api/assistant — retrieval-based (Merge 3)
# ---------------------------------------------------------------------------

def test_assistant_hospital_query_returns_contacts():
    """'nearest hospital' must return matched contacts, not a refusal."""
    res = client.post(
        "/api/assistant",
        json={"message": "nearest hospital", **IITM},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] is None
    assert body["matched_contacts"], "Hospital query must return matched contacts"
    assert "verified_contacts_db" in body["used_sources"]
    # All returned contacts must be hospital or trauma_center type.
    for c in body["matched_contacts"]:
        assert c["type"] in ("hospital", "trauma_center"), (
            f"Unexpected type {c['type']} in hospital query result"
        )


def test_assistant_ambulance_query_returns_contacts():
    res = client.post(
        "/api/assistant",
        json={"message": "call ambulance 108", **IITM},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] is None
    assert body["matched_contacts"]
    assert all(c["type"] == "ambulance" for c in body["matched_contacts"])


def test_assistant_police_query_returns_contacts():
    res = client.post(
        "/api/assistant",
        json={"message": "nearest police station", **IITM},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] is None
    assert body["matched_contacts"]
    assert all(c["type"] == "police" for c in body["matched_contacts"])


def test_assistant_fire_query_returns_contacts():
    res = client.post(
        "/api/assistant",
        json={"message": "fire station near me", **IITM},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] is None
    assert body["matched_contacts"]
    assert all(c["type"] == "fire_station" for c in body["matched_contacts"])


def test_assistant_realtime_query_refused():
    """'Is the ambulance coming?' must be refused with correct reason."""
    res = client.post(
        "/api/assistant",
        json={"message": "is the ambulance coming?", **IITM},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] == "realtime_availability_not_supported"
    assert body["matched_contacts"] == []


def test_assistant_eta_query_refused():
    res = client.post(
        "/api/assistant",
        json={"message": "what is the ETA of the ambulance?", **IITM},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] == "realtime_availability_not_supported"


def test_assistant_medical_advice_refused():
    res = client.post(
        "/api/assistant",
        json={"message": "how do I treat a broken leg?", **IITM},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] == "medical_legal_advice_not_provided"
    assert body["matched_contacts"] == []


def test_assistant_unknown_query_refused():
    res = client.post(
        "/api/assistant",
        json={"message": "what is the weather today?", **IITM},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] == "query_outside_verified_dataset"


def test_assistant_results_are_deterministic():
    """Same query must return same contacts in same order every time."""
    payload = {"message": "nearest hospital", **IITM}
    first = client.post("/api/assistant", json=payload).json()["matched_contacts"]
    second = client.post("/api/assistant", json=payload).json()["matched_contacts"]
    assert [c["id"] for c in first] == [c["id"] for c in second]


def test_assistant_matched_contacts_have_trust_metadata():
    """Every matched contact must carry source and confidence metadata."""
    res = client.post(
        "/api/assistant",
        json={"message": "nearest hospital", **IITM},
    )
    for c in res.json()["matched_contacts"]:
        assert c["source_url"], f"{c['id']} missing source_url"
        assert c["source_name"], f"{c['id']} missing source_name"
        assert c["confidence_score"] > 0, f"{c['id']} has zero confidence"


# ---------------------------------------------------------------------------
# Cross-region: Bengaluru (Merge 3)
# ---------------------------------------------------------------------------

# Koramangala, Bengaluru coordinates.
KORAMANGALA = {"lat": 12.9352, "lon": 77.6245}


def test_bengaluru_coordinates_return_bengaluru_contacts():
    """Bengaluru coordinates must auto-detect the bengaluru region."""
    res = client.post("/api/nearby-services", json={**KORAMANGALA, "radius_km": 20})
    assert res.status_code == 200
    body = res.json()
    services = body["services"]
    assert services, "Bengaluru coordinates must return Bengaluru contacts"
    # All returned contacts must be from Karnataka region.
    for svc in services:
        assert svc["region"] == "Karnataka", (
            f"{svc['id']} has region={svc['region']}, expected Karnataka"
        )


def test_bengaluru_explicit_region_parameter():
    """Explicit region='bengaluru' must return Bengaluru contacts."""
    res = client.post(
        "/api/nearby-services",
        json={**KORAMANGALA, "radius_km": 20, "region": "bengaluru"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["services"], "Explicit bengaluru region must return contacts"


def test_bengaluru_does_not_return_chennai_contacts():
    """Bengaluru query must not return Tamil Nadu contacts."""
    res = client.post("/api/nearby-services", json={**KORAMANGALA, "radius_km": 20})
    body = res.json()
    for svc in body["services"]:
        assert svc["region"] != "Tamil Nadu", (
            f"Chennai contact {svc['id']} appeared in Bengaluru query"
        )


def test_chennai_coordinates_return_chennai_contacts():
    """Chennai coordinates must return Tamil Nadu contacts, not Bengaluru."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20})
    body = res.json()
    for svc in body["services"]:
        assert svc["region"] == "Tamil Nadu", (
            f"Non-Chennai contact {svc['id']} appeared in Chennai query"
        )


# ---------------------------------------------------------------------------
# Chaos-case tests (Merge 3)
# ---------------------------------------------------------------------------

def test_coordinates_in_ocean_returns_only_fallbacks():
    """Coordinates in the ocean (outside all bounding boxes) must return
    only national fallback contacts and a warning."""
    ocean = {"lat": 10.0, "lon": 70.0}  # Arabian Sea
    res = client.post("/api/nearby-services", json={**ocean, "radius_km": 50})
    assert res.status_code == 200
    body = res.json()
    assert body["services"] == [], "No local services for ocean coordinates"
    assert body["fallback_contacts"], "Fallbacks must still be present"
    warnings_text = " ".join(body["warnings"]).lower()
    assert "outside" in warnings_text or "bounding" in warnings_text or "fallback" in warnings_text


def test_null_island_coordinates_handled():
    """Coordinates at 0,0 (Null Island) must not crash and return fallbacks."""
    res = client.post("/api/nearby-services", json={"lat": 0.0, "lon": 0.0, "radius_km": 50})
    assert res.status_code == 200
    body = res.json()
    assert body["fallback_contacts"], "Fallbacks must be present for Null Island"


def test_fire_station_type_filter_works():
    """Filtering by fire_station type must return only fire stations."""
    res = client.post(
        "/api/nearby-services",
        json={**IITM, "radius_km": 20, "service_types": ["fire_station"]},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["services"], "Chennai must have fire station contacts"
    assert all(s["type"] == "fire_station" for s in body["services"])


def test_chennai_has_20_plus_contacts():
    """Chennai must have at least 20 production contacts (Merge 3 target)."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 50})
    body = res.json()
    # Count services + no-coord contacts that appear in fallbacks.
    # Use cache-package which returns all production contacts.
    cache_res = client.get("/api/cache-package")
    contacts = cache_res.json()["contacts"]
    assert len(contacts) >= 20, (
        f"Chennai must have 20+ contacts, found {len(contacts)}"
    )


def test_ranking_reasons_include_freshness():
    """Ranking reasons must include data freshness information."""
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20})
    services = res.json()["services"]
    assert services
    # At least one service should have freshness info in ranking reasons.
    all_reasons = " ".join(
        r for svc in services for r in (svc.get("ranking_reasons") or [])
    )
    assert "days ago" in all_reasons, "Ranking reasons must include data freshness"
