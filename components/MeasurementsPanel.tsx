"use client";

import { useState } from "react";
import WeightTrendChart, { type TrendDay } from "@/components/charts/WeightTrendChart";

export type MeasurementSite = {
  key: string;
  name: string;
  /** Latest value (in), or null if never logged. */
  latest: number | null;
  /** Latest minus first entry (in), or null with fewer than 2 entries. */
  sinceStart: number | null;
  entries: number;
  lastDay: string | null;
  days: TrendDay[];
};

/**
 * Body measurements from users/{uid}/body_measurements: every site with
 * its latest value and change since the first entry (neutral: bigger
 * isn't better for every site), and the trend chart for the chosen site.
 */
export default function MeasurementsPanel({
  sites,
  today,
}: {
  sites: MeasurementSite[];
  today: number;
}) {
  const logged = sites.filter((s) => s.entries > 0);
  const [selected, setSelected] = useState(
    [...logged].sort((a, b) => b.entries - a.entries)[0]?.key ?? "",
  );
  const site = sites.find((s) => s.key === selected);

  if (logged.length === 0) {
    return <p className="text-sm text-zinc-500">No measurements logged yet.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <th className="py-1.5 font-medium">Site</th>
              <th className="py-1.5 font-medium text-right">Latest</th>
              <th className="py-1.5 font-medium text-right">Since start</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {sites.map((s) => (
              <tr
                key={s.key}
                onClick={() => s.entries > 0 && setSelected(s.key)}
                className={`${s.entries > 0 ? "cursor-pointer hover:bg-zinc-900" : "text-zinc-600"} ${
                  s.key === selected ? "bg-zinc-900" : ""
                }`}
              >
                <td className="py-2 pr-2 whitespace-nowrap">
                  {s.name}
                  {s.entries > 0 && (
                    <span className="ml-1.5 text-xs text-zinc-500">({s.entries})</span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {s.latest != null ? `${s.latest.toFixed(1)} in` : "—"}
                </td>
                <td className="py-2 text-right tabular-nums text-zinc-300">
                  {s.sinceStart == null
                    ? "—"
                    : `${s.sinceStart > 0 ? "+" : s.sinceStart < 0 ? "−" : ""}${Math.abs(s.sinceStart).toFixed(1)} in`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:col-span-3 min-w-0">
        {site && (
          <>
            <div className="text-sm font-semibold mb-2">
              {site.name}
              {site.lastDay && (
                <span className="ml-2 text-xs font-normal text-zinc-500">last {site.lastDay}</span>
              )}
            </div>
            <WeightTrendChart
              key={site.key}
              days={site.days}
              goal={null}
              today={today}
              unit="in"
              pointLabel="entries"
              storageKey="coach_measurement_chart_range"
            />
          </>
        )}
      </div>
    </div>
  );
}
