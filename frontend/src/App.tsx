import { useEffect, useMemo, useState } from "react"
import { api } from "./api/client"
import { DistrictCard } from "./components/DistrictCard"
import { MeasureSelector } from "./components/MeasureSelector"
import { QoLGauge } from "./components/QoLGauge"
import { VerdictPanel } from "./components/VerdictPanel"
import type { DistrictsResponse, MeasuresResponse, Recommendation, Selection, SimulateResult } from "./types"

export default function App() {
  const [districts, setDistricts] = useState<DistrictsResponse | null>(null)
  const [measuresData, setMeasuresData] = useState<MeasuresResponse | null>(null)
  const [baseScore, setBaseScore] = useState<number | null>(null)
  const [selections, setSelections] = useState<Selection[]>([])
  const [result, setResult] = useState<SimulateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<"city" | "measures">("measures")

  useEffect(() => {
    Promise.all([api.getDistricts(), api.getMeasures(), api.getBaseScore()])
      .then(([d, m, b]) => {
        setDistricts(d)
        setMeasuresData(m)
        setBaseScore(b.score)
      })
      .catch((e) => setLoadError(String(e)))
  }, [])

  const budgetUsed = useMemo(() => {
    if (!measuresData) return 0
    return selections.reduce((sum, s) => sum + (measuresData.measures[s.measure_id]?.cost ?? 0), 0)
  }, [selections, measuresData])

  function toggleMeasure(measureId: string) {
    setResult(null)
    setSelections((prev) => {
      const exists = prev.find((s) => s.measure_id === measureId)
      if (exists) return prev.filter((s) => s.measure_id !== measureId)
      const measure = measuresData?.measures[measureId]
      return [...prev, { measure_id: measureId, district: measure?.type === "city" ? null : "" }]
    })
  }

  function setDistrict(measureId: string, district: string) {
    setResult(null)
    setSelections((prev) =>
      prev.map((s) => (s.measure_id === measureId ? { ...s, district } : s)),
    )
  }

  async function handleSimulate() {
    setLoading(true)
    try {
      const cleaned = selections.map((s) => ({
        measure_id: s.measure_id,
        district: s.district === "" ? null : s.district,
      }))
      const res = await api.simulate(cleaned)
      setResult(res)
      setMobileTab("city")
    } catch (e) {
      setResult({ valid: false, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Не удалось загрузить данные: {loadError}. Проверьте, что backend запущен на :8000.
      </div>
    )
  }

  if (!districts || !measuresData || baseScore === null) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Загрузка…</div>
  }

  const readyToSimulate = selections.length === 5 && selections.every((s) => s.district !== "")
  const liveDistricts = result?.valid ? result.district_indicators : undefined
  const liveScores = result?.valid ? result.district_scores : undefined
  const recommendations: Recommendation[] = result?.valid ? selections.slice(0, 3).map((selection) => ({ id: `alt-${selection.measure_id}`, title: `Сценарий «${measuresData.measures[selection.measure_id]?.title ?? selection.measure_id}»`, description: "Быстрый альтернативный вариант для сравнения эффекта.", selections: selections.map((item) => ({ ...item })) })) : []
  const applyRecommendation = (recommendation: Recommendation) => { setResult(null); setSelections(recommendation.selections) }

  return (
    <div className="min-h-screen bg-[#0b0f19]">
      <header className="relative overflow-hidden border-b border-slate-800 px-4 sm:px-6 py-6 flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left justify-between gap-3 sm:gap-4">
        <svg aria-hidden="true" className="absolute inset-x-0 bottom-0 h-14 sm:h-24 w-full opacity-10 text-violet-300" viewBox="0 0 500 100" preserveAspectRatio="none"><path fill="currentColor" d="M0 100V65h25V45h22v20h24V25h30v40h18V10h35v55h25V35h40v30h25V20h32v45h35V5h30v60h35v35z" /></svg>
        <div className="relative min-w-0">
          <h1 className="text-xl font-bold text-white">«Аким на 5 часов»</h1>
          <p className="text-sm text-slate-400">AI-симулятор управления городом · Astana Innovations</p>
        </div>
        <div className="relative shrink-0 scale-90 sm:scale-100"><QoLGauge score={result?.valid ? (result.score ?? baseScore) : baseScore} baseScore={baseScore} /></div>
      </header>

      <div className="sticky top-0 z-20 flex border-b border-slate-800 bg-[#0b0f19]/95 p-2 sm:hidden">
        <button onClick={() => setMobileTab("measures")} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mobileTab === "measures" ? "bg-violet-600 text-white" : "text-slate-400"}`}>Мероприятия</button>
        <button onClick={() => setMobileTab("city")} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mobileTab === "city" ? "bg-violet-600 text-white" : "text-slate-400"}`}>Город</button>
      </div>
      <main className="px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className={`${mobileTab === "measures" ? "hidden" : ""} sm:block lg:col-span-2 space-y-4`}>
          <h2 className="text-lg font-semibold text-slate-100">Районы города</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(districts).map(([id, d]) => (
              <DistrictCard
                key={id}
                district={d}
                liveIndicators={liveDistricts?.[id]}
                liveScore={liveScores?.[id]}
                isWeakest={result?.valid && result.weakest_district === id}
                baseScore={undefined}
                baseIndicators={d.indicators}
              />
            ))}
          </div>

          {result && <VerdictPanel result={result} districts={districts} recommendations={recommendations} onApplyRecommendation={applyRecommendation} />}
        </section>

        <aside className={`${mobileTab === "city" ? "hidden" : ""} sm:block space-y-4`}>
          <MeasureSelector
            measures={measuresData.measures}
            districts={districts}
            selections={selections}
            onToggle={toggleMeasure}
            onDistrictChange={setDistrict}
            budgetLeft={measuresData.total_budget - budgetUsed}
          />

          <div className="sticky bottom-0 sm:bottom-4 z-10 -mx-1 bg-[#0b0f19]/95 p-1 sm:mx-0 sm:bg-transparent sm:p-0">
            <button
              onClick={handleSimulate}
              disabled={!readyToSimulate || loading}
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 transition-colors"
            >
              {loading
                ? "Считаем…"
                : selections.length < 5
                  ? `Выбрано ${selections.length} / 5`
                  : "Утвердить бюджет города"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}
