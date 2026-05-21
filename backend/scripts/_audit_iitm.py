"""Audit script: verify IIT Madras ranked results and API contract compliance."""
import json
import sys

sys.path.insert(0, ".")

from fastapi.testclient import TestClient

from app.core.paths import contracts_dir
from app.main import app

client = TestClient(app)
IITM = {"lat": 12.9915, "lon": 80.2337}

PASS = []
FAIL = []


def check(label, condition, detail=""):
    if condition:
        PASS.append(label)
        print(f"  [PASS] {label}")
    else:
        FAIL.append(label)
        print(f"  [FAIL] {label}" + (f" -- {detail}" if detail else ""))


# -----------------------------------------------------------------------
# 1. IIT Madras ranked results
# -----------------------------------------------------------------------
print("\n=== 1. Chennai data: ranked results for IIT Madras (20 km radius) ===")
res = client.post("/api/nearby-services", json={**IITM, "radius_km": 20, "location_source": "gps"})
body = res.json()

check("HTTP 200", res.status_code == 200)
check("Has ranked services", len(body["services"]) > 0,
      f"got {len(body['services'])}")
check("No FIXTURE warning (production data active)",
      not any("FIXTURE" in w for w in body["warnings"]),
      str(body["warnings"]))
check("Sorted by distance ascending",
      [s["distance_km"] for s in body["services"]] == sorted(s["distance_km"] for s in body["services"]))
check("All services have source_url",
      all(s.get("source_url") for s in body["services"]))
check("All services have verified_at",
      all(s.get("verified_at") for s in body["services"]))
check("All services have confidence_score > 0",
      all(s.get("confidence_score", 0) > 0 for s in body["services"]))
check("All services have ranking_reasons",
      all(s.get("ranking_reasons") for s in body["services"]))
check("Fallback contacts present",
      len(body["fallback_contacts"]) > 0)
check("ERSS 112 in fallbacks",
      any(c["phone"] == "112" for c in body["fallback_contacts"]))
check("Ambulance 108 in fallbacks",
      any(c["phone"] == "108" for c in body["fallback_contacts"]))
check("Cache version is merge2",
      body["offline_cache_version"] == "merge2-chennai-data-0")

print("\n  Ranked order:")
for i, s in enumerate(body["services"], 1):
    print(f"    {i:2}. [{s['type']:15}] {s['name'][:45]:45} | {s['distance_km']:6.2f} km | conf {s['confidence_score']:.2f} | {s['phone']}")

print("\n  Fallbacks:")
for f in body["fallback_contacts"]:
    print(f"       [{f['type']:18}] {f['name'][:40]:40} | {f['phone']}")

# -----------------------------------------------------------------------
# 2. Fallback behavior: tiny radius -> expand hint
# -----------------------------------------------------------------------
print("\n=== 2. Fallback behavior: no results within 0.01 km ===")
res2 = client.post("/api/nearby-services", json={**IITM, "radius_km": 0.01})
body2 = res2.json()
warnings_text = " ".join(body2["warnings"]).lower()
check("Empty services list", body2["services"] == [])
check("Expand-radius hint in warnings", "expand" in warnings_text or "radius" in warnings_text,
      str(body2["warnings"]))
check("Fallbacks still present", len(body2["fallback_contacts"]) > 0)

# -----------------------------------------------------------------------
# 3. Fallback behavior: invalid coordinates -> 422
# -----------------------------------------------------------------------
print("\n=== 3. Invalid coordinates -> 422 ===")
for bad in [{"lat": 200, "lon": 80}, {"lat": -91, "lon": 0}, {"lat": 12.99, "lon": 181}]:
    r = client.post("/api/nearby-services", json=bad)
    check(f"422 for {bad}", r.status_code == 422)

# -----------------------------------------------------------------------
# 4. Service type filters
# -----------------------------------------------------------------------
print("\n=== 4. Service type filters ===")
for stype in ["hospital", "police", "trauma_center"]:
    r = client.post("/api/nearby-services",
                    json={**IITM, "radius_km": 20, "service_types": [stype]})
    svcs = r.json()["services"]
    check(f"Filter '{stype}' returns results", len(svcs) > 0, f"got {len(svcs)}")
    check(f"Filter '{stype}' all correct type", all(s["type"] == stype for s in svcs))

