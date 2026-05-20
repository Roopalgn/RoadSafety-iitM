"""Make ``app`` and ``scripts`` importable when running pytest from anywhere."""

import os
import sys

BACKEND_DIR = os.path.dirname(__file__)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
