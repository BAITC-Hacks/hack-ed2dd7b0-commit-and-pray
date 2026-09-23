import {
  DIRECTION_ICONS,
  DIRECTION_LABELS,
  type DirectionKey,
  type DistrictsResponse,
  type Measure,
  type Selection,
} from "../types";
import { motion } from "framer-motion";
import type { RefObject } from "react";

const ANY_DISTRICT_CONFLICTS: Record<string, string> = { M1: "M3", M3: "M1" };
const SAME_DISTRICT_CONFLICTS: Record<string, string> = {
  M4: "M7",
  M7: "M4",
  M5: "M13",
  M13: "M5",
};

const DIRECTIONS: DirectionKey[] = [
  "transport",
  "ecology",
  "social",
  "safety",
  "services",
];

export function MeasureSelector({
  measures,
  districts,
  selections,
  onToggle,
  onDistrictChange,
  budgetLeft,
  highlightIds = [],
  catalogRef,
  onPreviewMeasure,
}: {
  measures: Record<string, Measure>;
  districts: DistrictsResponse;
  selections: Selection[];
  onToggle: (measureId: string) => void;
  onDistrictChange: (measureId: string, district: string) => void;
  budgetLeft: number;
  highlightIds?: string[];
  catalogRef?: RefObject<HTMLDivElement | null>;
  onPreviewMeasure?: (measureId: string | null) => void;
}) {
  const selectedIds = new Set(selections.map((s) => s.measure_id));
  const directionCount: Partial<Record<DirectionKey, number>> = {};
  for (const s of selections) {
    const direction = measures[s.measure_id]?.direction;
    if (direction)
      directionCount[direction] = (directionCount[direction] ?? 0) + 1;
  }
  const budgetUsed = 100 - budgetLeft;

  function blockReason(id: string, measure: Measure): string | null {
    if (selectedIds.has(id)) return null;
    if (selections.length >= 5) return "Уже выбрано 5 мер";
    if (measure.cost > budgetLeft)
      return `Не хватает бюджета: нужно ${measure.cost}, осталось ${budgetLeft}`;
    if ((directionCount[measure.direction] ?? 0) >= 2)
      return "Не более 2 мер на направление";
    const rival = ANY_DISTRICT_CONFLICTS[id];
    if (rival && selectedIds.has(rival))
      return `Несовместимо с ${rival} (либо BRT, либо ЛРТ)`;
    return null;
  }

  function districtTakenBy(id: string, districtId: string): string | null {
    const rival = SAME_DISTRICT_CONFLICTS[id];
    if (!rival) return null;
    const other = selections.find((s) => s.measure_id === rival);
    return other?.district === districtId ? rival : null;
  }

  return (
    <div ref={catalogRef} className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            Каталог мероприятий
          </h2>
          <div className="text-sm">
            <span className="text-slate-400">Бюджет: </span>
            <span className="font-mono font-semibold text-emerald-400">
              {budgetLeft}
            </span>
            <span className="text-slate-500">
              {" "}
              / 100 · мер {selections.length}/5
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
            initial={false}
            animate={{ width: `${Math.min(100, budgetUsed)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {DIRECTIONS.map((direction) => {
        const entries = Object.entries(measures).filter(
          ([, m]) => m.direction === direction,
        );
        return (
          <div key={direction}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {DIRECTION_ICONS[direction]} {DIRECTION_LABELS[direction]}
            </h3>
            <div className="space-y-2">
              {entries.map(([id, measure]) => {
                const isSelected = selectedIds.has(id);
                const selection = selections.find((s) => s.measure_id === id);
                const blocked = blockReason(id, measure);
                return (
                  <motion.div
                    key={id}
                    onMouseEnter={() => onPreviewMeasure?.(id)}
                    onMouseLeave={() => onPreviewMeasure?.(null)}
                    animate={
                      highlightIds.includes(id)
                        ? {
                            backgroundColor: [
                              "rgba(139,92,246,0.35)",
                              "rgba(139,92,246,0.10)",
                              "rgba(15,23,42,0.40)",
                            ],
                          }
                        : undefined
                    }
                    transition={
                      highlightIds.includes(id)
                        ? { duration: 0.75 }
                        : { duration: 0.15 }
                    }
                    className={`rounded-2xl border p-3 transition-all duration-150 ${
                      blocked
                        ? "border-slate-800 bg-slate-900/20 opacity-50"
                        : "hover:scale-[1.01] hover:bg-slate-800/60"
                    } ${
                      isSelected
                        ? "border-violet-500/70 bg-violet-500/10"
                        : blocked
                          ? ""
                          : "border-slate-700/60 bg-slate-900/40 hover:border-slate-600"
                    }`}
                  >
                    <label
                      title={blocked ?? undefined}
                      className={`flex items-start gap-3 ${blocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <motion.input
                        whileTap={{ scale: 0.97 }}
                        type="checkbox"
                        checked={isSelected}
                        disabled={Boolean(blocked)}
                        onChange={() => onToggle(id)}
                        onFocus={() => onPreviewMeasure?.(id)}
                        onBlur={() => onPreviewMeasure?.(null)}
                        className="mt-1 h-4 w-4 accent-violet-500 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-200 break-words">
                            {id} · {measure.title}
                          </span>
                          <span className="text-xs font-mono text-slate-400 shrink-0">
                            {measure.cost} у.е. · лаг {measure.lag}кв
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {measure.type === "city"
                            ? "Весь город"
                            : "Выбрать район"}{" "}
                          ·{" "}
                          {Object.entries(measure.effects)
                            .map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`)
                            .join(", ")}
                        </div>
                        {blocked && (
                          <div className="mt-1 text-[11px] text-amber-400/90">
                            {blocked}
                          </div>
                        )}
                      </div>
                    </label>

                    {isSelected && measure.type === "district" && (
                      <select
                        value={selection?.district ?? ""}
                        onChange={(e) => onDistrictChange(id, e.target.value)}
                        className="mt-2 ml-7 w-[calc(100%-1.75rem)] min-h-11 rounded-2xl bg-slate-800 border border-slate-600 text-sm text-slate-200 px-2 py-1"
                      >
                        <option value="" disabled>
                          Выберите район…
                        </option>
                        {Object.entries(districts).map(([dId, d]) => {
                          const rival = districtTakenBy(id, dId);
                          return (
                            <option
                              key={dId}
                              value={dId}
                              disabled={Boolean(rival)}
                            >
                              {d.name}
                              {rival ? ` — занято ${rival}` : ""}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
