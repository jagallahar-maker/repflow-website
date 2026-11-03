/**
 * Body fat and measurable goals for the coach portal. Pure functions so
 * tests/goals.test.mjs can run them. Mirrors app/lib/utils/goal_progress.dart
 * (current value, progress, achieved); the on-pace status stays in the app.
 *
 * Goal types: weight (target = users/{uid}.goalWeight, never copied),
 * bodyFat, measurement (site), lift (best weight for ≥ reps, or best
 * Epley e1RM), workoutsPerWeek (completed workouts this Mon–Sun week, live
 * and including backdated).
 */
import { epley, sessionDay, type SessionDoc } from "./coach-insights.ts";
import { mondayOf, trendWeightAt, type DayNum } from "./trend.ts";

export type BodyFatEntry = { day: DayNum; percent: number; method: string };

export type GoalDoc = {
  id: string;
  type: "weight" | "bodyFat" | "measurement" | "lift" | "workoutsPerWeek";
  site?: string;
  exerciseId?: string;
  exerciseName?: string;
  liftMetric?: string;
  reps?: number;
  startValue?: number;
  target?: number;
  targetDay?: DayNum | null;
  achievedDay?: DayNum | null;
  countBackdated?: boolean;
};

export type GoalContext = {
  today: DayNum;
  /** Weigh-ins (any order). */
  weights: { day: DayNum; weightLb: number }[];
  goalWeight: number | null;
  bodyFat: BodyFatEntry[];
  measurements: { bodyPart: string; day: DayNum; inches: number }[];
  /** null when workouts aren't shared. */
  sessions: SessionDoc[] | null;
};

export type GoalRow = {
  goal: GoalDoc;
  unit: string;
  start: number | null;
  current: number | null;
  target: number | null;
  progress: number;
  achieved: boolean;
  /** Workouts per week: this week's counts. */
  weekLive?: number;
  weekAll?: number;
  /** Why there's no current value (e.g. workouts not shared). */
  missing?: string;
};

const TOLERANCE: Record<string, number> = { weight: 0.5, bodyFat: 0.2, measurement: 0.1 };

export function unitFor(type: string): string {
  return type === "bodyFat" ? "%" : type === "measurement" ? "in" : type === "workoutsPerWeek" ? "/wk" : "lb";
}

function latest<T extends { day: DayNum }>(list: T[]): T | null {
  return list.reduce<T | null>((a, b) => (a == null || b.day >= a.day ? b : a), null);
}

function liftBest(goal: GoalDoc, sessions: SessionDoc[]): number | null {
  let best: number | null = null;
  for (const s of sessions) {
    if (!s.completed) continue;
    for (const ex of s.exercises ?? []) {
      if (ex.exerciseId !== goal.exerciseId) continue;
      for (const set of ex.sets ?? []) {
        const w = set.weightLb ?? 0;
        const r = set.reps ?? 0;
        if (!set.isCompleted || w <= 0 || r <= 0 || (set.durationSeconds ?? 0) > 0) continue;
        const v = goal.liftMetric === "e1rm" ? epley(w, r) : r >= (goal.reps ?? 1) ? w : null;
        if (v != null && (best == null || v > best)) best = v;
      }
    }
  }
  return best;
}

export function evaluateGoal(goal: GoalDoc, ctx: GoalContext): GoalRow {
  const unit = unitFor(goal.type);
  if (goal.type === "workoutsPerWeek") {
    const target = Math.min(14, Math.max(1, Math.round(goal.target ?? 3)));
    if (ctx.sessions == null) {
      return { goal, unit, start: null, current: null, target, progress: 0, achieved: false, missing: "workouts not shared" };
    }
    const monday = mondayOf(ctx.today);
    let all = 0;
    let live = 0;
    for (const s of ctx.sessions) {
      if (!s.completed) continue;
      const d = sessionDay(s);
      if (d == null || d < monday || d > ctx.today) continue;
      all++;
      if (!s.isBackdated) live++;
    }
    const counted = goal.countBackdated === false ? live : all;
    return {
      goal, unit, start: null, current: counted, target,
      progress: Math.min(1, counted / target), achieved: counted >= target,
      weekLive: live, weekAll: all,
    };
  }

  let current: number | null = null;
  let missing: string | undefined;
  switch (goal.type) {
    case "weight": {
      const pts = ctx.weights.map((w) => ({ day: w.day, weightLb: w.weightLb }));
      current = trendWeightAt(pts, ctx.today) ?? latest(ctx.weights)?.weightLb ?? null;
      break;
    }
    case "bodyFat":
      current = latest(ctx.bodyFat)?.percent ?? null;
      break;
    case "measurement":
      current = latest(ctx.measurements.filter((m) => m.bodyPart === goal.site))?.inches ?? null;
      break;
    case "lift":
      if (ctx.sessions == null) missing = "workouts not shared";
      else current = liftBest(goal, ctx.sessions);
      break;
  }
  const target = goal.type === "weight" ? ctx.goalWeight : goal.target ?? null;
  const start = goal.startValue ?? current;
  if (current == null || target == null) {
    return { goal, unit, start, current, target, progress: 0, achieved: goal.achievedDay != null, missing };
  }
  const base = start ?? current;
  const dir = goal.type === "lift" ? 1 : Math.sign(target - base) || Math.sign(target - current);
  const remaining = target - current;
  const reached = remaining * dir <= (TOLERANCE[goal.type] ?? 0);
  const total = Math.abs(target - base);
  const progress = reached ? 1 : total === 0 ? 0 : Math.min(1, Math.max(0, ((current - base) * dir) / total));
  return { goal, unit, start, current, target, progress, achieved: reached || goal.achievedDay != null };
}

export function goalTitle(goal: GoalDoc, siteName: (key: string) => string): string {
  switch (goal.type) {
    case "weight": return "Body weight";
    case "bodyFat": return "Body fat";
    case "measurement": return siteName(goal.site ?? "");
    case "lift":
      return `${goal.exerciseName ?? "Lift"} · ${goal.liftMetric === "e1rm" ? "est. 1RM" : `${goal.reps ?? 1}+ reps`}`;
    default: return "Workouts per week";
  }
}

export function formatGoalValue(v: number | null, unit: string): string {
  if (v == null) return "--";
  const d = unit === "in" ? 2 : unit === "/wk" ? 0 : 1;
  const s = String(Number(v.toFixed(d)));
  return unit === "/wk" ? s : unit === "%" ? `${s}%` : `${s} ${unit}`;
}
