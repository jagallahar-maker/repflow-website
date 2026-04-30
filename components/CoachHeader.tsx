"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";

type CoachHeaderProps = {
  coachId: string;
  coachDisplayName: string;
};

export default function CoachHeader({
  coachId,
  coachDisplayName,
}: CoachHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    // The auth context will clear the cookie via /api/auth/session DELETE.
    // Push to landing page after a brief delay so the cookie clear lands.
    await new Promise((r) => setTimeout(r, 200));
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 -mx-6 mb-6 bg-black/80 backdrop-blur border-b border-zinc-900">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <Link
          href="/clients"
          className="flex items-center gap-3 group"
        >
          <span className="font-bold text-lg tracking-tight">Repflow</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400 group-hover:text-white transition text-sm">
            Coach Dashboard
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm text-white">{coachDisplayName}</span>
            <span className="text-xs text-zinc-500 font-mono">
              @{coachId}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-400 hover:text-white transition border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-full"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}