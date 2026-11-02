/**
 * TypeScript port of the app's weight-trend math (app/lib/services/
 * tdee_engine.dart: dailyWeights, trendWeightAt, trendRate, trendStatus,
 * goalEstimate, dailyTrend). Keep the two in step: tests in
 * tests/trend.test.mjs mirror the Dart ones.
 *
 * Days are integers ("day numbers": days since 1970-01-01 of the
 * client's own calendar). The app stores dates as local wall-clock ISO
 * strings without a timezone ("2026-10-31T07:12:00.000"), so the date
 * part is the client's calendar day; converting through Date on the
 * server (UTC) would shift it. Plain TypeScript (no path aliases, no
 * enums) so Node can run the tests directly.
 */

export type DayNum = number;

export type WeightPoint = { day: DayNum; weightLb: number };

export type TrendRate = {
  lbPerWeek: number;
  weighIns: number;
  spanDays: number;
};

export type TrendStatus =
  | "notEnoughData"
  | "onTrack"
  | "ahead"
  | "behind"
  | "wrongDirection"
  | "drifting";

export type DailyTrendPoint = {
  day: DayNum;
  /** That day's weigh-in (average if several), or null. */
  weighInLb: number | null;
  weighIns: number;
  /** 7-day trailing trend, or null when the window has no weigh-in. */
  trend: number | null;
};

/** Minimum data for a trend rate: weigh-ins on this many days... */
export const MIN_TREND_WEIGH_INS = 4;
/** ...spread over at least this many days. */
export const MIN_TREND_SPAN_DAYS = 7;

const MS_PER_DAY = 86400000;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ── Day helpers ───────────────────────────────────────────────────────────

export function dayNum(year: number, month: number, day: number): DayNum {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

/** Calendar parts of a day number. */
export function dayParts(d: DayNum): { year: number; month: number; day: number } {
  const date = new Date(d * MS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(d: DayNum): number {
  return (new Date(d * MS_PER_DAY).getUTCDay() + 6) % 7;
}

export function mondayOf(d: DayNum): DayNum {
  return d - weekdayIndex(d);
}

/** "YYYY-MM-DD". */
export function dayKey(d: DayNum): string {
  const p = dayParts(d);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "Nov 1, 2026". */
export function formatDay(d: DayNum): string {
  const p = dayParts(d);
  return `${MONTHS[p.month - 1]} ${p.day}, ${p.year}`;
}

/** "Nov 1" or "Nov '26". */
export function formatDayShort(d: DayNum, withYear = false): string {
  const p = dayParts(d);
  return withYear
    ? `${MONTHS[p.month - 1]} '${String(p.year).slice(2)}`
    : `${MONTHS[p.month - 1]} ${p.day}`;
}

type TimestampLike = { toDate?: () => Date };

/**
 * The client's calendar day of a stored date. Local ISO strings use their
 * own date part; a Firestore Timestamp or a "Z" string (older data) falls
 * back to its UTC date.
 */
export function dayFromStored(
  value: string | TimestampLike | null | undefined,
): DayNum | null {
  if (!value) return null;
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) return dayNum(Number(m[1]), Number(m[2]), Number(m[3]));
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : Math.floor(t / MS_PER_DAY);
  }
  if (typeof value.toDate === "function") {
    try {
      const d = value.toDate();
      return dayNum(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Time zones to try, in order: the client's own (users/{uid}.timeZone,
 * saved by the app from build 20), then COACH_CLIENT_TIME_ZONE, then
 * America/New_York.
 */
export function timeZoneCandidates(timeZone?: string | null): string[] {
  const env =
    typeof process !== "undefined" ? process.env.COACH_CLIENT_TIME_ZONE : undefined;
  return [timeZone, env, "America/New_York"].filter(
    (tz): tz is string => typeof tz === "string" && tz.length > 0,
  );
}

/** Today on the client's calendar (see timeZoneCandidates). */
export function todayDay(timeZone?: string | null, now: Date = new Date()): DayNum {
  for (const tz of timeZoneCandidates(timeZone)) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now); // "2026-11-01"
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parts);
      if (m) return dayNum(Number(m[1]), Number(m[2]), Number(m[3]));
    } catch {
      // Unknown time zone name: try the next one.
    }
  }
  return Math.floor(now.getTime() / MS_PER_DAY);
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

// ── Trend math (mirrors tdee_engine.dart) ─────────────────────────────────

/** One point per calendar day (average of that day's weigh-ins), oldest first. */
export function dailyWeights(points: WeightPoint[]): WeightPoint[] {
  const byDay = new Map<DayNum, number[]>();
  for (const p of points) {
    const list = byDay.get(p.day);
    if (list) list.push(p.weightLb);
    else byDay.set(p.day, [p.weightLb]);
  }
  return [...byDay.keys()]
    .sort((a, b) => a - b)
    .map((day) => ({ day, weightLb: average(byDay.get(day)!) }));
}

/** Average of daily weights in the 7 days ending on [day]; null if none. */
export function trendWeightAt(points: WeightPoint[], day: DayNum): number | null {
  const start = day - 6;
  const window = dailyWeights(points)
    .filter((p) => p.day >= start && p.day <= day)
    .map((p) => p.weightLb);
  return window.length === 0 ? null : average(window);
}

/**
 * Rate of change (lb/week): least-squares slope of daily weights over the
 * last [windowDays] days. Null with fewer than MIN_TREND_WEIGH_INS weigh-in
 * days or a span under MIN_TREND_SPAN_DAYS.
 */
export function trendRate(
  points: WeightPoint[],
  today: DayNum,
  windowDays = 21,
): TrendRate | null {
  const start = today - (windowDays - 1);
  const daily = dailyWeights(points).filter((p) => p.day >= start && p.day <= today);
  if (daily.length < MIN_TREND_WEIGH_INS) return null;
  const spanDays = daily[daily.length - 1].day - daily[0].day;
  if (spanDays < MIN_TREND_SPAN_DAYS) return null;
  const xs = daily.map((p) => p.day - daily[0].day);
  const ys = daily.map((p) => p.weightLb);
  const mx = average(xs);
  const my = average(ys);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) * (xs[i] - mx);
  }
  if (sxx === 0) return null;
  return { lbPerWeek: (sxy / sxx) * 7, weighIns: daily.length, spanDays };
}

