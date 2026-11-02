"use client";

import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { functions } from "@/lib/firebase-client";

/**
 * The coach's invite code with Copy and Rotate. Rotating issues a new
 * code; the old one stops working for new athletes. Existing clients
 * stay connected.
 */
export default function InviteCodeCard({ inviteCode }: { inviteCode: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState(inviteCode);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Copied");
    } catch {
      setMessage("Couldn't copy. Select the code instead.");
    }
  }

  async function rotate() {
    setBusy(true);
    setMessage(null);
    try {
      const call = httpsCallable<Record<string, never>, { inviteCode: string }>(
        functions,
        "rotateInviteCode",
      );
      const res = await call({});
      setCode(res.data.inviteCode);
      setMessage("New code ready. The old code no longer works.");
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setMessage(
        (err as { message?: string })?.message || "Couldn't rotate the code.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-zinc-400">Invite code</div>
          <div className="mt-1 text-2xl font-bold font-mono tracking-wider">
            {code ?? "—"}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Athletes (18+) enter this in the Repflow app: Account → Coach.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copy}
            disabled={!code}
            className="text-sm border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-full transition disabled:opacity-40"
          >
            Copy
          </button>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-sm border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-full transition"
            >
              Rotate
            </button>
          ) : (
            <>
              <button
                onClick={rotate}
                disabled={busy}
                className="text-sm bg-amber-500 text-black font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-60"
              >
                {busy ? "Rotating…" : "Confirm new code"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="text-sm text-zinc-400 hover:text-white px-2 py-1.5"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      {confirming && !busy && (
        <p className="mt-3 text-xs text-amber-400">
          The current code will stop working for new athletes. Clients already
          connected stay connected.
        </p>
      )}
      {message && <p className="mt-3 text-xs text-zinc-400">{message}</p>}
    </div>
  );
}
