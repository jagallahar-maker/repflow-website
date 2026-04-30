"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyCountPoint } from "@/lib/coach-charts";

type Props = {
  data: WeeklyCountPoint[];
};

export default function WeeklyWorkoutCountChart({ data }: Props) {
  const hasAny = data.some((d) => d.total > 0);
  if (!hasAny) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        No workouts in the last 12 weeks.
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
            allowDecimals={false}
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
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
            iconType="circle"
          />
          <Bar
            dataKey="strength"
            stackId="a"
            fill="#9EFD06"
            name="Strength"
            radius={[0, 0, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="cardio"
            stackId="a"
            fill="#60a5fa"
            name="Cardio"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}