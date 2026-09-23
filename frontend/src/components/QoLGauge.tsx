import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useState } from "react"

const SIZE = 220
const STROKE = 16
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreColor(score: number): string {
  if (score < 45) return "#ef4444"
  if (score < 60) return "#f59e0b"
  return "#34d399"
}

export function QoLGauge({ score, baseScore }: { score: number; baseScore: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  const progress = useMotionValue(0)
  const [display, setDisplay] = useState(0)
  const dashOffset = useTransform(progress, (v) => CIRCUMFERENCE * (1 - v / 100))

  useEffect(() => {
    const controls = animate(progress, clamped, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [clamped, progress])

  const delta = score - baseScore
  const deltaLabel = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`

  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#1e293b"
          strokeWidth={STROKE}
          fill="none"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={scoreColor(clamped)}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="-mt-[130px] flex flex-col items-center">
        <span className="text-4xl font-bold text-white tabular-nums">{display.toFixed(1)}</span>
        <span className="text-xs text-slate-400 mt-1">Astana QoL Score</span>
      </div>
      <div className="mt-2 text-sm">
        <span className="text-slate-500">база {baseScore.toFixed(2)} · </span>
        <span className={delta >= 0 ? "text-emerald-400" : "text-red-400"}>{deltaLabel}</span>
      </div>
    </div>
  )
}
