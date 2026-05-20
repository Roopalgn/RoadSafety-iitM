"""Core data, geo, and reliability utilities owned by the data/backend branch.

Everything in this package is deterministic and offline:
no network calls, no randomness, no wall-clock-dependent ranking.
Same input always produces the same output so tests and the
10-second rescue drill stay reproducible.
"""
