// Mirrors the Dart checks for app/lib/services/tdee_engine.dart.
// Run: npm test   (Node 24 runs the .ts module directly)
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dailyTrend,
  dayFromStored,
  dayNum,
  goalEstimate,
  mondayOf,
  todayDay,
  trendRate,
  trendStatus,
  trendWeightAt,
  dailyWeights,
} from "../lib/trend.ts";

const TODAY = dayNum(2026, 11, 1);

/** Same series as the Dart test: skip every 6th day, linear rate. */
function series(lbPerWeek, days = 21) {
  const out = [];
  for (let d = days - 1; d >= 0; d--) {
    if (d % 6 === 5) continue;
    out.push({ day: TODAY - d, weightLb: 175 - (lbPerWeek * d) / 7 });
  }
  return out;
}

const close = (a, b, eps = 0.01) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} not within ${eps} of ${b}`);

test("trend rate", () => {
  close(trendRate(series(-0.6), TODAY).lbPerWeek, -0.6);
  close(trendRate(series(0.3), TODAY).lbPerWeek, 0.3);
  assert.equal(trendRate(series(0.3, 5), TODAY), null); // span < 7 days
  assert.equal(trendRate(series(0.3).slice(0, 3), TODAY), null); // < 4 weigh-ins
});

test("status never on track in the wrong direction", () => {
  assert.equal(trendStatus(-0.6, 0.25), "wrongDirection");
  assert.equal(trendStatus(-0.02, 0.1), "behind");
  assert.equal(trendStatus(0.25, 0.25), "onTrack");
  assert.equal(trendStatus(0.6, 0.25), "ahead");
  assert.equal(trendStatus(-1.0, -1.0), "onTrack");
  assert.equal(trendStatus(0.2, -1.0), "wrongDirection");
  assert.equal(trendStatus(0.4, 0), "drifting");
  assert.equal(trendStatus(null, 0.25), "notEnoughData");
});

test("goal estimate", () => {
  const up = { lbPerWeek: 0.3, weighIns: 15, spanDays: 20 };
  const down = { lbPerWeek: -0.6, weighIns: 15, spanDays: 20 };
  const g = (goal, t, plan) =>
    goalEstimate({
      goalWeightLb: goal,
      currentWeightLb: 175,
      trend: t,
      today: TODAY,
      planRateLbPerWeek: plan,
    });
  assert.equal(g(190, down), "Not heading toward goal yet");
  assert.match(g(190, up), /^Est\. .* at your trend$/);
  assert.equal(g(190, null), null);
  assert.match(g(190, null, 0.25), /at plan rate$/);
  assert.equal(g(160, up, 0.25), "Goal is below your weight");
  assert.equal(g(175.2, up), "Goal reached");
  assert.equal(g(null, up), null);
  // 15 lb at 0.3 lb/wk = 50 weeks = 350 days after Nov 1, 2026.
  assert.equal(g(190, up), "Est. Oct 17, 2027 at your trend");
});

test("trailing trend: first point equals its own weigh-in", () => {
  const pts = series(-0.6);
  const daily = dailyTrend(pts);
  assert.equal(daily[0].trend, daily[0].weighInLb);
});

test("dailyTrend matches trendWeightAt and keeps gaps", () => {
  const pts = [];
  for (let d = 730; d >= 0; d--) {
    if (d > 300 && d < 340) continue; // 40-day gap
    if (d % 5 === 3) continue;
    pts.push({ day: TODAY - d, weightLb: 190 - d * 0.02 + Math.sin(d) });
    if (d % 9 === 0) pts.push({ day: TODAY - d, weightLb: 191 - d * 0.02 });
  }
  const daily = dailyTrend(pts);
  for (const p of daily.filter((x) => x.day % 7 === 0)) {
    const ref = trendWeightAt(pts, p.day);
    if (ref == null) assert.equal(p.trend, null);
    else close(p.trend, ref, 1e-9);
  }
  assert.ok(daily.filter((p) => p.trend == null).length > 20);
  // Days with two weigh-ins average them.
  const doubled = daily.find((p) => p.weighIns === 2);
  assert.ok(doubled);
  assert.equal(dailyWeights(pts).length, daily.filter((p) => p.weighInLb != null).length);
});

test("stored dates use the client's wall-clock day", () => {
  assert.equal(dayFromStored("2026-10-31T23:30:00.000"), dayNum(2026, 10, 31));
  assert.equal(dayFromStored("2026-11-01"), TODAY);
  assert.equal(dayFromStored(null), null);
  assert.equal(mondayOf(TODAY), dayNum(2026, 10, 26)); // Nov 1, 2026 is a Sunday
  // 03:30 UTC on Nov 2 is still Nov 1 in New York.
  assert.equal(
    todayDay("America/New_York", new Date("2026-11-02T03:30:00Z")),
    TODAY,
  );
});
