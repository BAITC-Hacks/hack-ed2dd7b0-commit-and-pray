"""LLM-assisted scenario suggestions; all validity and scores stay in code."""
import json
from openai import OpenAI

from app.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, LLM_API_KEY_BACKUP, LLM_BASE_URL_BACKUP, LLM_MODEL_BACKUP
from app.simulation.data import DISTRICTS, MEASURES
from app.simulation.scoring import compute_score
from app.simulation.validator import ValidationError


def _ask(selections: list[dict], result: dict) -> list[list[dict]]:
    prompt = (
        "Предложи 2 альтернативных набора ровно из 5 мер для симулятора Астаны. "
        "Верни только JSON-массив объектов {selections:[{measure_id:'M1',district:'nura' или null}]}. "
        "Не считай Score. Наборы должны быть разными и соблюдать бюджет 100.\n"
        f"Текущие меры: {selections}\nРезультат: {result}\n"
        f"Допустимые меры: {list(MEASURES)}; районы: {list(DISTRICTS)}"
    )
    for key, url, model in ((LLM_API_KEY, LLM_BASE_URL, LLM_MODEL), (LLM_API_KEY_BACKUP, LLM_BASE_URL_BACKUP, LLM_MODEL_BACKUP)):
        if not key:
            continue
        try:
            response = OpenAI(api_key=key, base_url=url).chat.completions.create(
                model=model, messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}, max_tokens=500, temperature=0.7,
            )
            raw = json.loads(response.choices[0].message.content or "{}")
            items = raw.get("recommendations", raw if isinstance(raw, list) else [])
            return [item.get("selections", []) for item in items if isinstance(item, dict)]
        except Exception:
            continue
    return []


def recommend(selections: list[dict], result: dict) -> list[dict]:
    candidates = _ask(selections, result)
    # Без LLM или при невалидном ответе пробуем безопасные локальные варианты.
    if not candidates:
        ids = list(MEASURES)
        for replacement in ids:
            if replacement not in {s["measure_id"] for s in selections}:
                candidate = [dict(s) for s in selections[:-1]] + [{"measure_id": replacement, "district": None}]
                candidates.append(candidate)
    found = []
    for candidate in candidates:
        try:
            normalized = [{"measure_id": s["measure_id"], "district": s.get("district")} for s in candidate]
            scored = compute_score(normalized)
            if scored["score"] > result.get("score", 0) and all(x["selections"] != normalized for x in found):
                found.append({"selections": normalized, "score": scored["score"], "rationale": "Баланс мер улучшает итоговый Score."})
        except (KeyError, TypeError, ValidationError):
            continue
        if len(found) == 2:
            break
    return found
