import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { timeZoneCandidates } from "@/lib/trend.ts";
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
export async function getLatestSharedMediaTime(clientId: string): Promise<string | null> {
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
    pick("progress_photos"),
    pick("progress_videos"),
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

/** Records the coach's visit (drives the "new shared media" flag). */
export async function markCoachViewed(
  coachId: string,
  clientId: string,
  timeZone?: string | null,
): Promise<void> {
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
