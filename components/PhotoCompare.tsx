"use client";

import { useMemo, useState } from "react";
import type { SharedMediaItem } from "@/lib/coach-media-client";

/**
 * Side-by-side comparison of two shared progress photos, each labeled
 * with its date, pose and that day's 7-day trend weight. Defaults to the
 * oldest and newest photo of the newest photo's pose.
 */
export default function PhotoCompare({
  photos,
  trendByDay,
}: {
  photos: SharedMediaItem[];
  /** "YYYY-MM-DD" → 7-day trend weight (lb). */
  trendByDay: Record<string, number>;
}) {
  const sorted = useMemo(
    () =>
      [...photos].sort((a, b) =>
        (a.takenAt ?? a.createdAt ?? "").localeCompare(b.takenAt ?? b.createdAt ?? ""),
      ),
    [photos],
  );
  const newest = sorted[sorted.length - 1];
  const samePose = sorted.filter((p) => p.poseType === newest?.poseType);
  const [leftId, setLeftId] = useState(
    (samePose.length > 1 ? samePose[0] : sorted[0])?.id ?? "",
  );
  const [rightId, setRightId] = useState(newest?.id ?? "");

  if (sorted.length < 2) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
        Comparing needs at least two shared photos.
      </div>
    );
  }

  const left = sorted.find((p) => p.id === leftId) ?? sorted[0];
  const right = sorted.find((p) => p.id === rightId) ?? newest;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { item: left, id: leftId, set: setLeftId },
          { item: right, id: rightId, set: setRightId },
        ].map(({ item, id, set }, i) => (
          <div key={i} className="min-w-0">
            <select
              value={id}
              onChange={(e) => set(e.target.value)}
              className="w-full mb-2 rounded-lg bg-black border border-zinc-800 text-xs sm:text-sm px-2 py-1.5 text-white focus:border-zinc-600 focus:outline-none"
            >
              {sorted.map((p) => (
                <option key={p.id} value={p.id}>
                  {label(p)}
                </option>
              ))}
            </select>
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black border border-zinc-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.signedUrl}
                alt={item.poseType ?? "Progress photo"}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-2 text-xs sm:text-sm">
              <div className="font-semibold text-white">{label(item)}</div>
              <div className="text-[#9EFD06]">{trendLabel(item, trendByDay)}</div>
            </div>
          </div>
        ))}
      </div>
      <TrendDelta left={left} right={right} trendByDay={trendByDay} />
    </div>
  );
}

function dayOf(item: SharedMediaItem): string | null {
  const v = item.takenAt ?? item.createdAt;
  return v ? v.slice(0, 10) : null;
}

function label(item: SharedMediaItem): string {
  const d = dayOf(item);
  const date = d
    ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Unknown date";
  return `${date}${item.poseType ? ` · ${item.poseType}` : ""}`;
}

/** That day's trend, or the nearest earlier day within a week. */
function trendOf(item: SharedMediaItem, trendByDay: Record<string, number>): number | null {
  const d = dayOf(item);
  if (!d) return null;
  const t = Date.parse(`${d}T00:00:00Z`);
  for (let back = 0; back < 7; back++) {
    const key = new Date(t - back * 86400000).toISOString().slice(0, 10);
    if (trendByDay[key] != null) return trendByDay[key];
  }
  return null;
}

function trendLabel(item: SharedMediaItem, trendByDay: Record<string, number>): string {
  const t = trendOf(item, trendByDay);
  return t == null ? "No trend weight that week" : `Trend ${t.toFixed(1)} lb`;
}

function TrendDelta({
  left,
  right,
  trendByDay,
}: {
  left: SharedMediaItem;
  right: SharedMediaItem;
  trendByDay: Record<string, number>;
}) {
  const a = trendOf(left, trendByDay);
  const b = trendOf(right, trendByDay);
  const da = dayOf(left);
  const db = dayOf(right);
  if (a == null || b == null || !da || !db) return null;
  const days = Math.round((Date.parse(db) - Date.parse(da)) / 86400000);
  const diff = b - a;
  return (
    <div className="mt-3 text-xs text-zinc-400 text-center">
      {Math.abs(days)} days apart · trend {diff > 0 ? "+" : diff < 0 ? "−" : ""}
      {Math.abs(diff).toFixed(1)} lb
    </div>
  );
}
