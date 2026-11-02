import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { dayFromStored, dayKey, timeZoneCandidates, type DayNum } from "@/lib/trend.ts";
import type { ProgramDoc } from "@/lib/coach-programs.ts";
import type { SessionDoc } from "@/lib/coach-insights.ts";

/**
 * Field-limited reads for the coach portal. Every query names its fields
 * (select / fieldMask): activity sessions also hold GPS route points and
 * heart-rate samples, which the portal never needs and never reads.
 * Callers must check verifyClientBelongsToCoach first: the Admin SDK
 * bypasses Firestore rules.
 */

const SESSION_LIGHT = ["startTime", "createdAt", "category", "completed", "isBackdated"];
const SESSION_DETAIL = [
  ...SESSION_LIGHT,
  "workoutName",
  "activityType",
  "durationSeconds",
  "distanceMeters",
  "calories",
  "totalSets",
  "totalVolume",
  "exercises",
  "source",
];
const PROGRAM_FIELDS = [
  "name",
  "sessions",
  "scheduleType",
  "startDate",
  "scheduleStartsOn",
  "createdAt",
  "durationWeeks",
  "isActive",
];

export type WeighInDoc = { logDate?: string; weight?: number };

function userCol(clientId: string, name: string) {
  return adminDb.collection("users").doc(clientId).collection(name);
}

/** Newest first. "light" = enough for counts and last-workout dates. */
export async function getSessions(
  clientId: string,
  limit: number,
  detail: "light" | "full",
): Promise<SessionDoc[]> {
  const snap = await userCol(clientId, "activity_sessions")
    .orderBy("startTime", "desc")
    .limit(limit)
    .select(...(detail === "full" ? SESSION_DETAIL : SESSION_LIGHT))
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SessionDoc) }));
}

/** Newest first. */
export async function getWeighIns(clientId: string, limit: number): Promise<WeighInDoc[]> {
  const snap = await userCol(clientId, "bodyweight_logs")
    .orderBy("logDate", "desc")
    .limit(limit)
    .select("logDate", "weight")
    .get();
  return snap.docs.map((d) => d.data() as WeighInDoc);
}

/** The client's active workout program, if any. */
export async function getActiveProgram(clientId: string): Promise<ProgramDoc | null> {
  const snap = await userCol(clientId, "workout_programs")
    .where("isActive", "==", true)
    .limit(3)
    .select(...PROGRAM_FIELDS)
    .get();
  const doc = snap.docs.find((d) => Array.isArray(d.data().sessions));
  return doc ? ({ id: doc.id, ...(doc.data() as Omit<ProgramDoc, "id">) }) : null;
}

/**
 * Latest time a photo or video was shared (uploaded or switched to shared),
 * as the app's local wall-clock string, or null. Uses the existing
 * (sharedWithCoach, date) indexes; checks the newest few of each.
 */
export async function getLatestSharedMediaTime(
  clientId: string,
  kinds: { photos: boolean; videos: boolean } = { photos: true, videos: true },
): Promise<string | null> {
  const pick = async (col: string) => {
    const snap = await userCol(clientId, col)
      .where("sharedWithCoach", "==", true)
      .orderBy("date", "desc")
      .limit(5)
      .select("createdAt", "updatedAt")
      .get();
    let latest: string | null = null;
    for (const d of snap.docs) {
      for (const v of [d.get("createdAt"), d.get("updatedAt")]) {
        if (typeof v === "string" && (latest == null || v > latest)) latest = v;
      }
    }
    return latest;
  };
  const [photo, video] = await Promise.all([
    kinds.photos ? pick("progress_photos") : Promise.resolve(null),
    kinds.videos ? pick("progress_videos") : Promise.resolve(null),
  ]);
  if (photo == null) return video;
  if (video == null) return photo;
  return photo > video ? photo : video;
}

/**
 * Now as a wall-clock ISO string in the client's time zone (their saved
 * timeZone, else COACH_CLIENT_TIME_ZONE), comparable with the app's
 * stored local strings.
 */
