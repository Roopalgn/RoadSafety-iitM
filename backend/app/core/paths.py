"""Repo-relative path resolution.

The backend, scripts, and tests all need to find ``contracts/`` and ``data/``
without depending on the current working directory. Resolution can be
overridden with the ``ROADSOS_REPO_ROOT`` environment variable (useful when
the backend is deployed outside the repo tree).
"""

import os
from pathlib import Path

# .../backend/app/core/paths.py -> parents[3] is the repository root.
_DEFAULT_ROOT = Path(__file__).resolve().parents[3]


def repo_root() -> Path:
    override = os.environ.get("ROADSOS_REPO_ROOT")
    return Path(override).resolve() if override else _DEFAULT_ROOT


def contracts_dir() -> Path:
    return repo_root() / "contracts"


def data_dir() -> Path:
    return repo_root() / "data"


def fixtures_dir() -> Path:
    return repo_root() / "backend" / "tests" / "fixtures"


def contact_schema_path() -> Path:
    return contracts_dir() / "contact.schema.json"
