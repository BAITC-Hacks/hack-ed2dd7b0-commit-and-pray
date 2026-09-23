import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api/client";
import { DistrictCard } from "./components/DistrictCard";
import { MeasureSelector } from "./components/MeasureSelector";
import { QoLGauge } from "./components/QoLGauge";
import { VerdictPanel } from "./components/VerdictPanel";
import type {
  DistrictPreview,
  DistrictsResponse,
  MeasuresResponse,
  Recommendation,
  Selection,
  SimulateResult,
} from "./types";

export default function App() {
  const [districts, setDistricts] = useState<DistrictsResponse | null>(null);
  const [measuresData, setMeasuresData] = useState<MeasuresResponse | null>(
    null,
  );
  const [baseScore, setBaseScore] = useState<number | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"city" | "measures">("measures");
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const [districtPreviews, setDistrictPreviews] = useState<
    Record<string, DistrictPreview>
  >({});
  const previewToken = useRef(0);
  const hoveredMeasure = useRef<string | null>(null);

  async function previewMeasure(measureId: string | null) {
    const token = ++previewToken.current;
    const measure = measureId ? measuresData?.measures[measureId] : undefined;
    if (!measureId || !measure || !districts) {
      setDistrictPreviews({});
      return;
    }

    const existing = selections.find((s) => s.measure_id === measureId);
    const targetDistrict =
      measure.type === "city" ? null : (existing?.district ?? "");
    if (measure.type === "district" && !targetDistrict) {
      setDistrictPreviews({});
      return;
    }

    const without = selections.filter(
      (s) =>
        s.measure_id !== measureId &&
        (measuresData?.measures[s.measure_id]?.type === "city" ||
          Boolean(s.district)),
    );
    const target: Selection = {
      measure_id: measureId,
      district: targetDistrict,
    };

    try {
      const [before, after] = await Promise.all([
        api.preview(without),
        api.preview([...without, target]),
      ]);
      if (token !== previewToken.current) return;
      const districtIds = targetDistrict
        ? [targetDistrict]
        : Object.keys(districts);
      setDistrictPreviews(
        Object.fromEntries(
          districtIds.map((id) => [
            id,
            {
              measureId,
              added: !existing,
              score: after.district_scores[id],
              beforeScore: before.district_scores[id],
              indicators: after.district_indicators[id],
              beforeIndicators: before.district_indicators[id],
            },
          ]),
        ),
      );
    } catch {
      if (token === previewToken.current) setDistrictPreviews({});
    }
  }

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 1024);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    Promise.all([api.getDistricts(), api.getMeasures(), api.getBaseScore()])
      .then(([d, m, b]) => {
        setDistricts(d);
        setMeasuresData(m);
        setBaseScore(b.score);
      })
      .catch((e) => setLoadError(String(e)));
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (hoveredMeasure.current) void previewMeasure(hoveredMeasure.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections]);

  const budgetUsed = useMemo(() => {
    if (!measuresData) return 0;
    return selections.reduce(
      (sum, s) => sum + (measuresData.measures[s.measure_id]?.cost ?? 0),
      0,
    );
  }, [selections, measuresData]);

  function toggleMeasure(measureId: string) {
    setResult(null);
    setSelections((prev) => {
      const exists = prev.find((s) => s.measure_id === measureId);
      if (exists) return prev.filter((s) => s.measure_id !== measureId);
      const measure = measuresData?.measures[measureId];
      return [
        ...prev,
        {
          measure_id: measureId,
          district: measure?.type === "city" ? null : "",
        },
      ];
    });
  }

  function setDistrict(measureId: string, district: string) {
    hoveredMeasure.current = measureId;
    setResult(null);
    setSelections((prev) =>
      prev.map((s) => (s.measure_id === measureId ? { ...s, district } : s)),
    );
  }

  async function handleSimulate() {
    setLoading(true);
    try {
      const cleaned = selections.map((s) => ({
        measure_id: s.measure_id,
        district: s.district === "" ? null : s.district,
      }));
      const res = await api.simulate(cleaned);
      setResult(res);
      setMobileTab("city");
      if (res.valid) {
        setRecommendationsLoading(true);
        api
          .recommend(cleaned, res)
          .then(setRecommendations)
          .catch(() => setRecommendations([]))
          .finally(() => setRecommendationsLoading(false));
      }
    } catch (e) {
      setResult({ valid: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Не удалось загрузить данные: {loadError}. Проверьте, что backend запущен
        на :8000.
      </div>
    );
  }

  if (!districts || !measuresData || baseScore === null) {
    return (
      <div className="min-h-screen bg-[#0b0f19] p-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-24 rounded-2xl bg-slate-800/70" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-800/60" />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-800/60" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const readyToSimulate =
    selections.length === 5 && selections.every((s) => s.district !== "");
  const liveDistricts = result?.valid ? result.district_indicators : undefined;
  const liveScores = result?.valid ? result.district_scores : undefined;
  const applyRecommendation = (recommendation: Recommendation) => {
    setResult(null);
    setSelections(recommendation.selections);
    setHighlightIds(recommendation.selections.map((item) => item.measure_id));
    setMobileTab("measures");
    window.setTimeout(() => setHighlightIds([]), 800);
    window.setTimeout(
      () =>
        setToast(
          `Сценарий применён: выбрано ${recommendation.selections.length} мероприятий, бюджет ${recommendation.selections.reduce((sum, item) => sum + (measuresData?.measures[item.measure_id]?.cost ?? 0), 0)}/100`,
        ),
      0,
    );
    window.setTimeout(() => setToast(null), 3000);
    window.setTimeout(
      () =>
        catalogRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-[#0b0f19]"
    >
      <header className="relative overflow-hidden border-b border-slate-800 px-4 sm:px-6 py-6 flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left justify-between gap-3 sm:gap-4">
        <svg
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-14 sm:h-24 w-full opacity-10 text-violet-300"
          viewBox="0 0 500 100"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0 100V65h25V45h22v20h24V25h30v40h18V10h35v55h25V35h40v30h25V20h32v45h35V5h30v60h35v35z"
          />
        </svg>
        <div className="relative min-w-0">
          <h1 className="text-xl font-bold text-white">«Аким на 5 часов»</h1>
          <p className="text-sm text-slate-400">
            AI-симулятор управления городом · Astana Innovations
          </p>
        </div>
        <motion.div
          key={
            result?.valid && result.score && result.score > baseScore
              ? "improved"
              : "steady"
          }
          initial={
            result?.valid &&
            result.score !== undefined &&
            result.score > baseScore
              ? { boxShadow: "0 0 0 rgba(52,211,153,0)" }
              : undefined
          }
          animate={
            result?.valid &&
            result.score !== undefined &&
            result.score > baseScore
              ? {
                  boxShadow: [
                    "0 0 0 rgba(52,211,153,0)",
                    "0 0 28px rgba(52,211,153,0.45)",
                    "0 0 0 rgba(52,211,153,0)",
                  ],
                }
              : undefined
          }
          transition={{ duration: 0.6 }}
          className="relative shrink-0 rounded-full scale-90 sm:scale-100"
        >
          <QoLGauge
            score={result?.valid ? (result.score ?? baseScore) : baseScore}
            baseScore={baseScore}
          />
        </motion.div>
      </header>

      <div className="sticky top-0 z-20 flex border-b border-slate-800 bg-[#0b0f19]/95 p-2 lg:hidden">
        <button
          onClick={() => setMobileTab("measures")}
          className={`flex-1 rounded-2xl py-2 text-sm font-semibold transition-all duration-150 hover:scale-[1.01] ${mobileTab === "measures" ? "bg-violet-600 text-white" : "text-slate-400"}`}
        >
          Мероприятия
        </button>
        <button
          onClick={() => setMobileTab("city")}
          className={`flex-1 rounded-2xl py-2 text-sm font-semibold transition-all duration-150 hover:scale-[1.01] ${mobileTab === "city" ? "bg-violet-600 text-white" : "text-slate-400"}`}
        >
          Город
        </button>
      </div>
      <main className="px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="wait" initial={false}>
          {mobileTab === "city" || isDesktop ? (
            <motion.section
              key="city"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="lg:col-span-2 space-y-4"
            >
              <h2 className="text-lg font-semibold text-slate-100">
                Районы города
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(districts).map(([id, d], index) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <DistrictCard
                      district={d}
                      preview={isDesktop ? districtPreviews[id] : undefined}
                      liveIndicators={liveDistricts?.[id]}
                      liveScore={liveScores?.[id]}
                      isWeakest={
                        result?.valid && result.weakest_district === id
                      }
                      baseIndicators={d.indicators}
                    />
                  </motion.div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    key="verdict"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VerdictPanel
                      result={result}
                      districts={districts}
                      recommendations={recommendations}
                      recommendationsLoading={recommendationsLoading}
                      onApplyRecommendation={applyRecommendation}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {mobileTab === "measures" || isDesktop ? (
            <motion.aside
              key="measures"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <MeasureSelector
                measures={measuresData.measures}
                districts={districts}
                selections={selections}
                onToggle={toggleMeasure}
                onDistrictChange={setDistrict}
                budgetLeft={measuresData.total_budget - budgetUsed}
                highlightIds={highlightIds}
                catalogRef={catalogRef}
                onPreviewMeasure={(id) => {
                  hoveredMeasure.current = id;
                  void previewMeasure(id);
                }}
              />

              <div className="sticky bottom-0 sm:bottom-4 z-10 -mx-1 bg-[#0b0f19]/95 p-1 sm:mx-0 sm:bg-transparent sm:p-0">
                <button
                  onClick={handleSimulate}
                  disabled={!readyToSimulate || loading}
                  className="w-full rounded-2xl bg-violet-600 hover:bg-violet-500 hover:scale-[1.01] disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 transition-all duration-150"
                >
                  {loading
                    ? "Считаем…"
                    : selections.length < 5
                      ? `Выбрано ${selections.length} / 5`
                      : "Утвердить бюджет города"}
                </button>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-emerald-400/40 bg-slate-900 px-4 py-3 text-sm text-emerald-200 shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
