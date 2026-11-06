"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COMPOSE_EVENT } from "@/lib/coach-library-client";
import type { MessageDoc } from "@/lib/coach-client-data.ts";
import { callableError, markThreadRead, sendCoachMessage } from "@/lib/coach-messages-client";

/**
 * Coach ↔ client thread on the client page. Sending goes through
 * sendCoachMessage (text filter, 20/hour); opening the panel marks the
 * client's messages read. A reply to a check-in carries its id.
 */
export default function CoachMessagesPanel({
  clientId,
  clientName,
  messages,
  unread,
  replyTo,
}: {
  clientId: string;
  clientName: string;
  messages: MessageDoc[];
  unread: number;
  replyTo: { checkinId: string; label: string } | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);

  // "Send as message" from the AI summary: fill the composer (the coach
  // still presses Send).
  useEffect(() => {
    const fill = (e: Event) => {
      setText(String((e as CustomEvent).detail ?? "").slice(0, 2000));
      box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      box.current?.focus();
    };
    window.addEventListener(COMPOSE_EVENT, fill);
    return () => window.removeEventListener(COMPOSE_EVENT, fill);
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unread > 0) markThreadRead(clientId).then(() => router.refresh()).catch(() => {});
  }, [clientId, unread, router]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      await sendCoachMessage({ clientId, text: t, ...(replyTo ? { checkinId: replyTo.checkinId } : {}) });
      setText("");
      if (replyTo) router.replace(`/clients/${clientId}#messages`);
      router.refresh();
    } catch (err) {
      setError(callableError(err, "Couldn't send the message."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">No messages yet. Messages are text only and kept for safety.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "coach" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  m.sender === "coach" ? "bg-[#9EFD06]/15 text-white" : "bg-zinc-900 text-zinc-100"
                }`}
              >
                {m.checkinId && <div className="text-[11px] font-semibold text-[#9EFD06] mb-0.5">Re: check-in</div>}
                {m.text}
                <div className="mt-1 text-[10px] text-zinc-500">
                  {m.sender === "coach" ? "You" : clientName}
                  {m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString()}` : ""}
                  {m.sender === "coach" && m.read ? " · Read" : ""}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={send} className="mt-3">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-[#9EFD06]">
            <span>Replying to the check-in of {replyTo.label}</span>
            <Link href={`/clients/${clientId}#messages`} className="text-zinc-400 hover:text-white">
              Cancel
            </Link>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={box}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={text.length > 200 ? 8 : 2}
            placeholder={`Message ${clientName}`}
            className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="self-end bg-[#9EFD06] text-black px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </form>
    </div>
  );
}
