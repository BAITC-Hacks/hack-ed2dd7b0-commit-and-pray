"""Движок расчёта Astana Quality of Life Score — формула из раздела 3 ТЗ.

Шаги:
1. I'_dk = clip(I_dk + Σ эффект_m,k × (8 − L_m)/8 + синергии, 0, 100)
2. D_d = Σ w_k × I'_dk
3. D_avg = Σ pop_d × D_d
4. Score = 0.7 × D_avg + 0.3 × min(D_d) − 1.0 × N_crit

Детерминированно, без LLM — воспроизводимость важнее креативности здесь.
LLM подключается только поверх готовых чисел (см. narrative.py).
"""

from app.simulation.data import (
    DISTRICTS,
    INDICATOR_WEIGHTS,
    MEASURES,
    SIMULATION_HORIZON_QUARTERS,
    SYNERGIES,
)
from app.simulation.validator import validate_selection


def clip(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _base_indicators() -> dict[str, dict[str, float]]:
    return {
        d_id: dict(d["indicators"]) for d_id, d in DISTRICTS.items()
    }


def _apply_measure_effects(
    indicators: dict[str, dict[str, float]], selections: list[dict]
) -> None:
    for s in selections:
        measure = MEASURES[s["measure_id"]]
        fraction = (SIMULATION_HORIZON_QUARTERS - measure["lag"]) / SIMULATION_HORIZON_QUARTERS
        targets = (
            [s["district"]] if measure["type"] == "district" else list(DISTRICTS.keys())
        )
        for d_id in targets:
            for indicator, delta in measure["effects"].items():
                indicators[d_id][indicator] += delta * fraction


def _apply_synergies(
    indicators: dict[str, dict[str, float]], selections: list[dict]
) -> list[dict]:
    by_id = {s["measure_id"]: s for s in selections}
    applied = []
    for a, b, indicator, bonus in SYNERGIES:
        if a in by_id and b in by_id:
            district = by_id[a].get("district")
            targets = [district] if district else list(DISTRICTS.keys())
            for d_id in targets:
                indicators[d_id][indicator] += bonus
            applied.append({"pair": [a, b], "indicator": indicator, "bonus": bonus, "district": district})
    return applied


def _clip_all(indicators: dict[str, dict[str, float]]) -> None:
    for d_id in indicators:
        for k in indicators[d_id]:
            indicators[d_id][k] = clip(indicators[d_id][k])


def district_score(indicators: dict[str, float]) -> float:
    return sum(INDICATOR_WEIGHTS[k] * v for k, v in indicators.items())


def count_critical(indicators: dict[str, dict[str, float]]) -> int:
    return sum(
        1
        for d_id in indicators
        for v in indicators[d_id].values()
        if v < 40.0
    )


def compute_score(selections: list[dict]) -> dict:
    """selections: [{"measure_id": "M7", "district": "nura" | None}, ...]

    Валидирует набор (бросает ValidationError при нарушении) и считает Score.
    """
    validate_selection(selections)
    return evaluate(selections)


def evaluate(selections: list[dict]) -> dict:
    """Та же формула без проверки правил — для превью неполного набора мер."""
    indicators = _base_indicators()
    _apply_measure_effects(indicators, selections)
    synergies_applied = _apply_synergies(indicators, selections)
    _clip_all(indicators)

    district_scores = {
        d_id: round(district_score(indicators[d_id]), 2) for d_id in indicators
    }
    d_avg = sum(
        DISTRICTS[d_id]["population_share"] * district_scores[d_id]
        for d_id in district_scores
    )
    min_district = min(district_scores, key=district_scores.get)
    n_crit = count_critical(indicators)

    score = 0.7 * d_avg + 0.3 * district_scores[min_district] - 1.0 * n_crit
    total_cost = sum(MEASURES[s["measure_id"]]["cost"] for s in selections)

    return {
        "score": round(score, 2),
        "d_avg": round(d_avg, 2),
        "weakest_district": min_district,
        "weakest_district_score": district_scores[min_district],
        "district_scores": district_scores,
        "district_indicators": {
            d_id: {k: round(v, 1) for k, v in ind.items()}
            for d_id, ind in indicators.items()
        },
        "n_crit": n_crit,
        "synergies_applied": synergies_applied,
        "total_cost": total_cost,
        "budget_left": 100 - total_cost,
    }


def base_scenario_score() -> dict:
    """Score без единого мероприятия — контрольная точка ТЗ: должно быть 52.56."""
    result = evaluate([])
    return {
        "score": result["score"],
        "d_avg": result["d_avg"],
        "weakest_district": result["weakest_district"],
        "n_crit": result["n_crit"],
    }
