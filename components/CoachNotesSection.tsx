"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addCoachNote,
  deleteCoachNote,
  updateCoachNote,
} from "@/lib/coach-notes-client";
import type { CoachNote } from "@/lib/coach-notes-data";

type Props = {
  clientId: string;
  notes: CoachNote[];
};

const MAX_LEN = 4000;

export default function CoachNotesSection({ clientId, notes }: Props) {
  const router = useRouter();
  const [composerText, setComposerText] = useState("");
  const [composerVisible, setComposerVisible] = useState(false);
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = composerText.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LEN) {
      setComposerError(`Note must be ${MAX_LEN} characters or fewer.`);
      return;
    }

    setComposerSubmitting(true);
    setComposerError(null);
    try {
      await addCoachNote({
        clientId,
        text: trimmed,
        visibleToAthlete: composerVisible,
      });
      setComposerText("");
      setComposerVisible(false);
      refresh();
    } catch (err) {
      setComposerError(extractErrorMessage(err));
    } finally {
      setComposerSubmitting(false);
    }
  }

  async function handleSaveEdit(noteId: string) {
    const trimmed = editingText.trim();
    if (!trimmed) {
      setEditingError("Note cannot be empty.");
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setEditingError(`Note must be ${MAX_LEN} characters or fewer.`);
      return;
    }

    setEditingError(null);
    try {
      await updateCoachNote({
        clientId,
        noteId,
        text: trimmed,
      });
      setEditingId(null);
      setEditingText("");
      refresh();
    } catch (err) {
      setEditingError(extractErrorMessage(err));
    }
  }

  async function handleSendNow(noteId: string) {
    if (!confirm("Send this note to the athlete? After sending it can't be edited.")) {
      return;
    }
    try {
      await updateCoachNote({
        clientId,
        noteId,
        visibleToAthlete: true,
      });
      refresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this note? This can't be undone.")) {
      return;
    }
    try {
      await deleteCoachNote({ clientId, noteId });
      if (editingId === noteId) {
        setEditingId(null);
        setEditingText("");
      }
      refresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold">Notes</h2>
        <span className="text-xs text-zinc-500">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={composerText}
          onChange={(e) => {
            setComposerText(e.target.value);
            if (composerError) setComposerError(null);
          }}
          placeholder="Add a note about this athlete..."
          rows={3}
          maxLength={MAX_LEN}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none resize-none"
          disabled={composerSubmitting}
        />

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={composerVisible}
              onChange={(e) => setComposerVisible(e.target.checked)}
              disabled={composerSubmitting}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-lime-400 focus:ring-0 cursor-pointer"
            />
            <span>
              Send to athlete
              <span className="ml-2 text-xs text-zinc-500">
                {composerVisible ? "(athlete will see this)" : "(private)"}
              </span>
            </span>
          </label>

          <div className="flex items-center gap-3">
            {composerError && (
              <span className="text-xs text-red-400">{composerError}</span>
            )}
            <button
              type="submit"
              disabled={composerSubmitting || !composerText.trim()}
              className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {composerSubmitting
                ? "Saving..."
                : composerVisible
                  ? "Send"
                  : "Save private"}
            </button>
          </div>
        </div>
      </form>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-sm text-zinc-500 py-4 text-center">
          No notes yet. Add a private working note or send a message to the athlete.
        </div>
      ) : (
        <div className="grid gap-3">
          {notes.map((note) => {
            const isEditing = editingId === note.id;
            return (
              <div
                key={note.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {note.visibleToAthlete ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20">
                        Sent
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Private
                      </span>
                    )}
                    {note.visibleToAthlete && note.readByAthlete && (
                      <span className="text-[10px] text-zinc-500">
                        Read {formatRelative(note.readAt)}
                      </span>
                    )}
                    {note.visibleToAthlete && !note.readByAthlete && (
                      <span className="text-[10px] text-zinc-500">Unread</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {formatAbsolute(note.createdAt)}
                  </span>
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      value={editingText}
                      onChange={(e) => {
                        setEditingText(e.target.value);
                        if (editingError) setEditingError(null);
                      }}
                      rows={3}
                      maxLength={MAX_LEN}
                      className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none resize-none"
                    />
                    {editingError && (
                      <div className="mt-2 text-xs text-red-400">
                        {editingError}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingText("");
                          setEditingError(null);
                        }}
                        className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-medium hover:opacity-90 transition"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-zinc-200 whitespace-pre-wrap break-words">
                      {note.text}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
                      {!note.visibleToAthlete && (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(note.id);
                              setEditingText(note.text);
                              setEditingError(null);
                            }}
                            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSendNow(note.id)}
                            className="text-xs text-lime-400 hover:text-lime-300 px-3 py-1.5 rounded-full border border-lime-400/30 hover:border-lime-400/60 transition"
                          >
                            Send to athlete
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full border border-red-400/20 hover:border-red-400/40 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  return "Something went wrong. Please try again.";
}

function formatAbsolute(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatAbsolute(iso);
}