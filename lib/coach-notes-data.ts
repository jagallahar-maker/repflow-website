import { adminDb } from "@/lib/firebase-admin";

export type CoachNote = {
  id: string;
  text: string;
  visibleToAthlete: boolean;
  createdAt: string | null; // ISO string for serialization
  updatedAt: string | null;
  readByAthlete: boolean;
  readAt: string | null;
};

/**
 * Convert a Firestore Timestamp (or anything date-like) to an ISO string.
 * Returns null for null/undefined or unparseable values.
 */
function toIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  // Firestore Timestamp has a toDate() method.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybe = value as any;
  if (typeof maybe?.toDate === "function") {
    try {
      const d: Date = maybe.toDate();
      return d.toISOString();
    } catch {
      return null;
    }
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

/**
 * Fetch all notes for a coach-client relationship, newest first.
 */
export async function getCoachNotes(
  coachId: string,
  clientId: string,
): Promise<CoachNote[]> {
  const snap = await adminDb
    .collection("coaches")
    .doc(coachId)
    .collection("clients")
    .doc(clientId)
    .collection("notes")
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: (data.text as string) ?? "",
      visibleToAthlete: data.visibleToAthlete === true,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
      readByAthlete: data.readByAthlete === true,
      readAt: toIso(data.readAt),
    };
  });
}