"""Retrieval-based assistant for RoadSoS.

The assistant searches the verified contact dataset and approved safety
templates to answer user queries. It NEVER invents contacts, phone numbers,
or availability claims.

Intent matching is keyword-based and deterministic. If a query matches a
known intent, relevant contacts are returned with source citations. If the
query asks for real-time information, medical/legal advice, or anything
outside the verified dataset, a clear refusal is returned.

Merge 3 scope (Suyash / data-geo-backend):
  - Keyword/intent matching on user message.
  - Returns matched contacts from the verified dataset.
  - Refuses real-time queries, medical/legal advice, and unknown intents.
  - Deterministic: same query always returns the same result.
"""

from __future__ import annotations

import re
from datetime import date
from typing import Any

from .confidence import attach_confidence
from .geo import has_coordinates, rank_by_distance

# ---------------------------------------------------------------------------
# Intent definitions
# ---------------------------------------------------------------------------

# Each intent maps to:
#   - keywords: list of regex patterns (case-insensitive)
#   - service_types: contact types to return
#   - answer_template: human-readable answer prefix
_INTENTS: list[dict[str, Any]] = [
    {
        "name": "hospital",
        "keywords": [r"\bhospital\b", r"\btrauma\b", r"\binjur", r"\bwound", r"\bled\b"],
        "service_types": {"hospital", "trauma_center"},
        "answer_template": (
            "Here are the nearest verified hospitals and trauma centres from the "
            "RoadSoS dataset. All contacts are source-backed."
        ),
    },
    {
        "name": "ambulance",
        "keywords": [r"\bambulance\b", r"\b108\b", r"\bemergency medical\b", r"\bparamedic\b"],
        "service_types": {"ambulance"},
        "answer_template": (
            "Here are the verified ambulance contacts from the RoadSoS dataset. "
            "Dial 108 for a free GPS-dispatched ambulance anywhere in Tamil Nadu or Karnataka."
        ),
    },
    {
        "name": "police",
        "keywords": [r"\bpolice\b", r"\bfir\b", r"\bcop\b", r"\blaw enforcement\b", r"\b100\b"],
        "service_types": {"police"},
        "answer_template": (
            "Here are the nearest verified police stations from the RoadSoS dataset. "
            "Dial 100 for police emergency anywhere in India."
        ),
    },
    {
        "name": "tow",
        "keywords": [
            r"\btow\b", r"\bbreakdown\b", r"\bbroke down\b", r"\bpuncture\b", r"\brepair\b",
            r"\bmechanic\b", r"\bvehicle stuck\b", r"\bflat tyre\b", r"\bflat tire\b",
        ],
        "service_types": {"tow", "repair"},
        "answer_template": (
            "Here are the verified towing and repair contacts from the RoadSoS dataset."
        ),
    },
    {
        "name": "fire",
        "keywords": [r"\bfire\b", r"\bflame\b", r"\bburning\b", r"\bsmoke\b", r"\b101\b"],
        "service_types": {"fire_station"},
        "answer_template": (
            "Here are the nearest verified fire stations from the RoadSoS dataset. "
            "Dial 101 for fire emergency anywhere in India."
        ),
    },
    {
        "name": "offline",
        "keywords": [r"\boffline\b", r"\bno network\b", r"\bno internet\b", r"\bno signal\b"],
        "service_types": set(),
        "answer_template": (
            "RoadSoS works offline. The rescue cache stores all verified contacts "
            "and approved safety templates locally. Tap 'Refresh cache' when online "
            "to update. In offline mode, the cached contacts and fallback numbers "
            "(112, 108, 100) remain available."
        ),
    },
    {
        "name": "first_aid",
        "keywords": [
            r"\bfirst aid\b", r"\bwhat (do|should) i do\b", r"\bhow to help\b",
            r"\bbleeding\b", r"\bunconscious\b",
        ],
        "service_types": set(),
        "answer_template": None,  # Uses approved templates only
    },
]

# Queries that ask for real-time information — always refused.
_REALTIME_PATTERNS = [
    r"\bis the ambulance coming\b",
    r"\beta\b",
    r"\bhow long\b",
    r"\bwhere is the\b",
    r"\btracking\b",
    r"\blive location\b",
    r"\bavailability now\b",
    r"\bcurrent status\b",
    r"\bon the way\b",
    r"\bdispatched\b",
]

# Queries that ask for medical or legal advice — always refused.
_MEDICAL_LEGAL_PATTERNS = [
    r"\bdiagnos",
    r"\btreat\b",
    r"\bmedication\b",
    r"\bdrug\b",
    r"\bprescri",
    r"\blegal advice\b",
    r"\bsue\b",
    r"\bliabilit",
    r"\bcompensation\b",
    r"\binsurance claim\b",
]

