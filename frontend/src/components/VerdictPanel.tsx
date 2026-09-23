import type {
  DistrictsResponse,
  Recommendation,
  SimulateResult,
} from "../types";
import { motion } from "framer-motion";

export function VerdictPanel({
  result,
  districts,
  recommendations = [],
  onApplyRecommendation,
  recommendationsLoading = false,
}: {
  result: SimulateResult;
  districts: DistrictsResponse;
  recommendations?: Recommendation[];
  onApplyRecommendation?: (recommendation: Recommendation) => void;
  recommendationsLoading?: boolean;
}) {
  if (!result.valid) {
    return (
      <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4">
        <h3 className="text-sm font-semibold text-red-300 mb-1">
          Набор решений невалиден
        </h3>
        <p className="text-sm text-red-200">{result.error}</p>
      </div>
    );
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
            {result.weakest_district
              ? districts[result.weakest_district]?.name
              : "—"}{" "}
            · {result.weakest_district_score?.toFixed(1)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-800/60 p-2">
          <div className="text-slate-500">Критических показателей</div>
          <div
            className={`font-medium ${result.n_crit ? "text-red-400" : "text-emerald-400"}`}
          >
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
      {(recommendationsLoading || recommendations.length > 0) && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-semibold text-slate-200">
            Сценарии от Аким-AI
          </h4>
          {recommendationsLoading && (
            <div className="grid gap-2 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl border border-slate-700 bg-slate-800/60"
                />
              ))}
            </div>
          )}
          {!recommendationsLoading &&
            recommendations.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-3 transition-all duration-150 hover:scale-[1.01] hover:bg-violet-500/15"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-100">{item.title}</div>
                  {item.score !== undefined && (
                    <strong className="text-xl text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                      {item.score.toFixed(1)}
                    </strong>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {item.description}
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onApplyRecommendation?.(item)}
                  className="mt-3 min-h-10 rounded-2xl bg-violet-600 px-3 text-xs font-semibold text-white transition-all duration-150 hover:scale-[1.01] hover:bg-violet-500"
                >
                  Применить этот сценарий
                </motion.button>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}