export function nowLocalIso(timeZone?: string | null): string {
  for (const tz of timeZoneCandidates(timeZone)) {
    try {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        })
          .formatToParts(new Date())
          .map((p) => [p.type, p.value]),
      );
      return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.000`;
    } catch {
      // Unknown time zone name: try the next one.
    }
  }
  return new Date().toISOString().replace("Z", "");
}

/**
 * Records the coach's visit: the roster's last-visit time (drives the
 * "new shared media" flag) and an entry in the athlete's access log
 * (users/{uid}/coach_access_log, server-only; the app shows "Last viewed
 * by your coach").
 */
export async function markCoachViewed(
  coachId: string,
  clientId: string,
  timeZone?: string | null,
): Promise<void> {
  try {
    await adminDb
      .collection("users")
      .doc(clientId)
      .collection("coach_access_log")
      .add({
        coachId,
        kind: "view",
        detail: "client page",
        source: "website",
        at: FieldValue.serverTimestamp(),
      });
  } catch (e) {
    console.error("coach access log failed", e);
  }
  try {
    await adminDb
      .collection("coaches")
      .doc(coachId)
      .collection("clients")
      .doc(clientId)
      .update({
        coachLastViewedAt: FieldValue.serverTimestamp(),
        coachLastViewedLocal: nowLocalIso(timeZone),
      });
  } catch (e) {
    console.error("markCoachViewed failed", e);
  }
}

// ── Body measurements (body switch) ───────────────────────────────────────

export type MeasurementEntry = { bodyPart: string; day: DayNum; inches: number };

/** Head-to-toe, same keys as the app's BodyPartInfo. */
export const MEASUREMENT_SITES: { key: string; name: string }[] = [
  { key: "neck", name: "Neck" },
  { key: "shoulders", name: "Shoulders" },
  { key: "chest", name: "Chest" },
  { key: "leftArm", name: "Left Arm" },
  { key: "rightArm", name: "Right Arm" },
  { key: "leftForearm", name: "Left Forearm" },
  { key: "rightForearm", name: "Right Forearm" },
  { key: "waist", name: "Waist" },
  { key: "hips", name: "Hips" },
  { key: "leftThigh", name: "Left Thigh" },
  { key: "rightThigh", name: "Right Thigh" },
  { key: "leftCalf", name: "Left Calf" },
  { key: "rightCalf", name: "Right Calf" },
];

/** All measurements, oldest first, in inches (legacy cm converted like the app). */
export async function getMeasurements(clientId: string): Promise<MeasurementEntry[]> {
  const snap = await userCol(clientId, "body_measurements")
    .select("bodyPart", "value", "unit", "measurementDate")
    .get();
  const out: MeasurementEntry[] = [];
  for (const d of snap.docs) {
    const value = d.get("value");
    const day = dayFromStored(d.get("measurementDate"));
    const bodyPart = d.get("bodyPart");
    if (typeof value !== "number" || day == null || typeof bodyPart !== "string") continue;
    const cm = String(d.get("unit") ?? "").toLowerCase() === "cm";
    out.push({ bodyPart, day, inches: cm ? Math.round((value / 2.54) * 100) / 100 : value });
  }
  return out.sort((a, b) => a.day - b.day);
}

// ── Nutrition (nutrition switch) ──────────────────────────────────────────

export type StrategyDoc = {
  name?: string;
  goalType?: string;
  goalRateLbPerWeek?: number;
  currentCalorieTarget?: number;
  currentProteinTarget?: number;
  currentCarbsTarget?: number;
  currentFatTarget?: number;
  currentTdeeEstimate?: number;
  startDate?: string;
};

/** The client's active Diet → Strategy program, if any. */
export async function getActiveStrategy(clientId: string): Promise<StrategyDoc | null> {
  const snap = await userCol(clientId, "coached_programs")
    .where("isActive", "==", true)
    .limit(1)
    .select(
      "name",
      "goalType",
      "goalRateLbPerWeek",
      "currentCalorieTarget",
      "currentProteinTarget",
      "currentCarbsTarget",
      "currentFatTarget",
      "currentTdeeEstimate",
      "startDate",
    )
    .get();
  return snap.empty ? null : (snap.docs[0].data() as StrategyDoc);
}

export type DayIntake = { kcal: number; protein: number; carbs: number; fat: number };

/**
 * Food totals per day for the [days] days ending [today], from
 * users/{uid}/meals (dated) + meal_foods (by mealId). Supplements aren't
 * food and are left out. Days without entries are missing from the map.
 */
export async function getDailyIntake(
  clientId: string,
  today: DayNum,
  days: number,
): Promise<Map<DayNum, DayIntake>> {
  const from = today - (days - 1);
  const meals = await userCol(clientId, "meals")
    .where("date", ">=", dayKey(from))
    .select("date", "mealType")
    .get();
  const dayByMeal = new Map<string, DayNum>();
  for (const m of meals.docs) {
    if (m.get("mealType") === "supplements") continue;
    const day = dayFromStored(m.get("date"));
    if (day != null && day >= from && day <= today) dayByMeal.set(m.id, day);
  }
  const ids = [...dayByMeal.keys()];
  const out = new Map<DayNum, DayIntake>();
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const foods = await userCol(clientId, "meal_foods")
      .where("mealId", "in", chunk)
      .select("mealId", "calories", "protein", "carbs", "fat")
      .get();
    for (const f of foods.docs) {
      const day = dayByMeal.get(f.get("mealId"));
      if (day == null) continue;
      const t = out.get(day) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      t.kcal += Number(f.get("calories")) || 0;
      t.protein += Number(f.get("protein")) || 0;
      t.carbs += Number(f.get("carbs")) || 0;
      t.fat += Number(f.get("fat")) || 0;
      out.set(day, t);
    }
  }
  return out;
}

/** Completed days (before today) in the last 7 with food logged. */
export function loggedDaysLast7(intake: Map<DayNum, DayIntake>, today: DayNum): number {
  let n = 0;
  for (let d = today - 7; d < today; d++) if ((intake.get(d)?.kcal ?? 0) > 0) n++;
  return n;
}
