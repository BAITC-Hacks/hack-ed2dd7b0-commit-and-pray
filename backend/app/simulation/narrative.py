"""LLM-обёртка: «Аким-AI» объясняет уже посчитанный результат.

Важно (по ТЗ): LLM числа не считает и не придумывает — она получает готовый
результат compute_score() (дельты по районам/показателям, вклад мер) и
формулирует объяснение, сильные стороны, риски и компромиссы. Если LLM
недоступна — используется детерминированный fallback-текст, собранный из тех
же чисел, чтобы демо не ломалось.
"""

from openai import OpenAI

from app.config import (
    LLM_API_KEY, LLM_BASE_URL, LLM_MODEL,
    LLM_API_KEY_BACKUP, LLM_BASE_URL_BACKUP, LLM_MODEL_BACKUP,
)
from app.simulation.data import DISTRICTS, MEASURES

_clients: dict[str, OpenAI] = {}


def _get_client(api_key: str, base_url: str) -> OpenAI | None:
    if not api_key:
        return None
    key = f"{api_key}:{base_url}"
    if key not in _clients:
        _clients[key] = OpenAI(api_key=api_key, base_url=base_url)
    return _clients[key]


def _selection_summary(selections: list[dict]) -> str:
    parts = []
    for s in selections:
        measure = MEASURES[s["measure_id"]]
        district_name = DISTRICTS[s["district"]]["name"] if s.get("district") else "весь город"
        parts.append(f"{s['measure_id']} «{measure['title']}» ({district_name}, {measure['cost']} у.е.)")
    return "; ".join(parts)


def _fallback_explanation(result: dict, selections: list[dict], base_score: float) -> str:
    delta = result["score"] - base_score
    sign = "+" if delta >= 0 else ""
    weakest_name = DISTRICTS[result["weakest_district"]]["name"]
    lines = [
        f"Итоговый Astana Quality of Life Score: {result['score']} "
        f"({sign}{delta:.2f} к базовому {base_score}).",
        f"Самый слабый район по-прежнему {weakest_name} "
        f"({result['weakest_district_score']} баллов), критических показателей "
        f"(< 40): {result['n_crit']}.",
        f"Бюджет использован: {result['total_cost']} из 100 "
        f"(остаток {result['budget_left']}).",
    ]
    if result["synergies_applied"]:
        pairs = ", ".join("+".join(s["pair"]) for s in result["synergies_applied"])
        lines.append(f"Сработали синергии: {pairs}.")
    return " ".join(lines)


def generate_explanation(result: dict, selections: list[dict], base_score: float) -> str:
    prompt = (
        "Ты — аким Астаны, только что принявший 5 решений о распределении "
        "городского бюджета. Числа уже посчитаны, ты их не пересчитываешь, "
        "а объясняешь.\n\n"
        f"Выбранные меры: {_selection_summary(selections)}.\n"
        f"Базовый Score (без действий): {base_score}.\n"
        f"Итоговый Score: {result['score']}.\n"
        f"Средний балл по городу (D_avg): {result['d_avg']}.\n"
        f"Самый слабый район: {DISTRICTS[result['weakest_district']]['name']} "
        f"({result['weakest_district_score']} баллов).\n"
        f"Критических показателей (< 40 после решений): {result['n_crit']}.\n"
        f"Сработавшие синергии: {result['synergies_applied']}.\n"
        f"Бюджет: потрачено {result['total_cost']} из 100.\n\n"
        "Напиши объяснение результата от первого лица (4-6 предложений): что "
        "получилось хорошо, какие риски и компромиссы остались, почему счёт "
        "именно такой. По-русски, без канцелярита, опирайся только на "
        "приведённые числа."
    )
    for key, url, model in (
        (LLM_API_KEY, LLM_BASE_URL, LLM_MODEL),
        (LLM_API_KEY_BACKUP, LLM_BASE_URL_BACKUP, LLM_MODEL_BACKUP),
    ):
        client = _get_client(key, url)
        if client is None:
            continue
        try:
            resp = client.chat.completions.create(
                model=model, messages=[{"role": "user", "content": prompt}],
                max_tokens=350, temperature=0.6,
            )
            text = (resp.choices[0].message.content or "").strip()
            if text:
                return text
        except Exception:
            continue
    return _fallback_explanation(result, selections, base_score)
