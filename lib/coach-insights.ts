/**
 * Workout insights for the coach portal, computed from the client's
 * activity_sessions (the strength sessions carry exercises + sets).
 * Pure functions (no Firestore) so tests/insights.test.mjs can run them.
 *
 * PR rules follow app/lib/services/pr_calculator.dart: a lift record is
 * per exercise and rep count (heavier weight beats it); a timed hold is
 * per exercise and added weight (longer beats it). e1RM uses Epley
 * (weight × (1 + reps / 30)), the formula the app's progression charts
 * use.
 */
import { dayFromStored, mondayOf, type DayNum } from "./trend.ts";

export type SetDoc = {
  setNumber?: number;
  reps?: number;
  weightLb?: number;
  isCompleted?: boolean;
  durationSeconds?: number | null;
};

export type ExerciseDoc = {
  exerciseId?: string;
  exerciseName?: string;
  primaryMuscleGroup?: string;
  equipment?: string;
  sets?: SetDoc[];
};

export type SessionDoc = {
  id?: string;
  startTime?: string;
  createdAt?: string;
  category?: string;
  completed?: boolean;
  isBackdated?: boolean;
  workoutName?: string | null;
  activityType?: string;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  calories?: number | null;
  totalSets?: number | null;
  totalVolume?: number | null;
  exercises?: ExerciseDoc[] | null;
};

export const MUSCLE_GROUPS = ["chest", "back", "legs", "shoulders", "arms", "core"];

export function sessionDay(s: SessionDoc): DayNum | null {
  return dayFromStored(s.startTime ?? s.createdAt);
}

