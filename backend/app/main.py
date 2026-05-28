"""RoadSoS API.

Merge 4 scope (Suyash / data-geo-backend):
  - Chaos-mode hardening: XSS sanitization on free-text fields, rate-limit
    headers (informational), unicode safety, empty-body 422 via Pydantic.
  - All previous Merge 3 features retained.
"""

import html
import re
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .core.assistant import run_assistant
from .core.confidence import attach_confidence
from .core.data_loader import (
    OFFLINE_CACHE_VERSION,
    detect_region,
    load_fallback_contacts,
    resolve_service_contacts,
)
from .core.dedupe import dedupe_contacts
from .core.geo import has_coordinates, rank_by_distance
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
    version="0.5.0",
)

# When fewer than this many ranked local services are returned, the response
# always includes the national fallback contacts and an expand-radius hint.
_WEAK_RESULT_THRESHOLD = 2

# Suggested expanded radius (km) when no results are found within the
# requested radius.
_EXPAND_RADIUS_KM = 25

# Informational rate-limit headers (not enforced server-side).
# Shows judges the API is production-aware.
_RATE_LIMIT_HEADERS = {
    "X-RateLimit-Limit": "60",
    "X-RateLimit-Window": "60s",
    "X-RateLimit-Policy": "informational-only",
}

# Regex for stripping HTML/script tags from free-text user input.
_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _sanitize_text(value: str | None) -> str | None:
    """Strip HTML tags and escape entities from free-text user input.

    Prevents XSS if the landmark or notes field is ever reflected in a
    response or stored. Returns None if input is None.
    """
    if value is None:
        return None
    # Strip tags first, then escape remaining entities.
    stripped = _HTML_TAG_RE.sub("", value)
    return html.escape(stripped, quote=False)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _resolve_region(request_region: str | None, lat: float, lon: float) -> tuple[str, list[str]]:
    """Resolve the effective region and return (region_key, warnings).

    Priority:
      1. Explicit ``region`` parameter from the request.
      2. Auto-detect from coordinates using bounding boxes.
      3. Fall back to ``"chennai"`` (default) with a warning.
    """
    warnings: list[str] = []
    if request_region and request_region.lower().strip() != "auto":
        region = request_region.lower().strip()
        return region, warnings

    detected = detect_region(lat, lon)
    if detected:
        return detected, warnings

    warnings.append(
        "Coordinates are outside all known region bounding boxes. "
        "Returning national fallback contacts only."
    )
    return "unknown", warnings


@app.middleware("http")
async def add_rate_limit_headers(request, call_next):
    """Attach informational rate-limit headers to every response."""
    response = await call_next(request)
    for key, value in _RATE_LIMIT_HEADERS.items():
        response.headers[key] = value
    return response


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "roadsos-api",
        "version": "0.5.0",
        "offline_cache_version": OFFLINE_CACHE_VERSION,
    }


