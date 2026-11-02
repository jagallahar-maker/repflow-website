import { adminDb } from "@/lib/firebase-admin";

/**
 * What the athlete shares with their coach: users/{uid}/coach_sharing/
 * current, written by the athlete in the app. Missing doc / field = the
 * defaults (what coaches could already see before the switches). Mirrors
 * functions/src/coachSharing.ts; keep them in step.
 *
 * Every per-client read on the website must check the matching switch
 * (on top of verifyClientBelongsToCoach): the Admin SDK bypasses rules.
 */
export type CoachSharing = {
  workouts: boolean;
  /** Weight, goal weight, measurements, body fat. */
  body: boolean;
  /** Food log + Strategy. */
  nutrition: boolean;
  photos: boolean;
  videos: boolean;
  checkins: boolean;
  aiSummaries: boolean;
};

export const COACH_SHARING_DEFAULTS: CoachSharing = {
  workouts: true,
  body: true,
  nutrition: false,
  photos: true,
  videos: true,
  checkins: true,
  aiSummaries: false,
};

export async function getCoachSharing(clientId: string): Promise<CoachSharing> {
  const snap = await adminDb
    .collection("users")
    .doc(clientId)
    .collection("coach_sharing")
    .doc("current")
    .get();
  const data = snap.data() ?? {};
  const out: CoachSharing = { ...COACH_SHARING_DEFAULTS };
  for (const key of Object.keys(out) as (keyof CoachSharing)[]) {
    if (typeof data[key] === "boolean") out[key] = data[key];
  }
  return out;
}
