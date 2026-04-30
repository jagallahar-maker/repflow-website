"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyVolumePoint } from "@/lib/coach-charts";

type Props = {
  data: WeeklyVolumePoint[];
};

function formatVolume(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

export default function WeeklyVolumeChart({ data }: Props) {
  const hasAnyVolume = data.some((d) => d.volume > 0);
  if (!hasAnyVolume) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        No strength workouts in the last 12 weeks.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="weekLabel"
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            tickLine={false}
            minTickGap={8}
          />
          <YAxis
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatVolume}
          />
          <Tooltip
            cursor={{ fill: "#27272a40" }}
            contentStyle={{
              backgroundColor: "#09090b",
              border: "1px solid #27272a",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a1a1aa" }}
            itemStyle={{ color: "#fff" }}
            formatter={(value, _name, props) => {
              const count =
                (props.payload as { workoutCount?: number } | undefined)
                  ?.workoutCount ?? 0;
              const v = typeof value === "number" ? value : 0;
              return [
                `${formatVolume(v)} lb (${count} workout${count === 1 ? "" : "s"})`,
                "Volume",
              ];
            }}
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Bar
            dataKey="volume"
            fill="#9EFD06"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}