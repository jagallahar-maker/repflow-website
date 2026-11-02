"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDay, formatDayShort } from "@/lib/trend.ts";

/**
 * Web port of the app's interactive weight chart (app/lib/widgets/
 * trend_chart.dart): ranges 30D / 90D / 6M / 1Y / All (remembered in this
 * browser), raw weigh-ins as dots (one weekly average dot on 1Y / All),
 * the 7-day trend as a line with gaps where there's no data, a dashed
 * goal line, and a hover / touch-drag readout.
 */

/** [day, weigh-in or null, weigh-in count, 7-day trend or null], oldest first. */
export type TrendDay = [number, number | null, number, number | null];

const RANGES = [
  { key: "30D", days: 30 },
  { key: "90D", days: 90 },
  { key: "6M", days: 182 },
  { key: "1Y", days: 365 },
  { key: "All", days: null },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const LIME = "#9EFD06";
const STORAGE_KEY = "coach_weight_chart_range";

type Row = {
  x: number;
  trend: number | null;
  dot: number | null;
  weighIn: number | null;
  count: number;
};

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readSavedRange(key: string): RangeKey | null {
  try {
    const v = localStorage.getItem(key);
    return RANGES.some((r) => r.key === v) ? (v as RangeKey) : null;
  } catch {
    return null;
  }
}

function niceInterval(range: number): number {
  if (range <= 3) return 0.5;
  if (range <= 6) return 1;
  if (range <= 12) return 2;
  if (range <= 30) return 5;
  if (range <= 60) return 10;
  return 20;
}

export default function WeightTrendChart({
  days,
  goal,
  today,
  unit = "lb",
  pointLabel = "weigh-ins",
  storageKey = STORAGE_KEY,
}: {
  days: TrendDay[];
  goal: number | null;
  today: number;
  /** "lb" for weight, "in" for measurement sites. */
  unit?: string;
  /** Legend for the dots: "weigh-ins" or "entries". */
  pointLabel?: string;
  /** Remembered range (localStorage), one per chart kind. */
  storageKey?: string;
}) {
  const one = pointLabel === "weigh-ins" ? "weigh-in" : "entry";
  // Last choice from this browser (null on the server and when unset).
  const saved = useSyncExternalStore(
    subscribeStorage,
    () => readSavedRange(storageKey),
    () => null,
  );
  const [picked, setPicked] = useState<RangeKey | null>(null);
  const range: RangeKey = picked ?? saved ?? "30D";

  function choose(key: RangeKey) {
    setPicked(key);
    try {
      localStorage.setItem(storageKey, key);
    } catch {
      // ignore
    }
  }

  const view = useMemo(() => {
    if (days.length === 0) return null;
    const spec = RANGES.find((r) => r.key === range)!;
    const start = spec.days == null ? days[0][0] : today - (spec.days - 1);
    const weekly = range === "1Y" || range === "All";
    const visible = days.filter((d) => d[0] >= start && d[0] <= today);

    // Dots: each day's weigh-in, or one weekly average on long ranges.
    const dotByDay = new Map<number, number>();
    if (weekly) {
      const weeks = new Map<number, { xs: number[]; ys: number[] }>();
      for (const [day, w] of visible) {
        if (w == null) continue;
        const k = Math.floor((day - start) / 7);
        const wk = weeks.get(k) ?? { xs: [], ys: [] };
        wk.xs.push(day);
        wk.ys.push(w);
        weeks.set(k, wk);
      }
      for (const { xs, ys } of weeks.values()) {
        const x = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
        dotByDay.set(x, ys.reduce((a, b) => a + b, 0) / ys.length);
      }
    } else {
      for (const [day, w] of visible) if (w != null) dotByDay.set(day, w);
    }

    const rows: Row[] = visible.map(([x, weighIn, count, trend]) => ({
      x,
      trend,
      dot: dotByDay.get(x) ?? null,
      weighIn,
      count,
    }));

    const values = rows.flatMap((r) => [r.dot, r.trend]).filter((v): v is number => v != null);
    if (values.length === 0) {
      const lastTrend = [...days].reverse().find((d) => d[3] != null)?.[3];
      if (lastTrend != null) values.push(lastTrend);
    }
    if (values.length === 0) return { rows, start, weekly, empty: true as const };
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    const span = Math.max(hi - lo, 5);
    const goalVisible = goal != null && goal >= lo - span && goal <= hi + span;
    if (goalVisible) {
      lo = Math.min(lo, goal!);
      hi = Math.max(hi, goal!);
    }
    const pad = Math.max((hi - lo) * 0.12, 1);
    const interval = niceInterval(hi - lo + 2 * pad);
    const minY = Math.floor((lo - pad) / interval) * interval;
    const maxY = Math.ceil((hi + pad) / interval) * interval;

    const withTrend = rows.filter((r) => r.trend != null);
    const first = withTrend[0];
    const last = withTrend[withTrend.length - 1];
    const change = first && last ? last.trend! - first.trend! : null;
    const weeks = first && last ? (last.x - first.x) / 7 : 0;
    return {
      rows,
      start,
      weekly,
      empty: false as const,
      minY,
      maxY,
      interval,
      goalVisible,
      summary: {
        start: first?.trend ?? null,
        end: last?.trend ?? null,
        change,
        perWeek: change != null && weeks >= 1 ? change / weeks : null,
      },
    };
  }, [days, range, today, goal]);

  const longAxis = view != null && today - view.start > 200;
  const signed = (v: number, d: number) =>
    `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}`;

  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => choose(r.key)}
            className={`flex-1 sm:flex-none text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              r.key === range
                ? "border-[#9EFD06] text-[#9EFD06] bg-[#9EFD06]/10"
                : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
            }`}
          >
            {r.key}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: LIME, opacity: 0.45 }} />
          {view?.weekly ? "weekly avg" : pointLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5" style={{ background: LIME }} />
          7-day trend
        </span>
        {goal != null && (
          <span>
            {view && !view.empty && !view.goalVisible
              ? `Goal ${goal.toFixed(1)} ${unit} (off chart)`
              : "- - goal"}
          </span>
        )}
        <span className="text-zinc-600">Hover or drag to read a day</span>
      </div>

      <div className="h-64 sm:h-72">
        {!view || view.empty ? (
          <div className="h-full flex items-center justify-center text-sm text-zinc-500">
            No {pointLabel} yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={view.rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="x"
                type="number"
                domain={[view.start, today]}
                tickCount={4}
                tickFormatter={(v: number) => formatDayShort(v, longAxis)}
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                domain={[view.minY, view.maxY]}
                ticks={Array.from(
                  { length: Math.round((view.maxY - view.minY) / view.interval) + 1 },
                  (_, i) => view.minY + i * view.interval,
                )}
                tickFormatter={(v: number) => v.toFixed(view.interval < 1 ? 1 : 0)}
                width={40}
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              {goal != null && view.goalVisible && (
                <ReferenceLine
                  y={goal}
                  stroke={LIME}
                  strokeOpacity={0.6}
                  strokeDasharray="6 4"
                  label={{
                    value: `Goal ${goal.toFixed(1)}`,
                    position: "insideTopLeft",
                    fill: LIME,
                    fontSize: 11,
                  }}
                />
              )}
              <Tooltip
                isAnimationActive={false}
                cursor={{ stroke: "#a1a1aa", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const row = (payload?.[0]?.payload ?? null) as Row | null;
                  if (!active || !row) return null;
                  return (
                    <div className="rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-xs shadow-lg">
                      <div className="font-semibold text-white">{formatDay(row.x)}</div>
                      <div className="text-zinc-300">
                        {row.weighIn == null
                          ? `No ${one}`
                          : `${row.count > 1 ? `Avg of ${row.count}` : one[0].toUpperCase() + one.slice(1)} ${row.weighIn.toFixed(1)} ${unit}`}
                      </div>
                      <div style={{ color: LIME }}>
                        {row.trend == null ? "No trend" : `Trend ${row.trend.toFixed(1)} ${unit}`}
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                dataKey="dot"
                stroke="none"
                isAnimationActive={false}
                activeDot={false}
                legendType="none"
                dot={(props: { cx?: number; cy?: number; index?: number; payload?: Row }) =>
                  props.payload?.dot == null || props.cx == null || props.cy == null ? (
                    <g key={`d${props.index}`} />
                  ) : (
                    <circle
                      key={`d${props.index}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={view.weekly ? 3 : 3.5}
                      fill={LIME}
                      fillOpacity={0.45}
                    />
                  )
                }
              />
              <Line
                dataKey="trend"
                stroke={LIME}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                activeDot={{ r: 5, fill: LIME, stroke: "#000", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {view && !view.empty && (
        <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
          {[
            ["Start", view.summary.start != null ? `${view.summary.start.toFixed(1)} ${unit}` : "—"],
            ["End", view.summary.end != null ? `${view.summary.end.toFixed(1)} ${unit}` : "—"],
            ["Change", view.summary.change != null ? `${signed(view.summary.change, 1)} ${unit}` : "—"],
            ["Per week", view.summary.perWeek != null ? `${signed(view.summary.perWeek, 2)} ${unit}` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <div className="text-[11px] text-zinc-500">{label}</div>
              <div className="font-semibold truncate">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
