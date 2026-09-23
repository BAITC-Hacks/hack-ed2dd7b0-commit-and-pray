import { useEffect, useMemo, useState } from "react"
import { api } from "./api/client"
import { DistrictCard } from "./components/DistrictCard"
import { MeasureSelector } from "./components/MeasureSelector"
import { QoLGauge } from "./components/QoLGauge"
import { VerdictPanel } from "./components/VerdictPanel"
import type { DistrictsResponse, MeasuresResponse, Selection, SimulateResult } from "./types"

export default function App() {
  const [districts, setDistricts] = useState<DistrictsResponse | null>(null)
  const [measuresData, setMeasuresData] = useState<MeasuresResponse | null>(null)
  const [baseScore, setBaseScore] = useState<number | null>(null)
  const [selections, setSelections] = useState<Selection[]>([])
  const [result, setResult] = useState<SimulateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<import("./types").Recommendation[]>([])
  const [recommending, setRecommending] = useState(false)
  const [saved, setSaved] = useState<SimulateResult[]>(() => JSON.parse(localStorage.getItem("astana-scenarios") || "[]"))

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
      setRecommendations([])
    } catch (e) {
      setResult({ valid: false, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  async function handleRecommend() {
    if (!result?.valid) return
    setRecommending(true)
    try { setRecommendations((await api.recommend(selections.map((s) => ({ ...s, district: s.district || null })), result)).recommendations) }
    catch (e) { setResult({ ...result, error: `Не удалось получить рекомендации: ${String(e)}` }) }
    finally { setRecommending(false) }
  }

  function saveScenario() {
    if (!result?.valid) return
    const next = [result, ...saved.filter((x) => x.score !== result.score)].slice(0, 3)
    setSaved(next); localStorage.setItem("astana-scenarios", JSON.stringify(next))
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

  return (
    <div className="min-h-screen bg-[#0b0f19]">
      <header className="border-b border-slate-800 px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">«Аким на 5 часов»</h1>
          <p className="text-sm text-slate-400">AI-симулятор управления городом · Astana Innovations</p>
        </div>
        <QoLGauge score={result?.valid ? (result.score ?? baseScore) : baseScore} baseScore={baseScore} />
      </header>

      <main className="px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Районы города</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(districts).map(([id, d]) => (
              <DistrictCard
                key={id}
                district={d}
                liveIndicators={liveDistricts?.[id]}
                liveScore={liveScores?.[id]}
                isWeakest={result?.valid && result.weakest_district === id}
              />
            ))}
          </div>

          {result && <VerdictPanel result={result} districts={districts} onRecommend={handleRecommend} recommendations={recommendations} recommending={recommending} />}
          {result?.valid && <button onClick={saveScenario} className="text-xs text-slate-400 hover:text-white">＋ Сохранить сценарий для сравнения</button>}
          {saved.length > 0 && <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"><div className="text-xs text-slate-500 mb-2">Сохранённые сценарии</div><div className="flex flex-wrap gap-2">{saved.map((s, i) => <span key={i} className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300">#{i + 1} · {s.score?.toFixed(1)}</span>)}</div></div>}
        </section>

        <aside className="space-y-4">
          <MeasureSelector
            measures={measuresData.measures}
            districts={districts}
            selections={selections}
            onToggle={toggleMeasure}
            onDistrictChange={setDistrict}
            budgetLeft={measuresData.total_budget - budgetUsed}
          />

          <div className="sticky bottom-4">
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
