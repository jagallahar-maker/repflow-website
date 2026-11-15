"use client";

import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { functions } from "@/lib/firebase-client";

/**
 * Past clients: lets someone the coach ended connect again with the
 * coach's invite code (allowClientReconnect). Until then the code refuses
 * them. It's a one-time pass: if they reconnect and the coach ends it
 * again, they're blocked again.
 */
export default function AllowReconnectButton({
  clientId,
  allowed,
}: {
  clientId: string;
  allowed: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(allowed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return <span className="text-xs text-zinc-500">Can reconnect</span>;
  }

  async function allow() {
    setBusy(true);
    setError(null);
    try {
      const call = httpsCallable<{ clientId: string }, { success: boolean }>(
        functions,
        "allowClientReconnect",
      );
      await call({ clientId });
      setDone(true);
      router.refresh();
    } catch (err) {
      setError((err as { message?: string })?.message || "Couldn't allow it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      <button
        onClick={allow}
        disabled={busy}
        title="They can connect again with your invite code."
        className="text-xs border border-zinc-800 hover:border-zinc-600 text-zinc-300 px-2.5 py-1 rounded-full transition disabled:opacity-60"
      >
        {busy ? "Allowing…" : "Allow to reconnect"}
      </button>
    </span>
  );
}
