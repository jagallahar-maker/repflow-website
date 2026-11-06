"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  errorText,
  saveCoachProgram,
  saveCoachRoutine,
  type SaveResult,
} from "@/lib/coach-library-client";
import { LIMITS, WEEKDAYS, validateProgram } from "@/lib/routine-format";
import { routineDraftOf, type AiRoutineDraft } from "@/lib/ai-draft";
import type { DraftClient } from "@/lib/coach-library-data";
import AiDraftDialog from "./AiDraftDialog";
import RoutineBuilder from "./RoutineBuilder";

/** Draft routines from Build with AI live here ("ai:A") until Save. */
const DRAFT = "ai:";

export type ProgramDraft = {
  name: string;
  notes: string;
  durationWeeks: number;
  /** weekday → routine ids (none = rest, one, or two = A/B). */
  days: Record<string, string[]>;
};

type Mode = "rest" | "routine" | "alternating";

const dayName = (d: string) => d[0].toUpperCase() + d.slice(1);

/**
 * Coach program builder (draft), like the app's: name, 1–16 weeks, and
 * for each weekday rest, one routine, or two alternating (A one time, B
 * the next, after whichever was completed last). Every week repeats.
 *
 * "Build with AI" fills the schedule with AI draft routines that exist
 * only here (edit each one, with its reasons) until Save, which saves
 * the used ones to the library and then the program. Never assigned.
 */
