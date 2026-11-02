// Program schedule rules (mirror app/lib/models/workout_program.dart) and
// workout insights. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayNum } from "../lib/trend.ts";
import {
  programAdherence,
  scheduleStart,
  scheduledDates,
  sessionStatus,
  weekAdherence,
} from "../lib/coach-programs.ts";
import {
  bestLifts,
  muscleBalance,
  prEvents,
  weeklyWorkoutStats,
} from "../lib/coach-insights.ts";

// Mon Oct 26, 2026 start; Mon/Wed/Fri for 2 weeks + a rest Sunday.
const MON = dayNum(2026, 10, 26);
const program = (overrides = {}) => ({
  id: "p1",
  name: "Test",
  scheduleType: "weekday",
  startDate: "2026-10-26T00:00:00.000",
  createdAt: "2026-10-26T09:00:00.000",
  sessions: [
    { id: "a1", orderIndex: 0, weekday: "monday", lastCompletedAt: "2026-10-26T18:00:00.000" },
    { id: "b1", orderIndex: 1, weekday: "wednesday" },
    { id: "c1", orderIndex: 2, weekday: "friday", skippedAt: "2026-10-30T08:00:00.000" },
    { id: "r1", orderIndex: 3, weekday: "sunday", isRestDay: true },
    { id: "a2", orderIndex: 4, weekday: "monday" },
    { id: "b2", orderIndex: 5, weekday: "wednesday" },
    { id: "c2", orderIndex: 6, weekday: "friday" },
  ],
  ...overrides,
});

test("scheduled dates follow week order", () => {
  const dates = scheduledDates(program());
  assert.equal(dates.get("a1"), MON);
  assert.equal(dates.get("c1"), MON + 4);
  assert.equal(dates.get("a2"), MON + 7);
  assert.equal(dates.get("c2"), MON + 11);
});

test("statuses: done / missed / skipped / today / upcoming / rest", () => {
  const p = program();
  const today = MON + 9; // Wed Nov 4
  const s = (id) => sessionStatus(p, p.sessions.find((x) => x.id === id), today);
  assert.equal(s("a1"), "done");
  assert.equal(s("b1"), "missed");
  assert.equal(s("c1"), "skipped");
  assert.equal(s("r1"), "rest");
  assert.equal(s("a2"), "missed");
  assert.equal(s("b2"), "today");
  assert.equal(s("c2"), "upcoming");
});

test("days before the first owed day aren't missed", () => {
  // Activated Wednesday of the start week: Monday isn't owed.
  const p = program({ createdAt: "2026-10-28T10:00:00.000" });
  p.sessions[0].lastCompletedAt = null;
  assert.equal(scheduleStart(p), MON + 2);
  assert.equal(sessionStatus(p, p.sessions[0], MON + 3), "notOwed");
  const p2 = program({ scheduleStartsOn: "2026-10-30T00:00:00.000" });
  assert.equal(sessionStatus(p2, p2.sessions[1], MON + 5), "notOwed");
});

test("week adherence", () => {
  const p = program();
  const wk1 = weekAdherence(p, MON, MON + 9);
  assert.deepEqual(
    { planned: wk1.planned, completed: wk1.completed, skipped: wk1.skipped, missed: wk1.missed, remaining: wk1.remaining },
    { planned: 3, completed: 1, skipped: 1, missed: 1, remaining: 0 },
  );
  const { thisWeek } = programAdherence(p, MON + 9);
  assert.equal(thisWeek.planned, 3);
  assert.equal(thisWeek.missed, 1); // a2
  assert.equal(thisWeek.remaining, 2); // b2 today, c2 upcoming
});

test("rotating programs count completions by day, never missed", () => {
  const p = program({ scheduleType: "rotating" });
  const wk = weekAdherence(p, MON, MON + 9);
  assert.equal(wk.planned, null);
  assert.equal(wk.completed, 1);
  assert.equal(wk.skipped, 1);
  assert.equal(wk.missed, 0);
});

const strength = (date, exercises) => ({
  startTime: `${date}T18:00:00.000`,
  category: "strength",
  completed: true,
  exercises,
});
const ex = (id, group, sets) => ({
  exerciseId: id,
  exerciseName: id,
  primaryMuscleGroup: group,
  sets: sets.map(([weightLb, reps, durationSeconds]) => ({
    weightLb,
    reps,
    isCompleted: true,
    ...(durationSeconds ? { durationSeconds } : {}),
  })),
});

test("PR events beat an earlier record for the same rep count", () => {
  const sessions = [
    strength("2026-10-01", [ex("squat", "legs", [[225, 5], [235, 5]])]),
    strength("2026-10-08", [ex("squat", "legs", [[245, 5], [245, 5]])]),
    strength("2026-10-15", [ex("squat", "legs", [[245, 5], [275, 1]])]),
    strength("2026-10-20", [ex("plank", "core", [[0, 0, 60]])]),
    strength("2026-10-27", [ex("plank", "core", [[0, 0, 75]])]),
  ];
  const events = prEvents(sessions);
  assert.equal(events.length, 2);
  assert.equal(events[0].weightLb, 245);
  assert.equal(events[0].previous.weightLb, 235);
  assert.equal(events[1].kind, "hold");
  assert.equal(events[1].durationSeconds, 75);
  const [squat] = bestLifts(sessions);
  assert.equal(squat.exerciseId, "squat");
  assert.equal(squat.heaviest.weightLb, 275);
  assert.equal(Math.round(squat.bestE1rm.value), 286); // 245 × (1 + 5/30)
});

test("muscle balance flags groups well below or above the rest", () => {
  const today = dayNum(2026, 11, 1);
  const sessions = [
    strength("2026-10-28", [
      ex("bench", "chest", [[185, 8], [185, 8], [185, 8], [185, 8]]),
      ex("row", "back", [[155, 10], [155, 10], [155, 10], [155, 10]]),
      ex("squat", "legs", [[225, 5], [225, 5], [225, 5], [225, 5]]),
      ex("press", "shoulders", [[95, 8], [95, 8], [95, 8], [95, 8]]),
      ex("curl", "arms", [[30, 12]]),
      ex("plank", "core", [[0, 0, 60], [0, 0, 60], [0, 0, 60], [0, 0, 60], [0, 0, 60], [0, 0, 60], [0, 0, 60], [0, 0, 60], [0, 0, 60], [0, 0, 60]]),
    ]),
  ];
  const { rows } = muscleBalance(sessions, today);
  const flag = (g) => rows.find((r) => r.group === g).flag;
  assert.equal(flag("arms"), "low");
  assert.equal(flag("core"), "high");
  assert.equal(flag("chest"), null);
  const wk = weeklyWorkoutStats(sessions, today);
  assert.equal(wk.thisWeek, 1);
});
