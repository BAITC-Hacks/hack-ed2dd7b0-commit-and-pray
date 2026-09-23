"""Валидатор набора решений — правила из раздела 4 ТЗ.

1. Бюджет <= 100.
2. Решений ровно 5.
3. Повторы запрещены.
4. Район обязателен для type=district, запрещён для type=city.
5. Не более 2 мер из одного направления.
6. Несовместимости M1-M3 (в любом районе), M4-M7 и M5-M13 (в одном районе).
"""

from app.simulation.data import DISTRICTS, INCOMPATIBLE_PAIRS, MEASURES, TOTAL_BUDGET


class ValidationError(Exception):
    pass


def validate_selection(selections: list[dict]) -> None:
    """selections: [{"measure_id": "M7", "district": "nura" | None}, ...]"""

    if len(selections) != 5:
        raise ValidationError(
            f"Нужно выбрать ровно 5 мероприятий, выбрано {len(selections)}."
        )

    measure_ids = [s["measure_id"] for s in selections]
    if len(set(measure_ids)) != len(measure_ids):
        raise ValidationError("Повторы мероприятий запрещены.")

    for mid in measure_ids:
        if mid not in MEASURES:
            raise ValidationError(f"Неизвестное мероприятие: {mid}.")

    total_cost = sum(MEASURES[mid]["cost"] for mid in measure_ids)
    if total_cost > TOTAL_BUDGET:
        raise ValidationError(
            f"Превышен бюджет: {total_cost} у.е. из {TOTAL_BUDGET} доступных."
        )

    direction_count: dict[str, int] = {}
    for s in selections:
        mid = s["measure_id"]
        measure = MEASURES[mid]
        district = s.get("district")

        if measure["type"] == "district":
            if not district:
                raise ValidationError(
                    f"Мероприятие {mid} требует указания района."
                )
            if district not in DISTRICTS:
                raise ValidationError(f"Неизвестный район: {district}.")
        else:
            if district:
                raise ValidationError(
                    f"Мероприятие {mid} городское, район указывать не нужно."
                )

        direction = measure["direction"]
        direction_count[direction] = direction_count.get(direction, 0) + 1
        if direction_count[direction] > 2:
            raise ValidationError(
                f"Не более 2 мер из одного направления «{direction}»."
            )

    by_id = {s["measure_id"]: s for s in selections}
    for a, b, scope in INCOMPATIBLE_PAIRS:
        if a in by_id and b in by_id:
            if scope == "any":
                raise ValidationError(f"Несовместимость: {a} и {b} нельзя выбрать вместе.")
            if scope == "same_district" and by_id[a].get("district") == by_id[b].get(
                "district"
            ):
                raise ValidationError(
                    f"Несовместимость: {a} и {b} нельзя выбрать в одном районе."
                )