# Approved first-aid safety templates (offline-safe, no medical advice).
APPROVED_SAFETY_TEMPLATES = [
    "Stay calm and keep the injured person still unless there is immediate danger.",
    "Do not move a person with a suspected spinal injury.",
    "Call 108 for a free emergency ambulance in Tamil Nadu or Karnataka.",
    "Call 112 for police, fire, or medical emergency anywhere in India.",
    "Turn on hazard lights and place warning triangles if available.",
    "Do not give food or water to an injured person.",
    "Keep bystanders back to maintain a clear path for emergency responders.",
    "If safe to do so, note the exact location (landmark, road name, GPS coordinates) to share with emergency services.",
]


def _matches_any(text: str, patterns: list[str]) -> bool:
    """Return True if any pattern matches the text (case-insensitive)."""
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def _match_intent(message: str) -> dict[str, Any] | None:
    """Return the first matching intent definition, or None."""
    for intent in _INTENTS:
        if _matches_any(message, intent["keywords"]):
            return intent
    return None


def run_assistant(
    message: str,
    contacts: list[dict[str, Any]],
    lat: float | None,
    lon: float | None,
    today: date,
) -> dict[str, Any]:
    """Run the retrieval-based assistant.

    Args:
        message: User's query string.
        contacts: Full list of production contacts for the active region.
        lat: User's latitude (may be None).
        lon: User's longitude (may be None).
        today: Reference date for confidence scoring.

    Returns a dict with:
        answer: str
        used_sources: list[str]
        refusal_reason: str | None
        matched_contacts: list[dict]
    """
    # --- Real-time query check (always refused) ---
    if _matches_any(message, _REALTIME_PATTERNS):
        return {
            "answer": (
                "I cannot provide real-time dispatch status, ETAs, or live tracking. "
                "For immediate help, dial 112 (all emergencies) or 108 (ambulance)."
            ),
            "used_sources": ["approved_safety_templates"],
            "refusal_reason": "realtime_availability_not_supported",
            "matched_contacts": [],
        }

    # --- Medical/legal advice check (always refused) ---
    if _matches_any(message, _MEDICAL_LEGAL_PATTERNS):
        return {
            "answer": (
                "I cannot provide medical diagnoses, treatment advice, or legal counsel. "
                "For medical emergencies, dial 108 (ambulance) or 112 (all emergencies)."
            ),
            "used_sources": ["approved_safety_templates"],
            "refusal_reason": "medical_legal_advice_not_provided",
            "matched_contacts": [],
        }

    # --- Intent matching ---
    intent = _match_intent(message)

    if intent is None:
        return {
            "answer": (
                "I can only answer questions about nearby emergency services, "
                "towing, first aid guidance, and offline usage from the verified "
                "RoadSoS dataset. For emergencies, dial 112 or 108."
            ),
            "used_sources": ["approved_safety_templates"],
            "refusal_reason": "query_outside_verified_dataset",
            "matched_contacts": [],
        }

    # --- First-aid / offline: return approved templates, no contacts ---
    if intent["name"] in ("first_aid", "offline"):
        return {
            "answer": intent["answer_template"] or "\n".join(APPROVED_SAFETY_TEMPLATES),
            "used_sources": ["approved_safety_templates"],
            "refusal_reason": None,
            "matched_contacts": [],
        }

    # --- Contact retrieval ---
    wanted_types = intent["service_types"]
    filtered = [c for c in contacts if c.get("type") in wanted_types]

    # Score contacts.
    scored = attach_confidence(filtered, today)

    # Rank by distance if coordinates are available; otherwise sort by score.
    if lat is not None and lon is not None:
        coord_contacts = [c for c in scored if has_coordinates(c)]
        no_coord = [c for c in scored if not has_coordinates(c)]
        ranked = rank_by_distance(coord_contacts, lat, lon)
        # Append no-coordinate contacts (e.g. statewide 108) after ranked ones.
        ranked = ranked + sorted(
            no_coord, key=lambda c: -c.get("effective_confidence", 0)
        )
    else:
        ranked = sorted(scored, key=lambda c: -c.get("effective_confidence", 0))

    if not ranked:
        return {
            "answer": (
                f"No verified {intent['name']} contacts found in the current region. "
                "Use the official fallback contacts: dial 112 or 108."
            ),
            "used_sources": ["verified_contacts_db"],
            "refusal_reason": None,
            "matched_contacts": [],
        }

    return {
        "answer": intent["answer_template"],
        "used_sources": ["verified_contacts_db"],
        "refusal_reason": None,
        "matched_contacts": ranked,
    }
