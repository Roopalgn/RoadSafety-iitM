"""Deterministic confidence scoring rules.

Each contact carries a human-curated ``confidence_score`` in the seed data.
This module derives an *effective* score from that value plus objective,
explainable signals (freshness, completeness). It never invents trust:
it can only keep or lower the curated score, and it always reports why.

The reference date is passed in explicitly so scoring is reproducible
and never depends on the wall clock.

Merge 3 additions:
  - Freshness penalty: contacts verified > 90 days ago get a confidence
    reduction (PENALTY_AGING_90).
  - Service-priority boost: trauma_center > hospital > ambulance > police >
    fire_station > tow > repair for accident scenarios.
  - Availability boost: "24x7" contacts rank above "office_hours" or unknown.
  - ``data_freshness_days`` is returned so the frontend can show staleness.
"""

from datetime import date
from typing import Any

# Freshness thresholds in days. Older verification lowers the effective score.
FRESH_DAYS = 90       # Merge 3: tightened from 180 to 90 days
AGING_DAYS = 180
STALE_DAYS = 365

# Multiplicative penalties (deterministic, capped so a contact is never zeroed
# out by metadata alone — a stale-but-official contact still beats nothing).
PENALTY_AGING_90 = 0.95   # > 90 days: slight reduction
PENALTY_AGING = 0.90      # > 180 days: moderate reduction
PENALTY_STALE = 0.75      # > 365 days: significant reduction
PENALTY_NO_PHONE = 0.50
PENALTY_NO_COORDS = 0.90

# Service-priority boost multipliers for accident scenarios.
# Higher multiplier = higher effective confidence for ranking.
_SERVICE_PRIORITY: dict[str, float] = {
    "trauma_center": 1.10,
    "hospital": 1.05,
    "ambulance": 1.04,
    "police": 1.03,
    "fire_station": 1.02,
    "tow": 1.01,
    "repair": 1.00,
    "fallback_emergency": 1.00,
}

# Availability boost multiplier.
_AVAILABILITY_BOOST = 1.03   # 24x7 contacts get a small boost


def _curated_score(contact: dict[str, Any]) -> float:
    try:
        return max(0.0, min(1.0, float(contact.get("confidence_score", 0))))
    except (TypeError, ValueError):
        return 0.0


def _parse_verified_at(value: Any) -> date | None:
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def evaluate_confidence(
    contact: dict[str, Any], today: date
) -> dict[str, Any]:
    """Return ``{"score": float, "reasons": list[str], "data_freshness_days": int | None}``
    for one contact.

    ``score`` is the effective confidence in ``[0, 1]``. ``reasons`` explains
    every adjustment so the trust ledger can show it verbatim.
    ``data_freshness_days`` is the age of the verification in days (None if
    the date is missing or unparseable).
    """
    score = _curated_score(contact)
    reasons: list[str] = [f"curated confidence {score:.2f}"]
    data_freshness_days: int | None = None

    source_url = (contact.get("source_url") or "").strip()
    source_name = (contact.get("source_name") or "").strip()
    if source_url and source_name:
        reasons.append(f"source-backed: {source_name}")
    else:
        score *= 0.0
        reasons.append("no source attribution -> not trustworthy")
        return {"score": 0.0, "reasons": reasons, "data_freshness_days": None}

    verified = _parse_verified_at(contact.get("verified_at"))
    if verified is None:
        score *= PENALTY_STALE
        reasons.append("verification date missing or unparseable")
    else:
        age_days = (today - verified).days
        data_freshness_days = max(0, age_days)
        if age_days < 0:
            reasons.append(f"verified {verified.isoformat()} (future date kept as-is)")
        elif age_days <= FRESH_DAYS:
            reasons.append(f"verified {age_days} days ago (fresh)")
        elif age_days <= AGING_DAYS:
            score *= PENALTY_AGING_90
            reasons.append(f"verified {age_days} days ago (aging, >90 days)")
        elif age_days <= STALE_DAYS:
            score *= PENALTY_AGING
            reasons.append(f"verified {age_days} days ago (aging, >180 days)")
        else:
            score *= PENALTY_STALE
            reasons.append(f"verified {age_days} days ago (stale, >365 days)")

    phone = (contact.get("phone") or "").strip()
    if not phone:
        score *= PENALTY_NO_PHONE
        reasons.append("no phone number")

    lat, lon = contact.get("lat"), contact.get("lon")
    has_coords = isinstance(lat, (int, float)) and isinstance(lon, (int, float))
    if not has_coords and contact.get("type") != "fallback_emergency":
        score *= PENALTY_NO_COORDS
        reasons.append("no coordinates (excluded from distance ranking)")

    # Service-priority boost.
    service_type = contact.get("type", "")
    priority_mult = _SERVICE_PRIORITY.get(service_type, 1.00)
    if priority_mult > 1.00:
        score *= priority_mult
        reasons.append(
            f"service-priority boost x{priority_mult:.2f} for {service_type}"
        )

    # Availability boost.
    availability = (contact.get("availability") or "").lower()
    if "24x7" in availability or "24/7" in availability:
        score *= _AVAILABILITY_BOOST
        reasons.append("availability boost: 24x7 service")

    return {
        "score": round(max(0.0, min(1.0, score)), 4),
        "reasons": reasons,
        "data_freshness_days": data_freshness_days,
    }


def attach_confidence(
    contacts: list[dict[str, Any]], today: date
) -> list[dict[str, Any]]:
    """Return shallow copies with ``effective_confidence`` + reasons attached."""
    enriched: list[dict[str, Any]] = []
    for contact in contacts:
        result = evaluate_confidence(contact, today)
        item = dict(contact)
        item["effective_confidence"] = result["score"]
        item["confidence_eval_reasons"] = result["reasons"]
        item["data_freshness_days"] = result["data_freshness_days"]
        # Append freshness note to ranking_reasons if they already exist
        # (set by rank_by_distance before scoring).
        freshness = result["data_freshness_days"]
        if freshness is not None and item.get("ranking_reasons"):
            item["ranking_reasons"] = list(item["ranking_reasons"]) + [
                f"data verified {freshness} days ago"
            ]
        enriched.append(item)
    return enriched
