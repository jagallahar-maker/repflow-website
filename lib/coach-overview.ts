import {
  getActiveProgram,
  getLatestSharedMediaTime,
  getSessions,
  getWeighIns,
} from "@/lib/coach-client-data.ts";
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
  trendRate,
  trendWeightAt,
  type DayNum,
  type WeightPoint,
} from "@/lib/trend.ts";

export type FlagKey = "noWorkout" | "missedSessions" | "noWeighIn" | "trendAway" | "newMedia";

export type ClientFlag = {
  key: FlagKey;
  label: string;
  /** "warn" flags mean "needs attention"; "info" is a heads-up. */
  level: "warn" | "info";
};

export type ClientOverview = {
  id: string;
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

/** Everything the dashboard row needs, from ~6 small field-limited reads. */
export async function getClientOverview(
  clientId: string,
  summary: ClientSummaryDoc & { coachLastViewedLocal?: string },
  today: DayNum,
): Promise<ClientOverview> {
  const [profile, sessions, logs, program, latestShared] = await Promise.all([
    getUserProfile(clientId),
    getSessions(clientId, 60, "light"),
    getWeighIns(clientId, 40),
    getActiveProgram(clientId),
    getLatestSharedMediaTime(clientId),
  ]);

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
  const goalWeight = typeof profile?.goalWeight === "number" ? profile.goalWeight : null;
  const current = trendWeight ?? (points.length ? points[0].weightLb : null);
  const goalText =
    current != null
      ? goalEstimate({ goalWeightLb: goalWeight, currentWeightLb: current, trend, today })
      : null;

  const flags: ClientFlag[] = [];
  if (daysSinceWorkout == null || daysSinceWorkout >= 5) {
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
  if (lastWeighInDay == null || today - lastWeighInDay >= 7) {
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
  const lastViewed =
    summary.coachLastViewedLocal ??
    (typeof summary.linkedAt === "string" ? summary.linkedAt : null);
  if (latestShared && (!lastViewed || latestShared > lastViewed)) {
    flags.push({ key: "newMedia", label: "New shared media", level: "info" });
  }

  const weights: Record<FlagKey, number> = {
    missedSessions: 4,
    noWorkout: 3,
    trendAway: 2,
    noWeighIn: 2,
    newMedia: 1,
  };
  const score = flags.reduce((sum, f) => sum + weights[f.key], 0);

  return {
    id: clientId,
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