export default function ProgramBuilder({
  id,
  initial,
  routines: library,
  clients,
}: {
  id: string | null;
  initial: ProgramDraft;
  routines: { id: string; name: string; summary: string }[];
  clients: DraftClient[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, AiRoutineDraft>>({});
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const routines = useMemo(
    () => [
      ...library,
      ...Object.entries(drafts).map(([did, d]) => ({
        id: did,
        name: `${d.name} (AI draft)`,
        summary: `${d.category} · ${d.exercises.length} exercises · saved with the program`,
      })),
    ],
    [library, drafts],
  );
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [weeks, setWeeks] = useState(initial.durationWeeks);
  const [days, setDays] = useState<Record<string, string[]>>(initial.days);
  const [saving, setSaving] = useState(false);
  const [triedSave, setTriedSave] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const routineIds = useMemo(() => new Set(routines.map((r) => r.id)), [routines]);
  const byId = useMemo(() => new Map(routines.map((r) => [r.id, r])), [routines]);
  const input = {
    name,
    notes,
    durationWeeks: weeks,
    schedule: WEEKDAYS.map((weekday) => ({ weekday, routineIds: days[weekday] ?? [] })),
  };
  const { errors } = validateProgram(input, routineIds);
  const [initialJson] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify({ name, notes, durationWeeks: weeks, days }) !== initialJson;

  useEffect(() => {
    if (!dirty || saving) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  function setMode(day: string, mode: Mode) {
    const ids = days[day] ?? [];
    const first = ids[0] ?? routines[0]?.id;
    const next =
      mode === "rest" || !first
        ? []
        : mode === "routine"
          ? [first]
          : [first, ids[1] ?? routines.find((r) => r.id !== first)?.id ?? first];
    setDays((d) => ({ ...d, [day]: next }));
  }

  function setRoutine(day: string, slot: number, routineId: string) {
    setDays((d) => {
      const ids = [...(d[day] ?? [])];
      ids[slot] = routineId;
      return { ...d, [day]: ids };
    });
  }

  async function save() {
    setTriedSave(true);
    setServerError(null);
    if (errors.length) return;
    setSaving(true);
    try {
      // AI drafts on the schedule become library routines first; each is
      // swapped for its new id as soon as it's saved (a retry won't
      // duplicate it). Drafts not on the schedule are dropped.
      let schedule = input.schedule;
      const used = [...new Set(schedule.flatMap((s) => s.routineIds))].filter((r) => r.startsWith(DRAFT));
      for (const did of used) {
        const d = drafts[did];
        const saved = (await saveCoachRoutine({
          id: null,
          routine: { name: d.name, category: d.category, notes: d.notes, exercises: d.exercises },
        })) as SaveResult;
        schedule = schedule.map((s) => ({ ...s, routineIds: s.routineIds.map((r) => (r === did ? saved.id : r)) }));
        setDays(Object.fromEntries(schedule.map((s) => [s.weekday, s.routineIds])));
        setDrafts((ds) => {
          const next = { ...ds };
          delete next[did];
          return next;
        });
      }
      const res = (await saveCoachProgram({ id, program: { ...input, schedule } })) as SaveResult;
      // Clients who couldn't get the update (old app, sharing off).
      if (res.skipped?.length) window.alert(["Saved. Not updated:", ...res.skipped].join("\n"));
      router.push("/library");
      router.refresh();
    } catch (err) {
      setServerError(errorText(err));
      setSaving(false);
    }
  }

  const trainingDays = WEEKDAYS.filter((d) => (days[d] ?? []).length > 0).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/library" className="text-sm text-zinc-400 hover:text-white">
          ← Library
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setAiOpen(true)}
            disabled={saving}
            className="rounded-full border border-[#9EFD06]/60 text-[#9EFD06] font-semibold text-sm px-4 py-2"
          >
            ✨ Build with AI
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-[#9EFD06] text-black font-semibold text-sm px-5 py-2 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save program"}
          </button>
        </div>
      </div>

      {aiNote && (
        <div className="rounded-2xl border border-[#9EFD06]/30 bg-[#9EFD06]/5 p-4 text-sm">
          <div className="text-[#9EFD06] text-xs font-semibold mb-1">✨ AI draft</div>
          <p className="text-zinc-200 whitespace-pre-line">{aiNote}</p>
          <p className="text-xs text-zinc-500 mt-2">
            Not saved yet. Open each AI routine (Edit on its day) to check the exercises and the reason for
            each, then Save: the routines go into your library with the program.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
        <label className="block">
          <span className="text-xs text-zinc-500">Program name</span>
          <input
            value={name}
            maxLength={LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Upper / Lower, 4 days"
            className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
          />
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-300">Length</span>
          <button
            aria-label="Fewer weeks"
            disabled={weeks <= LIMITS.weeksMin}
            onClick={() => setWeeks((w) => w - 1)}
            className="w-8 h-8 rounded-full border border-zinc-800 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-20 text-center text-[#9EFD06] font-semibold">
            {weeks} {weeks === 1 ? "week" : "weeks"}
          </span>
          <button
            aria-label="More weeks"
            disabled={weeks >= LIMITS.weeksMax}
            onClick={() => setWeeks((w) => w + 1)}
            className="w-8 h-8 rounded-full border border-zinc-800 disabled:opacity-30"
          >
            +
          </button>
        </div>
        <label className="block">
          <span className="text-xs text-zinc-500">Notes for the client (optional)</span>
          <textarea
            value={notes}
            maxLength={LIMITS.notesMax}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-600"
          />
        </label>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-wider text-zinc-500">
          Weekly schedule · {trainingDays} training {trainingDays === 1 ? "day" : "days"}
        </h2>
        <p className="text-xs text-zinc-600 mt-1">Every week repeats this.</p>
      </div>

      {routines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-400">
          Build a routine first, then add it to days here.{" "}
          <Link href="/library/routines/new" className="text-[#9EFD06]">
            New routine
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {WEEKDAYS.map((d) => {
            const ids = days[d] ?? [];
            const mode: Mode = ids.length === 0 ? "rest" : ids.length === 1 ? "routine" : "alternating";
            const missing = ids.some((x) => !byId.has(x));
            return (
              <li key={d} className={`rounded-2xl border bg-zinc-950 p-4 ${missing ? "border-red-500/50" : "border-zinc-800"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-24 font-medium">{dayName(d)}</span>
                  <div className="flex gap-1">
                    {(["rest", "routine", "alternating"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(d, m)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          mode === m
                            ? "border-[#9EFD06] text-[#9EFD06] bg-[#9EFD06]/10"
                            : "border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {m === "rest" ? "Rest" : m === "routine" ? "Routine" : "A / B"}
                      </button>
                    ))}
                  </div>
                </div>
                {ids.length > 0 && (
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    {ids.map((rid, slot) => (
                      <label key={slot} className="block">
                        {ids.length > 1 && (
                          <span className="text-xs text-zinc-500">{slot === 0 ? "A" : "B"}</span>
                        )}
                        <select
                          value={byId.has(rid) ? rid : ""}
                          onChange={(e) => setRoutine(d, slot, e.target.value)}
                          className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm"
                        >
                          {!byId.has(rid) && <option value="">Missing routine: pick another</option>}
                          {routines.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        {byId.has(rid) && (
                          <span className="block text-xs text-zinc-500 mt-1">{byId.get(rid)!.summary}</span>
                        )}
                        {drafts[rid] && (
                          <button
                            onClick={() => setEditing(rid)}
                            className="mt-1 text-xs text-[#9EFD06] hover:underline"
                          >
                            Edit AI routine
                          </button>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {mode === "alternating" && (
                  <p className="text-xs text-zinc-500 mt-2">
                    The client does the other one after each completion.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {aiOpen && (
        <AiDraftDialog
          mode="program"
          clients={clients}
          onClose={() => setAiOpen(false)}
          onResult={(plan, note) => {
            const hasDays = WEEKDAYS.some((d) => (days[d] ?? []).length > 0);
            if (hasDays && !window.confirm("Replace this schedule with the AI draft?")) return;
            const next: Record<string, AiRoutineDraft> = {};
            for (const r of plan.routines) next[`${DRAFT}${r.key}`] = routineDraftOf(r);
            setDrafts(next);
            setName(plan.name);
            setWeeks(plan.weeks);
            setDays(Object.fromEntries(WEEKDAYS.map((d) => [
              d,
              (plan.schedule.find((s) => s.weekday === d)?.routineKeys ?? []).map((k) => `${DRAFT}${k}`),
            ])));
            setAiNote([note, plan.why].filter(Boolean).join("\n"));
            setAiOpen(false);
          }}
        />
      )}
      {editing && drafts[editing] && (
        <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true">
          <div className="max-w-4xl mx-auto rounded-2xl border border-zinc-800 bg-black p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">AI routine</h2>
            <RoutineBuilder
              id={null}
              initial={drafts[editing]}
              initialWhys={drafts[editing].whys}
              initialNote={drafts[editing].why || null}
              onCancel={() => setEditing(null)}
              onDone={(d) => {
                setDrafts((ds) => ({ ...ds, [editing]: d }));
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}

      {(serverError || (triedSave && errors.length > 0)) && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 space-y-1">
          {serverError ? <p>{serverError}</p> : errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}
    </div>
  );
}
