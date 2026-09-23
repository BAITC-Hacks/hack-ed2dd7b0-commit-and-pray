import type { DistrictsResponse, Recommendation, SimulateResult } from "../types"

export function VerdictPanel({
  result,
  districts,
  onRecommend,
  recommendations,
  recommending,
}: {
  result: SimulateResult
  districts: DistrictsResponse
  onRecommend?: () => void
  recommendations?: Recommendation[]
  recommending?: boolean
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
      <button onClick={onRecommend} disabled={recommending} className="rounded-lg border border-violet-400/40 px-3 py-2 text-xs text-violet-200 hover:bg-violet-500/15 disabled:opacity-50">
        {recommending ? "Ищем точки роста…" : "Что можно улучшить?"}
      </button>
      {recommendations?.length ? <div className="grid gap-2 sm:grid-cols-2">
        {recommendations.map((item, index) => <div key={index} className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
          <div className="flex justify-between text-slate-300"><span>Вариант {index + 1}</span><strong className="text-emerald-300">Score {item.score.toFixed(1)}</strong></div>
          <p className="mt-2 text-slate-400">{item.selections.map((s) => `${s.measure_id}${s.district ? ` · ${districts[s.district]?.name ?? s.district}` : ""}`).join(" · ")}</p>
        </div>)}
      </div> : null}

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
    </div>
  )
}
