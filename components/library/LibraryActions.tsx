"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteCoachProgram,
  deleteCoachRoutine,
  duplicateCoachProgram,
  duplicateCoachRoutine,
  errorText,
} from "@/lib/coach-library-client";

/** Duplicate / Delete for one library item (delete asks first). */
export default function LibraryActions({
  kind,
  id,
  name,
  blockedReason,
}: {
  kind: "routine" | "program";
  id: string;
  name: string;
  /** Why it can't be deleted (assigned, used by a program), if so. */
  blockedReason?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() =>
            run(() => (kind === "routine" ? duplicateCoachRoutine({ id }) : duplicateCoachProgram({ id })))
          }
          className="text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-full px-3 py-1 disabled:opacity-40"
        >
          Duplicate
        </button>
        <button
          disabled={busy || !!blockedReason}
          title={blockedReason}
          onClick={() => {
            if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
            run(() => (kind === "routine" ? deleteCoachRoutine({ id }) : deleteCoachProgram({ id })));
          }}
          className="text-xs text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-full px-3 py-1 disabled:opacity-30 disabled:hover:text-zinc-400"
        >
          Delete
        </button>
      </div>
      {blockedReason && <span className="text-[11px] text-zinc-600">{blockedReason}</span>}
      {error && <span className="text-xs text-red-400 max-w-xs text-right">{error}</span>}
    </div>
  );
}
