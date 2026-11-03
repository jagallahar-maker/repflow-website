// Mirrors app/lib/utils/goal_progress.dart (current value, progress, achieved).
// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateGoal, formatGoalValue } from "../lib/coach-goals.ts";
import { dayNum } from "../lib/trend.ts";

const today = dayNum(2026, 11, 4); // Wednesday
const base = { today, weights: [], goalWeight: null, bodyFat: [], measurements: [], sessions: [] };

const session = (y, m, d, weightLb, reps, isBackdated = false) => ({
  startTime: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T10:00:00.000`,
  completed: true,
  isBackdated,
  exercises: [{ exerciseId: "bench", sets: [{ weightLb, reps, isCompleted: true }] }],
});

test("weight goal reads goalWeight and the 7-day trend", () => {
  const weights = [];
  for (let i = 0; i < 7; i++) weights.push({ day: today - i, weightLb: 176 });
  const row = evaluateGoal({ id: "weight", type: "weight", startValue: 180 },
    { ...base, weights, goalWeight: 170 });
  assert.equal(row.current, 176);
  assert.equal(row.target, 170);
  assert.ok(Math.abs(row.progress - 0.4) < 1e-9);
  assert.equal(row.achieved, false);
});

test("lift: best weight for at least N reps, and Epley e1RM", () => {
  const sessions = [session(2026, 10, 20, 185, 5), session(2026, 10, 27, 195, 5), session(2026, 11, 3, 190, 6)];
  const reps = evaluateGoal({ id: "l", type: "lift", exerciseId: "bench", liftMetric: "reps", reps: 5,
    startValue: 185, target: 225 }, { ...base, sessions });
  assert.equal(reps.current, 195);
  assert.equal(reps.progress, 0.25);
  const e1 = evaluateGoal({ id: "e", type: "lift", exerciseId: "bench", liftMetric: "e1rm", target: 220 },
    { ...base, sessions });
  assert.equal(e1.current, 228);
  assert.equal(e1.achieved, true);
  const hidden = evaluateGoal({ id: "l", type: "lift", exerciseId: "bench", target: 225 }, { ...base, sessions: null });
  assert.equal(hidden.missing, "workouts not shared");
});

test("workouts per week counts live and backdated", () => {
  const sessions = [session(2026, 11, 2, 100, 5, true), session(2026, 11, 3, 100, 5), session(2026, 10, 30, 100, 5)];
  const all = evaluateGoal({ id: "h", type: "workoutsPerWeek", target: 2 }, { ...base, sessions });
  assert.equal(all.weekAll, 2);
  assert.equal(all.weekLive, 1);
  assert.equal(all.achieved, true);
  const live = evaluateGoal({ id: "h", type: "workoutsPerWeek", target: 2, countBackdated: false },
    { ...base, sessions });
  assert.equal(live.achieved, false);
});

test("formatting", () => {
  assert.equal(formatGoalValue(17.5, "%"), "17.5%");
  assert.equal(formatGoalValue(32.25, "in"), "32.25 in");
  assert.equal(formatGoalValue(170, "lb"), "170 lb");
});
