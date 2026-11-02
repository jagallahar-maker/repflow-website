/**
 * Port of the app's program schedule rules (app/lib/models/
 * workout_program.dart: isWeekdaySchedule, scheduleStart, scheduledDates,
 * dayStatusOf). Keep in step with the app; tests in
 * tests/programs.test.mjs.
 *
 * Weekday programs give every session a calendar date (week N from the
 * Monday of startDate, plus its weekday). A dated session is done
 * (lastCompletedAt), skipped (skippedAt), not owed (before the first owed
 * day), missed (date passed), today, or upcoming. Rotating programs have
 * no dates, so they can't be "missed".
 */
import { dayFromStored, mondayOf, type DayNum } from "./trend.ts";

export type ProgramSessionDoc = {
  id: string;
  label?: string;
  routineId?: string | null;
  orderIndex?: number;
  weekday?: string | null;
  isRestDay?: boolean;
  lastCompletedAt?: string | null;
  skippedAt?: string | null;
};

export type ProgramDoc = {
  id: string;
  name?: string;
  sessions?: ProgramSessionDoc[];
  scheduleType?: string;
  startDate?: string | null;
  scheduleStartsOn?: string | null;
  createdAt?: string | null;
  durationWeeks?: number;
};

export type SessionDayStatus =
  | "rest"
  | "done"
  | "skipped"
  | "upcoming"
  | "notOwed"
  | "missed"
  | "today";

export type WeekAdherence = {
  weekStart: DayNum;
  /** Owed, non-rest sessions dated this week (null for rotating programs). */
  planned: number | null;
  completed: number;
  skipped: number;
  missed: number;
  /** Today's and later sessions still to do this week. */
  remaining: number;
};

const WEEKDAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

function weekdayOffset(weekday: string): number {
  const i = WEEKDAYS.indexOf(weekday.toLowerCase());
  return i < 0 ? 0 : i;
}

function sortedSessions(p: ProgramDoc): ProgramSessionDoc[] {
  return [...(p.sessions ?? [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );
}

export function isWeekdaySchedule(p: ProgramDoc): boolean {
  const s = p.sessions ?? [];
  return p.scheduleType === "weekday" && s.length > 0 && s.every((x) => !!x.weekday);
}

/** First owed day (see WorkoutProgram.scheduleStart). */
export function scheduleStart(p: ProgramDoc): DayNum | null {
  const start = dayFromStored(p.startDate);
  if (start == null) return null;
  const explicit = dayFromStored(p.scheduleStartsOn);
  if (explicit != null) return explicit;
  const monday = mondayOf(start);
  const created = dayFromStored(p.createdAt);
  const inStartWeek = created != null && created >= monday && created < monday + 7;
  return inStartWeek ? created : start;
}

/** Calendar day of each session of a weekday schedule, by session id. */
export function scheduledDates(p: ProgramDoc): Map<string, DayNum> {
  const dates = new Map<string, DayNum>();
  const start = dayFromStored(p.startDate);
  if (!isWeekdaySchedule(p) || start == null) return dates;
  const monday = mondayOf(start);
  let week = 0;
  let lastOffset = -1;
  for (const s of sortedSessions(p)) {
    const offset = weekdayOffset(s.weekday!);
    if (offset <= lastOffset) week++;
    lastOffset = offset;
    dates.set(s.id, monday + week * 7 + offset);
  }
  return dates;
}

function statusOf(
  s: ProgramSessionDoc,
  dates: Map<string, DayNum>,
  today: DayNum,
  owedFrom: DayNum | null,
): SessionDayStatus {
  if (s.isRestDay) return "rest";
  if (s.lastCompletedAt) return "done";
  if (s.skippedAt) return "skipped";
  const date = dates.get(s.id);
  if (date == null) return "upcoming"; // rotating
  if (owedFrom != null && date < owedFrom) return "notOwed";
  if (date < today) return "missed";
  if (date === today) return "today";
  return "upcoming";
}

export function sessionStatus(
  p: ProgramDoc,
  s: ProgramSessionDoc,
  today: DayNum,
): SessionDayStatus {
  return statusOf(s, scheduledDates(p), today, scheduleStart(p));
}

/** Planned vs completed / skipped / missed for the week starting [weekStart]. */
export function weekAdherence(
  p: ProgramDoc,
  weekStart: DayNum,
  today: DayNum,
): WeekAdherence {
  const result: WeekAdherence = {
    weekStart,
    planned: null,
    completed: 0,
    skipped: 0,
    missed: 0,
    remaining: 0,
  };
  const weekEnd = weekStart + 6;
  if (isWeekdaySchedule(p) && dayFromStored(p.startDate) != null) {
    const dates = scheduledDates(p);
    const owedFrom = scheduleStart(p);
    result.planned = 0;
    for (const s of sortedSessions(p)) {
      const date = dates.get(s.id);
      if (date == null || date < weekStart || date > weekEnd) continue;
      const status = statusOf(s, dates, today, owedFrom);
      if (status === "rest" || status === "notOwed") continue;
      result.planned++;
      if (status === "done") result.completed++;
      else if (status === "skipped") result.skipped++;
      else if (status === "missed") result.missed++;
      else result.remaining++;
    }
    return result;
  }
  // Rotating: count what was completed / skipped during the week.
  for (const s of p.sessions ?? []) {
    const done = dayFromStored(s.lastCompletedAt);
    const skipped = dayFromStored(s.skippedAt);
    if (done != null && done >= weekStart && done <= weekEnd) result.completed++;
    else if (skipped != null && skipped >= weekStart && skipped <= weekEnd) result.skipped++;
  }
  return result;
}

/** This week plus the previous [weeks] full weeks, newest first. */
export function programAdherence(
  p: ProgramDoc,
  today: DayNum,
  weeks = 4,
): { thisWeek: WeekAdherence; previous: WeekAdherence[] } {
  const monday = mondayOf(today);
  const previous: WeekAdherence[] = [];
  for (let w = 1; w <= weeks; w++) {
    previous.push(weekAdherence(p, monday - 7 * w, today));
  }
  return { thisWeek: weekAdherence(p, monday, today), previous };
}

/** Program week number (1-based, calendar weeks since the start Monday). */
export function programWeek(p: ProgramDoc, today: DayNum): number | null {
  const start = dayFromStored(p.startDate);
  if (start == null) return null;
  return Math.floor((mondayOf(today) - mondayOf(start)) / 7) + 1;
}