# Ambulance 108 has null coords so it surfaces in fallback_contacts, not services.
# This is correct behaviour per data/README.md: null-coord contacts are excluded
# from distance ranking and surfaced as fallbacks instead.
r_amb = client.post("/api/nearby-services",
                    json={**IITM, "radius_km": 20, "service_types": ["ambulance"]})
body_amb = r_amb.json()
all_amb = body_amb["services"] + body_amb["fallback_contacts"]
check("Filter 'ambulance' surfaces 108 (in services or fallbacks)",
      any(c["phone"] == "108" for c in all_amb),
      "108 not found in services or fallback_contacts")

# -----------------------------------------------------------------------
# 5. API examples contract compliance
# -----------------------------------------------------------------------
print("\n=== 5. API examples contract compliance ===")
with (contracts_dir() / "api.examples.json").open(encoding="utf-8") as fh:
    examples = json.load(fh)

# nearby-services
r = client.post("/api/nearby-services", json=examples["nearby_services_request"])
b = r.json()
expected_keys = set(examples["nearby_services_response"].keys())
check("nearby_services: all contract keys present",
      expected_keys.issubset(b.keys()),
      f"missing: {expected_keys - set(b.keys())}")
check("nearby_services: query_location.source matches",
      b["query_location"]["source"] == "gps")
check("nearby_services: fallback has 112",
      any(c["phone"] == "112" for c in b["fallback_contacts"]))

# incident-summary
r2 = client.post("/api/incident-summary", json=examples["incident_summary_request"])
b2 = r2.json()
exp2 = set(examples["incident_summary_response"].keys())
check("incident_summary: all contract keys present",
      exp2.issubset(b2.keys()),
      f"missing: {exp2 - set(b2.keys())}")
check("incident_summary: contains landmark",
      "IIT Madras main gate" in b2["summary"])
check("incident_summary: medical_disclaimer present",
      bool(b2.get("medical_disclaimer")))
check("incident_summary: generated_from = user_reported_fields",
      b2.get("generated_from") == "user_reported_fields")

# assistant
r3 = client.post("/api/assistant", json=examples["assistant_request"])
b3 = r3.json()
exp3 = set(examples["assistant_response"].keys())
check("assistant: all contract keys present",
      exp3.issubset(b3.keys()),
      f"missing: {exp3 - set(b3.keys())}")

# cache-package
r4 = client.get("/api/cache-package")
b4 = r4.json()
check("cache_package: HTTP 200", r4.status_code == 200)
check("cache_package: version = merge2-chennai-data-0",
      b4.get("version") == "merge2-chennai-data-0")
check("cache_package: contacts non-empty", len(b4.get("contacts", [])) > 0)
check("cache_package: no fixture IDs",
      not any(c["id"].startswith("fixture-") for c in b4.get("contacts", [])))
check("cache_package: approved_templates non-empty",
      len(b4.get("approved_templates", [])) > 0)

# health
r5 = client.get("/health")
b5 = r5.json()
check("health: status ok", b5.get("status") == "ok")
check("health: offline_cache_version present", bool(b5.get("offline_cache_version")))

# -----------------------------------------------------------------------
# 6. Determinism
# -----------------------------------------------------------------------
print("\n=== 6. Determinism ===")
payload = {**IITM, "radius_km": 20}
ids1 = [s["id"] for s in client.post("/api/nearby-services", json=payload).json()["services"]]
ids2 = [s["id"] for s in client.post("/api/nearby-services", json=payload).json()["services"]]
check("Same order on repeated calls", ids1 == ids2)

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
print(f"\n{'='*60}")
print(f"RESULT: {len(PASS)} passed, {len(FAIL)} failed")
if FAIL:
    print("FAILED checks:")
    for f in FAIL:
        print(f"  - {f}")
    sys.exit(1)
else:
    print("ALL CHECKS PASSED")
    sys.exit(0)
