"""Deterministic distance and ranking utilities.

The ranking order is fixed and explainable so a judge can be told exactly
why a contact appeared first. There is no hidden tie-break and no randomness.
"""

import math
from collections.abc import Iterable
from typing import Any

# Mean Earth radius (km), WGS-84. Used for the haversine great-circle distance.
EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres between two lat/lon points."""
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def has_coordinates(contact: dict[str, Any]) -> bool:
    """True only when both lat and lon are real numbers (not null)."""
    lat, lon = contact.get("lat"), contact.get("lon")
    return isinstance(lat, (int, float)) and isinstance(lon, (int, float))


def _confidence(contact: dict[str, Any]) -> float:
    raw = contact.get("confidence_score", 0)
    try:
        return max(0.0, min(1.0, float(raw)))
    except (TypeError, ValueError):
        return 0.0


def rank_by_distance(
    contacts: Iterable[dict[str, Any]],
    origin_lat: float,
    origin_lon: float,
    radius_km: float | None = None,
) -> list[dict[str, Any]]:
    """Return contacts sorted by distance from the origin.

    Each returned record is a shallow copy with two extra keys:
      - ``distance_km``: rounded great-circle distance from the origin.
      - ``ranking_reasons``: human-readable reasons the contact ranked here.

    Rules:
      - Contacts without usable coordinates are dropped from distance
        ranking (per ``data/README.md``); the caller decides whether to
        surface them through fallbacks instead.
      - ``radius_km`` filters out anything farther than the radius when set.
      - Ordering is fully deterministic:
          1. distance ascending
          2. confidence_score descending
          3. id ascending
    """
    ranked: list[dict[str, Any]] = []
    for contact in contacts:
        if not has_coordinates(contact):
            continue
        distance = haversine_km(
            origin_lat, origin_lon, float(contact["lat"]), float(contact["lon"])
        )
        if radius_km is not None and distance > radius_km:
            continue
        enriched = dict(contact)
        enriched["distance_km"] = round(distance, 3)
        enriched["ranking_reasons"] = [
            f"{round(distance, 2)} km from the reported location",
            f"confidence {_confidence(contact):.2f} from curated source data",
        ]
        ranked.append(enriched)

    ranked.sort(
        key=lambda c: (
            c["distance_km"],
            -_confidence(c),
            str(c.get("id", "")),
        )
    )
    return ranked
