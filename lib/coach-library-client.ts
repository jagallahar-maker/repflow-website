"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase-client";

/** Coach library callables (functions/src/coachLibrary.ts). */

const call = <T>(name: string) => {
  const fn = httpsCallable(functions, name);
  return async (data: unknown): Promise<T> => (await fn(data)).data as T;
};

export const saveCoachRoutine = call<{ id: string; version: number }>("saveCoachRoutine");
export const duplicateCoachRoutine = call<{ id: string }>("duplicateCoachRoutine");
export const deleteCoachRoutine = call<{ ok: boolean }>("deleteCoachRoutine");
export const saveCoachProgram = call<{ id: string; version: number }>("saveCoachProgram");
export const duplicateCoachProgram = call<{ id: string }>("duplicateCoachProgram");
export const deleteCoachProgram = call<{ ok: boolean }>("deleteCoachProgram");

/** A callable error's message (the server's validation text). */
export function errorText(err: unknown): string {
  const e = err as { message?: string; details?: { errors?: string[] } };
  if (e?.details?.errors?.length) return e.details.errors.join(" ");
  return e?.message || "Something went wrong. Try again.";
}

export const assignProgramToClient = call<{ clientProgramId: string }>("assignProgramToClient");
export const assignRoutineToClient = call<{ clientRoutineId: string }>("assignRoutineToClient");
export const unassignFromClient = call<{ ok: boolean }>("unassignFromClient");

/** After a library save: who didn't get the update, and why. */
export type SaveResult = { id: string; version: number; updated?: number; skipped?: string[] };

const _aiBuildCoachDraft = httpsCallable(functions, "aiBuildCoachDraft", { timeout: 300000 });
const _aiStatus = httpsCallable(functions, "aiStatus");

/** aiBuildCoachDraft (functions/src/ai/coachBuild.ts): a plan to edit. */
export async function aiBuildCoachDraft(data: unknown): Promise<{
  plan: import("@/lib/ai-draft").AiPlanJson;
  remaining: number;
  usedClientData: boolean;
}> {
  return (await _aiBuildCoachDraft(data)).data as never;
}

/** Coach AI drafts left this month (null if AI is off or unknown). */
export async function coachDraftsLeft(): Promise<{ left: number | null; cap: number | null; enabled: boolean }> {
  const d = (await _aiStatus()).data as {
    enabled?: boolean;
    remaining?: { coachDraft?: number };
    caps?: { coachDraft?: number };
  };
  return {
    enabled: d.enabled !== false,
    left: d.remaining?.coachDraft ?? null,
    cap: d.caps?.coachDraft ?? null,
  };
}

const _aiCoachSummary = httpsCallable(functions, "aiCoachSummary", { timeout: 120000 });

/** aiCoachSummary (functions/src/ai/coachSummary.ts): a draft to review. */
export async function aiCoachSummary(clientId: string): Promise<{
  text: string;
  remaining: number;
  included: string[];
}> {
  return (await _aiCoachSummary({ clientId })).data as never;
}

/** Fills the client page's message composer (CoachMessagesPanel). */
export const COMPOSE_EVENT = "repflow:compose";
export function prefillMessage(text: string) {
  window.dispatchEvent(new CustomEvent(COMPOSE_EVENT, { detail: text }));
}
