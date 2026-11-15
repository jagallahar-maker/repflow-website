"use client";

import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { functions } from "@/lib/firebase-client";

// Same format as functions/src/inviteCodes.ts customCodeProblem (the
// server also checks reserved and blocked words and whether it's taken).
// 8 is the most the app's code field takes (builds up to 29).
const CUSTOM_CODE = /^[A-Z][A-Z0-9]{5,7}$/;

/**
 * The coach's invite code with Copy, Customize and Rotate. Rotating issues
 * a new random code; Customize sets one the coach picks (setInviteCode).
 * Either way the old one stops working for new athletes and existing
 * clients stay connected. Customize shows only where `canCustomize` is
 * set (approved coaches).
 */
export default function InviteCodeCard({
  inviteCode,
  canCustomize = false,
}: {
  inviteCode: string | null;
  canCustomize?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(inviteCode);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function startEditing() {
    setDraft(code ?? "");
    setEditing(true);
    setConfirming(false);
    setMessage(null);
  }

  async function saveCustom() {
    if (!CUSTOM_CODE.test(draft)) {
      setMessage("Use 6 to 8 letters or numbers, starting with a letter.");
      return;
    }
    if (draft === code) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const call = httpsCallable<{ code: string }, { inviteCode: string }>(
        functions,
        "setInviteCode",
      );
      const res = await call({ code: draft });
      setCode(res.data.inviteCode);
      setEditing(false);
      setMessage("Saved. Your old code no longer works for new athletes.");
      router.refresh();
    } catch (err) {
      setMessage(
        (err as { message?: string })?.message || "Couldn't save the code.",
      );
    } finally {
      setBusy(false);
    }
  }

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
          {editing ? (
            <input
              value={draft}
              onChange={(e) =>
                setDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveCustom();
                if (e.key === "Escape") setEditing(false);
              }}
              disabled={busy}
              autoFocus
              aria-label="Your invite code"
              placeholder="JUSTFIT"
              className="mt-1 w-48 bg-black border border-zinc-700 focus:border-zinc-400 outline-none rounded-lg px-3 py-1 text-2xl font-bold font-mono tracking-wider"
            />
          ) : (
            <div className="mt-1 text-2xl font-bold font-mono tracking-wider">
              {code ?? "—"}
            </div>
          )}
          <div className="mt-1 text-xs text-zinc-500">
            {editing
              ? "6 to 8 letters or numbers, starting with a letter. You can pick a new code 3 times in 30 days."
              : "Athletes (18+) enter this in the Repflow app: Account → Coach."}
          </div>
        </div>
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={saveCustom}
              disabled={busy || draft.length === 0}
              className="text-sm bg-white text-black font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setMessage(null);
              }}
              disabled={busy}
              className="text-sm text-zinc-400 hover:text-white px-2 py-1.5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copy}
              disabled={!code}
              className="text-sm border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-full transition disabled:opacity-40"
            >
              Copy
            </button>
            {canCustomize && !confirming && (
              <button
                onClick={startEditing}
                className="text-sm border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-full transition"
              >
                Customize
              </button>
            )}
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
        )}
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
