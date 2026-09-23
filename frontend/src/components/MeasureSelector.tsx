import { DIRECTION_ICONS, DIRECTION_LABELS, type DirectionKey, type DistrictsResponse, type Measure, type Selection } from "../types"

const DIRECTIONS: DirectionKey[] = ["transport", "ecology", "social", "safety", "services"]

export function MeasureSelector({
  measures,
  districts,
  selections,
  onToggle,
  onDistrictChange,
  budgetLeft,
}: {
  measures: Record<string, Measure>
  districts: DistrictsResponse
  selections: Selection[]
  onToggle: (measureId: string) => void
  onDistrictChange: (measureId: string, district: string) => void
  budgetLeft: number
}) {
  const selectedIds = new Set(selections.map((s) => s.measure_id))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Каталог мероприятий</h2>
        <div className="text-sm">
          <span className="text-slate-400">Осталось бюджета: </span>
          <span className={`font-mono font-semibold ${budgetLeft < 0 ? "text-red-400" : "text-emerald-400"}`}>
            {budgetLeft}
          </span>
          <span className="text-slate-500"> / 100</span>
        </div>
      </div>

      {DIRECTIONS.map((direction) => {
        const entries = Object.entries(measures).filter(([, m]) => m.direction === direction)
        return (
          <div key={direction}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {DIRECTION_ICONS[direction]} {DIRECTION_LABELS[direction]}
            </h3>
            <div className="space-y-2">
              {entries.map(([id, measure]) => {
                const isSelected = selectedIds.has(id)
                const selection = selections.find((s) => s.measure_id === id)
                return (
                  <div
                    key={id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-violet-500/70 bg-violet-500/10"
                        : "border-slate-700/60 bg-slate-900/40 hover:border-slate-600"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(id)}
                        className="mt-1 h-4 w-4 accent-violet-500"
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
                          {measure.type === "city" ? "Весь город" : "Выбрать район"} ·{" "}
                          {Object.entries(measure.effects)
                            .map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`)
                            .join(", ")}
                        </div>
                      </div>
                    </label>

                    {isSelected && measure.type === "district" && (
                      <select
                        value={selection?.district ?? ""}
                        onChange={(e) => onDistrictChange(id, e.target.value)}
                        className="mt-2 ml-7 w-[calc(100%-1.75rem)] min-h-11 rounded-lg bg-slate-800 border border-slate-600 text-sm text-slate-200 px-2 py-1"
                      >
                        <option value="" disabled>
                          Выберите район…
                        </option>
                        {Object.entries(districts).map(([dId, d]) => (
                          <option key={dId} value={dId}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
