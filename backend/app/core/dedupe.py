"""Deterministic de-duplication of emergency contacts.

Curated data from multiple public sources will overlap (the same hospital
listed by a directory and a government page). Showing a panicking bystander
the same number three times wastes their golden hour, so duplicates are
collapsed with a fixed, explainable rule.

Two contacts collide when EITHER:
  - their normalized phone numbers are equal and non-trivial, OR
  - their normalized names are equal AND both have coordinates within
    ``proximity_m`` metres of each other.

Within a collision group the survivor is chosen deterministically:
highest curated ``confidence_score``, then lowest ``id``.
"""

import re
from typing import Any

from .geo import haversine_km

_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_DIGITS = re.compile(r"\D+")

DEFAULT_PROXIMITY_M = 60.0


def normalize_name(name: Any) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    if not isinstance(name, str):
        return ""
    return _NON_ALNUM.sub(" ", name.lower()).strip()


def normalize_phone(phone: Any) -> str:
    """Digits only; keep the last 10 for long numbers, short codes intact.

    ``+91 044-2257 4802`` and ``04422574802`` normalize to the same value,
    while emergency short codes such as ``112`` are preserved as-is.
    """
    if not isinstance(phone, str):
        return ""
    digits = _DIGITS.sub("", phone)
    if len(digits) > 10:
        return digits[-10:]
    return digits


def _curated_score(contact: dict[str, Any]) -> float:
    try:
        return max(0.0, min(1.0, float(contact.get("confidence_score", 0))))
    except (TypeError, ValueError):
        return 0.0


def _same_place(a: dict[str, Any], b: dict[str, Any], proximity_m: float) -> bool:
    for c in (a, b):
        if not (
            isinstance(c.get("lat"), (int, float))
            and isinstance(c.get("lon"), (int, float))
        ):
            return False
    distance_m = haversine_km(a["lat"], a["lon"], b["lat"], b["lon"]) * 1000.0
    return distance_m <= proximity_m


def _is_duplicate(
    a: dict[str, Any], b: dict[str, Any], proximity_m: float
) -> bool:
    phone_a, phone_b = normalize_phone(a.get("phone")), normalize_phone(b.get("phone"))
    if phone_a and phone_b and phone_a == phone_b:
        return True
    name_a, name_b = normalize_name(a.get("name")), normalize_name(b.get("name"))
    if name_a and name_a == name_b and _same_place(a, b, proximity_m):
        return True
    return False


def dedupe_contacts(
    contacts: list[dict[str, Any]],
    proximity_m: float = DEFAULT_PROXIMITY_M,
) -> dict[str, Any]:
    """Collapse duplicates.

    Returns ``{"contacts": [...survivors...], "removed": [{"id", "duplicate_of",
    "reason"}]}``. Input order does not affect the result.
    """
    ordered = sorted(contacts, key=lambda c: str(c.get("id", "")))
    survivors: list[dict[str, Any]] = []
    removed: list[dict[str, Any]] = []

    for contact in ordered:
        match_index = None
        for idx, kept in enumerate(survivors):
            if _is_duplicate(contact, kept, proximity_m):
                match_index = idx
                break

        if match_index is None:
            survivors.append(contact)
            continue

        kept = survivors[match_index]
        keep_new = (
            _curated_score(contact),
            str(kept.get("id", "")),
        ) > (
            _curated_score(kept),
            str(contact.get("id", "")),
        )
        loser, winner = (kept, contact) if keep_new else (contact, kept)
        if keep_new:
            survivors[match_index] = contact
        removed.append(
            {
                "id": loser.get("id"),
                "duplicate_of": winner.get("id"),
                "reason": "matched by normalized phone or name+proximity",
            }
        )

    survivors.sort(key=lambda c: str(c.get("id", "")))
    return {"contacts": survivors, "removed": removed}
