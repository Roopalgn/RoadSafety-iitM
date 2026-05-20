"""Distance + deterministic ranking tests."""

from app.core.geo import haversine_km, has_coordinates, rank_by_distance

# Reference: IIT Madras main gate area.
IITM_LAT, IITM_LON = 12.9915, 80.2337


def test_haversine_known_distance():
    # IIT Madras -> Chennai Central is ~11-13 km; allow a generous band.
    d = haversine_km(IITM_LAT, IITM_LON, 13.0827, 80.2707)
    assert 9.0 < d < 14.0


def test_haversine_zero_distance():
    assert haversine_km(IITM_LAT, IITM_LON, IITM_LAT, IITM_LON) == 0.0


def test_has_coordinates():
    assert has_coordinates({"lat": 1.0, "lon": 2.0})
    assert not has_coordinates({"lat": None, "lon": 2.0})
    assert not has_coordinates({"lat": 1.0, "lon": None})


def test_rank_excludes_null_coordinates():
    contacts = [
        {"id": "a", "lat": 12.99, "lon": 80.23, "confidence_score": 0.9},
        {"id": "b", "lat": None, "lon": None, "confidence_score": 1.0},
    ]
    ranked = rank_by_distance(contacts, IITM_LAT, IITM_LON)
    assert [c["id"] for c in ranked] == ["a"]


def test_rank_is_sorted_by_distance():
    contacts = [
        {"id": "far", "lat": 12.95, "lon": 80.20, "confidence_score": 0.9},
        {"id": "near", "lat": 12.9916, "lon": 80.2338, "confidence_score": 0.5},
    ]
    ranked = rank_by_distance(contacts, IITM_LAT, IITM_LON)
    assert [c["id"] for c in ranked] == ["near", "far"]
    assert ranked[0]["distance_km"] <= ranked[1]["distance_km"]
    assert ranked[0]["ranking_reasons"]


def test_rank_tie_break_is_deterministic():
    # Same coordinates -> tie on distance. Higher confidence wins, then id.
    base = {"lat": 12.99, "lon": 80.23}
    contacts = [
        {"id": "z", **base, "confidence_score": 0.5},
        {"id": "a", **base, "confidence_score": 0.5},
        {"id": "m", **base, "confidence_score": 0.9},
    ]
    ranked = rank_by_distance(contacts, IITM_LAT, IITM_LON)
    assert [c["id"] for c in ranked] == ["m", "a", "z"]
    # Re-running with shuffled input yields the same order.
    again = rank_by_distance(list(reversed(contacts)), IITM_LAT, IITM_LON)
    assert [c["id"] for c in again] == ["m", "a", "z"]


def test_radius_filter():
    contacts = [
        {"id": "in", "lat": 12.9916, "lon": 80.2338, "confidence_score": 0.9},
        {"id": "out", "lat": 13.30, "lon": 80.50, "confidence_score": 0.9},
    ]
    ranked = rank_by_distance(contacts, IITM_LAT, IITM_LON, radius_km=5)
    assert [c["id"] for c in ranked] == ["in"]
