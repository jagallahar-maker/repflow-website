import type { ActivitySessionDoc, BodyweightLogDoc } from "@/lib/coach-data";
import { parseDate } from "@/lib/coach-data";

// =============================================================================
// Types
// =============================================================================

export type WeightPoint = {
  date: string;
  dateLabel: string;
  weight: number;
};

export type WeeklyVolumePoint = {
  weekStart: string;
  weekLabel: string;
  volume: number;
  workoutCount: number;
};

export type WeeklyCountPoint = {
  weekStart: string;
  weekLabel: string;
  strength: number;
  cardio: number;
  total: number;
};

export type WeeklyCardioPoint = {
  weekStart: string;
  weekLabel: string;
  miles: number;
  sessions: number;
  durationMinutes: number;
};

export type HeatmapCell = {
  date: string;
  count: number;
  strength: number;
  cardio: number;
  dayOfWeek: number;
  outOfRange: boolean;
};

export type HeatmapWeek = {
  weekStart: string;
  cells: HeatmapCell[];
  monthLabel: string | null;
};

/** One point on a per-exercise e1RM trend chart. */
export type E1rmPoint = {
  date: string; // ISO
  dateLabel: string; // "Apr 12"
  e1rm: number;
  topWeight: number;
  topReps: number;
};

/** An exercise option in the per-exercise picker dropdown. */
export type ExerciseOption = {
  exerciseId: string;
  exerciseName: string;
  appearances: number; // total sessions where this exercise appeared
  lastSeen: string; // ISO of most recent appearance
  bestE1rm: number;
};

// =============================================================================
// Date helpers
// =============================================================================

function startOfMondayWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

function startOfSundayWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString();
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function monthOnlyLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short" });
}

const METERS_PER_MILE = 1609.344;

// =============================================================================
// e1RM helpers
// =============================================================================

/**
 * Epley formula. Matches the Flutter PRCalculator.calculateOneRepMax
 * exactly so coach-side numbers match what the athlete sees in their app.
 */
function epleyE1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Embedded set entry shape inside ActivitySession.exercises[].sets.
 * Matches Flutter StrengthSetEntry.toJson.
 */
type EmbeddedSet = {
  setNumber?: number;
  weightLb?: number;
  reps?: number;
  isCompleted?: boolean;
  completedAt?: string | null;
};

/** Embedded exercise entry inside ActivitySession.exercises[]. */
type EmbeddedExercise = {
  exerciseId?: string;
  exerciseName?: string;
  sets?: EmbeddedSet[];
};

// =============================================================================
// Bodyweight series
// =============================================================================

