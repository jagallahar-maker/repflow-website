"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase-client";

export type SharedMediaItem = {
  id: string;
  mediaType: "photo" | "video";
  poseType: string | null;
  note: string | null;
  takenAt: string | null;
  signedUrl: string;
  thumbnailSignedUrl: string;
  expiresAt: string;
  createdAt: string | null;
  durationSeconds?: number | null;
};

export type SharedMediaPage = {
  items: SharedMediaItem[];
  nextCursor: string | null;
};

const _getSharedClientMedia = httpsCallable(functions, "getSharedClientMedia");

export async function getSharedClientMedia(args: {
  clientId: string;
  cursor?: string | null;
  limit?: number;
  mediaType?: "photo" | "video";
}): Promise<SharedMediaPage> {
  const result = await _getSharedClientMedia({
    clientId: args.clientId,
    cursor: args.cursor ?? null,
    limit: args.limit ?? 24,
    ...(args.mediaType ? { mediaType: args.mediaType } : {}),
  });
  return result.data as SharedMediaPage;
}