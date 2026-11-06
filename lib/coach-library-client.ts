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
