"use client";

import { useState } from "react";
import type { HeatmapWeek } from "@/lib/coach-charts";

type Props = {
  weeks: HeatmapWeek[];
};

const CELL_SIZE = 14;
const CELL_GAP = 4;
const COL_WIDTH = CELL_SIZE + CELL_GAP;
const ROW_HEIGHT = CELL_SIZE + CELL_GAP;

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]; // sparse like GitHub
const DAY_LABEL_WIDTH = 32;
const MONTH_LABEL_HEIGHT = 18;

// Suppress a month label if it would render within this many columns of
// the previous one (avoids "JanFeb" overlap when February is the very
// next column after January's label).
const MIN_COLUMNS_BETWEEN_MONTH_LABELS = 3;

function colorForCount(count: number, outOfRange: boolean): string {
  if (outOfRange) return "transparent";
  if (count <= 0) return "#18181b"; // zinc-900 — base "no activity"
  if (count === 1) return "#365314"; // dark lime
  if (count === 2) return "#65a30d"; // mid lime
  if (count === 3) return "#9EFD06"; // brand bright
  return "#bef264"; // 4+
}

type HoveredCell = {
  date: string;
  count: number;
  strength: number;
  cardio: number;
  x: number;
  y: number;
};

export default function ActivityHeatmap({ weeks }: Props) {
  const [hovered, setHovered] = useState<HoveredCell | null>(null);

  if (weeks.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-zinc-500">
        No activity in the last 90 days.
      </div>
    );
  }

  const gridWidth = weeks.length * COL_WIDTH;
  const gridHeight = 7 * ROW_HEIGHT;

  const totalSessions = weeks.reduce(
    (sum, w) => sum + w.cells.reduce((s, c) => s + c.count, 0),
    0,
  );
  const activeDays = weeks.reduce(
    (sum, w) => sum + w.cells.filter((c) => c.count > 0).length,
    0,
  );

  // Decide which month labels to actually render. We skip a label if it
  // would land too close to the previous rendered label.
  const renderedMonthLabels: { colIdx: number; label: string }[] = [];
  let lastRenderedCol = -Infinity;
  weeks.forEach((week, colIdx) => {
    if (!week.monthLabel) return;
    if (colIdx - lastRenderedCol < MIN_COLUMNS_BETWEEN_MONTH_LABELS) return;
    renderedMonthLabels.push({ colIdx, label: week.monthLabel });
    lastRenderedCol = colIdx;
  });

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs text-zinc-500">
          {activeDays} active day{activeDays === 1 ? "" : "s"} ·{" "}
          {totalSessions} session{totalSessions === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-sm"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: colorForCount(n, false),
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          width={DAY_LABEL_WIDTH + gridWidth}
          height={MONTH_LABEL_HEIGHT + gridHeight}
          className="block"
        >
          {/* Day-of-week labels */}
          {DAY_LABELS.map((label, idx) =>
            label ? (
              <text
                key={`day-${idx}`}
                x={0}
                y={MONTH_LABEL_HEIGHT + idx * ROW_HEIGHT + CELL_SIZE - 2}
                fontSize={11}
                fill="#71717a"
              >
                {label}
              </text>
            ) : null,
          )}

          {/* Month labels (only those that survived spacing filter) */}
          {renderedMonthLabels.map(({ colIdx, label }) => (
            <text
              key={`month-${colIdx}`}
              x={DAY_LABEL_WIDTH + colIdx * COL_WIDTH}
              y={MONTH_LABEL_HEIGHT - 4}
              fontSize={11}
              fill="#a1a1aa"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, colIdx) =>
            week.cells.map((cell, rowIdx) => {
              const x = DAY_LABEL_WIDTH + colIdx * COL_WIDTH;
              const y = MONTH_LABEL_HEIGHT + rowIdx * ROW_HEIGHT;
              const fill = colorForCount(cell.count, cell.outOfRange);
              return (
                <rect
                  key={`${colIdx}-${rowIdx}`}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  ry={2}
                  fill={fill}
                  stroke={cell.outOfRange ? "transparent" : "#27272a"}
                  strokeWidth={cell.outOfRange ? 0 : 0.5}
                  onMouseEnter={() =>
                    !cell.outOfRange &&
                    setHovered({
                      date: cell.date,
                      count: cell.count,
                      strength: cell.strength,
                      cardio: cell.cardio,
                      x: x + CELL_SIZE / 2,
                      y,
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    cursor: cell.outOfRange ? "default" : "pointer",
                  }}
                />
              );
            }),
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs shadow-lg"
            style={{
              left: hovered.x,
              top: hovered.y - 8,
              transform: "translate(-50%, -100%)",
              whiteSpace: "nowrap",
            }}
          >
            <div className="font-semibold text-white">
              {formatTooltipDate(hovered.date)}
            </div>
            <div className="mt-1 text-zinc-400">
              {hovered.count === 0
                ? "No activity"
                : `${hovered.count} session${hovered.count === 1 ? "" : "s"}`}
            </div>
            {hovered.count > 0 && (
              <div className="mt-0.5 text-zinc-500">
                {hovered.strength} strength · {hovered.cardio} cardio
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTooltipDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  if (!y || !m || !d) return yyyymmdd;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}