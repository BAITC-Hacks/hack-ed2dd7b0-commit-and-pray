import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
} from "framer-motion";
import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  DIRECTION_ICONS,
  DIRECTION_LABELS,
  INDICATOR_LABELS,
  type DirectionKey,
  type District,
  type DistrictPreview,
} from "../types";

const groups: Array<[DirectionKey, string[]]> = [
  ["transport", ["T1", "T2"]],
  ["ecology", ["E1", "E2"]],
  ["social", ["S1", "S2"]],
  ["safety", ["B1", "B2"]],
  ["services", ["C1", "C2"]],
];

function directionAverage(
  indicators: Record<string, number>,
  codes: string[],
): number {
  return (
    codes.reduce((sum, code) => sum + (indicators[code] ?? 0), 0) / codes.length
  );
}

export function DistrictCard({
  district,
  liveIndicators,
  liveScore,
  baseIndicators,
  isWeakest,
  preview,
}: {
  district: District;
  liveIndicators?: Record<string, number>;
  liveScore?: number;
  baseIndicators?: Record<string, number>;
  isWeakest?: boolean;
  preview?: DistrictPreview;
}) {
  const indicators =
    preview?.indicators ?? liveIndicators ?? district.indicators;
  const compareIndicators = preview
    ? preview.beforeIndicators
    : liveIndicators
      ? baseIndicators
      : undefined;
  const shownScore = preview ? preview.score : liveScore;

  const progress = useMotionValue(0);
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    if (shownScore === undefined) return;
    if (preview) progress.jump(preview.beforeScore);
    const controls = animate(progress, shownScore, {
      duration: preview ? 0.45 : 0.8,
      ease: "easeOut",
      onUpdate: setDisplayScore,
    });
    return () => controls.stop();
  }, [shownScore, progress, preview]);

  const radarData = groups.map(([key, codes]) => ({
    subject: `${DIRECTION_ICONS[key]} ${DIRECTION_LABELS[key]}`,
    value: directionAverage(indicators, codes),
    before: compareIndicators
      ? directionAverage(compareIndicators, codes)
      : undefined,
  }));

  return (
    <motion.div
      initial={false}
      animate={{
        scale: preview ? 1.02 : 1,
        boxShadow: preview
          ? "0 0 0 2px rgba(139,92,246,0.7), 0 0 28px rgba(139,92,246,0.35)"
          : isWeakest
            ? "0 0 0 1px rgba(239,68,68,0.4)"
            : "0 0 0 0px rgba(139,92,246,0)",
      }}
      transition={{ duration: 0.25 }}
      className={`relative rounded-2xl border p-3 bg-slate-900/60 backdrop-blur transition-colors ${
        preview
          ? "border-violet-500/80"
          : isWeakest
            ? "border-red-500/70"
            : "border-slate-700/70"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-100">
          {district.name}
        </h3>
        <span className="text-xs text-slate-400">
          {Math.round(district.population_share * 100)}% населения
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400 leading-snug">
        {district.profile}
      </p>

      <AnimatePresence>
        {preview && (
          <motion.div
            key={preview.measureId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-medium text-violet-200"
          >
            {preview.added
              ? `Если добавить ${preview.measureId}`
              : `Эффект ${preview.measureId}`}
          </motion.div>
        )}
      </AnimatePresence>

      {shownScore !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-white tabular-nums">
            {displayScore.toFixed(1)}
          </span>
          {preview && <Delta value={preview.score - preview.beforeScore} />}
          {isWeakest && !preview && (
            <span className="rounded-full bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 font-medium">
              самый слабый район
            </span>
          )}
        </div>
      )}

      <div className="mt-2 h-36 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="68%">
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {compareIndicators && (
              <Radar
                dataKey="before"
                stroke="#94a3b8"
                strokeDasharray="4 3"
                fill="transparent"
                isAnimationActive={false}
              />
            )}
            <Radar
              dataKey="value"
              stroke={preview ? "#a78bfa" : "#8b5cf6"}
              fill={preview ? "#a78bfa" : "#8b5cf6"}
              fillOpacity={preview ? 0.4 : 0.28}
              animationDuration={400}
            />
            <Tooltip
              formatter={(v, name) => [
                Number(v).toFixed(1),
                name === "before" ? "до" : "сейчас",
              ]}
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-[10px] text-slate-500">
        Шкала 0–100: чем больше фигура, тем лучше
        {compareIndicators && " · пунктир — до изменений"}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
        {Object.entries(indicators).map(([code, value]) => {
          const before = compareIndicators?.[code];
          const changed =
            before !== undefined && Math.abs(value - before) >= 0.05;
          return (
            <div
              key={code}
              className={`flex items-center gap-1.5 rounded px-1 transition-colors ${
                changed && preview ? "bg-violet-500/15" : ""
              }`}
              title={INDICATOR_LABELS[code]}
            >
              <span className="w-6 shrink-0 font-mono text-slate-500">
                {code}
              </span>
              <span className="w-8 shrink-0 text-right font-mono text-slate-300">
                {Math.round(value)}
              </span>
              {before !== undefined && <Delta value={value - before} />}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function Delta({ value }: { value: number }) {
  if (Math.abs(value) < 0.05) return null;
  const positive = value > 0;
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-[10px] font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}
    >
      {positive ? "▲" : "▼"} {Math.abs(value).toFixed(1)}
    </motion.span>
  );
}
