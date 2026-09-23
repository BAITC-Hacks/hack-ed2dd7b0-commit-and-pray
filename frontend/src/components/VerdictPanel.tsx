import type { DistrictsResponse, Recommendation, SimulateResult } from "../types"

export function VerdictPanel({
  result,
  districts,
  recommendations = [],
  onApplyRecommendation,
}: {
  result: SimulateResult
  districts: DistrictsResponse
  recommendations?: Recommendation[]
  onApplyRecommendation?: (recommendation: Recommendation) => void
}) {
  if (!result.valid) {
    return (
      <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4">
        <h3 className="text-sm font-semibold text-red-300 mb-1">Набор решений невалиден</h3>
        <p className="text-sm text-red-200">{result.error}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏛️</span>
        <h3 className="text-sm font-semibold text-slate-100">Слово Аким-AI</h3>
      </div>
      <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
        {result.explanation}
      </p>

      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
        <div className="rounded-lg bg-slate-800/60 p-2">
          <div className="text-slate-500">Слабейший район</div>
          <div className="text-slate-200 font-medium">
            {result.weakest_district ? districts[result.weakest_district]?.name : "—"} ·{" "}
            {result.weakest_district_score?.toFixed(1)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-800/60 p-2">
          <div className="text-slate-500">Критических показателей</div>
          <div className={`font-medium ${result.n_crit ? "text-red-400" : "text-emerald-400"}`}>
            {result.n_crit}
          </div>
        </div>
        <div className="rounded-lg bg-slate-800/60 p-2">
          <div className="text-slate-500">Бюджет</div>
          <div className="text-slate-200 font-medium">
            {result.total_cost} / 100 (остаток {result.budget_left})
          </div>
        </div>
        <div className="rounded-lg bg-slate-800/60 p-2">
          <div className="text-slate-500">Синергии</div>
          <div className="text-slate-200 font-medium">
            {result.synergies_applied?.length
              ? result.synergies_applied.map((s) => s.pair.join("+")).join(", ")
              : "нет"}
          </div>
        </div>
      </div>
      {recommendations.length > 0 && <div className="space-y-2 pt-2"><h4 className="text-sm font-semibold text-slate-200">Сценарии от Аким-AI</h4>{recommendations.map((item) => <div key={item.id} className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-3"><div className="font-medium text-slate-100">{item.title}</div><p className="mt-1 text-xs text-slate-400">{item.description}</p><button onClick={() => onApplyRecommendation?.(item)} className="mt-3 min-h-10 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-500">Применить этот сценарий</button></div>)}</div>}
    </div>
  )
}
