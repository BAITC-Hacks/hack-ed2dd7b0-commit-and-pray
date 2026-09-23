"""LLM-обёртка: «Аким-AI» объясняет уже посчитанный результат.

Важно (по ТЗ): LLM числа не считает и не придумывает — она получает готовый
результат compute_score() (дельты по районам/показателям, вклад мер) и
формулирует объяснение, сильные стороны, риски и компромиссы. Если LLM
недоступна — используется детерминированный fallback-текст, собранный из тех
же чисел, чтобы демо не ломалось.
"""

from openai import OpenAI

from app.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
from app.simulation.data import DISTRICTS, MEASURES

_client: OpenAI | None = None


def _get_client() -> OpenAI | None:
    global _client
    if not LLM_API_KEY:
        return None
    if _client is None:
        _client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
    return _client


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
    client = _get_client()
    if client is None:
        return _fallback_explanation(result, selections, base_score)

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
        "именно такой. Особо отметь, если решение в одной сфере дало "
        "заметный побочный эффект в другой (например, мера по транспорту "
        "повлияла на экологию или нагрузку на инфраструктуру, синергия "
        "между направлениями усилила эффект, или экономия в одной сфере "
        "создала риск в другой) — покажи это как цепочку причин и следствий, "
        "а не список изолированных фактов. По-русски, без канцелярита, "
        "опирайся только на приведённые числа, не придумывай эффекты, "
        "которых нет в данных."
    )
    try:
        resp = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=350,
            temperature=0.6,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return _fallback_explanation(result, selections, base_score)
