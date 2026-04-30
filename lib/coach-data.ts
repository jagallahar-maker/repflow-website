import { adminDb } from "@/lib/firebase-admin";

// ---------- Constants ----------

export const HARDCODED_COACH_ID = "coachtest2";

// ---------- Types ----------

export type ClientSummaryDoc = {
  clientId?: string;
  coachId?: string;
  displayName?: string;
  email?: string;
  status?: string;
  currentWeight?: number;
  goalWeight?: number;
  workoutsThisWeek?: number;
  lastWorkoutAt?: string | { toDate?: () => Date } | null;
  linkedAt?: string | { toDate?: () => Date } | null;
  createdAt?: string | { toDate?: () => Date } | null;
  updatedAt?: string | { toDate?: () => Date } | null;
};

export type UserProfileDoc = {
  displayName?: string;
  email?: string;
  currentWeight?: number;
  goalWeight?: number;
  coachId?: string;
  coachStatus?: string;
  coachDisplayName?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
};

export type BodyweightLogDoc = {
  id?: string;
  weight?: number;
  logDate?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string | null;
  userId?: string;
};

export type ExerciseSet = {
  reps?: number;
  weightLb?: number;
  setNumber?: number;
  isCompleted?: boolean;
};

export type Exercise = {
  exerciseId?: string;
  exerciseName?: string;
  equipment?: string;
  primaryMuscleGroup?: string;
  sets?: ExerciseSet[];
};

export type ActivitySessionDoc = {
  id?: string;
  activityType?: string;
  category?: string;
  completed?: boolean;
  calories?: number | null;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
  workoutName?: string | null;
  source?: string;
  totalSets?: number | null;
  totalVolume?: number | null;
  userId?: string;
  exercises?: Exercise[] | null;
};

export type ClientCardData = {
  id: string;
  summary: ClientSummaryDoc;
  latestWeight: number | null;
  weightChange: number | null;
  lastWorkoutDate: string | null;
  workoutsLast7Days: number;
  strengthLast7Days: number;
  cardioLast7Days: number;
};

// ---------- Coach-scoped fetchers ----------

export async function getCoachClients(
  coachId: string = HARDCODED_COACH_ID,
): Promise<Array<{ id: string } & ClientSummaryDoc>> {
  const snapshot = await adminDb
    .collection("coaches")
    .doc(coachId)
    .collection("clients")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as ClientSummaryDoc),
  }));
}

export async function getClientSummary(
  clientId: string,
  coachId: string = HARDCODED_COACH_ID,
): Promise<ClientSummaryDoc | null> {
  const doc = await adminDb
    .collection("coaches")
    .doc(coachId)
    .collection("clients")
    .doc(clientId)
    .get();

  if (!doc.exists) return null;
  return doc.data() as ClientSummaryDoc;
}

// ---------- User-scoped fetchers ----------

export async function getUserProfile(
  clientId: string,
): Promise<UserProfileDoc | null> {
  const doc = await adminDb.collection("users").doc(clientId).get();
  if (!doc.exists) return null;
  return doc.data() as UserProfileDoc;
}

export async function getRecentBodyweightLogs(
  clientId: string,
  limit = 10,
): Promise<BodyweightLogDoc[]> {
  const snapshot = await adminDb
    .collection("users")
    .doc(clientId)
    .collection("bodyweight_logs")
    .orderBy("logDate", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as BodyweightLogDoc);
}

export async function getRecentActivitySessions(
  clientId: string,
  limit = 25,
): Promise<ActivitySessionDoc[]> {
  const snapshot = await adminDb
    .collection("users")
    .doc(clientId)
    .collection("activity_sessions")
    .orderBy("startTime", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as ActivitySessionDoc);
}

// ---------- Per-client aggregation for cards ----------

export async function getClientCardData(
  clientId: string,
  summary: ClientSummaryDoc,
): Promise<ClientCardData> {
  const [bodyweightLogs, activitySessions] = await Promise.all([
    getRecentBodyweightLogs(clientId, 10),
    getRecentActivitySessions(clientId, 25),
  ]);

  return {
    id: clientId,
    summary,
    latestWeight: getLatestWeight(bodyweightLogs) ?? summary.currentWeight ?? null,
    weightChange: getWeightChangeFromOldest(bodyweightLogs),
    lastWorkoutDate: getLastWorkoutDate(activitySessions),
    workoutsLast7Days: getSevenDayWorkoutCount(activitySessions),
    strengthLast7Days: getSevenDayStrengthCount(activitySessions),
    cardioLast7Days: getSevenDayCardioCount(activitySessions),
  };
}

// ---------- Display helpers ----------

export function getBestDisplayName(
  summary: ClientSummaryDoc | null,
  profile: UserProfileDoc | null,
) {
  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    summary?.displayName ||
    profile?.displayName ||
    fullName ||
    "Unnamed Client"
  );
}

