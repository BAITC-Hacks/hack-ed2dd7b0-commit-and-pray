import { useEffect, useState } from "react"
import { INDICATOR_LABELS, type District } from "../types"

function indicatorColor(value: number): string {
  if (value < 40) return "bg-red-500"
  if (value < 60) return "bg-amber-500"
  return "bg-emerald-500"
}

export function DistrictCard({
  district,
  liveIndicators,
  liveScore,
  isWeakest,
}: {
  district: District
  liveIndicators?: Record<string, number>
  liveScore?: number
  isWeakest?: boolean
}) {
  const indicators = liveIndicators ?? district.indicators
  const [displayScore, setDisplayScore] = useState(liveScore)
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (liveScore === undefined) return
    const start = displayScore ?? liveScore
    const began = performance.now()
    const frame = (now: number) => {
      const progress = Math.min(1, (now - began) / 500)
      setDisplayScore(start + (liveScore - start) * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) requestAnimationFrame(frame)
    }
    setPulse(true)
    requestAnimationFrame(frame)
    const timer = window.setTimeout(() => setPulse(false), 700)
    return () => window.clearTimeout(timer)
  }, [liveScore])

  return (
    <div
      className={`rounded-2xl border p-4 bg-slate-900/60 backdrop-blur transition-colors ${
        isWeakest ? "border-red-500/70 shadow-[0_0_0_1px_rgba(239,68,68,0.4)]" : "border-slate-700/70"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-100">{district.name}</h3>
        <span className="text-xs text-slate-400">
          {Math.round(district.population_share * 100)}% населения
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400 leading-snug">{district.profile}</p>

      {liveScore !== undefined && (
        <div className={`mt-3 flex items-center gap-2 rounded-lg transition-colors ${pulse ? "bg-violet-500/15" : ""}`}>
          <span className="text-2xl font-bold text-white">{displayScore?.toFixed(1)}</span>
          {isWeakest && (
            <span className="rounded-full bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 font-medium">
              самый слабый район
            </span>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {Object.entries(indicators).map(([code, value]) => (
          <div key={code} className="flex items-center gap-1.5" title={INDICATOR_LABELS[code]}>
            <span className="w-6 shrink-0 text-[10px] font-mono text-slate-500">{code}</span>
            <div className="h-1.5 flex-1 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${indicatorColor(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className={`w-8 shrink-0 text-right text-[10px] font-mono transition-colors ${pulse ? "text-violet-300" : "text-slate-400"}`}>
              {Math.round(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
