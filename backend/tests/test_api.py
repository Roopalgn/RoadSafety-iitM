"""API contract tests against ``contracts/api.examples.json`` shapes."""

import json

from fastapi.testclient import TestClient

from app.core.paths import contracts_dir
from app.main import app

client = TestClient(app)

IITM = {"lat": 12.9915, "lon": 80.2337}


def _examples():
    with (contracts_dir() / "api.examples.json").open(encoding="utf-8") as fh:
        return json.load(fh)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["offline_cache_version"]


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


def test_nearby_services_returns_ranked_fixture_results():
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20})
    body = res.json()
    services = body["services"]
    assert services, "fixtures should produce ranked services in Merge 1"
    # Sorted ascending by distance.
    distances = [s["distance_km"] for s in services]
    assert distances == sorted(distances)
    # Honesty: fixture data must be flagged loudly.
    assert any("FIXTURE" in w for w in body["warnings"])
    # Null-coordinate fixture must be excluded from distance ranking.
    assert all(s["id"] != "fixture-statewide-helpline" for s in services)


def test_nearby_services_is_deterministic():
    payload = {**IITM, "radius_km": 20}
    first = client.post("/api/nearby-services", json=payload).json()["services"]
    second = client.post("/api/nearby-services", json=payload).json()["services"]
    assert [s["id"] for s in first] == [s["id"] for s in second]


def test_nearby_services_dedupes_fixture_duplicate():
    res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20})
    body = res.json()
    ids = [s["id"] for s in body["services"]]
    assert not ("fixture-ambulance-svc" in ids and "fixture-ambulance-svc-duplicate" in ids)
    assert any("duplicate" in w for w in body["warnings"])


def test_service_type_filter():
    res = client.post(
        "/api/nearby-services",
        json={**IITM, "radius_km": 20, "service_types": ["police"]},
    )
    services = res.json()["services"]
    assert services
    assert all(s["type"] == "police" for s in services)


def test_fallback_contacts_present_and_official():
    res = client.post("/api/nearby-services", json={**IITM})
    fallbacks = res.json()["fallback_contacts"]
    assert any(c["phone"] == "112" for c in fallbacks)


def test_invalid_coordinates_rejected():
    res = client.post("/api/nearby-services", json={"lat": 200, "lon": 80})
    assert res.status_code == 422


def test_cache_package():
    res = client.get("/api/cache-package")
    assert res.status_code == 200
    body = res.json()
    assert body["version"]
    assert isinstance(body["contacts"], list)
    assert isinstance(body["fallback_contacts"], list)


def test_incident_summary():
    example = _examples()["incident_summary_request"]
    res = client.post("/api/incident-summary", json=example)
    assert res.status_code == 200
    body = res.json()
    assert "IIT Madras main gate" in body["summary"]
    assert body["medical_disclaimer"]


def test_assistant_is_guarded_stub():
    res = client.post("/api/assistant", json={"message": "find nearest ambulance"})
    assert res.status_code == 200
    body = res.json()
    assert body["refusal_reason"] == "assistant_layer_not_implemented"
    assert "approved_safety_templates" in body["used_sources"]