export function getBestEmail(
  summary: ClientSummaryDoc | null,
  profile: UserProfileDoc | null,
) {
  return summary?.email || profile?.email || "No email";
}

// ---------- Date helpers ----------

export function parseDate(
  value?: string | { toDate?: () => Date } | null,
): Date | null {
  if (!value) return null;

  // Handle Firestore Timestamp objects
  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      return value.toDate() ?? null;
    } catch {
      return null;
    }
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  return null;
}

export function formatDate(value?: string | { toDate?: () => Date } | null) {
  const date = parseDate(value);
  if (!date) return typeof value === "string" ? value : "N/A";
  return date.toLocaleString();
}

export function formatShortDate(
  value?: string | { toDate?: () => Date } | null,
) {
  const date = parseDate(value);
  if (!date) return typeof value === "string" ? value : "N/A";
  return date.toLocaleDateString();
}

export function formatRelativeDate(
  value?: string | { toDate?: () => Date } | null,
) {
  const date = parseDate(value);
  if (!date) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return date.toLocaleDateString();
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export function isWithinLastDays(
  value?: string | { toDate?: () => Date } | null,
  days = 7,
) {
  const date = parseDate(value);
  if (!date) return false;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const maxMs = days * 24 * 60 * 60 * 1000;

  return diffMs >= 0 && diffMs <= maxMs;
}

// ---------- Format helpers ----------

export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "N/A";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

export function formatDistanceMiles(distanceMeters?: number | null) {
  if (!distanceMeters || distanceMeters <= 0) return "N/A";
  return `${(distanceMeters / 1609.34).toFixed(2)} mi`;
}

export function formatCalories(calories?: number | null) {
  if (calories == null) return "N/A";
  return `${Math.round(calories)} kcal`;
}

export function formatWeight(weight?: number | null) {
  if (weight == null) return "N/A";
  return `${weight} lb`;
}

export function formatWeightChange(change?: number | null) {
  if (change == null) return "N/A";
  if (change === 0) return "0.0 lb";

  const prefix = change > 0 ? "+" : "";
  return `${prefix}${change.toFixed(1)} lb`;
}

// ---------- Session helpers ----------

export function getSessionTitle(session: ActivitySessionDoc) {
  return (
    session.workoutName ||
    session.activityType ||
    session.category ||
    "Activity Session"
  );
}

export function getSessionSubtitle(session: ActivitySessionDoc) {
  if (session.category === "strength") {
    return `Strength Workout • ${session.totalSets ?? 0} sets • ${session.totalVolume ?? 0} lb volume`;
  }

  if (session.category === "cardio") {
    return `Cardio • ${formatDistanceMiles(session.distanceMeters)} • ${formatDuration(session.durationSeconds)}`;
  }

  return session.activityType || "Activity";
}

export function getCompletedExercisesCount(session: ActivitySessionDoc) {
  if (!session.exercises || !Array.isArray(session.exercises)) return 0;
  return session.exercises.length;
}

// ---------- Aggregation helpers ----------

export function getSevenDayWorkoutCount(sessions: ActivitySessionDoc[]) {
  return sessions.filter(
    (session) => session.completed && isWithinLastDays(session.startTime, 7),
  ).length;
}

export function getSevenDayStrengthCount(sessions: ActivitySessionDoc[]) {
  return sessions.filter(
    (session) =>
      session.completed &&
      session.category === "strength" &&
      isWithinLastDays(session.startTime, 7),
  ).length;
}

export function getSevenDayCardioCount(sessions: ActivitySessionDoc[]) {
  return sessions.filter(
    (session) =>
      session.completed &&
      session.category === "cardio" &&
      isWithinLastDays(session.startTime, 7),
  ).length;
}

export function getLastWorkoutDate(sessions: ActivitySessionDoc[]) {
  const latestCompleted = sessions.find((session) => session.completed);
  return latestCompleted?.startTime || latestCompleted?.createdAt || null;
}

export function getLatestWeight(logs: BodyweightLogDoc[]) {
  return logs[0]?.weight ?? null;
}

export function getWeightChangeFromOldest(logs: BodyweightLogDoc[]) {
  if (logs.length < 2) return null;

  const latest = logs[0]?.weight;
  const oldest = logs[logs.length - 1]?.weight;

  if (latest == null || oldest == null) return null;

  return latest - oldest;
}

// ---------- Status helpers ----------

export function getStatusColor(status?: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "active") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (normalized === "inactive") return "bg-zinc-700/40 text-zinc-400 border-zinc-700";
  if (normalized === "pending") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (normalized === "paused") return "bg-blue-500/20 text-blue-400 border-blue-500/30";

  return "bg-zinc-700/40 text-zinc-400 border-zinc-700";
}