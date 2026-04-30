"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightPoint } from "@/lib/coach-charts";

type Props = {
  data: WeightPoint[];
  goalWeight?: number | null;
};

export default function BodyweightChart({ data, goalWeight }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        No bodyweight logs in the last 90 days.
      </div>
    );
  }

  // Compute Y-axis domain with a little padding so the line isn't clipped.
  const weights = data.map((d) => d.weight);
  const goalNumber = typeof goalWeight === "number" ? goalWeight : null;
  if (goalNumber != null) weights.push(goalNumber);

  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const padding = Math.max(2, (maxW - minW) * 0.15);
  const yMin = Math.floor(minW - padding);
  const yMax = Math.ceil(maxW + padding);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
            tickFormatter={(v) => `${v}`}
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
            formatter={(value) => [`${value} lb`, "Weight"]}
          />
          {goalNumber != null && (
            <ReferenceLine
              y={goalNumber}
              stroke="#9EFD06"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Goal: ${goalNumber} lb`,
                position: "insideTopRight",
                fill: "#9EFD06",
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#ffffff"
            strokeWidth={2}
            dot={{ fill: "#ffffff", r: 3 }}
            activeDot={{ r: 5, fill: "#9EFD06" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}