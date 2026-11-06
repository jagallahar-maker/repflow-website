"use client";

import { useMemo, useState } from "react";
import { EXERCISE_CATALOG, type CatalogExercise } from "@/lib/exercise-catalog";
import { usableTracking } from "@/lib/routine-format";

/** Library exercises a coach routine can use (reps or holds), by id. */
export const PICKABLE = EXERCISE_CATALOG.filter((e) => usableTracking(e.tracking));
export const EXERCISE_BY_ID = new Map(EXERCISE_CATALOG.map((e) => [e.id, e]));

const MUSCLES = ["chest", "back", "shoulders", "arms", "legs", "core"];
const EQUIPMENT: Record<string, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machine",
  cable: "Cable",
  smithMachine: "Smith",
  kettlebell: "Kettlebell",
  band: "Band",
  bodyweight: "Bodyweight",
  other: "Other",
};

/** "midChest" → "Mid chest". */
export function humanize(s: string): string {
  const spaced = s.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced[0].toUpperCase() + spaced.slice(1);
}

export function equipmentLabel(e: string): string {
  return EQUIPMENT[e] ?? humanize(e);
}

type Props = {
  title: string;
  /** Pick several (routine) or one at a time (alternatives). */
  multi: boolean;
  /** Only this tracking type (alternatives must match the exercise). */
  tracking?: string;
  exclude?: string[];
  /** How many more can be added (routine limit). */
  room?: number;
  onPick: (ids: string[]) => void;
  onClose: () => void;
};

/**
 * The app's exercise library (generated catalog, same ids as the app),
 * with search over names and aliases, muscle and equipment filters, and a
 * how-to preview.
 */
export default function ExercisePicker({
  title, multi, tracking, exclude = [], room = 30, onPick, onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<CatalogExercise | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PICKABLE.filter(
      (e) =>
        !exclude.includes(e.id) &&
        (!tracking || e.tracking === tracking) &&
        (!muscle || e.muscle === muscle) &&
        (!equipment || e.equipment === equipment) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          (e.aliases ?? []).some((a) => a.toLowerCase().includes(q))),
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [query, muscle, equipment, tracking, exclude]);

  function toggle(id: string) {
    if (!multi) {
      onPick([id]);
      return;
    }
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < room ? [...s, id] : s,
    );
  }

  const chip = (on: boolean) =>
    `text-xs px-2.5 py-1 rounded-full border transition ${
      on
        ? "border-[#9EFD06] text-[#9EFD06] bg-[#9EFD06]/10"
        : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-4xl h-[90vh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">
            Close
          </button>
        </div>

        <div className="px-5 py-3 space-y-2 border-b border-zinc-900">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises (name or alias)"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-600"
          />
          <div className="flex flex-wrap gap-1.5">
            <button className={chip(muscle == null)} onClick={() => setMuscle(null)}>
              All muscles
            </button>
            {MUSCLES.map((m) => (
              <button key={m} className={chip(muscle === m)} onClick={() => setMuscle(m)}>
                {humanize(m)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button className={chip(equipment == null)} onClick={() => setEquipment(null)}>
              All equipment
            </button>
            {Object.entries(EQUIPMENT).map(([k, v]) => (
              <button key={k} className={chip(equipment === k)} onClick={() => setEquipment(k)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 grid sm:grid-cols-[1fr_minmax(0,320px)]">
          <ul className="overflow-y-auto divide-y divide-zinc-900">
            {list.length === 0 && (
              <li className="px-5 py-6 text-sm text-zinc-500">No exercises match.</li>
            )}
            {list.map((e) => {
              const on = selected.includes(e.id);
              return (
                <li key={e.id} className={`flex items-center gap-3 px-5 py-2.5 ${on ? "bg-[#9EFD06]/5" : ""}`}>
                  <button
                    onClick={() => toggle(e.id)}
                    className="flex-1 min-w-0 text-left"
                    aria-pressed={on}
                  >
                    <div className={`text-sm truncate ${on ? "text-[#9EFD06]" : "text-white"}`}>
                      {on ? "✓ " : ""}
                      {e.name}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {humanize(e.subgroup ?? e.muscle)} · {equipmentLabel(e.equipment)}
                      {e.tracking === "timed" ? ` · hold${e.perSide ? " (per side)" : ""}` : ""}
                    </div>
                  </button>
                  <button
                    onClick={() => setPreview(e)}
                    className="shrink-0 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-full w-7 h-7"
                    aria-label={`How to: ${e.name}`}
                  >
                    i
                  </button>
                </li>
              );
            })}
          </ul>
          <aside className="hidden sm:block overflow-y-auto border-l border-zinc-900 p-5 text-sm">
            {preview ? (
              <ExerciseInfo e={preview} />
            ) : (
              <p className="text-zinc-500">Tap “i” on an exercise to see how to do it.</p>
            )}
          </aside>
        </div>

        {preview && (
          <div className="sm:hidden fixed inset-0 z-50 bg-black/80 p-4 flex items-end" onClick={() => setPreview(null)}>
            <div className="w-full max-h-[70vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 p-5 text-sm">
              <ExerciseInfo e={preview} />
            </div>
          </div>
        )}

        {multi && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-zinc-900">
            <span className="text-xs text-zinc-500">
              {selected.length} selected{room < 30 ? ` · room for ${room}` : ""}
            </span>
            <button
              disabled={selected.length === 0}
              onClick={() => onPick(selected)}
              className="rounded-full bg-[#9EFD06] text-black font-semibold text-sm px-5 py-2 disabled:opacity-40"
            >
              Add {selected.length || ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ExerciseInfo({ e }: { e: CatalogExercise }) {
  const section = (title: string, items?: string[], ordered = false) =>
    items && items.length > 0 ? (
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">{title}</div>
        {ordered ? (
          <ol className="list-decimal pl-5 space-y-1 text-zinc-300">
            {items.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            {items.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        )}
      </div>
    ) : null;
  return (
    <div>
      <h3 className="font-semibold text-white">{e.name}</h3>
      <p className="text-xs text-zinc-500 mt-1">
        {humanize(e.subgroup ?? e.muscle)}
        {e.secondary?.length ? ` + ${e.secondary.map(humanize).join(", ")}` : ""} ·{" "}
        {equipmentLabel(e.equipment)}
        {e.tracking === "timed" ? " · hold" : ""}
      </p>
      {section("How to", e.instructions, true)}
      {section("Cues", e.cues)}
      {section("Common mistakes", e.mistakes)}
      {!e.instructions?.length && !e.cues?.length && (
        <p className="mt-4 text-zinc-500">No how-to for this one yet.</p>
      )}
    </div>
  );
}