export function buildWeightSeries(
  logs: BodyweightLogDoc[],
  days: number = 90,
): WeightPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const points: WeightPoint[] = [];
  for (const log of logs) {
    if (log.weight == null) continue;
    const date = parseDate(log.logDate ?? log.createdAt);
    if (!date) continue;
    if (date < cutoff) continue;
    points.push({
      date: isoDate(date),
      dateLabel: shortLabel(date),
      weight: log.weight,
    });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

// =============================================================================
// Weekly volume (strength only)
// =============================================================================

export function buildWeeklyVolumeSeries(
  sessions: ActivitySessionDoc[],
  weeks: number = 12,
): WeeklyVolumePoint[] {
  const now = new Date();
  const currentWeekStart = startOfMondayWeek(now);
  const earliestWeekStart = new Date(currentWeekStart);
  earliestWeekStart.setDate(earliestWeekStart.getDate() - 7 * (weeks - 1));

  const buckets = new Map<string, WeeklyVolumePoint>();
  for (let i = 0; i < weeks; i++) {
    const ws = new Date(earliestWeekStart);
    ws.setDate(ws.getDate() + i * 7);
    const key = isoDate(ws);
    buckets.set(key, {
      weekStart: key,
      weekLabel: shortLabel(ws),
      volume: 0,
      workoutCount: 0,
    });
  }

  for (const session of sessions) {
    if (!session.completed) continue;
    if (session.category !== "strength") continue;
    const date = parseDate(session.startTime ?? session.createdAt);
    if (!date) continue;
    if (date < earliestWeekStart) continue;
    const ws = startOfMondayWeek(date);
    const key = isoDate(ws);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.volume += session.totalVolume ?? 0;
    bucket.workoutCount += 1;
  }

  return Array.from(buckets.values());
}

// =============================================================================
// Weekly workout count
// =============================================================================

export function buildWeeklyCountSeries(
  sessions: ActivitySessionDoc[],
  weeks: number = 12,
): WeeklyCountPoint[] {
  const now = new Date();
  const currentWeekStart = startOfMondayWeek(now);
  const earliestWeekStart = new Date(currentWeekStart);
  earliestWeekStart.setDate(earliestWeekStart.getDate() - 7 * (weeks - 1));

  const buckets = new Map<string, WeeklyCountPoint>();
  for (let i = 0; i < weeks; i++) {
    const ws = new Date(earliestWeekStart);
    ws.setDate(ws.getDate() + i * 7);
    const key = isoDate(ws);
    buckets.set(key, {
      weekStart: key,
      weekLabel: shortLabel(ws),
      strength: 0,
      cardio: 0,
      total: 0,
    });
  }

  for (const session of sessions) {
    if (!session.completed) continue;
    const date = parseDate(session.startTime ?? session.createdAt);
    if (!date) continue;
    if (date < earliestWeekStart) continue;
    const ws = startOfMondayWeek(date);
    const key = isoDate(ws);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (session.category === "strength") {
      bucket.strength += 1;
    } else if (session.category === "cardio") {
      bucket.cardio += 1;
    }
    bucket.total = bucket.strength + bucket.cardio;
  }

  return Array.from(buckets.values());
}

// =============================================================================
// Weekly cardio distance
// =============================================================================

export function buildWeeklyCardioSeries(
  sessions: ActivitySessionDoc[],
  weeks: number = 12,
): WeeklyCardioPoint[] {
  const now = new Date();
  const currentWeekStart = startOfMondayWeek(now);
  const earliestWeekStart = new Date(currentWeekStart);
  earliestWeekStart.setDate(earliestWeekStart.getDate() - 7 * (weeks - 1));

  const buckets = new Map<string, WeeklyCardioPoint>();
  for (let i = 0; i < weeks; i++) {
    const ws = new Date(earliestWeekStart);
    ws.setDate(ws.getDate() + i * 7);
    const key = isoDate(ws);
    buckets.set(key, {
      weekStart: key,
      weekLabel: shortLabel(ws),
      miles: 0,
      sessions: 0,
      durationMinutes: 0,
    });
  }

  for (const session of sessions) {
    if (!session.completed) continue;
    if (session.category !== "cardio") continue;
    const date = parseDate(session.startTime ?? session.createdAt);
    if (!date) continue;
    if (date < earliestWeekStart) continue;
    const ws = startOfMondayWeek(date);
    const key = isoDate(ws);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.sessions += 1;
    if (typeof session.distanceMeters === "number") {
      bucket.miles += session.distanceMeters / METERS_PER_MILE;
    }
    if (typeof session.durationSeconds === "number") {
      bucket.durationMinutes += session.durationSeconds / 60;
    }
  }

  for (const b of buckets.values()) {
    b.miles = Math.round(b.miles * 10) / 10;
    b.durationMinutes = Math.round(b.durationMinutes);
  }

  return Array.from(buckets.values());
}

// =============================================================================
// Activity heatmap
// =============================================================================

export function buildActivityHeatmap(
  sessions: ActivitySessionDoc[],
  days: number = 91,
): HeatmapWeek[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() - (days - 1));
  const gridStart = startOfSundayWeek(earliest);

  const counts = new Map<string, { strength: number; cardio: number }>();
  for (const session of sessions) {
    if (!session.completed) continue;
    const date = parseDate(session.startTime ?? session.createdAt);
    if (!date) continue;
    if (date < gridStart) continue;
    if (date > today) continue;
    const key = localDateKey(date);
    const existing = counts.get(key) ?? { strength: 0, cardio: 0 };
    if (session.category === "strength") existing.strength += 1;
    else if (session.category === "cardio") existing.cardio += 1;
    counts.set(key, existing);
  }

  const weeks: HeatmapWeek[] = [];
  let lastMonth: number | null = null;

  const cursor = new Date(gridStart);
  while (cursor <= today) {
    const cells: HeatmapCell[] = [];
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(cursor);
      cellDate.setDate(cellDate.getDate() + i);

      const outOfRange = cellDate < earliest || cellDate > today;
      const key = localDateKey(cellDate);
      const entry = outOfRange ? undefined : counts.get(key);

      cells.push({
        date: key,
        count: entry ? entry.strength + entry.cardio : 0,
        strength: entry?.strength ?? 0,
        cardio: entry?.cardio ?? 0,
        dayOfWeek: i,
        outOfRange,
      });
    }

    const colMonth = cursor.getMonth();
    let monthLabel: string | null = null;
    if (lastMonth === null || colMonth !== lastMonth) {
      monthLabel = monthOnlyLabel(cursor);
      lastMonth = colMonth;
    }

    weeks.push({
      weekStart: isoDate(cursor),
      cells,
      monthLabel,
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

// =============================================================================
// Per-exercise progression
// =============================================================================

/**
 * Walk all completed strength sessions, collect every exercise the user
 * has performed, and return them ranked by appearance count (most-used
 * first), capped at `limit`. Used to populate the exercise picker.
 *
 * Treats `exerciseId` as the canonical key (to avoid ghost duplicates
 * when an exercise gets renamed in the catalog) but falls back to
 * `exerciseName` if id is missing.
 */
export function buildExerciseOptions(
  sessions: ActivitySessionDoc[],
  limit: number = 10,
): ExerciseOption[] {
  const map = new Map<
    string,
    {
      exerciseId: string;
      exerciseName: string;
      appearances: number;
      lastSeen: Date;
      bestE1rm: number;
    }
  >();

  for (const session of sessions) {
    if (!session.completed) continue;
    if (session.category !== "strength") continue;
    const exercises = (session as ActivitySessionDoc & {
      exercises?: EmbeddedExercise[];
    }).exercises;
    if (!Array.isArray(exercises) || exercises.length === 0) continue;
    const date = parseDate(session.startTime ?? session.createdAt);
    if (!date) continue;

    for (const ex of exercises) {
      const id = (ex.exerciseId ?? ex.exerciseName ?? "").toString();
      const name = (ex.exerciseName ?? "").toString();
      if (!id || !name) continue;

      // Compute this session's best e1RM for this exercise.
      let bestE1rmThisSession = 0;
      for (const set of ex.sets ?? []) {
        if (!set.isCompleted) continue;
        const w = typeof set.weightLb === "number" ? set.weightLb : 0;
        const r = typeof set.reps === "number" ? set.reps : 0;
        const e1rm = epleyE1rm(w, r);
        if (e1rm > bestE1rmThisSession) bestE1rmThisSession = e1rm;
      }
      if (bestE1rmThisSession <= 0) continue;

      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          exerciseId: id,
          exerciseName: name,
          appearances: 1,
          lastSeen: date,
          bestE1rm: bestE1rmThisSession,
        });
      } else {
        existing.appearances += 1;
        if (date > existing.lastSeen) existing.lastSeen = date;
        if (bestE1rmThisSession > existing.bestE1rm)
          existing.bestE1rm = bestE1rmThisSession;
      }
    }
  }

  const list = Array.from(map.values())
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, limit)
    .map((e) => ({
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      appearances: e.appearances,
      lastSeen: e.lastSeen.toISOString(),
      bestE1rm: Math.round(e.bestE1rm),
    }));

  return list;
}