/** Same formula as the app (lib/utils/one_rep_max.dart). */
export function epley(weightLb: number, reps: number): number {
  if (weightLb <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightLb;
  return weightLb * (1 + reps / 30);
}

/** "1:05" for timed holds. */
export function formatHold(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function isHoldSet(set: SetDoc): boolean {
  return (set.durationSeconds ?? 0) > 0;
}

/** A completed set that counts (a lift with reps, or a hold with time). */
function isWorkingSet(set: SetDoc): boolean {
  if (!set.isCompleted) return false;
  return isHoldSet(set) || (set.reps ?? 0) > 0;
}

/** Completed sessions, oldest first. */
function completedChronological(sessions: SessionDoc[]): (SessionDoc & { day: DayNum })[] {
  return sessions
    .filter((s) => s.completed)
    .map((s) => ({ ...s, day: sessionDay(s) }))
    .filter((s): s is SessionDoc & { day: DayNum } => s.day != null)
    .sort((a, b) => a.day - b.day || (a.startTime ?? "").localeCompare(b.startTime ?? ""));
}

// ── Workout counts ────────────────────────────────────────────────────────

export function lastWorkoutDay(sessions: SessionDoc[]): DayNum | null {
  let last: DayNum | null = null;
  for (const s of sessions) {
    if (!s.completed) continue;
    const d = sessionDay(s);
    if (d != null && (last == null || d > last)) last = d;
  }
  return last;
}

/** Completed workouts this week (Mon–today) and the average of the 4 weeks before. */
export function weeklyWorkoutStats(
  sessions: SessionDoc[],
  today: DayNum,
): { thisWeek: number; avgPrev4: number } {
  const monday = mondayOf(today);
  let thisWeek = 0;
  let prev = 0;
  for (const s of sessions) {
    if (!s.completed) continue;
    const d = sessionDay(s);
    if (d == null) continue;
    if (d >= monday && d <= today) thisWeek++;
    else if (d >= monday - 28 && d < monday) prev++;
  }
  return { thisWeek, avgPrev4: prev / 4 };
}

// ── PRs ───────────────────────────────────────────────────────────────────

export type PrEvent = {
  exerciseId: string;
  exerciseName: string;
  day: DayNum;
  kind: "lift" | "hold";
  weightLb: number;
  reps: number;
  durationSeconds: number;
  /** The record it beat. */
  previous: { weightLb: number; reps: number; durationSeconds: number; day: DayNum };
};

/**
 * Every time a set beat an earlier record for the same key, oldest first.
 * First-ever sets for a key set the baseline but aren't listed (they'd
 * make every new rep count look like a PR).
 */
export function prEvents(sessions: SessionDoc[]): PrEvent[] {
  const best = new Map<string, { weightLb: number; reps: number; durationSeconds: number; day: DayNum }>();
  const events: PrEvent[] = [];
  for (const s of completedChronological(sessions)) {
    if (s.category !== "strength") continue;
    for (const ex of s.exercises ?? []) {
      const id = ex.exerciseId;
      if (!id) continue;
      const name = ex.exerciseName ?? id;
      // Best of this session per key, so several sets don't each count.
      const sessionBest = new Map<string, { weightLb: number; reps: number; durationSeconds: number; kind: "lift" | "hold" }>();
      for (const set of ex.sets ?? []) {
        if (!set.isCompleted) continue;
        const w = set.weightLb ?? 0;
        if (isHoldSet(set)) {
          const key = `${id}_t${w.toFixed(1)}`;
          const cur = sessionBest.get(key);
          if (!cur || set.durationSeconds! > cur.durationSeconds) {
            sessionBest.set(key, { weightLb: w, reps: 0, durationSeconds: set.durationSeconds!, kind: "hold" });
          }
        } else {
          const reps = set.reps ?? 0;
          if (w <= 0 || reps <= 0) continue;
          const key = `${id}_${reps}`;
          const cur = sessionBest.get(key);
          if (!cur || w > cur.weightLb) {
            sessionBest.set(key, { weightLb: w, reps, durationSeconds: 0, kind: "lift" });
          }
        }
      }
      for (const [key, rec] of sessionBest) {
        const prev = best.get(key);
        const beats = prev
          ? rec.kind === "hold"
            ? rec.durationSeconds > prev.durationSeconds
            : rec.weightLb > prev.weightLb
          : false;
        if (beats && prev) {
          events.push({
            exerciseId: id,
            exerciseName: name,
            day: s.day,
            kind: rec.kind,
            weightLb: rec.weightLb,
            reps: rec.reps,
            durationSeconds: rec.durationSeconds,
            previous: prev,
          });
        }
        if (!prev || beats) {
          best.set(key, { weightLb: rec.weightLb, reps: rec.reps, durationSeconds: rec.durationSeconds, day: s.day });
        }
      }
    }
  }
  return events;
}

export type BestLift = {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroup: string | null;
  sessions: number;
  lastDay: DayNum;
  /** Heaviest completed set (more reps breaks a tie). */
  heaviest: { weightLb: number; reps: number; day: DayNum } | null;
  bestE1rm: { value: number; weightLb: number; reps: number; day: DayNum } | null;
  longestHold: { durationSeconds: number; weightLb: number; day: DayNum } | null;
};

/** Best lifts for the most-trained exercises, most sessions first. */
export function bestLifts(sessions: SessionDoc[], limit = 8): BestLift[] {
  const byId = new Map<string, BestLift>();
  for (const s of completedChronological(sessions)) {
    if (s.category !== "strength") continue;
    for (const ex of s.exercises ?? []) {
      const id = ex.exerciseId;
      if (!id) continue;
      const working = (ex.sets ?? []).filter(isWorkingSet);
      if (working.length === 0) continue;
      let b = byId.get(id);
      if (!b) {
        b = {
          exerciseId: id,
          exerciseName: ex.exerciseName ?? id,
          primaryMuscleGroup: ex.primaryMuscleGroup ?? null,
          sessions: 0,
          lastDay: s.day,
          heaviest: null,
          bestE1rm: null,
          longestHold: null,
        };
        byId.set(id, b);
      }
      b.sessions++;
      b.lastDay = s.day;
      for (const set of working) {
        const w = set.weightLb ?? 0;
        if (isHoldSet(set)) {
          const t = set.durationSeconds!;
          if (!b.longestHold || t > b.longestHold.durationSeconds) {
            b.longestHold = { durationSeconds: t, weightLb: w, day: s.day };
          }
          continue;
        }
        const reps = set.reps ?? 0;
        if (w <= 0) continue;
        if (
          !b.heaviest ||
          w > b.heaviest.weightLb ||
          (w === b.heaviest.weightLb && reps > b.heaviest.reps)
        ) {
          b.heaviest = { weightLb: w, reps, day: s.day };
        }
        const e = epley(w, reps);
        if (!b.bestE1rm || e > b.bestE1rm.value) {
          b.bestE1rm = { value: e, weightLb: w, reps, day: s.day };
        }
      }
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.sessions - a.sessions || b.lastDay - a.lastDay)
    .slice(0, limit);
}

// ── Muscle balance ────────────────────────────────────────────────────────

export type MuscleBalanceRow = {
  group: string;
  /** Completed sets per week, oldest week first. */
  weekly: number[];
  avg: number;
  flag: "low" | "high" | null;
};

/**
 * Completed working sets per primary muscle group for the last [weeks]
 * weeks (this week included, oldest first). A group is flagged "low"
 * below half the median group and "high" above twice it.
 */
export function muscleBalance(
  sessions: SessionDoc[],
  today: DayNum,
  weeks = 4,
): { weekStarts: DayNum[]; rows: MuscleBalanceRow[]; medianAvg: number } {
  const monday = mondayOf(today);
  const weekStarts = Array.from({ length: weeks }, (_, i) => monday - 7 * (weeks - 1 - i));
  const counts = new Map<string, number[]>(
    MUSCLE_GROUPS.map((g) => [g, Array(weeks).fill(0)]),
  );
  for (const s of sessions) {
    if (!s.completed || s.category !== "strength") continue;
    const d = sessionDay(s);
    if (d == null || d < weekStarts[0] || d > today) continue;
    const w = Math.floor((d - weekStarts[0]) / 7);
    for (const ex of s.exercises ?? []) {
      const g = (ex.primaryMuscleGroup ?? "").toLowerCase();
      const row = counts.get(g);
      if (!row) continue;
      row[w] += (ex.sets ?? []).filter(isWorkingSet).length;
    }
  }
  const rows: MuscleBalanceRow[] = MUSCLE_GROUPS.map((group) => {
    const weekly = counts.get(group)!;
    return { group, weekly, avg: weekly.reduce((a, b) => a + b, 0) / weeks, flag: null };
  });
  const avgs = rows.map((r) => r.avg).sort((a, b) => a - b);
  const medianAvg = (avgs[2] + avgs[3]) / 2; // 6 groups
  if (medianAvg > 0) {
    for (const r of rows) {
      if (r.avg < medianAvg * 0.5) r.flag = "low";
      else if (r.avg > medianAvg * 2) r.flag = "high";
    }
  }
  return { weekStarts, rows, medianAvg };
}
