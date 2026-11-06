"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  aiCoachSummary,
  coachDraftsLeft,
  errorText,
  prefillMessage,
} from "@/lib/coach-library-client";
import { addCoachNote } from "@/lib/coach-notes-client";

/** Message and note limits (coachMessages.ts 2000, notes 4000). */
const MESSAGE_MAX = 2000;

/**
 * Client page → "✨ Draft weekly summary" (aiCoachSummary). Shown only
 * when the client's AI summaries switch is on (the server checks too).
 * The draft is editable and never goes anywhere by itself: Copy, Send as
 * message (fills the message box; the coach presses Send), or Save as a
 * private note.
 */
export default function WeeklySummaryPanel({
  clientId,
  clientName,
  shares,
}: {
  clientId: string;
  clientName: string;
  /** What the summary can draw on (their sharing switches). */
  shares: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [text, setText] = useState<string | null>(null);
  const [included, setIncluded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    coachDraftsLeft().then((s) => setLeft(s.left)).catch(() => {});
  }, []);

  async function draft() {
    if (text && !window.confirm("Replace this draft with a new one?")) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await aiCoachSummary(clientId);
      setText(res.text);
      setIncluded(res.included);
      setLeft(res.remaining);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!text?.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addCoachNote({
        clientId,
        text: `Weekly summary (AI draft, edited)\n\n${text.trim()}`.slice(0, 4000),
        visibleToAthlete: false,
      });
      setDone("Saved as a private note.");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setDone("Copied.");
    } catch {
      setError("Couldn't copy. Select the text and copy it instead.");
    }
  }

  const button = "rounded-full text-sm font-semibold px-4 py-1.5 disabled:opacity-40";
  const tooLong = (text?.length ?? 0) > MESSAGE_MAX;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          The last 7 days vs the week before, from what {clientName} shares with you (
          {shares.join(", ") || "nothing"}). No name or injury details are sent.
        </p>
        <button
          onClick={draft}
          disabled={busy || left === 0}
          className={`${button} border border-[#9EFD06]/60 text-[#9EFD06]`}
        >
          {busy && !text ? "Drafting…" : text ? "✨ Redraft" : "✨ Draft weekly summary"}
        </button>
      </div>
      {left != null && (
        <p className="text-xs text-zinc-600">
          {left === 0
            ? "You've used all your AI drafts this month. They reset on the 1st."
            : `${left} AI draft${left === 1 ? "" : "s"} left this month (shared with Build with AI).`}
        </p>
      )}

      {text != null && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              AI draft, review before sending
            </span>
            <span className="text-xs text-zinc-500">Uses: {included.join(", ")}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            className="w-full rounded-lg bg-black border border-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600 font-mono leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={copy} disabled={busy} className={`${button} border border-zinc-700 text-white`}>
              Copy
            </button>
            <button
              onClick={() => {
                prefillMessage(text);
                setDone("Added to the message box below. Check it, then press Send.");
              }}
              disabled={busy || tooLong || !text.trim()}
              title={tooLong ? `Messages are up to ${MESSAGE_MAX} characters` : undefined}
              className={`${button} bg-[#9EFD06] text-black`}
            >
              Send as message
            </button>
            <button onClick={saveNote} disabled={busy || !text.trim()} className={`${button} border border-zinc-700 text-white`}>
              Save as private note
            </button>
          </div>
          {tooLong && (
            <p className="text-xs text-amber-300">
              {text.length} characters: shorten it to {MESSAGE_MAX} to send it as a message.
            </p>
          )}
          <p className="text-xs text-zinc-600">
            AI can be wrong. Nothing is sent to {clientName} unless you send it.
          </p>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && <p className="text-sm text-[#9EFD06]">{done}</p>}
    </div>
  );
}
