"""Проверка движка расчёта против контрольных чисел из официального ТЗ.

Запуск: pytest (из backend/), или `python -m pytest`.
"""

import pytest

from app.simulation.scoring import base_scenario_score, compute_score
from app.simulation.validator import ValidationError


def test_base_score_matches_spec():
    base = base_scenario_score()
    assert base["score"] == pytest.approx(52.56, abs=0.01)
    assert base["weakest_district"] == "nura"
    assert base["n_crit"] == 2


def test_example_scenario_from_spec():
    selections = [
        {"measure_id": "M7", "district": "nura"},
        {"measure_id": "M8", "district": "nura"},
        {"measure_id": "M10", "district": "nura"},
        {"measure_id": "M12", "district": None},
        {"measure_id": "M5", "district": "saryarka"},
    ]
    result = compute_score(selections)
    assert result["total_cost"] == 95
    assert result["score"] == pytest.approx(56.5, abs=0.5)
    assert len(result["synergies_applied"]) == 1
    assert result["synergies_applied"][0]["pair"] == ["M10", "M12"]


def test_cheapest_valid_scenario():
    selections = [
        {"measure_id": "M9", "district": "nura"},
        {"measure_id": "M11", "district": "nura"},
        {"measure_id": "M10", "district": "nura"},
        {"measure_id": "M12", "district": None},
        {"measure_id": "M4", "district": "nura"},
    ]
    result = compute_score(selections)
    assert result["total_cost"] == 61


def test_rejects_wrong_measure_count():
    with pytest.raises(ValidationError):
        compute_score([{"measure_id": "M9", "district": "nura"}])


def test_rejects_budget_overrun():
    with pytest.raises(ValidationError):
        compute_score([
            {"measure_id": "M3", "district": "esil"},
            {"measure_id": "M13", "district": "almaty"},
            {"measure_id": "M8", "district": "saryarka"},
            {"measure_id": "M7", "district": "baikonur"},
            {"measure_id": "M6", "district": None},
        ])


def test_rejects_duplicate_measure():
    with pytest.raises(ValidationError):
        compute_score([
            {"measure_id": "M9", "district": "nura"},
            {"measure_id": "M9", "district": "esil"},
            {"measure_id": "M10", "district": "nura"},
            {"measure_id": "M12", "district": None},
            {"measure_id": "M4", "district": "nura"},
        ])


def test_rejects_incompatible_m1_m3_any_district():
    with pytest.raises(ValidationError):
        compute_score([
            {"measure_id": "M1", "district": "esil"},
            {"measure_id": "M3", "district": "almaty"},
            {"measure_id": "M9", "district": "nura"},
            {"measure_id": "M10", "district": "nura"},
            {"measure_id": "M12", "district": None},
        ])


def test_rejects_incompatible_m4_m7_same_district_only():
    with pytest.raises(ValidationError):
        compute_score([
            {"measure_id": "M4", "district": "nura"},
            {"measure_id": "M7", "district": "nura"},
            {"measure_id": "M9", "district": "esil"},
            {"measure_id": "M10", "district": "nura"},
            {"measure_id": "M12", "district": None},
        ])
    # разные районы — допустимо
    result = compute_score([
        {"measure_id": "M4", "district": "nura"},
        {"measure_id": "M7", "district": "esil"},
        {"measure_id": "M9", "district": "saryarka"},
        {"measure_id": "M10", "district": "nura"},
        {"measure_id": "M12", "district": None},
    ])
    assert result["score"] > 0


def test_rejects_more_than_two_measures_per_direction():
    with pytest.raises(ValidationError):
        compute_score([
            {"measure_id": "M1", "district": "esil"},
            {"measure_id": "M2", "district": None},
            {"measure_id": "M3", "district": "almaty"},
            {"measure_id": "M10", "district": "nura"},
            {"measure_id": "M12", "district": None},
        ])


def test_district_measure_requires_district():
    with pytest.raises(ValidationError):
        compute_score([
            {"measure_id": "M9", "district": None},
            {"measure_id": "M10", "district": "nura"},
            {"measure_id": "M11", "district": "nura"},
            {"measure_id": "M12", "district": None},
            {"measure_id": "M4", "district": "nura"},
        ])


def test_different_selections_change_score():
    a = compute_score([
        {"measure_id": "M9", "district": "nura"},
        {"measure_id": "M10", "district": "nura"},
        {"measure_id": "M11", "district": "nura"},
        {"measure_id": "M12", "district": None},
        {"measure_id": "M4", "district": "nura"},
    ])
    b = compute_score([
        {"measure_id": "M9", "district": "esil"},
        {"measure_id": "M10", "district": "esil"},
        {"measure_id": "M11", "district": "esil"},
        {"measure_id": "M12", "district": None},
        {"measure_id": "M4", "district": "esil"},
    ])
    assert a["score"] != b["score"]