/**
 * For a single exercise (matched by id, falling back to name), build the
 * time series of best-e1RM per session for the last [days] days.
 */
export function buildE1rmSeries(
  sessions: ActivitySessionDoc[],
  exerciseKey: string,
  days: number = 90,
): E1rmPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const points: E1rmPoint[] = [];

  for (const session of sessions) {
    if (!session.completed) continue;
    if (session.category !== "strength") continue;
    const date = parseDate(session.startTime ?? session.createdAt);
    if (!date) continue;
    if (date < cutoff) continue;

    const exercises = (session as ActivitySessionDoc & {
      exercises?: EmbeddedExercise[];
    }).exercises;
    if (!Array.isArray(exercises) || exercises.length === 0) continue;

    const ex = exercises.find((e) => {
      const id = (e.exerciseId ?? e.exerciseName ?? "").toString();
      return id === exerciseKey;
    });
    if (!ex) continue;

    let bestE1rm = 0;
    let topWeight = 0;
    let topReps = 0;
    for (const set of ex.sets ?? []) {
      if (!set.isCompleted) continue;
      const w = typeof set.weightLb === "number" ? set.weightLb : 0;
      const r = typeof set.reps === "number" ? set.reps : 0;
      const e1rm = epleyE1rm(w, r);
      if (e1rm > bestE1rm) {
        bestE1rm = e1rm;
        topWeight = w;
        topReps = r;
      }
    }
    if (bestE1rm <= 0) continue;

    points.push({
      date: isoDate(date),
      dateLabel: shortLabel(date),
      e1rm: Math.round(bestE1rm),
      topWeight,
      topReps,
    });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}