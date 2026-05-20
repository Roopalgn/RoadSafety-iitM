"""Deterministic confidence scoring rules.

Each contact carries a human-curated ``confidence_score`` in the seed data.
This module derives an *effective* score from that value plus objective,
explainable signals (freshness, completeness). It never invents trust:
it can only keep or lower the curated score, and it always reports why.

The reference date is passed in explicitly so scoring is reproducible
and never depends on the wall clock.
"""

from datetime import date
from typing import Any

# Freshness thresholds in days. Older verification lowers the effective score.
FRESH_DAYS = 180
STALE_DAYS = 365

# Multiplicative penalties (deterministic, capped so a contact is never zeroed
# out by metadata alone — a stale-but-official contact still beats nothing).
PENALTY_AGING = 0.90
PENALTY_STALE = 0.75
PENALTY_NO_PHONE = 0.50
PENALTY_NO_COORDS = 0.90


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
    """Return ``{"score": float, "reasons": list[str]}`` for one contact.

    ``score`` is the effective confidence in ``[0, 1]``. ``reasons`` explains
    every adjustment so the trust ledger can show it verbatim.
    """
    score = _curated_score(contact)
    reasons: list[str] = [f"curated confidence {score:.2f}"]

    source_url = (contact.get("source_url") or "").strip()
    source_name = (contact.get("source_name") or "").strip()
    if source_url and source_name:
        reasons.append(f"source-backed: {source_name}")
    else:
        score *= 0.0
        reasons.append("no source attribution -> not trustworthy")
        return {"score": 0.0, "reasons": reasons}

    verified = _parse_verified_at(contact.get("verified_at"))
    if verified is None:
        score *= PENALTY_STALE
        reasons.append("verification date missing or unparseable")
    else:
        age_days = (today - verified).days
        if age_days < 0:
            reasons.append(f"verified {verified.isoformat()} (future date kept as-is)")
        elif age_days <= FRESH_DAYS:
            reasons.append(f"verified {age_days} days ago (fresh)")
        elif age_days <= STALE_DAYS:
            score *= PENALTY_AGING
            reasons.append(f"verified {age_days} days ago (aging)")
        else:
            score *= PENALTY_STALE
            reasons.append(f"verified {age_days} days ago (stale)")

    phone = (contact.get("phone") or "").strip()
    if not phone:
        score *= PENALTY_NO_PHONE
        reasons.append("no phone number")

    lat, lon = contact.get("lat"), contact.get("lon")
    has_coords = isinstance(lat, (int, float)) and isinstance(lon, (int, float))
    if not has_coords and contact.get("type") != "fallback_emergency":
        score *= PENALTY_NO_COORDS
        reasons.append("no coordinates (excluded from distance ranking)")

    return {"score": round(max(0.0, min(1.0, score)), 4), "reasons": reasons}


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
        enriched.append(item)
    return enriched
