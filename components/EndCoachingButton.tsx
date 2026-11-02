"use client";

import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { functions } from "@/lib/firebase-client";

/**
 * Ends coaching for one client (endClientRelationship). Access stops
 * immediately; the athlete gets an inbox notice and keeps all their data.
 */
export default function EndCoachingButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function end() {
    setBusy(true);
    setError(null);
    try {
      const call = httpsCallable<{ clientId: string }, { success: boolean }>(
        functions,
        "endClientRelationship",
      );
      await call({ clientId });
      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError(
        (err as { message?: string })?.message || "Couldn't end coaching.",
      );
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-400 border border-red-500/30 hover:border-red-500/60 px-3 py-1.5 rounded-full transition"
      >
        End coaching
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
      <p className="text-zinc-200">
        End coaching for {clientName}? You&apos;ll lose access to their data
        right away. They&apos;ll get a notice in the app and keep everything.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={end}
          disabled={busy}
          className="bg-red-500 text-white font-semibold px-3 py-1.5 rounded-full disabled:opacity-60"
        >
          {busy ? "Ending…" : "End coaching"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="text-zinc-400 hover:text-white px-2 py-1.5"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-red-400">{error}</p>}
    </div>
  );
}
