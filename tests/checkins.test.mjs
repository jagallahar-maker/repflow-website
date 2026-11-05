// Mirrors CheckInSchedule in app/lib/models/coach_checkin.dart.
// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkinState, cycleDueDay, lastDueDay, nextDueDay, weekdayOf } from "../lib/coach-checkins.ts";
import { dayNum } from "../lib/trend.ts";

const sun = dayNum(2026, 11, 8); // Sunday
const wed = dayNum(2026, 11, 4); // Wednesday

test("weekdays and due days (Sunday default)", () => {
  assert.equal(weekdayOf(sun), 7);
  assert.equal(weekdayOf(wed), 3);
  assert.equal(nextDueDay(7, wed), sun);
  assert.equal(lastDueDay(7, wed), sun - 7);
  assert.equal(nextDueDay(7, sun), sun);
  assert.equal(lastDueDay(7, sun), sun);
});

test("cycle: early window, due day, late", () => {
  assert.equal(cycleDueDay(7, sun - 2), sun); // Friday: early for Sunday
  assert.equal(cycleDueDay(7, sun - 3), sun - 7); // Thursday: last Sunday's cycle
  assert.equal(cycleDueDay(7, sun + 1), sun); // Monday: late for Sunday
});

test("states", () => {
  assert.equal(checkinState(7, sun, null).kind, "dueToday");
  assert.equal(checkinState(7, sun - 1, null).kind, "dueSoon");
  const late = checkinState(7, sun + 2, null);
  assert.equal(late.kind, "overdue");
  assert.equal(late.daysLate, 2);
  assert.equal(checkinState(7, sun + 1, { day: sun - 2, replied: false }).kind, "received");
  assert.equal(checkinState(7, sun + 1, { day: sun - 3, replied: false }).kind, "overdue");
  const r = checkinState(7, sun, { day: sun, replied: true });
  assert.equal(r.kind, "received");
  assert.equal(r.replied, true);
});
