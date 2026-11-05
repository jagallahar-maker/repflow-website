"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase-client";

// functions/src/coachMessages.ts
const _send = httpsCallable(functions, "sendCoachMessage");
const _markRead = httpsCallable(functions, "markThreadRead");
const _setDay = httpsCallable(functions, "setClientCheckinDay");

export async function sendCoachMessage(args: {
  clientId: string;
  text: string;
  checkinId?: string;
}): Promise<void> {
  await _send(args);
}

export async function markThreadRead(clientId: string): Promise<void> {
  await _markRead({ clientId });
}

export async function setClientCheckinDay(clientId: string, weekday: number): Promise<void> {
  await _setDay({ clientId, weekday });
}

/** The server's message for a failed callable ("Messages can be up to…"). */
export function callableError(err: unknown, fallback: string): string {
  const m = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "";
  return m && !m.startsWith("internal") ? m.replace(/^[a-z-]+: /, "") : fallback;
}
