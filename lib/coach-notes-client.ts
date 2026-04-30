"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase-client";

const _addCoachNote = httpsCallable(functions, "addCoachNote");
const _updateCoachNote = httpsCallable(functions, "updateCoachNote");
const _deleteCoachNote = httpsCallable(functions, "deleteCoachNote");

export async function addCoachNote(args: {
  clientId: string;
  text: string;
  visibleToAthlete: boolean;
}): Promise<{ noteId: string }> {
  const result = await _addCoachNote(args);
  return result.data as { noteId: string };
}

export async function updateCoachNote(args: {
  clientId: string;
  noteId: string;
  text?: string;
  visibleToAthlete?: boolean;
}): Promise<void> {
  await _updateCoachNote(args);
}

export async function deleteCoachNote(args: {
  clientId: string;
  noteId: string;
}): Promise<void> {
  await _deleteCoachNote(args);
}