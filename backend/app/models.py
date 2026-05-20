"""Request/response models that mirror ``contracts/api.examples.json``.

Field names and shapes here must stay in sync with the contract examples.
Any change to these models is a contract change and must be called out in
the PR description (see ``contracts/README.md``).
"""

from typing import Literal

from pydantic import BaseModel, Field

ServiceType = Literal[
    "hospital",
    "trauma_center",
    "ambulance",
    "police",
    "tow",
    "repair",
    "fallback_emergency",
]


class ContactRecord(BaseModel):
    """One emergency contact, matching ``contracts/contact.schema.json``.

    ``distance_km`` and ``ranking_reasons`` are computed per request and are
    absent on fallback contacts that have no coordinates.
    """

    id: str
    name: str
    type: ServiceType
    lat: float | None = None
    lon: float | None = None
    phone: str
    address: str | None = None
    locality: str
    region: str
    country: str
    source_url: str
    source_name: str
    verified_at: str
    availability: str
    confidence_score: float
    confidence_reasons: list[str]
    notes: str | None = None
    # Per-request enrichment (not part of the stored schema).
    distance_km: float | None = None
    ranking_reasons: list[str] | None = None
    effective_confidence: float | None = None


class QueryLocation(BaseModel):
    lat: float
    lon: float
    source: Literal["gps", "manual", "cached"]
    confidence: str


class NearbyServicesRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=8, gt=0, le=100)
    service_types: list[ServiceType] = Field(default_factory=list)
    location_source: Literal["gps", "manual", "cached"] = "manual"


class NearbyServicesResponse(BaseModel):
    query_location: QueryLocation
    services: list[ContactRecord]
    fallback_contacts: list[ContactRecord]
    offline_cache_version: str
    generated_at: str
    warnings: list[str]


class IncidentSummaryRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    nearest_landmark: str | None = None
    injury_count: int | None = Field(default=None, ge=0)
    hazards: list[str] = Field(default_factory=list)
    notes: str | None = None


class IncidentSummaryResponse(BaseModel):
    summary: str
    generated_from: str
    medical_disclaimer: str


class AssistantRequest(BaseModel):
    message: str = Field(..., min_length=1)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)


class AssistantResponse(BaseModel):
    answer: str
    used_sources: list[str]
    refusal_reason: str | None = None


class CachePackageResponse(BaseModel):
    version: str
    contacts: list[ContactRecord]
    fallback_contacts: list[ContactRecord]
    approved_templates: list[str]
