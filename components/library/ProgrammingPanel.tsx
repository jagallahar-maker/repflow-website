"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  assignProgramToClient,
  assignRoutineToClient,
  errorText,
  unassignFromClient,
} from "@/lib/coach-library-client";

type Item = { id: string; name: string; version: number; detail: string };

/**
 * Client page → Programming: what's assigned from the coach's library,
 * Edit (opens the library builder; saving updates the client's copy),
 * Unassign, and Assign a program or routine. [blocked] is why this client
 * can't receive programs right now (old app build, Workouts sharing off);
 * the server checks the same on every call.
 */
export default function ProgrammingPanel({
  clientId,
  clientName,
  blocked,
  programs,
  routines,
  assignedProgram,
  assignedRoutines,
}: {
  clientId: string;
  clientName: string;
  blocked: string | null;
  programs: Item[];
  routines: Item[];
  assignedProgram: { id: string; version: number } | null;
  assignedRoutines: { id: string; version: number }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [start, setStart] = useState<"thisWeek" | "nextWeek">("thisWeek");
  const assignedIds = new Set(assignedRoutines.map((r) => r.id));
  const freeRoutines = routines.filter((r) => !assignedIds.has(r.id));
  const [routineId, setRoutineId] = useState(freeRoutines[0]?.id ?? "");

  const programById = new Map(programs.map((p) => [p.id, p]));
  const routineById = new Map(routines.map((r) => [r.id, r]));
  const current = assignedProgram ? programById.get(assignedProgram.id) : null;

  async function run(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await fn();
      setDone(message);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const button =
    "rounded-full text-sm font-semibold px-4 py-1.5 disabled:opacity-40";

  return (
    <div className="space-y-5">
      {blocked && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {blocked}
        </div>
      )}

      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Assigned program</div>
        {assignedProgram ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 px-4 py-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{current?.name ?? "Deleted program"}</div>
              <div className="text-xs text-zinc-500">
                {current?.detail}
                {current && current.version > assignedProgram.version
                  ? ` · library v${current.version}, ${clientName} has v${assignedProgram.version}`
                  : ` · v${assignedProgram.version}`}
              </div>
            </div>
            <div className="flex gap-2">
              {current && (
                <Link
                  href={`/library/programs/${current.id}`}
                  className={`${button} border border-zinc-700 text-white`}
                >
                  Edit assigned program
                </Link>
              )}
              <button
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`Unassign ${current?.name ?? "this program"}? ${clientName} keeps it and can edit it.`)) return;
                  run(() => unassignFromClient({ clientId }), "Program unassigned.");
                }}
                className={`${button} border border-zinc-800 text-zinc-400 hover:text-red-400`}
              >
                Unassign
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No program assigned.</p>
        )}
      </div>

      {programs.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-48">
            <span className="text-xs text-zinc-500">
              {assignedProgram ? "Replace with" : "Assign a program"}
            </span>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.detail})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs text-zinc-500">Starts</span>
            <select
              value={start}
              onChange={(e) => setStart(e.target.value as "thisWeek" | "nextWeek")}
              className="mt-1 block rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm"
            >
              <option value="thisWeek">This week</option>
              <option value="nextWeek">Next Monday</option>
            </select>
          </label>
          <button
            disabled={busy || !programId || !!blocked}
            onClick={() => {
              const name = programById.get(programId)?.name ?? "this program";
              const ok = window.confirm(
                assignedProgram
                  ? `Replace ${current?.name ?? "the current program"} with ${name}? ${clientName} keeps the old one (editable) and the new one becomes active.`
                  : `Assign ${name} to ${clientName}? It becomes their active program.`,
              );
              if (!ok) return;
              run(() => assignProgramToClient({ clientId, programId, start }), `${name} assigned.`);
            }}
            className={`${button} bg-[#9EFD06] text-black`}
          >
            Assign
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Build a program in your{" "}
          <Link href="/library" className="text-[#9EFD06]">library</Link> to assign it.
        </p>
      )}

      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Assigned routines</div>
        {assignedRoutines.length === 0 ? (
          <p className="text-sm text-zinc-500">No single routines assigned.</p>
        ) : (
          <ul className="space-y-2">
            {assignedRoutines.map((a) => {
              const r = routineById.get(a.id);
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r?.name ?? "Deleted routine"}</div>
                    <div className="text-xs text-zinc-500">
                      {r?.detail}
                      {r && r.version > a.version ? ` · library v${r.version}, client v${a.version}` : ` · v${a.version}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r && (
                      <Link href={`/library/routines/${r.id}`} className={`${button} border border-zinc-700 text-white`}>
                        Edit
                      </Link>
                    )}
                    <button
                      disabled={busy}
                      onClick={() => run(() => unassignFromClient({ clientId, routineId: a.id }), "Routine unassigned.")}
                      className={`${button} border border-zinc-800 text-zinc-400 hover:text-red-400`}
                    >
                      Unassign
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {freeRoutines.length > 0 && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-48">
              <span className="text-xs text-zinc-500">Assign a single routine</span>
              <select
                value={routineId}
                onChange={(e) => setRoutineId(e.target.value)}
                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm"
              >
                {freeRoutines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.detail})
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={busy || !routineId || !!blocked}
              onClick={() => run(() => assignRoutineToClient({ clientId, routineId }),
                `${routineById.get(routineId)?.name ?? "Routine"} assigned.`)}
              className={`${button} border border-[#9EFD06]/60 text-[#9EFD06]`}
            >
              Assign routine
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && <p className="text-sm text-[#9EFD06]">{done}</p>}
      <p className="text-xs text-zinc-600">
        {clientName} sees assigned programs and routines read-only, with your name. When you
        save an edit in your library, their copy updates and they get a notice; workouts
        they&apos;ve logged don&apos;t change.
      </p>
    </div>
  );
}
