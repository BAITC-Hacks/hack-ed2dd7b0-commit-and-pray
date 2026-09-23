import { motion } from "framer-motion"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts"
import { DIRECTION_ICONS, INDICATOR_LABELS, type District, type DirectionKey } from "../types"

const groups: Array<[DirectionKey, string[]]> = [["transport", ["T1", "T2"]], ["ecology", ["E1", "E2"]], ["social", ["S1", "S2"]], ["safety", ["B1", "B2"]], ["services", ["C1", "C2"]]]

export function DistrictCard({
  district,
  liveIndicators,
  liveScore,
  baseScore,
  baseIndicators,
  isWeakest,
}: {
  district: District
  liveIndicators?: Record<string, number>
  liveScore?: number
  baseScore?: number
  baseIndicators?: Record<string, number>
  isWeakest?: boolean
}) {
  const indicators = liveIndicators ?? district.indicators

  const radarData = groups.map(([key, codes]) => ({ subject: `${DIRECTION_ICONS[key]} ${key === "social" ? "Соцсфера" : key === "transport" ? "Транспорт" : key === "ecology" ? "Экология" : key === "safety" ? "Безопасность" : "Сервисы"}`, value: codes.reduce((sum, code) => sum + (indicators[code] ?? 0), 0) / codes.length }))
  return (
    <div
      className={`rounded-2xl border p-3 bg-slate-900/60 backdrop-blur transition-colors ${
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

      {(liveScore !== undefined || baseScore !== undefined) && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{(liveScore ?? baseScore ?? 0).toFixed(1)}</span>
          {liveScore !== undefined && baseScore !== undefined && <Delta value={liveScore - baseScore} />}
          {isWeakest && (
            <span className="rounded-full bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 font-medium">
              самый слабый район
            </span>
          )}
        </div>
      )}

      <div className="mt-2 h-36 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData} outerRadius="68%"><PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} /><Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.28} /><Tooltip formatter={(v) => Number(v).toFixed(1)} /></RadarChart></ResponsiveContainer>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
        {Object.entries(indicators).map(([code, value]) => (
          <div key={code} className="flex items-center gap-1.5" title={INDICATOR_LABELS[code]}>
            <span className="w-6 shrink-0 text-[10px] font-mono text-slate-500">{code}</span>
            <span className="w-8 shrink-0 text-right text-[10px] font-mono text-slate-400">
              {Math.round(value)}
            </span>
            {baseIndicators?.[code] !== undefined && <Delta value={value - baseIndicators[code]} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function Delta({ value }: { value: number }) {
  if (Math.abs(value) < 0.05) return null
  const positive = value > 0
  return <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`text-[10px] font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>{positive ? "▲" : "▼"} {Math.abs(value).toFixed(1)}</motion.span>
}
