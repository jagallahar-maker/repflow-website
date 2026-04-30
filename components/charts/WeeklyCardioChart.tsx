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
import type { WeeklyCardioPoint } from "@/lib/coach-charts";

type Props = {
  data: WeeklyCardioPoint[];
};

function formatMiles(value: number): string {
  if (value === 0) return "0";
  if (value < 1) return value.toFixed(1);
  return `${value.toFixed(1)}`;
}

export default function WeeklyCardioChart({ data }: Props) {
  const totalMiles = data.reduce((sum, d) => sum + d.miles, 0);
  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0);

  if (totalSessions === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        No cardio in the last 12 weeks.
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
            tickFormatter={(v) => `${v}mi`}
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
              const payload = props.payload as
                | {
                    sessions?: number;
                    durationMinutes?: number;
                  }
                | undefined;
              const sessions = payload?.sessions ?? 0;
              const minutes = payload?.durationMinutes ?? 0;
              const v = typeof value === "number" ? value : 0;
              return [
                `${formatMiles(v)} mi · ${sessions} session${
                  sessions === 1 ? "" : "s"
                } · ${minutes} min`,
                "Cardio",
              ];
            }}
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Bar
            dataKey="miles"
            fill="#60a5fa"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>
          Total: {totalMiles.toFixed(1)} mi · {totalSessions} session
          {totalSessions === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}