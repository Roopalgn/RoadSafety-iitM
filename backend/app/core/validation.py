"""Validate contacts against the frozen contract schema.

The schema in ``contracts/contact.schema.json`` is the shared agreement
between the data, backend, and frontend branches. This module enforces it
plus the production-data rules from ``data/README.md`` so unsourced or
malformed emergency contacts can never reach the API or the offline cache.

``date`` and ``uri`` formats are checked explicitly here rather than relying
on optional ``jsonschema`` format plugins, so validation behaves the same on
every machine without extra dependencies.
"""

import json
from datetime import date
from functools import lru_cache
from typing import Any
from urllib.parse import urlparse

from jsonschema import Draft202012Validator, FormatChecker

from .paths import contact_schema_path

_format_checker = FormatChecker()


@_format_checker.checks("date", raises=ValueError)
def _check_date(value: object) -> bool:
    if not isinstance(value, str):
        return True
    date.fromisoformat(value)  # raises ValueError on bad dates
    return True


@_format_checker.checks("uri", raises=ValueError)
def _check_uri(value: object) -> bool:
    if not isinstance(value, str):
        return True
    parsed = urlparse(value)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError(f"not an absolute URI: {value!r}")
    return True


@lru_cache(maxsize=1)
def _load_schema() -> dict[str, Any]:
    with contact_schema_path().open(encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def _validator() -> Draft202012Validator:
    return Draft202012Validator(_load_schema(), format_checker=_format_checker)


def validate_contact(contact: Any) -> list[str]:
    """Return a list of schema error messages (empty means valid)."""
    errors: list[str] = []
    for err in sorted(_validator().iter_errors(contact), key=str):
        location = "/".join(str(p) for p in err.absolute_path) or "(root)"
        errors.append(f"{location}: {err.message}")
    return errors


# Production-data rules that go beyond the JSON Schema (data/README.md).
_PRODUCTION_REQUIRED = ("source_url", "source_name", "verified_at")


def validate_production_contact(contact: Any) -> list[str]:
    """Schema errors plus production provenance rules.

    Production contacts must be source-backed: a real ``source_url`` and
    ``source_name``, a ``verified_at`` date, and at least one
    ``confidence_reason``. Test fixtures use :func:`validate_contact` only.
    """
    errors = validate_contact(contact)
    if not isinstance(contact, dict):
        return errors
    for field in _PRODUCTION_REQUIRED:
        if not str(contact.get(field) or "").strip():
            errors.append(f"{field}: required for production data, but missing/empty")
    reasons = contact.get("confidence_reasons")
    if not isinstance(reasons, list) or not reasons:
        errors.append("confidence_reasons: production data needs at least one reason")
    return sorted(set(errors))


def validate_collection(
    contacts: Any, *, production: bool = False
) -> dict[str, Any]:
    """Validate a list of contacts.

    Returns ``{"ok": bool, "count": int, "errors": [{"index", "id", "errors"}]}``.
    """
    check = validate_production_contact if production else validate_contact
    if not isinstance(contacts, list):
        return {
            "ok": False,
            "count": 0,
            "errors": [{"index": None, "id": None, "errors": ["top level must be a JSON array"]}],
        }

    failures: list[dict[str, Any]] = []
    seen_ids: dict[str, int] = {}
    for index, contact in enumerate(contacts):
        item_errors = check(contact)
        if isinstance(contact, dict):
            cid = contact.get("id")
            if isinstance(cid, str):
                if cid in seen_ids:
                    item_errors.append(
                        f"id: duplicate id '{cid}' (also at index {seen_ids[cid]})"
                    )
                else:
                    seen_ids[cid] = index
        if item_errors:
            failures.append(
                {
                    "index": index,
                    "id": contact.get("id") if isinstance(contact, dict) else None,
                    "errors": item_errors,
                }
            )

    return {"ok": not failures, "count": len(contacts), "errors": failures}