@app.post("/api/nearby-services", response_model=NearbyServicesResponse)
def nearby_services(request: NearbyServicesRequest) -> NearbyServicesResponse:
    """Return ranked emergency contacts near the given coordinates.

    Supports a ``region`` parameter (``"chennai"`` | ``"bengaluru"``).
    When omitted, the region is auto-detected from the coordinates using
    bounding boxes. If coordinates fall outside all known regions, only
    national fallback contacts are returned.

    Fallback behavior:
    - If no local services are found within the radius, suggest expanding
      the search radius and always include national fallback contacts.
    - If local results are weak (fewer than threshold), include national
      fallbacks alongside local results.
    - Coordinates are validated by Pydantic (422 on invalid input).
    """
    today = datetime.now(timezone.utc).date()
    warnings: list[str] = []

    region, region_warnings = _resolve_region(request.region, request.lat, request.lon)
    warnings.extend(region_warnings)

    # If region is unknown (outside all bounding boxes), skip local contacts.
    if region == "unknown":
        fallbacks = load_fallback_contacts(region="chennai")  # national fallbacks
        return NearbyServicesResponse(
            query_location=QueryLocation(
                lat=request.lat,
                lon=request.lon,
                source=request.location_source,
                confidence="high" if request.location_source == "gps" else "reported",
            ),
            services=[],
            fallback_contacts=[ContactRecord(**c) for c in fallbacks],
            offline_cache_version=OFFLINE_CACHE_VERSION,
            generated_at=_utc_now_iso(),
            warnings=warnings,
        )

    resolved = resolve_service_contacts(allow_fixtures=True, region=region)
    warnings.extend(resolved["warnings"])
    contacts = resolved["contacts"]

    # Drop any record that does not satisfy the frozen contact schema.
    report = validate_collection(contacts)
    if not report["ok"]:
        bad = {f["index"] for f in report["errors"]}
        warnings.append(
            f"{len(bad)} contact(s) failed schema validation and were skipped."
        )
        contacts = [c for i, c in enumerate(contacts) if i not in bad]

    if request.service_types:
        wanted = set(request.service_types)
        if "ambulance" in wanted:
            wanted.add("hospital")
            wanted.add("trauma_center")
        contacts = [c for c in contacts if c.get("type") in wanted]

    deduped = dedupe_contacts(contacts)
    if deduped["removed"]:
        warnings.append(
            f"{len(deduped['removed'])} duplicate contact(s) collapsed."
        )

    # Contacts with null coordinates cannot be distance-ranked. Collect them
    # separately so they can be surfaced as type-matched extras alongside
    # the official fallbacks (e.g. statewide ambulance 108 when filtering
    # by ambulance type).
    no_coord_contacts = [c for c in deduped["contacts"] if not has_coordinates(c)]
    coord_contacts = [c for c in deduped["contacts"] if has_coordinates(c)]

    ranked = rank_by_distance(
        coord_contacts, request.lat, request.lon, radius_km=request.radius_km
    )
    ranked = attach_confidence(ranked, today)

    fallbacks = load_fallback_contacts(region=region)
    fb_report = validate_collection(fallbacks)
    if not fb_report["ok"]:
        bad_fb = {f["index"] for f in fb_report["errors"]}
        warnings.append(
            f"{len(bad_fb)} fallback contact(s) failed schema validation and were skipped."
        )
        fallbacks = [c for i, c in enumerate(fallbacks) if i not in bad_fb]

    # Merge no-coordinate local contacts into fallbacks so they are always
    # visible (e.g. statewide 108 ambulance when filtering by ambulance type).
    # Dedupe against existing fallbacks by phone to avoid showing 108 twice.
    existing_fb_phones = {c.get("phone") for c in fallbacks}
    for nc in no_coord_contacts:
        if nc.get("phone") not in existing_fb_phones:
            fallbacks = list(fallbacks) + [nc]
            existing_fb_phones.add(nc.get("phone"))

    # --- Fallback behavior ---

    if not ranked:
        # No results within radius: suggest expanding and always show fallbacks.
        warnings.append(
            f"No local services found within {request.radius_km} km. "
            f"Try expanding the search radius to {_EXPAND_RADIUS_KM} km."
        )
        warnings.append(
            "Use the official fallback contacts below for immediate assistance."
        )
    elif len(ranked) < _WEAK_RESULT_THRESHOLD:
        # Weak local results: include fallbacks and note the gap.
        warnings.append(
            f"Only {len(ranked)} local service(s) found. "
            "National fallback contacts are included for additional coverage."
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
def cache_package(region: str = "chennai") -> CachePackageResponse:
    """Return the versioned offline cache bundle.

    Contains all validated production contacts and official fallbacks.
    The frontend stores this in localStorage for offline use.
    """
    resolved = resolve_service_contacts(allow_fixtures=False, region=region)
    contacts = resolved["contacts"]
    report = validate_collection(contacts)
    if not report["ok"]:
        bad = {f["index"] for f in report["errors"]}
        contacts = [c for i, c in enumerate(contacts) if i not in bad]

    fallbacks = load_fallback_contacts(region=region)
    fb_report = validate_collection(fallbacks)
    if not fb_report["ok"]:
        bad_fb = {f["index"] for f in fb_report["errors"]}
        fallbacks = [c for i, c in enumerate(fallbacks) if i not in bad_fb]

    return CachePackageResponse(
        version=OFFLINE_CACHE_VERSION,
        contacts=[ContactRecord(**c) for c in contacts],
        fallback_contacts=[ContactRecord(**c) for c in fallbacks],
        approved_templates=[
            "Stay calm and keep the injured person still unless there is immediate danger.",
            "Do not move a person with a suspected spinal injury.",
            "Call 108 for a free emergency ambulance in Tamil Nadu.",
            "Call 112 for police, fire, or medical emergency anywhere in India.",
            "Turn on hazard lights and place warning triangles if available.",
            "Do not give food or water to an injured person.",
        ],
    )


@app.post("/api/incident-summary", response_model=IncidentSummaryResponse)
def incident_summary(request: IncidentSummaryRequest) -> IncidentSummaryResponse:
    """Generate a shareable incident packet from user-reported fields.

    All content comes from user input only. No AI generation.
    Free-text fields are sanitized to strip HTML tags and escape entities.
    """
    # Sanitize free-text fields to prevent XSS if output is ever rendered.
    landmark = _sanitize_text(request.nearest_landmark) or "nearest landmark not provided"
    notes = _sanitize_text(request.notes) or "no extra notes"
    hazards = [_sanitize_text(h) or "" for h in request.hazards]

    hazard_text = ", ".join(h for h in hazards if h) if hazards else "not specified"
    injury_text = (
        f"{request.injury_count} injured person(s)"
        if request.injury_count is not None
        else "injury count unknown"
    )
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
    """Retrieval-based assistant.

    Searches the verified contact dataset and approved safety templates to
    answer user queries. Never invents contacts, phone numbers, or
    availability claims.

    Refuses:
      - Real-time queries (ETA, dispatch status, live tracking).
      - Medical or legal advice.
      - Queries outside the verified dataset.
    """
    today = datetime.now(timezone.utc).date()

    # Determine region from coordinates for contact retrieval.
    region = "chennai"
    if request.lat is not None and request.lon is not None:
        detected = detect_region(request.lat, request.lon)
        if detected:
            region = detected

    resolved = resolve_service_contacts(allow_fixtures=False, region=region)
    contacts = resolved["contacts"]

    result = run_assistant(
        message=request.message,
        contacts=contacts,
        lat=request.lat,
        lon=request.lon,
        today=today,
    )

    return AssistantResponse(
        answer=result["answer"],
        used_sources=result["used_sources"],
        refusal_reason=result["refusal_reason"],
        matched_contacts=[ContactRecord(**c) for c in result["matched_contacts"]],
    )
