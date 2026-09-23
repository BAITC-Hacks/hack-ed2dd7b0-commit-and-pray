"""Deterministic alternative scenarios built on the canonical scoring function."""

from app.simulation.data import DISTRICTS, MEASURES
from app.simulation.scoring import compute_score
from app.simulation.validator import ValidationError


def recommend(selections: list[dict], limit: int = 3) -> list[dict]:
    current_ids = {item["measure_id"] for item in selections}
    alternatives: list[dict] = []

    # Replace one selected measure at a time. This keeps the scenario size
    # and district assignments stable while producing genuinely new scores.
    available = [measure_id for measure_id in MEASURES if measure_id not in current_ids]
    for selected_index, current in enumerate(selections):
        for replacement_id in available:
            replacement = MEASURES[replacement_id]
            district = None if replacement["type"] == "city" else (
                current.get("district") or next(iter(DISTRICTS))
            )
            candidate = [dict(item) for item in selections]
            candidate[selected_index] = {"measure_id": replacement_id, "district": district}
            if sum(MEASURES[item["measure_id"]]["cost"] for item in candidate) > 100:
                continue
            try:
                scored = compute_score(candidate)
            except ValidationError:
                continue
            if any(item["measure_id"] == replacement_id for item in candidate):
                alternatives.append({
                    "id": f"recommendation-{len(alternatives) + 1}",
                    "title": f"Сценарий «{replacement['title']}»",
                    "description": "Вариант с заменой одного решения для сравнения эффекта.",
                    "selections": candidate,
                    "score": scored["score"],
                    "total_cost": scored["total_cost"],
                })
            if len(alternatives) >= limit * 3:
                break
        if len(alternatives) >= limit * 3:
            break

    # Prefer distinct scores and measure sets in the response.
    unique: list[dict] = []
    seen: set[tuple[tuple[str, ...], float]] = set()
    for item in sorted(alternatives, key=lambda value: value["score"], reverse=True):
        key = (tuple(sorted(selection["measure_id"] for selection in item["selections"])), item["score"])
        if key not in seen:
            seen.add(key)
            unique.append(item)
        if len(unique) == limit:
            break
    return unique
