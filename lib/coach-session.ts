import { adminDb } from "@/lib/firebase-admin";
import { getSessionUser, requireSessionUser, type SessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export type CoachSession = {
  user: SessionUser;
  coachId: string;
  coachDisplayName: string;
  inviteCode: string | null;
};

/**
 * Find the coach doc owned by this auth user, if any.
 * Returns null if the user has no coach profile yet.
 */
export async function getCoachForUser(uid: string): Promise<{
  coachId: string;
  displayName: string;
  inviteCode: string | null;
  isActive: boolean;
} | null> {
  const snap = await adminDb
    .collection("coaches")
    .where("ownerUid", "==", uid)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  return {
    coachId: doc.id,
    displayName: (data.displayName as string) ?? "",
    inviteCode: (data.inviteCode as string) ?? null,
    isActive: data.isActive === true,
  };
}

/**
 * Server-component guard: requires a signed-in user who has a coach profile.
 *
 * Behavior:
 *   - Not signed in        → redirect to /sign-in
 *   - Signed in, not coach → redirect to /become-coach
 *   - Coach not active     → redirect to /become-coach (pending approval
 *                            or deactivated; that page explains)
 *   - Signed in, is coach  → returns { user, coachId, ... }
 *
 * Use at the top of any server component that needs coach context.
 */
export async function requireCoach(): Promise<CoachSession> {
  const user = await requireSessionUser();
  const coach = await getCoachForUser(user.uid);

  if (!coach || !coach.isActive) {
    redirect("/become-coach");
  }

  return {
    user,
    coachId: coach.coachId,
    coachDisplayName: coach.displayName,
    inviteCode: coach.inviteCode,
  };
}

/**
 * True only while clientId is an ACTIVE client of coachId: the roster
 * entry coaches/{coachId}/clients/{clientId} has status "active" AND the
 * athlete's own users/{clientId} doc still names this coach as active.
 * The user doc is what disconnecting changes, so a coach loses access the
 * moment the athlete disconnects, is removed, or moves to another coach.
 * Mirrors isActiveClient() in functions/src/index.ts.
 *
 * Gate every per-client read with this: the Admin SDK bypasses Firestore
 * rules, so this check is the only thing protecting client data.
 */
export async function verifyClientBelongsToCoach(
  coachId: string,
  clientId: string,
): Promise<boolean> {
  const [clientDoc, userSnaps] = await Promise.all([
    adminDb
      .collection("coaches")
      .doc(coachId)
      .collection("clients")
      .doc(clientId)
      .get(),
    adminDb.getAll(adminDb.collection("users").doc(clientId), {
      fieldMask: ["coachId", "coachStatus"],
    }),
  ]);
  if (!clientDoc.exists || clientDoc.data()?.status !== "active") {
    return false;
  }
  const user = userSnaps[0]?.data() ?? {};
  return user.coachId === coachId && user.coachStatus === "active";
}

/**
 * Soft variant of requireCoach() for places that want to render different
 * UI based on coach status without redirecting (e.g. landing nav).
 */
export async function getCoachSessionOrNull(): Promise<CoachSession | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const coach = await getCoachForUser(user.uid);
  if (!coach || !coach.isActive) return null;
  return {
    user,
    coachId: coach.coachId,
    coachDisplayName: coach.displayName,
    inviteCode: coach.inviteCode,
  };
}