import { adminDb } from "@/lib/firebase-admin";
import { getCoachClients } from "@/lib/coach-data";
import { verifyClientBelongsToCoach } from "@/lib/coach-session";
import { getCoachSharing } from "@/lib/coach-sharing";
import type {
  StoredProgram,
  StoredRoutine,
} from "@/lib/routine-format";

/**
 * Server reads of the coach's library (coaches/{c}/routines and
 * /programs, written by functions/src/coachLibrary.ts). Timestamps become
 * ISO strings so pages can pass them to client components.
 */

export type LibraryRoutine = StoredRoutine & {
  id: string;
  version: number;
  updatedAt: string | null;
};

export type LibraryProgram = StoredProgram & {
  id: string;
  routineIds: string[];
  version: number;
  updatedAt: string | null;
};

function iso(v: unknown): string | null {
  const t = v as { toDate?: () => Date } | null;
  return t && typeof t.toDate === "function" ? t.toDate().toISOString() : null;
}

function coach(coachId: string) {
  return adminDb.collection("coaches").doc(coachId);
}

export async function listCoachRoutines(coachId: string): Promise<LibraryRoutine[]> {
  const snap = await coach(coachId).collection("routines").get();
  return snap.docs
    .map((d) => routineOf(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCoachRoutine(
  coachId: string,
  id: string,
): Promise<LibraryRoutine | null> {
  const d = await coach(coachId).collection("routines").doc(id).get();
  return d.exists ? routineOf(d.id, d.data() ?? {}) : null;
}

export async function listCoachPrograms(coachId: string): Promise<LibraryProgram[]> {
  const snap = await coach(coachId).collection("programs").get();
  return snap.docs
    .map((d) => programOf(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCoachProgram(
  coachId: string,
  id: string,
): Promise<LibraryProgram | null> {
  const d = await coach(coachId).collection("programs").doc(id).get();
  return d.exists ? programOf(d.id, d.data() ?? {}) : null;
}

/** Ids in use by an assignment (Phase 5b); deleting them is blocked. */
export async function assignedIds(coachId: string): Promise<Set<string>> {
  const snap = await coach(coachId).collection("assignments").get();
  const ids = new Set<string>();
  for (const d of snap.docs) {
    const p = d.get("programId");
    if (typeof p === "string") ids.add(p);
    for (const r of (d.get("routineIds") as string[] | undefined) ?? []) ids.add(r);
  }
  return ids;
}

function routineOf(id: string, d: Record<string, unknown>): LibraryRoutine {
  return {
    id,
    name: String(d.name ?? "Routine"),
    category: String(d.category ?? "Custom"),
    notes: (d.notes as string | null) ?? null,
    exercises: (d.exercises as StoredRoutine["exercises"]) ?? [],
    estimatedDurationMinutes: Number(d.estimatedDurationMinutes ?? 0),
    formatVersion: 1,
    version: Number(d.version ?? 1),
    updatedAt: iso(d.updatedAt),
  };
}

function programOf(id: string, d: Record<string, unknown>): LibraryProgram {
  return {
    id,
    name: String(d.name ?? "Program"),
    notes: (d.notes as string | null) ?? null,
    durationWeeks: Number(d.durationWeeks ?? 8),
    schedule: (d.schedule as StoredProgram["schedule"]) ?? [],
    routineIds: (d.routineIds as string[]) ?? [],
    version: Number(d.version ?? 1),
    updatedAt: iso(d.updatedAt),
  };
}

/** coaches/{c}/assignments/{clientId} (functions/src/coachAssign.ts). */
export type ClientAssignment = {
  program: { programId: string; version: number } | null;
  routines: { routineId: string; version: number }[];
};

export async function getAssignment(
  coachId: string,
  clientId: string,
): Promise<ClientAssignment> {
  const d = await coach(coachId).collection("assignments").doc(clientId).get();
  const program = d.get("program") as { programId?: string; version?: number } | undefined;
  const routines = (d.get("routines") as Record<string, { version?: number }> | undefined) ?? {};
  return {
    program: program?.programId
      ? { programId: program.programId, version: Number(program.version ?? 1) }
      : null,
    routines: Object.entries(routines).map(([routineId, r]) => ({
      routineId,
      version: Number(r?.version ?? 1),
    })),
  };
}

/** The first build that can receive coach programs (coachAssign.ts). */
export const MIN_MANAGED_BUILD = 21;

/** An active client as the AI draft dialog lists them. */
export type DraftClient = {
  id: string;
  name: string;
  /** "AI summaries" switch (their data can go to the AI). */
  aiSummaries: boolean;
  /** Categories that switch shares (workouts, body, nutrition). */
  shares: string[];
};

/** Active clients with their AI sharing (for Build with AI). */
export async function listDraftClients(coachId: string): Promise<DraftClient[]> {
  const clients = await getCoachClients(coachId);
  const rows = await Promise.all(
    clients.map(async (c): Promise<DraftClient | null> => {
      if (!(await verifyClientBelongsToCoach(coachId, c.id))) return null;
      const s = await getCoachSharing(c.id);
      return {
        id: c.id,
        name: c.displayName || "Unnamed client",
        aiSummaries: s.aiSummaries,
        shares: ["workouts", "body", "nutrition"].filter((k) => s[k as "workouts" | "body" | "nutrition"]),
      };
    }),
  );
  return rows
    .filter((r): r is DraftClient => r != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}
