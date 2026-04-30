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
  };
}

/**
 * Server-component guard: requires a signed-in user who has a coach profile.
 *
 * Behavior:
 *   - Not signed in        → redirect to /sign-in
 *   - Signed in, not coach → redirect to /become-coach
 *   - Signed in, is coach  → returns { user, coachId, ... }
 *
 * Use at the top of any server component that needs coach context.
 */
export async function requireCoach(): Promise<CoachSession> {
  const user = await requireSessionUser();
  const coach = await getCoachForUser(user.uid);

  if (!coach) {
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
 * Verify that a given clientId is actually a client of the given coach.
 * Returns true if the client summary doc exists under
 * coaches/{coachId}/clients/{clientId}.
 *
 * Use this to gate /clients/[clientId] so coaches can't view other
 * coaches' clients by URL.
 */
export async function verifyClientBelongsToCoach(
  coachId: string,
  clientId: string,
): Promise<boolean> {
  const doc = await adminDb
    .collection("coaches")
    .doc(coachId)
    .collection("clients")
    .doc(clientId)
    .get();
  return doc.exists;
}

/**
 * Soft variant of requireCoach() for places that want to render different
 * UI based on coach status without redirecting (e.g. landing nav).
 */
export async function getCoachSessionOrNull(): Promise<CoachSession | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const coach = await getCoachForUser(user.uid);
  if (!coach) return null;
  return {
    user,
    coachId: coach.coachId,
    coachDisplayName: coach.displayName,
    inviteCode: coach.inviteCode,
  };
}