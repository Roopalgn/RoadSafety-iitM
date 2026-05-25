"""Confidence scoring rule tests (deterministic, fixed reference date)."""

from datetime import date

from app.core.confidence import attach_confidence, evaluate_confidence

TODAY = date(2026, 5, 16)


def _contact(**overrides):
    base = {
        "id": "c1",
        "name": "Sample",
        "type": "hospital",
        "lat": 12.99,
        "lon": 80.23,
        "phone": "044-0000-0000",
        "source_url": "https://example.test/x",
        "source_name": "Example Source",
        "verified_at": "2026-05-01",
        "confidence_score": 0.9,
        "confidence_reasons": ["seed"],
        "availability": "24x7",
    }
    base.update(overrides)
    return base


def test_fresh_source_backed_keeps_score():
    result = evaluate_confidence(_contact(), TODAY)
    # Merge 3: hospital gets service-priority boost (x1.05) and 24x7 gets
    # availability boost (x1.03), so effective score > curated score.
    assert result["score"] >= 0.9
    assert any("fresh" in r for r in result["reasons"])


def test_service_priority_boost_applied():
    """trauma_center must score higher than repair for same curated score."""
    trauma = evaluate_confidence(_contact(type="trauma_center"), TODAY)
    repair = evaluate_confidence(_contact(type="repair"), TODAY)
    assert trauma["score"] > repair["score"]


def test_availability_boost_applied():
    """24x7 contact must score higher than office_hours contact."""
    always_on = evaluate_confidence(_contact(availability="24x7"), TODAY)
    office = evaluate_confidence(_contact(availability="office_hours"), TODAY)
    assert always_on["score"] > office["score"]


def test_missing_source_zeroes_trust():
    result = evaluate_confidence(_contact(source_url="", source_name=""), TODAY)
    assert result["score"] == 0.0
    assert any("no source" in r for r in result["reasons"])


def test_stale_verification_lowers_score():
    fresh = evaluate_confidence(_contact(verified_at="2026-05-01"), TODAY)["score"]
    stale = evaluate_confidence(_contact(verified_at="2024-01-01"), TODAY)["score"]
    assert stale < fresh


def test_missing_phone_penalised():
    with_phone = evaluate_confidence(_contact(), TODAY)["score"]
    without = evaluate_confidence(_contact(phone=""), TODAY)["score"]
    assert without < with_phone


def test_fallback_without_coords_not_penalised_for_coords():
    fb = _contact(type="fallback_emergency", lat=None, lon=None)
    result = evaluate_confidence(fb, TODAY)
    assert not any("no coordinates" in r for r in result["reasons"])


def test_attach_confidence_is_pure():
    original = _contact()
    snapshot = dict(original)
    [enriched] = attach_confidence([original], TODAY)
    assert original == snapshot  # input not mutated
    assert "effective_confidence" in enriched
    assert "confidence_eval_reasons" in enriched
