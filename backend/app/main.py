"""RoadSoS API.

Merge 1 scope (Suyash / data-geo-backend):
  - real ``/api/nearby-services`` backed by the deterministic geo, dedupe,
    and confidence utilities in ``app.core``;
  - request/response models aligned with ``contracts/api.examples.json``;
  - ``/api/cache-package`` serves the offline fallback set.

Production local contacts are still empty, so ``/api/nearby-services``
falls back to clearly-labelled fixtures and warns loudly. ``/api/assistant``
remains a guarded stub until the AI branch lands.
"""

from datetime import datetime, timezone

from fastapi import FastAPI

from .core.confidence import attach_confidence
from .core.data_loader import (
    OFFLINE_CACHE_VERSION,
    load_fallback_contacts,
    resolve_service_contacts,
)
from .core.dedupe import dedupe_contacts
from .core.geo import rank_by_distance
from .core.validation import validate_collection
from .models import (
    AssistantRequest,
    AssistantResponse,
    CachePackageResponse,
    ContactRecord,
    IncidentSummaryRequest,
    IncidentSummaryResponse,
    NearbyServicesRequest,
    NearbyServicesResponse,
    QueryLocation,
)

app = FastAPI(
    title="RoadSoS API",
    description="Offline-first accident response API.",
    version="0.2.0",
)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "roadsos-api",
        "offline_cache_version": OFFLINE_CACHE_VERSION,
    }


@app.post("/api/nearby-services", response_model=NearbyServicesResponse)
def nearby_services(request: NearbyServicesRequest) -> NearbyServicesResponse:
    today = datetime.now(timezone.utc).date()
    warnings: list[str] = []

    resolved = resolve_service_contacts(allow_fixtures=True)
    warnings.extend(resolved["warnings"])
    contacts = resolved["contacts"]

    # Drop any record that does not satisfy the frozen contact schema so a
    # malformed entry can never surface as a "real" emergency contact.
    report = validate_collection(contacts)
    if not report["ok"]:
        bad = {f["index"] for f in report["errors"]}
        warnings.append(
            f"{len(bad)} contact(s) failed schema validation and were skipped."
        )
        contacts = [c for i, c in enumerate(contacts) if i not in bad]

    if request.service_types:
        wanted = set(request.service_types)
        contacts = [c for c in contacts if c.get("type") in wanted]

    deduped = dedupe_contacts(contacts)
    if deduped["removed"]:
        warnings.append(
            f"{len(deduped['removed'])} duplicate contact(s) collapsed."
        )

    ranked = rank_by_distance(
        deduped["contacts"], request.lat, request.lon, radius_km=request.radius_km
    )
    ranked = attach_confidence(ranked, today)

    fallbacks = load_fallback_contacts()
    fb_report = validate_collection(fallbacks)
    if not fb_report["ok"]:
        bad_fb = {f["index"] for f in fb_report["errors"]}
        warnings.append(
            f"{len(bad_fb)} fallback contact(s) failed schema validation and were skipped."
        )
        fallbacks = [c for i, c in enumerate(fallbacks) if i not in bad_fb]

    if not ranked:
        warnings.append(
            "No ranked local services within radius. Use the official fallback contacts."
        )

    return NearbyServicesResponse(
        query_location=QueryLocation(
            lat=request.lat,
            lon=request.lon,
            source=request.location_source,
            confidence="high" if request.location_source == "gps" else "reported",
        ),
        services=[ContactRecord(**c) for c in ranked],
        fallback_contacts=[ContactRecord(**c) for c in fallbacks],
        offline_cache_version=OFFLINE_CACHE_VERSION,
        generated_at=_utc_now_iso(),
        warnings=warnings,
    )


@app.get("/api/cache-package", response_model=CachePackageResponse)
def cache_package() -> CachePackageResponse:
    resolved = resolve_service_contacts(allow_fixtures=True)
    contacts = resolved["contacts"]
    report = validate_collection(contacts)
    if not report["ok"]:
        bad = {f["index"] for f in report["errors"]}
        contacts = [c for i, c in enumerate(contacts) if i not in bad]
    return CachePackageResponse(
        version=OFFLINE_CACHE_VERSION,
        contacts=[ContactRecord(**c) for c in contacts],
        fallback_contacts=[ContactRecord(**c) for c in load_fallback_contacts()],
        approved_templates=[],
    )


@app.post("/api/incident-summary", response_model=IncidentSummaryResponse)
def incident_summary(request: IncidentSummaryRequest) -> IncidentSummaryResponse:
    hazard_text = ", ".join(request.hazards) if request.hazards else "not specified"
    injury_text = (
        f"{request.injury_count} injured person(s)"
        if request.injury_count is not None
        else "injury count unknown"
    )
    landmark = request.nearest_landmark or "nearest landmark not provided"
    notes = request.notes or "no extra notes"
    return IncidentSummaryResponse(
        summary=(
            f"Road accident near {landmark}. {injury_text}. "
            f"Hazards: {hazard_text}. Notes: {notes}. "
            f"Coordinates: {request.lat}, {request.lon}."
        ),
        generated_from="user_reported_fields",
        medical_disclaimer="This is not medical advice or dispatch confirmation.",
    )


@app.post("/api/assistant", response_model=AssistantResponse)
def assistant(request: AssistantRequest) -> AssistantResponse:
    return AssistantResponse(
        answer=(
            "I can only use verified RoadSoS data and approved safety templates. "
            "The full assistant guardrail layer is owned by the AI branch and is "
            "not implemented yet."
        ),
        used_sources=["approved_safety_templates"],
        refusal_reason="assistant_layer_not_implemented",
    )
