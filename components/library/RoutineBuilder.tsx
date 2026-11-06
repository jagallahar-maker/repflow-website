"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ExercisePicker, { EXERCISE_BY_ID, equipmentLabel, humanize } from "./ExercisePicker";
import { errorText, saveCoachRoutine, type SaveResult } from "@/lib/coach-library-client";
import {
  LIMITS,
  ROUTINE_CATEGORIES,
  newEditorExercise,
  validateRoutine,
  type CatalogInfo,
  type EditorExercise,
} from "@/lib/routine-format";

const CATALOG = new Map<string, CatalogInfo>(
  [...EXERCISE_BY_ID.values()].map((e) => [e.id, { name: e.name, tracking: e.tracking }]),
);

type Row = EditorExercise & { key: number };

/** Row keys for reorder / remove (stable across renders). */
let nextKey = 0;

function toEditor(r: Row): EditorExercise {
  const { key, ...e } = r;
  void key;
  return e;
}

export type RoutineDraft = {
  name: string;
  category: string;
  notes: string;
  exercises: EditorExercise[];
};

function mmss(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** "3–4 × 6–10 · rest 3:00 · RIR 1–2 · progression" (the app's wording). */
function summary(r: EditorExercise): string {
  const timed = EXERCISE_BY_ID.get(r.exerciseId)?.tracking === "timed";
  const sets = r.maxSets > r.minSets ? `${r.minSets}–${r.maxSets}` : `${r.minSets}`;
  const target = timed
    ? `${r.targetSeconds} s`
    : r.toFailure
      ? "to failure"
      : r.maxReps > r.minReps
        ? `${r.minReps}–${r.maxReps} reps`
        : `${r.minReps} reps`;
  const extras = [
    r.restSeconds != null ? `rest ${mmss(r.restSeconds)}` : null,
    r.targetRir ? `RIR ${r.targetRir.min}–${r.targetRir.max}${r.targetRir.finalSetOnly ? " (last set)" : ""}` : null,
    !timed && !r.toFailure && r.maxReps > r.minReps && r.doubleProgression ? "progression" : null,
    r.alternativeExerciseIds.length ? `${r.alternativeExerciseIds.length} swap${r.alternativeExerciseIds.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return `${sets} × ${target}${extras.length ? ` · ${extras.join(" · ")}` : ""}`;
}

/**
 * Coach routine builder (draft): the app editor's unified format and
 * limits, checked live with the same validator the server runs
 * (lib/routine-format.ts = functions/src/coachLibraryFormat.ts).
 */
export default function RoutineBuilder({
  id,
  initial,
}: {
  id: string | null;
  initial: RoutineDraft;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category);
  const [notes, setNotes] = useState(initial.notes);
  const [rows, setRows] = useState<Row[]>(() =>
    initial.exercises.map((e) => ({ ...e, key: nextKey++ })),
  );
  const [open, setOpen] = useState<number | null>(null);
  const [picker, setPicker] = useState<null | { kind: "add" } | { kind: "alt"; key: number }>(null);
  const [saving, setSaving] = useState(false);
  const [triedSave, setTriedSave] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const draft = { name, category, notes, exercises: rows };
  const [initialJson] = useState(() => JSON.stringify(initial));
  const dirty =
    JSON.stringify({ name, category, notes, exercises: rows.map(toEditor) }) !== initialJson;
  const { errors } = useMemo(
    () => validateRoutine(draft, CATALOG),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, category, notes, rows],
  );

  useEffect(() => {
    if (!dirty || saving) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  function update(key: number, patch: Partial<EditorExercise>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function move(index: number, by: number) {
    setRows((rs) => {
      const next = [...rs];
      const [r] = next.splice(index, 1);
      next.splice(Math.max(0, Math.min(next.length, index + by)), 0, r);
      return next;
    });
  }

  async function save() {
    setTriedSave(true);
    setServerError(null);
    if (errors.length) return;
    setSaving(true);
    try {
      const res = (await saveCoachRoutine({
        id,
        routine: { ...draft, exercises: rows.map(toEditor) },
      })) as SaveResult;
      // Clients who couldn't get the update (old app, sharing off).
      if (res.skipped?.length) window.alert(["Saved. Not updated:", ...res.skipped].join("\n"));
      router.push("/library");
      router.refresh();
    } catch (err) {
      setServerError(errorText(err));
      setSaving(false);
    }
  }

  const room = LIMITS.exercisesMax - rows.length;
  const pickerRow = picker?.kind === "alt" ? rows.find((r) => r.key === picker.key) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/library" className="text-sm text-zinc-400 hover:text-white">
          ← Library
        </Link>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[#9EFD06] text-black font-semibold text-sm px-5 py-2 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save routine"}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
        <label className="block">
          <span className="text-xs text-zinc-500">Routine name</span>
          <input
            value={name}
            maxLength={LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day"
            className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
          />
        </label>
        <div>
          <span className="text-xs text-zinc-500">Category</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {ROUTINE_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  category === c
                    ? "border-[#9EFD06] text-[#9EFD06] bg-[#9EFD06]/10"
                    : "border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
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

      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500">
          Exercises ({rows.length}/{LIMITS.exercisesMax})
        </h2>
        <span className="text-xs text-zinc-600">
          Starting weights come from the client&apos;s history in the app.
        </span>
      </div>

      <ol className="space-y-2">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500 text-center">
            No exercises yet. Add some below.
          </li>
        )}
        {rows.map((r, i) => {
          const ex = EXERCISE_BY_ID.get(r.exerciseId);
          return (
            <li key={r.key} className="rounded-2xl border border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col">
                  <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="text-zinc-500 hover:text-white disabled:opacity-20 text-xs leading-none">▲</button>
                  <button aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="text-zinc-500 hover:text-white disabled:opacity-20 text-xs leading-none mt-1">▼</button>
                </div>
                <button className="flex-1 min-w-0 text-left" onClick={() => setOpen(open === r.key ? null : r.key)}>
                  <div className={`text-sm font-medium truncate ${ex ? "" : "text-red-400"}`}>
                    {i + 1}. {ex?.name ?? "Missing exercise"}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{summary(r)}</div>
                </button>
                <button onClick={() => setOpen(open === r.key ? null : r.key)} className="text-xs text-zinc-400 hover:text-white">
                  {open === r.key ? "Done" : "Edit"}
                </button>
                <button
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  className="text-xs text-zinc-500 hover:text-red-400"
                  aria-label={`Remove ${ex?.name ?? "exercise"}`}
                >
                  Remove
                </button>
              </div>
              {open === r.key && ex && (
                <ExerciseEditor
                  row={r}
                  timed={ex.tracking === "timed"}
                  equipment={equipmentLabel(ex.equipment)}
                  muscle={humanize(ex.subgroup ?? ex.muscle)}
                  onChange={(p) => update(r.key, p)}
                  onAddAlternative={() => setPicker({ kind: "alt", key: r.key })}
                />
              )}
            </li>
          );
        })}
      </ol>

      <button
        disabled={room <= 0}
        onClick={() => setPicker({ kind: "add" })}
        className="w-full rounded-2xl border border-[#9EFD06]/50 text-[#9EFD06] py-3 text-sm font-semibold disabled:opacity-40"
      >
        {room <= 0 ? `Limit reached (${LIMITS.exercisesMax})` : "+ Add exercises"}
      </button>

      {(serverError || (triedSave && errors.length > 0)) && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 space-y-1">
          {serverError ? <p>{serverError}</p> : errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {picker?.kind === "add" && (
        <ExercisePicker
          title="Add exercises"
          multi
          room={room}
          onClose={() => setPicker(null)}
          onPick={(ids) => {
            setRows((rs) => [...rs, ...ids.map((x) => ({ ...newEditorExercise(x), key: nextKey++ }))]);
            setPicker(null);
          }}
        />
      )}
      {picker?.kind === "alt" && pickerRow && (
        <ExercisePicker
          title={`Alternative for ${EXERCISE_BY_ID.get(pickerRow.exerciseId)?.name ?? "exercise"}`}
          multi={false}
          tracking={EXERCISE_BY_ID.get(pickerRow.exerciseId)?.tracking}
          exclude={[pickerRow.exerciseId, ...pickerRow.alternativeExerciseIds]}
          onClose={() => setPicker(null)}
          onPick={([alt]) => {
            update(pickerRow.key, {
              alternativeExerciseIds: [...pickerRow.alternativeExerciseIds, alt].slice(0, LIMITS.alternativesMax),
            });
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function NumberField({
  label, value, min, max, onChange, suffix,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (n: number) => void; suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="mt-1 flex items-center gap-1">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Math.round(Number(e.target.value)))}
          className="w-20 rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm outline-none focus:border-zinc-600"
        />
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </label>
  );
}

function Toggle({ label, checked, disabled, onChange, hint }: {
  label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <label className={`flex items-start gap-2 text-sm ${disabled ? "opacity-40" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[#9EFD06]"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      </span>
    </label>
  );
}

function ExerciseEditor({
  row, timed, equipment, muscle, onChange, onAddAlternative,
}: {
  row: EditorExercise;
  timed: boolean;
  equipment: string;
  muscle: string;
  onChange: (p: Partial<EditorExercise>) => void;
  onAddAlternative: () => void;
}) {
  const canProgress = !timed && !row.toFailure && row.maxReps > row.minReps;
  return (
    <div className="border-t border-zinc-900 px-4 py-4 space-y-4">
      <p className="text-xs text-zinc-500">
        {muscle} · {equipment}
        {timed ? " · hold" : ""}
      </p>
      <div className="flex flex-wrap gap-4">
        <NumberField label="Sets (min)" value={row.minSets} min={1} max={LIMITS.setsMax}
          onChange={(n) => onChange({ minSets: n, maxSets: Math.max(n, row.maxSets) })} />
        <NumberField label="Sets (max)" value={row.maxSets} min={1} max={LIMITS.setsMax}
          onChange={(n) => onChange({ maxSets: n })} />
        {timed ? (
          <NumberField label="Hold" value={row.targetSeconds} min={LIMITS.secondsMin} max={LIMITS.secondsMax}
            suffix="seconds" onChange={(n) => onChange({ targetSeconds: n })} />
        ) : !row.toFailure ? (
          <>
            <NumberField label="Reps (min)" value={row.minReps} min={1} max={LIMITS.repsMax}
              onChange={(n) => onChange({ minReps: n, maxReps: Math.max(n, row.maxReps) })} />
            <NumberField label="Reps (max)" value={row.maxReps} min={1} max={LIMITS.repsMax}
              onChange={(n) => onChange({ maxReps: n })} />
          </>
        ) : null}
        <label className="block">
          <span className="text-xs text-zinc-500">Rest</span>
          <div className="mt-1 flex items-center gap-1">
            <input
              type="number"
              min={LIMITS.restMin}
              max={LIMITS.restMax}
              step={15}
              placeholder="App default"
              value={row.restSeconds ?? ""}
              onChange={(e) => onChange({ restSeconds: e.target.value === "" ? null : Math.round(Number(e.target.value)) })}
              className="w-28 rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm outline-none focus:border-zinc-600"
            />
            <span className="text-xs text-zinc-500">seconds</span>
          </div>
        </label>
      </div>
      {!timed && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Toggle label="To failure" checked={row.toFailure} onChange={(v) => onChange({ toFailure: v })} />
          <Toggle
            label="Double progression"
            hint={canProgress ? "Add weight when every set hits the top of the range." : "Needs a rep range (max above min)."}
            checked={row.doubleProgression && canProgress}
            disabled={!canProgress}
            onChange={(v) => onChange({ doubleProgression: v })}
          />
        </div>
      )}
      <div className="space-y-2">
        <Toggle
          label="Target RIR (reps in reserve)"
          checked={row.targetRir != null}
          onChange={(v) => onChange({ targetRir: v ? { min: 1, max: 2, finalSetOnly: false } : null })}
        />
        {row.targetRir && (
          <div className="flex flex-wrap items-end gap-4 pl-6">
            <NumberField label="RIR (min)" value={row.targetRir.min} min={0} max={LIMITS.rirMax}
              onChange={(n) => onChange({ targetRir: { ...row.targetRir!, min: n, max: Math.max(n, row.targetRir!.max) } })} />
            <NumberField label="RIR (max)" value={row.targetRir.max} min={0} max={LIMITS.rirMax}
              onChange={(n) => onChange({ targetRir: { ...row.targetRir!, max: n } })} />
            <Toggle label="Last set only" checked={row.targetRir.finalSetOnly}
              onChange={(v) => onChange({ targetRir: { ...row.targetRir!, finalSetOnly: v } })} />
          </div>
        )}
      </div>
      <label className="block">
        <span className="text-xs text-zinc-500">Notes (shown in the workout)</span>
        <input
          value={row.notes}
          maxLength={LIMITS.exerciseNotesMax}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="e.g. 2-second pause at the bottom"
          className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm outline-none focus:border-zinc-600"
        />
      </label>
      <div>
        <span className="text-xs text-zinc-500">Alternatives for Swap ({row.alternativeExerciseIds.length}/{LIMITS.alternativesMax})</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {row.alternativeExerciseIds.map((a) => (
            <span key={a} className="text-xs rounded-full border border-zinc-700 px-2.5 py-1 flex items-center gap-1.5">
              {EXERCISE_BY_ID.get(a)?.name ?? a}
              <button
                aria-label="Remove alternative"
                onClick={() => onChange({ alternativeExerciseIds: row.alternativeExerciseIds.filter((x) => x !== a) })}
                className="text-zinc-500 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
          {row.alternativeExerciseIds.length < LIMITS.alternativesMax && (
            <button onClick={onAddAlternative} className="text-xs rounded-full border border-dashed border-zinc-700 px-2.5 py-1 text-zinc-400 hover:text-white">
              + Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
