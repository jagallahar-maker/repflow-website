/**
 * Weekly check-in schedule for the coach portal. Mirrors CheckInSchedule
 * in app/lib/models/coach_checkin.dart: the coach picks a weekday (1 = Mon
 * … 7 = Sun, default Sunday); the current cycle's due day is the coming one
 * once within EARLY_DAYS of it, otherwise the last one; a check-in counts
 * for the cycle if sent on or after EARLY_DAYS before its due day.
 * Pure functions (tests/checkins.test.mjs).
 */
import { weekdayIndex, type DayNum } from "./trend.ts";

export const DEFAULT_WEEKDAY = 7;
export const EARLY_DAYS = 2;
export const GRACE_DAYS = 2;

export const WEEKDAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** 1 = Monday … 7 = Sunday. */
export function weekdayOf(d: DayNum): number {
  return weekdayIndex(d) + 1;
}

export function lastDueDay(weekday: number, today: DayNum): DayNum {
  return today - (((weekdayOf(today) - weekday) % 7) + 7) % 7;
}

export function nextDueDay(weekday: number, today: DayNum): DayNum {
  return today + (((weekday - weekdayOf(today)) % 7) + 7) % 7;
}

export function cycleDueDay(weekday: number, today: DayNum): DayNum {
  const next = nextDueDay(weekday, today);
  return next - today <= EARLY_DAYS ? next : lastDueDay(weekday, today);
}

export type CheckinState =
  | { kind: "received"; day: DayNum; replied: boolean }
  | { kind: "dueSoon"; dueDay: DayNum }
  | { kind: "dueToday"; dueDay: DayNum }
  | { kind: "overdue"; dueDay: DayNum; daysLate: number };

/**
 * Where this client is in the weekly cycle.
 * @param latest Day of the latest check-in (and whether the coach replied).
 */
export function checkinState(
  weekday: number,
  today: DayNum,
  latest: { day: DayNum; replied: boolean } | null,
): CheckinState {
  const cycle = cycleDueDay(weekday, today);
  if (latest && latest.day >= cycle - EARLY_DAYS) {
    return { kind: "received", day: latest.day, replied: latest.replied };
  }
  if (cycle === today) return { kind: "dueToday", dueDay: cycle };
  if (cycle > today) return { kind: "dueSoon", dueDay: cycle };
  return { kind: "overdue", dueDay: cycle, daysLate: today - cycle };
}

export function checkinLabel(s: CheckinState): string {
  switch (s.kind) {
    case "received": return s.replied ? "Received · replied" : "Received";
    case "dueToday": return "Due today";
    case "dueSoon": return `Due ${WEEKDAY_NAMES[weekdayOf(s.dueDay)]}`;
    default: return `Overdue ${s.daysLate} day${s.daysLate === 1 ? "" : "s"}`;
  }
}

export const ADHERENCE_LABELS: Record<string, string> = {
  most: "Most sessions",
  some: "Some sessions",
  few: "Few sessions",
};

export const STRATEGY_STATUS_LABELS: Record<string, string> = {
  notEnoughData: "Not enough data",
  onTrack: "On track",
  ahead: "Ahead",
  behind: "Behind",
  wrongDirection: "Wrong direction",
  drifting: "Drifting",
};
