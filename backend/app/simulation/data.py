"""Официальный датасет районов и каталог мероприятий (ТЗ хакатона).

Источники: "HackAlem AI — Аким на 5 часов" (ТЗ) + "Датасет районов" (PDF,
раздел 1-4). Числа зафиксированы как константы — они являются частью условия
задачи и не подлежат "тюнингу".
"""

INDICATORS = ["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"]

INDICATOR_WEIGHTS = {
    "T1": 0.10,
    "T2": 0.10,
    "E1": 0.09,
    "E2": 0.11,
    "S1": 0.11,
    "S2": 0.11,
    "B1": 0.09,
    "B2": 0.09,
    "C1": 0.10,
    "C2": 0.10,
}

DIRECTION_OF_INDICATOR = {
    "T1": "transport",
    "T2": "transport",
    "E1": "ecology",
    "E2": "ecology",
    "S1": "social",
    "S2": "social",
    "B1": "safety",
    "B2": "safety",
    "C1": "services",
    "C2": "services",
}

# Доля бюджета/веса по направлениям — для справки в UI (не используется в Score).
DIRECTION_WEIGHTS = {
    "transport": 0.20,
    "ecology": 0.20,
    "social": 0.22,
    "safety": 0.18,
    "services": 0.20,
}

DISTRICTS = {
    "esil": {
        "name": "Есиль",
        "profile": "Богатый, но с пробками на мостах и переполненными школами.",
        "population_share": 0.27,
        "indicators": {
            "T1": 45, "T2": 62, "E1": 68, "E2": 72, "S1": 48,
            "S2": 55, "B1": 78, "B2": 60, "C1": 75, "C2": 70,
        },
    },
    "almaty": {
        "name": "Алматы",
        "profile": "Старый ЖКХ и пробки.",
        "population_share": 0.24,
        "indicators": {
            "T1": 40, "T2": 75, "E1": 50, "E2": 55, "S1": 60,
            "S2": 65, "B1": 62, "B2": 52, "C1": 50, "C2": 60,
        },
    },
    "saryarka": {
        "name": "Сарыарка",
        "profile": "Смог от частного сектора, слабое озеленение.",
        "population_share": 0.20,
        "indicators": {
            "T1": 50, "T2": 70, "E1": 42, "E2": 40, "S1": 62,
            "S2": 68, "B1": 58, "B2": 55, "C1": 45, "C2": 55,
        },
    },
    "baikonur": {
        "name": "Байконур",
        "profile": "Середняк без ярких перекосов.",
        "population_share": 0.13,
        "indicators": {
            "T1": 52, "T2": 68, "E1": 55, "E2": 50, "S1": 58,
            "S2": 60, "B1": 52, "B2": 58, "C1": 55, "C2": 58,
        },
    },
    "nura": {
        "name": "Нура",
        "profile": "Главный «аутсайдер» по соцсфере и транспорту.",
        "population_share": 0.16,
        "indicators": {
            "T1": 55, "T2": 40, "E1": 45, "E2": 65, "S1": 38,
            "S2": 35, "B1": 55, "B2": 50, "C1": 60, "C2": 50,
        },
    },
}

# type: "district" — нужен конкретный район; "city" — эффект на все 5 районов.
MEASURES = {
    "M1": {
        "direction": "transport",
        "title": "Выделенные полосы для автобусов",
        "type": "district",
        "cost": 18,
        "lag": 2,
        "effects": {"T1": 6, "T2": 9},
    },
    "M2": {
        "direction": "transport",
        "title": "Умные светофоры (адаптивное управление)",
        "type": "city",
        "cost": 22,
        "lag": 2,
        "effects": {"T1": 4, "B2": 3},
    },
    "M3": {
        "direction": "transport",
        "title": "Линия ЛРТ / расширение",
        "type": "district",
        "cost": 30,
        "lag": 4,
        "effects": {"T1": 16, "T2": 20, "E2": 4},
    },
    "M4": {
        "direction": "ecology",
        "title": "Парк / сквер",
        "type": "district",
        "cost": 15,
        "lag": 2,
        "effects": {"E1": 12, "E2": 3, "B1": 2},
    },
    "M5": {
        "direction": "ecology",
        "title": "Перевод частного сектора на чистое топливо",
        "type": "district",
        "cost": 25,
        "lag": 3,
        "effects": {"E2": 14, "C1": 4},
    },
    "M6": {
        "direction": "ecology",
        "title": "Городская программа озеленения и ветрозащитных полос",
        "type": "city",
        "cost": 20,
        "lag": 4,
        "effects": {"E1": 5, "E2": 3},
    },
    "M7": {
        "direction": "social",
        "title": "Школа + детсад (модульное строительство)",
        "type": "district",
        "cost": 24,
        "lag": 3,
        "effects": {"S1": 16},
    },
    "M8": {
        "direction": "social",
        "title": "Центр семейного здоровья / поликлиника",
        "type": "district",
        "cost": 20,
        "lag": 3,
        "effects": {"S2": 14},
    },
    "M9": {
        "direction": "social",
        "title": "Дворовые спорт-хабы",
        "type": "district",
        "cost": 10,
        "lag": 1,
        "effects": {"S1": 3, "S2": 3, "B1": 3},
    },
    "M10": {
        "direction": "safety",
        "title": "Освещение и камеры (расширение Safe City)",
        "type": "district",
        "cost": 12,
        "lag": 1,
        "effects": {"B1": 12, "B2": 2},
    },
    "M11": {
        "direction": "safety",
        "title": "Безопасные переходы и школьные зоны",
        "type": "district",
        "cost": 10,
        "lag": 1,
        "effects": {"B2": 12, "T1": -2},
    },
    "M12": {
        "direction": "services",
        "title": "Единая цифровая платформа обращений",
        "type": "city",
        "cost": 14,
        "lag": 1,
        "effects": {"C2": 5},
    },
    "M13": {
        "direction": "services",
        "title": "Модернизация тепло- и водосетей",
        "type": "district",
        "cost": 28,
        "lag": 4,
        "effects": {"C1": 18, "E2": 2},
    },
    "M14": {
        "direction": "services",
        "title": "Аварийные бригады ЖКХ + раннее оповещение",
        "type": "city",
        "cost": 16,
        "lag": 1,
        "effects": {"C1": 5, "C2": 2},
    },
}

# (measure_id, measure_id) -> (indicator, bonus). Бонус в районе ПЕРВОЙ меры пары.
SYNERGIES = [
    ("M1", "M2", "T1", 2),
    ("M10", "M12", "B1", 2),
    ("M5", "M6", "E2", 2),
]

# Несовместимости: True = запрещено в любом случае (без учёта района),
# False = запрещено только если выбраны в одном районе.
INCOMPATIBLE_PAIRS = [
    ("M1", "M3", "any"),
    ("M4", "M7", "same_district"),
    ("M5", "M13", "same_district"),
]

SIMULATION_HORIZON_QUARTERS = 8
TOTAL_BUDGET = 100
