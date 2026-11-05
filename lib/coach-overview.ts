import {
  getActiveProgram,
  getCheckins,
  getDailyIntake,
  getLatestSharedMediaTime,
  getSessions,
  getWeighIns,
  loggedDaysLast7,
} from "@/lib/coach-client-data.ts";
import { getCoachSharing, type CoachSharing } from "@/lib/coach-sharing.ts";
import { DEFAULT_WEEKDAY, checkinState, type CheckinState } from "@/lib/coach-checkins.ts";
import {
  getBestDisplayName,
  getBestEmail,
  getUserProfile,
  type ClientSummaryDoc,
} from "@/lib/coach-data";
import { lastWorkoutDay, weeklyWorkoutStats } from "@/lib/coach-insights.ts";
import { isWeekdaySchedule, weekAdherence } from "@/lib/coach-programs.ts";
import {
  dayFromStored,
  goalEstimate,
  mondayOf,
  todayDay,
  trendRate,
  trendWeightAt,
  type DayNum,
  type WeightPoint,
} from "@/lib/trend.ts";

export type FlagKey =
  | "checkinOverdue"
  | "checkinReceived"
  | "unreadMessages"
  | "noWorkout"
  | "missedSessions"
  | "noWeighIn"
  | "trendAway"
  | "lowFoodLogging"
  | "newMedia";

export type ClientFlag = {
  key: FlagKey;
  label: string;
  /** "warn" flags mean "needs attention"; "info" is a heads-up. */
  level: "warn" | "info";
};

export type ClientOverview = {
  id: string;
  /** Today on this client's calendar (their own time zone when saved). */
  today: DayNum;
  /** What the client shares; unshared data is never read. */
  sharing: CoachSharing;
  /** Completed days of the last 7 with food logged (nutrition shared only). */
  foodLoggedDays: number | null;
  name: string;
  email: string;
  lastWorkoutDay: DayNum | null;
  daysSinceWorkout: number | null;
  workoutsThisWeek: number;
  /** Planned program sessions this week (weekday programs), else the 4-week average. */
  target:
    | { kind: "program"; programName: string; planned: number; completed: number; missed: number }
    | { kind: "average"; avgPerWeek: number; programName: string | null };
  trendWeight: number | null;
  rateLbPerWeek: number | null;
  goalWeight: number | null;
  goalText: string | null;
  lastWeighInDay: DayNum | null;
  /** Weekly check-in state (check-ins shared only). */
  checkin: CheckinState | null;
  /** Client messages the coach hasn't read. */
  unreadMessages: number;
  flags: ClientFlag[];
  needsAttention: boolean;
  /** Higher = more urgent; used for sorting. */
  score: number;
};

export function weighInPoints(logs: { logDate?: string; weight?: number }[]): WeightPoint[] {
  const out: WeightPoint[] = [];
  for (const l of logs) {
    const day = dayFromStored(l.logDate);
    if (day != null && typeof l.weight === "number") out.push({ day, weightLb: l.weight });
  }
  return out;
}

/**
 * Everything the dashboard row needs, from a few small field-limited
 * reads. Only categories the client shares are read at all.
 */