/** Measured trend vs goal rate. Never "onTrack" when moving the wrong way. */
export function trendStatus(
  actualLbPerWeek: number | null,
  goalLbPerWeek: number,
): TrendStatus {
  if (actualLbPerWeek == null) return "notEnoughData";
  if (Math.abs(goalLbPerWeek) < 0.01) {
    return Math.abs(actualLbPerWeek) <= 0.25 ? "onTrack" : "drifting";
  }
  const progress = goalLbPerWeek > 0 ? actualLbPerWeek : -actualLbPerWeek;
  if (progress < -0.05) return "wrongDirection";
  if (progress <= 0) return "behind";
  const tolerance = Math.max(0.15, Math.abs(goalLbPerWeek) * 0.3);
  const diff = progress - Math.abs(goalLbPerWeek);
  if (diff > tolerance) return "ahead";
  if (diff < -tolerance) return "behind";
  return "onTrack";
}

/**
 * Goal date text, or null. Same wording as the app. Pass
 * planRateLbPerWeek only when a Strategy program is known (not today:
 * Strategy needs Phase 1 consent), so the portal never says "at plan rate".
 */
export function goalEstimate(args: {
  goalWeightLb: number | null | undefined;
  currentWeightLb: number;
  trend: TrendRate | null;
  today: DayNum;
  planRateLbPerWeek?: number | null;
}): string | null {
  const { goalWeightLb, currentWeightLb, trend, today } = args;
  if (goalWeightLb == null) return null;
  const remaining = goalWeightLb - currentWeightLb;
  if (Math.abs(remaining) < 0.5) return "Goal reached";
  const plan = args.planRateLbPerWeek ?? null;
  if (plan != null) {
    if (Math.abs(plan) < 0.01) return null;
    if (Math.sign(remaining) !== Math.sign(plan)) {
      return remaining > 0 ? "Goal is above your weight" : "Goal is below your weight";
    }
  }
  const dayIn = (weeks: number) => today + Math.round(weeks * 7);
  if (trend) {
    const toward = trend.lbPerWeek * Math.sign(remaining);
    if (toward < 0.05) return "Not heading toward goal yet";
    return `Est. ${formatDay(dayIn(Math.abs(remaining) / toward))} at your trend`;
  }
  if (plan == null) return null;
  return `Est. ${formatDay(dayIn(Math.abs(remaining) / Math.abs(plan)))} at plan rate`;
}

/**
 * The 7-day trend for every calendar day from the first weigh-in to
 * [until] (default the last weigh-in), in one pass. Same definition as
 * trendWeightAt; trend is null when the window has no weigh-in.
 */
export function dailyTrend(points: WeightPoint[], until?: DayNum): DailyTrendPoint[] {
  const daily = dailyWeights(points);
  if (daily.length === 0) return [];
  const counts = new Map<DayNum, number>();
  for (const p of points) counts.set(p.day, (counts.get(p.day) ?? 0) + 1);
  const byDay = new Map(daily.map((p) => [p.day, p.weightLb]));
  const first = daily[0].day;
  const last = Math.max(daily[daily.length - 1].day, until ?? -Infinity);
  const result: DailyTrendPoint[] = [];
  const window: (number | null)[] = [];
  let sum = 0;
  let n = 0;
  for (let d = first; d <= last; d++) {
    const w = byDay.get(d) ?? null;
    window.push(w);
    if (w != null) {
      sum += w;
      n++;
    }
    if (window.length > 7) {
      const out = window.shift();
      if (out != null) {
        sum -= out;
        n--;
      }
    }
    result.push({
      day: d,
      weighInLb: w,
      weighIns: counts.get(d) ?? 0,
      trend: n === 0 ? null : sum / n,
    });
  }
  return result;
}
