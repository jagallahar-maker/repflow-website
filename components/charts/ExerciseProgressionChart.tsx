"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExerciseOption, E1rmPoint } from "@/lib/coach-charts";

type Props = {
  exercises: ExerciseOption[];
  /**
   * Map of exerciseId → series. Pre-computed server-side so this client
   * component doesn't have to re-do session aggregation when the user
   * picks a different exercise from the dropdown.
   */
  seriesByExerciseId: Record<string, E1rmPoint[]>;
};

export default function ExerciseProgressionChart({
  exercises,
  seriesByExerciseId,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    exercises[0]?.exerciseId ?? "",
  );

  const selected = useMemo(
    () => exercises.find((e) => e.exerciseId === selectedId),
    [exercises, selectedId],
  );
  const series = seriesByExerciseId[selectedId] ?? [];

  if (exercises.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-zinc-500 px-4 text-center">
        No strength exercises logged yet.
      </div>
    );
  }

  // Compute display stats from the series.
  const bestE1rm =
    series.length > 0 ? Math.max(...series.map((p) => p.e1rm)) : 0;
  const startE1rm = series.length > 0 ? series[0].e1rm : 0;
  const endE1rm = series.length > 0 ? series[series.length - 1].e1rm : 0;
  const delta = endE1rm - startE1rm;
  const deltaPct =
    startE1rm > 0 ? Math.round((delta / startE1rm) * 100) : 0;

  // Y-axis padding for visual breathing room.
  const yValues = series.map((p) => p.e1rm);
  const minY = yValues.length > 0 ? Math.min(...yValues) : 0;
  const maxY = yValues.length > 0 ? Math.max(...yValues) : 100;
  const padding = Math.max(5, (maxY - minY) * 0.15);
  const yMin = Math.floor(minY - padding);
  const yMax = Math.ceil(maxY + padding);

  return (
    <div className="w-full">
      {/* Picker + summary row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg bg-zinc-950 border border-zinc-800 text-sm px-3 py-2 text-white focus:border-zinc-600 focus:outline-none"
        >
          {exercises.map((ex) => (
            <option key={ex.exerciseId} value={ex.exerciseId}>
              {ex.exerciseName} ({ex.appearances})
            </option>
          ))}
        </select>

        {selected && series.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-zinc-400 ml-auto flex-wrap">
            <Stat label="Best e1RM" value={`${bestE1rm} lb`} />
            <Stat label="Sessions" value={`${series.length}`} />
            <Stat
              label="Trend"
              value={
                series.length >= 2
                  ? `${delta >= 0 ? "+" : ""}${delta} lb (${
                      deltaPct >= 0 ? "+" : ""
                    }${deltaPct}%)`
                  : "—"
              }
              tone={
                series.length < 2
                  ? "neutral"
                  : delta >= 0
                    ? "positive"
                    : "negative"
              }
            />
          </div>
        )}
      </div>

      {/* Chart */}
      {series.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
          No data for this exercise in the last 90 days.
        </div>
      ) : series.length === 1 ? (
        <div className="h-64 flex flex-col items-center justify-center text-sm text-zinc-500 gap-2">
          <div>Only one session logged in the last 90 days.</div>
          <div className="text-xs">
            {series[0].dateLabel}: {series[0].topWeight} lb × {series[0].topReps} reps
            (e1RM {series[0].e1rm})
          </div>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={series}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[yMin, yMax]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#a1a1aa" }}
                itemStyle={{ color: "#fff" }}
                formatter={(value, _name, props) => {
                  const payload = props.payload as
                    | { topWeight?: number; topReps?: number }
                    | undefined;
                  const w = payload?.topWeight ?? 0;
                  const r = payload?.topReps ?? 0;
                  return [
                    `${value} lb (${w} × ${r})`,
                    "e1RM",
                  ];
                }}
              />
              <Line
                type="monotone"
                dataKey="e1rm"
                stroke="#9EFD06"
                strokeWidth={2}
                dot={{ fill: "#9EFD06", r: 3 }}
                activeDot={{ r: 5, fill: "#ffffff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueColor =
    tone === "positive"
      ? "text-lime-400"
      : tone === "negative"
        ? "text-red-400"
        : "text-white";
  return (
    <div className="flex flex-col">
      <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}