export async function getClientOverview(
  clientId: string,
  summary: ClientSummaryDoc & { coachLastViewedLocal?: string },
): Promise<ClientOverview> {
  const [profile, sharing] = await Promise.all([
    getUserProfile(clientId),
    getCoachSharing(clientId),
  ]);
  const today = todayDay(profile?.timeZone);
  const [sessions, logs, program, latestShared, intake, checkins] = await Promise.all([
    sharing.workouts ? getSessions(clientId, 60, "light") : Promise.resolve([]),
    sharing.body ? getWeighIns(clientId, 40) : Promise.resolve([]),
    sharing.workouts ? getActiveProgram(clientId) : Promise.resolve(null),
    sharing.photos || sharing.videos
      ? getLatestSharedMediaTime(clientId, sharing)
      : Promise.resolve(null),
    sharing.nutrition ? getDailyIntake(clientId, today, 8) : Promise.resolve(null),
    sharing.checkins ? getCheckins(clientId, 1) : Promise.resolve([]),
  ]);
  const foodLoggedDays = intake ? loggedDaysLast7(intake, today) : null;

  const last = lastWorkoutDay(sessions);
  const daysSinceWorkout = last == null ? null : today - last;
  const { thisWeek, avgPrev4 } = weeklyWorkoutStats(sessions, today);

  let target: ClientOverview["target"];
  let missedThisWeek = 0;
  if (program && isWeekdaySchedule(program)) {
    const wk = weekAdherence(program, mondayOf(today), today);
    missedThisWeek = wk.missed;
    target = {
      kind: "program",
      programName: program.name ?? "Program",
      planned: wk.planned ?? 0,
      completed: wk.completed,
      missed: wk.missed,
    };
  } else {
    target = { kind: "average", avgPerWeek: avgPrev4, programName: program?.name ?? null };
  }

  const points = weighInPoints(logs);
  const trend = trendRate(points, today);
  const trendWeight = trendWeightAt(points, today);
  const lastWeighInDay = points.length ? Math.max(...points.map((p) => p.day)) : null;
  const goalWeight =
    sharing.body && typeof profile?.goalWeight === "number" ? profile.goalWeight : null;
  const current = trendWeight ?? (points.length ? points[0].weightLb : null);
  const goalText =
    current != null
      ? goalEstimate({ goalWeightLb: goalWeight, currentWeightLb: current, trend, today })
      : null;

  const flags: ClientFlag[] = [];
  if (sharing.workouts && (daysSinceWorkout == null || daysSinceWorkout >= 5)) {
    flags.push({
      key: "noWorkout",
      label: daysSinceWorkout == null ? "No workouts yet" : `No workout in ${daysSinceWorkout} days`,
      level: "warn",
    });
  }
  if (missedThisWeek > 0) {
    flags.push({
      key: "missedSessions",
      label: `Missed ${missedThisWeek} program session${missedThisWeek === 1 ? "" : "s"} this week`,
      level: "warn",
    });
  }
  if (sharing.body && (lastWeighInDay == null || today - lastWeighInDay >= 7)) {
    flags.push({
      key: "noWeighIn",
      label: lastWeighInDay == null ? "No weigh-ins yet" : `No weigh-in in ${today - lastWeighInDay} days`,
      level: "warn",
    });
  }
  if (goalWeight != null && current != null && trend) {
    const remaining = goalWeight - current;
    if (Math.abs(remaining) >= 0.5 && trend.lbPerWeek * Math.sign(remaining) < -0.05) {
      flags.push({
        key: "trendAway",
        label: `Weight trending away from goal (${trend.lbPerWeek > 0 ? "+" : ""}${trend.lbPerWeek.toFixed(2)} lb/wk)`,
        level: "warn",
      });
    }
  }
  if (foodLoggedDays != null && foodLoggedDays < 4) {
    flags.push({
      key: "lowFoodLogging",
      label: `Food logged ${foodLoggedDays} of the last 7 days`,
      level: "warn",
    });
  }
  const checkin = sharing.checkins
    ? checkinState(
        typeof summary.checkinWeekday === "number" ? summary.checkinWeekday : DEFAULT_WEEKDAY,
        today,
        checkins.length ? { day: checkins[0].day, replied: checkins[0].replied } : null,
      )
    : null;
  if (checkin?.kind === "overdue" && checkins.length > 0) {
    flags.push({ key: "checkinOverdue", label: `Check-in overdue ${checkin.daysLate} day${checkin.daysLate === 1 ? "" : "s"}`, level: "warn" });
  } else if (checkin?.kind === "received" && !checkin.replied) {
    flags.push({ key: "checkinReceived", label: "Check-in to review", level: "info" });
  }
  const unreadMessages = Math.max(0, summary.unreadByCoach ?? 0);
  if (unreadMessages > 0) {
    flags.push({
      key: "unreadMessages",
      label: `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`,
      level: "info",
    });
  }
  const lastViewed =
    summary.coachLastViewedLocal ??
    (typeof summary.linkedAt === "string" ? summary.linkedAt : null);
  if (latestShared && (!lastViewed || latestShared > lastViewed)) {
    flags.push({ key: "newMedia", label: "New shared media", level: "info" });
  }

  const weights: Record<FlagKey, number> = {
    checkinOverdue: 2,
    checkinReceived: 1,
    unreadMessages: 1,
    missedSessions: 4,
    noWorkout: 3,
    trendAway: 2,
    noWeighIn: 2,
    lowFoodLogging: 2,
    newMedia: 1,
  };
  const score = flags.reduce((sum, f) => sum + weights[f.key], 0);

  return {
    id: clientId,
    today,
    sharing,
    foodLoggedDays,
    name: getBestDisplayName(summary, profile),
    email: getBestEmail(summary, profile),
    lastWorkoutDay: last,
    daysSinceWorkout,
    workoutsThisWeek: thisWeek,
    target,
    trendWeight,
    rateLbPerWeek: trend?.lbPerWeek ?? null,
    goalWeight,
    goalText,
    lastWeighInDay,
    checkin,
    unreadMessages,
    flags,
    needsAttention: flags.some((f) => f.level === "warn"),
    score,
  };
}

/** "Today", "Yesterday", "3 days ago", "2w ago". */
export function relativeDay(day: DayNum | null, today: DayNum): string {
  if (day == null) return "Never";
  const diff = today - day;
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 14) return `${diff} days ago`;
  return `${Math.floor(diff / 7)}w ago`;
}
