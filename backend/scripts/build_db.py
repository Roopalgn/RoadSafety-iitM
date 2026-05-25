"""Build the RoadSoS SQLite database from seed JSON files.

This script is the single repeatable command for generating the versioned
SQLite cache that the backend and offline layer consume.

Usage (run from the ``backend/`` directory):

    python -m scripts.build_db

Output:
    data/roadsos.db   - SQLite database with contacts and fallbacks tables
    data/cache_version.txt - plain-text version string for the offline layer

The script validates every record against the frozen contract schema before
writing. Any invalid record is reported and skipped; it never silently enters
the database. Exit code is non-zero if any production record fails validation.
"""

import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

from app.core.data_loader import load_fallback_contacts, load_production_contacts
from app.core.paths import data_dir
from app.core.validation import validate_collection

# Bump this string every time the schema or data changes in a breaking way.
# Format: merge<N>-<description>-<sequence>
CACHE_VERSION = "merge4-final-0"

_CREATE_CONTACTS = """
CREATE TABLE IF NOT EXISTS contacts (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    type              TEXT NOT NULL,
    lat               REAL,
    lon               REAL,
    phone             TEXT NOT NULL,
    address           TEXT,
    locality          TEXT NOT NULL,
    region            TEXT NOT NULL,
    country           TEXT NOT NULL,
    source_url        TEXT NOT NULL,
    source_name       TEXT NOT NULL,
    verified_at       TEXT NOT NULL,
    availability      TEXT NOT NULL,
    confidence_score  REAL NOT NULL,
    confidence_reasons TEXT NOT NULL,
    notes             TEXT,
    is_fallback       INTEGER NOT NULL DEFAULT 0
);
"""

_INSERT_CONTACT = """
INSERT OR REPLACE INTO contacts (
    id, name, type, lat, lon, phone, address, locality, region, country,
    source_url, source_name, verified_at, availability,
    confidence_score, confidence_reasons, notes, is_fallback
) VALUES (
    :id, :name, :type, :lat, :lon, :phone, :address, :locality, :region, :country,
    :source_url, :source_name, :verified_at, :availability,
    :confidence_score, :confidence_reasons, :notes, :is_fallback
);
"""

_CREATE_META = """
CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


def _flatten(contact: dict, is_fallback: bool) -> dict:
    """Prepare a contact dict for SQLite insertion."""
    row = dict(contact)
    # confidence_reasons is a list; store as JSON string.
    row["confidence_reasons"] = json.dumps(contact.get("confidence_reasons", []))
    row["is_fallback"] = 1 if is_fallback else 0
    return row


def build(db_path: Path, version_path: Path) -> int:
    """Build the database. Returns 0 on success, 1 on validation failure."""
    production = load_production_contacts()
    fallbacks = load_fallback_contacts()

    prod_report = validate_collection(production, production=True)
    fb_report = validate_collection(fallbacks, production=True)

    ok = True
    if not prod_report["ok"]:
        ok = False
        print(f"[FAIL] contacts.seed.json: {len(prod_report['errors'])} error(s)")
        for f in prod_report["errors"]:
            print(f"  index {f['index']} ({f['id']}): {f['errors']}")
    else:
        print(f"[OK] contacts.seed.json: {prod_report['count']} record(s) valid")

    if not fb_report["ok"]:
        ok = False
        print(f"[FAIL] fallbacks.seed.json: {len(fb_report['errors'])} error(s)")
        for f in fb_report["errors"]:
            print(f"  index {f['index']} ({f['id']}): {f['errors']}")
    else:
        print(f"[OK] fallbacks.seed.json: {fb_report['count']} record(s) valid")

    if not ok:
        print("\nRESULT: FAIL — database not written due to validation errors.")
        return 1

    # Remove stale DB so we always start clean.
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(db_path)
    try:
        conn.execute(_CREATE_CONTACTS)
        conn.execute(_CREATE_META)

        bad_prod = {f["index"] for f in prod_report["errors"]}
        bad_fb = {f["index"] for f in fb_report["errors"]}

        written = 0
        for i, contact in enumerate(production):
            if i in bad_prod:
                continue
            conn.execute(_INSERT_CONTACT, _flatten(contact, is_fallback=False))
            written += 1

        for i, contact in enumerate(fallbacks):
            if i in bad_fb:
                continue
            conn.execute(_INSERT_CONTACT, _flatten(contact, is_fallback=True))
            written += 1

        generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        conn.execute(
            "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
            ("cache_version", CACHE_VERSION),
        )
        conn.execute(
            "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
            ("generated_at", generated_at),
        )
        conn.execute(
            "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
            ("production_count", str(len(production) - len(bad_prod))),
        )
        conn.execute(
            "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
            ("fallback_count", str(len(fallbacks) - len(bad_fb))),
        )
        conn.commit()
    finally:
        conn.close()

    # Write plain-text version file for the offline layer.
    version_path.write_text(CACHE_VERSION + "\n", encoding="utf-8")

    print(f"\n[OK] Written {written} contact(s) to {db_path}")
    print(f"[OK] Cache version: {CACHE_VERSION}")
    print(f"[OK] Version file: {version_path}")
    print("\nRESULT: PASS")
    return 0


def main() -> int:
    db_path = data_dir() / "roadsos.db"
    version_path = data_dir() / "cache_version.txt"
    return build(db_path, version_path)


if __name__ == "__main__":
    raise SystemExit(main())
