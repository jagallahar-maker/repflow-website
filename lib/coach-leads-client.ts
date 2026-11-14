"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase-client";

/** The coach's lead actions (functions/src/leads.ts). */

const call = <T>(name: string) => {
  const fn = httpsCallable<Record<string, unknown>, T>(functions, name, { timeout: 30000 });
  return async (data: Record<string, unknown>) => (await fn(data)).data;
};

export const updateLead = call<{ status: string }>("updateLead");
export const deleteLead = call<{ ok: boolean }>("deleteLead");
export const setLeadPlan = call<{ planProgramId: string | null }>("setLeadPlan");
export const createLeadInvite = call<{ code: string; expiresAt: string }>("createLeadInvite");
export const setIntakeEnabled = call<{ enabled: boolean }>("setIntakeEnabled");
