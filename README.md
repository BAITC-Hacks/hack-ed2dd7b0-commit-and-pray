# «Аким на 5 часов» — AI-симулятор управления городом

Спец-трек **Astana Innovations**, HackAlem AI 2026. Команда: Commit and Pray.

## 1. Описание

Городской бюджет (100 условных единиц) нужно разложить по 5 направлениям —
транспорт, экология, соцсфера, безопасность, сервисы — с учётом того, что
ресурсы ограничены и эффект от мер проявляется не сразу. Игрок выбирает
ровно 5 мероприятий из каталога (14 шт.), распределяя их по 5 условным
районам Астаны, и получает итоговый **Astana Quality of Life Score** с
объяснением от «Аким-AI»: что получилось хорошо, какие риски и компромиссы
остались.

Данные и формула — из официального ТЗ и датасета районов, предоставленных
организаторами (владелец задачи: Astana Innovations).

## 2. Архитектура

Подробная схема, формула Score и роль LLM — в [docs/architecture.md](docs/architecture.md).

```
Frontend (React + Vite + Tailwind)  ⇄  Backend (FastAPI)  ⇄  LLM (опционально)
        /api/districts, /api/measures, /api/simulate
```

- **backend/app/simulation/data.py** — официальный датасет районов и каталог мероприятий.
- **backend/app/simulation/validator.py** — проверка правил набора решений.
- **backend/app/simulation/scoring.py** — детерминированный расчёт Score.
- **backend/app/simulation/narrative.py** — LLM-объяснение готового результата.

## 3. Технологии

| Слой | Технологии |
|---|---|
| Backend | Python 3.12+, FastAPI, Pydantic, Uvicorn, pytest |
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, Recharts, Framer Motion |
| AI | LLM через OpenAI-совместимый API (объяснение результата, не расчёт) |
| Деплой | Docker Compose (backend + nginx-frontend), либо локальный запуск |

## 4. Установка и запуск

### Вариант A — Docker Compose (рекомендуется для проверки)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api

### Вариант B — локально, без Docker

**Backend:**

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate      # Windows; на Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn app.main:app --reload --port 8000
```

**Frontend** (в отдельном терминале):

```bash
cd frontend
npm install
npm run dev
```

Frontend откроется на http://localhost:5173 и проксирует `/api` на
`http://localhost:8000` (настроено в `vite.config.ts`).

## 5. Переменные окружения

См. [.env.example](.env.example). Ключевые:

| Переменная | Назначение | Обязательна? |
|---|---|---|
| `LLM_API_KEY` | Ключ LLM для генерации объяснений | Нет — без ключа работает детерминированный fallback-текст, демо не ломается |
| `LLM_BASE_URL` | Эндпоинт LLM (OpenAI-совместимый, включая NVIDIA NIM) | Нет, есть значение по умолчанию |
| `LLM_MODEL` | Название модели | Нет |
| `CORS_ORIGINS` | Разрешённые origin для backend | Нет, по умолчанию `http://localhost:5173` |

## 6. Проверка (Verification Steps)

1. Убедиться, что формула Score реализована корректно:
   ```bash
   cd backend
   pytest -q
   ```
   Все тесты сверяются с контрольными числами из официального ТЗ, включая
   базовый Score = **52.56** и пример из документа (набор M7+M8+M10+M12+M5
   в Нуре/Сарыарке, бюджет 95, Score ≈ 56.5).
2. Запустить backend и frontend (см. раздел 4).
3. В интерфейсе выбрать ровно 5 мероприятий (для мер типа «Район» —
   указать район), нажать «Утвердить бюджет города».
4. Убедиться, что:
   - при превышении бюджета/нарушении правил (повтор меры, несовместимость
     M1+M3, >2 мер на направление и т.д.) выводится понятная ошибка вместо Score;
   - при валидном наборе Score и показатели районов обновляются, а «Аким-AI»
     даёт текстовое объяснение результата.

## 7. Open Source & AI Declarations

- **AI-модель:** LLM (OpenAI-совместимый API) используется исключительно
  для генерации текстового объяснения уже посчитанного результата —
  числа Score считаются детерминированным кодом (`scoring.py`), LLM их не
  вычисляет и не придумывает.
- **Данные:** синтетический датасет районов и каталог мероприятий,
  предоставлены организаторами трека (Astana Innovations), не содержат
  персональных данных.
- **Открытый код:** FastAPI, Pydantic, Uvicorn, React, Vite, TailwindCSS,
  Recharts, Framer Motion, OpenAI Python SDK — все используемые библиотеки
  распространяются под открытыми лицензиями (MIT/Apache-2.0/BSD).
