/**
 * Coach routines and programs: the unified routine format and its
 * validation. ONE FILE, TWO COPIES: functions/src/coachLibraryFormat.ts
 * (the callables enforce it) and website/lib/routine-format.ts (the
 * builder shows the same errors as you edit). Keep them identical;
 * functions/test/coach-library.test.js fails when they differ.
 *
 * Same limits as the app's routine editor (routine_editor_screen.dart,
 * routine_exercise_targets_sheet.dart) and the same stored shape as
 * RoutineExercise.toJson, so assigning a routine (Phase 5b) is a copy:
 *   - 1–30 exercises, 1–10 sets (a range when max > min).
 *   - Rep exercises: 1–50 reps (a range when max > min) or "to failure";
 *     double progression only with a rep range.
 *   - Timed holds: targetSeconds 5–600 (reps mirrors it for old readers).
 *   - Rest 15–600 s or null (the user's saved timer); RIR 0–5.
 *   - Alternatives for Swap: up to 5 library ids of the same type.
 * No imports: the catalog is passed in.
 */

export const LIMITS = {
  nameMax: 60,
  notesMax: 1000,
  exerciseNotesMax: 300,
  exercisesMax: 30,
  setsMax: 10,
  repsMax: 50,
  secondsMin: 5,
  secondsMax: 600,
  restMin: 15,
  restMax: 600,
  rirMax: 5,
  alternativesMax: 5,
  weeksMin: 1,
  weeksMax: 16,
} as const;

/** The app's routine categories (RoutineEditorScreen.categories). */
export const ROUTINE_CATEGORIES = ["Custom", "Push", "Pull", "Legs", "Upper",
  "Lower", "Full Body", "Chest", "Back", "Shoulders", "Arms"];

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday",
  "friday", "saturday", "sunday"];

/** What the validator needs to know about a library exercise. */
export type CatalogInfo = {name: string; tracking: string};

/**
 * Library exercises a coach routine may use (reps or holds).
 * @param {string} tracking Catalog tracking type.
 * @return {boolean} Usable.
 */
export function usableTracking(tracking: string): boolean {
  return tracking === "reps" || tracking === "timed";
}

export type StoredRoutineExercise = {
  exerciseId: string;
  sets: number;
  reps: number | "toFailure";
  notes: string | null;
  supersetGroup: null;
  minSets?: number;
  maxSets?: number;
  minReps?: number;
  maxReps?: number;
  restSeconds?: number;
  targetRir?: {min: number; max: number; finalSetOnly: boolean};
  progressionRule?: "doubleProgression";
  alternativeExerciseIds?: string[];
  targetSeconds?: number;
};

export type StoredRoutine = {
  name: string;
  category: string;
  notes: string | null;
  exercises: StoredRoutineExercise[];
  estimatedDurationMinutes: number;
  formatVersion: 1;
};

export type StoredProgram = {
  name: string;
  notes: string | null;
  durationWeeks: number;
  /** Monday … Sunday; no ids = rest, one = routine, two = A/B. */
  schedule: {weekday: string; routineIds: string[]}[];
};

type Raw = Record<string, unknown>;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const int = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) ? n : NaN;
};
const inRange = (n: number, lo: number, hi: number) =>
  Number.isInteger(n) && n >= lo && n <= hi;

/**
 * Rough length (the app editor's estimate): per set, the rest (or 90 s)
 * plus ~40 s of work; 10–240 min.
 * @param {StoredRoutineExercise[]} exercises Exercises.
 * @return {number} Minutes.
 */
export function estimateMinutes(exercises: StoredRoutineExercise[]): number {
  let seconds = 0;
  for (const e of exercises) seconds += e.sets * ((e.restSeconds ?? 90) + 40);
  return Math.min(240, Math.max(10, Math.round(seconds / 60)));
}

/**
 * Checks one exercise and converts it to the stored shape.
 * @param {unknown} raw Editor entry.
 * @param {number} i Index (for messages).
 * @param {Map<string, CatalogInfo>} catalog Library by id.
 * @param {string[]} errors Collects errors.
 * @return {StoredRoutineExercise | null} Entry.
 */
function exerciseOf(raw: unknown, i: number,
  catalog: Map<string, CatalogInfo>, errors: string[]):
  StoredRoutineExercise | null {
  const e = (raw ?? {}) as Raw;
  const id = text(e.exerciseId);
  const info = catalog.get(id);
  const label = info ? info.name : `Exercise ${i + 1}`;
  if (!info || !usableTracking(info.tracking)) {
    errors.push(`${label}: not in the exercise library.`);
    return null;
  }
  const before = errors.length;
  const minSets = int(e.minSets ?? e.sets);
  const maxSets = int(e.maxSets ?? minSets);
  if (!inRange(minSets, 1, LIMITS.setsMax) ||
    !inRange(maxSets, minSets, LIMITS.setsMax)) {
    errors.push(`${label}: sets must be 1–${LIMITS.setsMax} (min ≤ max).`);
  }
  const out: StoredRoutineExercise = {exerciseId: id, sets: minSets, reps: 0,
    notes: null, supersetGroup: null};
  if (maxSets > minSets) {
    out.minSets = minSets;
    out.maxSets = maxSets;
  }
  if (info.tracking === "timed") {
    const secs = int(e.targetSeconds);
    if (!inRange(secs, LIMITS.secondsMin, LIMITS.secondsMax)) {
      errors.push(`${label}: hold ${LIMITS.secondsMin}–${LIMITS.secondsMax} ` +
        "seconds.");
    }
    out.reps = secs;
    out.targetSeconds = secs;
  } else if (e.toFailure === true) {
    out.reps = "toFailure";
  } else {
    const minReps = int(e.minReps ?? e.reps);
    const maxReps = int(e.maxReps ?? minReps);
    if (!inRange(minReps, 1, LIMITS.repsMax) ||
      !inRange(maxReps, minReps, LIMITS.repsMax)) {
      errors.push(`${label}: reps must be 1–${LIMITS.repsMax} (min ≤ max).`);
    }
    out.reps = minReps;
    if (maxReps > minReps) {
      out.minReps = minReps;
      out.maxReps = maxReps;
      if (e.doubleProgression === true) {
        out.progressionRule = "doubleProgression";
      }
    }
  }
  if (e.restSeconds != null && e.restSeconds !== "") {
    const rest = int(e.restSeconds);
    if (!inRange(rest, LIMITS.restMin, LIMITS.restMax)) {
      errors.push(`${label}: rest ${LIMITS.restMin}–${LIMITS.restMax} s.`);
    }
    out.restSeconds = rest;
  }
  if (e.targetRir != null) {
    const r = e.targetRir as Raw;
    const min = int(r.min);
    const max = int(r.max ?? r.min);
    if (!inRange(min, 0, LIMITS.rirMax) || !inRange(max, min, LIMITS.rirMax)) {
      errors.push(`${label}: RIR 0–${LIMITS.rirMax} (min ≤ max).`);
    }
    out.targetRir = {min, max, finalSetOnly: r.finalSetOnly === true};
  }
  const notes = text(e.notes);
  if (notes.length > LIMITS.exerciseNotesMax) {
    errors.push(`${label}: notes up to ${LIMITS.exerciseNotesMax} ` +
      "characters.");
  }
  out.notes = notes || null;
  const alts = Array.isArray(e.alternativeExerciseIds) ?
    [...new Set(e.alternativeExerciseIds.map(text))].filter((a) => a) : [];
  if (alts.length > LIMITS.alternativesMax) {
    errors.push(`${label}: up to ${LIMITS.alternativesMax} alternatives.`);
  }
  for (const a of alts) {
    const alt = catalog.get(a);
    if (a === id) {
      errors.push(`${label}: can't be its own alternative.`);
    } else if (!alt) {
      errors.push(`${label}: alternative "${a}" isn't in the library.`);
    } else if (alt.tracking !== info.tracking) {
      errors.push(`${label}: ${alt.name} is a different type ` +
        `(${alt.tracking === "timed" ? "hold" : "reps"}).`);
    }
  }
  if (alts.length) out.alternativeExerciseIds = alts;
  return errors.length > before ? null : out;
}

/**
 * Checks a routine from the builder and converts it to the stored shape.
 * @param {unknown} raw {name, category, notes, exercises}.
 * @param {Map<string, CatalogInfo>} catalog Library by id.
 * @return {object} {routine (null on errors), errors}.
 */
export function validateRoutine(raw: unknown,
  catalog: Map<string, CatalogInfo>):
  {routine: StoredRoutine | null; errors: string[]} {
  const r = (raw ?? {}) as Raw;
  const errors: string[] = [];
  const name = text(r.name);
  if (!name) errors.push("Give the routine a name.");
  if (name.length > LIMITS.nameMax) {
    errors.push(`Name up to ${LIMITS.nameMax} characters.`);
  }
  const category = text(r.category) || "Custom";
  if (!ROUTINE_CATEGORIES.includes(category)) errors.push("Pick a category.");
  const notes = text(r.notes);
  if (notes.length > LIMITS.notesMax) {
    errors.push(`Notes up to ${LIMITS.notesMax} characters.`);
  }
  const list = Array.isArray(r.exercises) ? r.exercises : [];
  if (list.length === 0) errors.push("Add at least one exercise.");
  if (list.length > LIMITS.exercisesMax) {
    errors.push(`Up to ${LIMITS.exercisesMax} exercises.`);
  }
  const exercises = list.slice(0, LIMITS.exercisesMax)
    .map((e, i) => exerciseOf(e, i, catalog, errors))
    .filter((e): e is StoredRoutineExercise => e != null);
  if (errors.length) return {routine: null, errors};
  return {
    routine: {name, category, notes: notes || null, exercises,
      estimatedDurationMinutes: estimateMinutes(exercises), formatVersion: 1},
    errors,
  };
}

/**
 * Checks a program from the builder. [routineIds] = the coach's routines.
 * @param {unknown} raw {name, notes, durationWeeks, schedule}.
 * @param {Set<string>} routineIds The coach's routine ids.
 * @return {object} {program (null on errors), errors}.
 */
export function validateProgram(raw: unknown, routineIds: Set<string>):
  {program: StoredProgram | null; errors: string[]} {
  const p = (raw ?? {}) as Raw;
  const errors: string[] = [];
  const name = text(p.name);
  if (!name) errors.push("Give the program a name.");
  if (name.length > LIMITS.nameMax) {
    errors.push(`Name up to ${LIMITS.nameMax} characters.`);
  }
  const notes = text(p.notes);
  if (notes.length > LIMITS.notesMax) {
    errors.push(`Notes up to ${LIMITS.notesMax} characters.`);
  }
  const weeks = int(p.durationWeeks);
  if (!inRange(weeks, LIMITS.weeksMin, LIMITS.weeksMax)) {
    errors.push(`Length ${LIMITS.weeksMin}–${LIMITS.weeksMax} weeks.`);
  }
  const given = Array.isArray(p.schedule) ? p.schedule as Raw[] : [];
  const schedule = WEEKDAYS.map((weekday) => {
    const slot = given.find((s) => text(s?.weekday) === weekday);
    const ids = Array.isArray(slot?.routineIds) ?
      (slot.routineIds as unknown[]).map(text).filter((x) => x) : [];
    const day = weekday[0].toUpperCase() + weekday.slice(1);
    if (ids.length > 2) {
      errors.push(`${day}: one routine, or two to alternate.`);
    }
    if (ids.length === 2 && ids[0] === ids[1]) {
      errors.push(`${day}: alternate between two different routines.`);
    }
    for (const id of ids) {
      if (!routineIds.has(id)) {
        errors.push(`${day}: uses a routine that no longer exists. ` +
          "Pick another.");
      }
    }
    return {weekday, routineIds: ids.slice(0, 2)};
  });
  if (schedule.every((s) => s.routineIds.length === 0)) {
    errors.push("Pick a routine for at least one day.");
  }
  if (errors.length) return {program: null, errors};
  return {program: {name, notes: notes || null, durationWeeks: weeks,
    schedule}, errors};
}

/** One exercise as the builder edits it (what validateRoutine reads). */
export type EditorExercise = {
  exerciseId: string;
  minSets: number;
  maxSets: number;
  minReps: number;
  maxReps: number;
  toFailure: boolean;
  targetSeconds: number;
  restSeconds: number | null;
  targetRir: {min: number; max: number; finalSetOnly: boolean} | null;
  notes: string;
  doubleProgression: boolean;
  alternativeExerciseIds: string[];
};

/**
 * A new row for [exerciseId]: 3 × 8–12 with double progression, or
 * 3 × 30 s for a hold (the app editor's starting values).
 * @param {string} exerciseId Library id.
 * @return {EditorExercise} Row.
 */
export function newEditorExercise(exerciseId: string): EditorExercise {
  return {exerciseId, minSets: 3, maxSets: 3, minReps: 8, maxReps: 12,
    toFailure: false, targetSeconds: 30, restSeconds: null, targetRir: null,
    notes: "", doubleProgression: true, alternativeExerciseIds: []};
}

/**
 * A stored exercise back in the builder's shape.
 * @param {StoredRoutineExercise} s Stored.
 * @return {EditorExercise} Row.
 */
export function editorExerciseOf(s: StoredRoutineExercise): EditorExercise {
  const reps = typeof s.reps === "number" ? s.reps : 10;
  return {
    exerciseId: s.exerciseId,
    minSets: s.minSets ?? s.sets,
    maxSets: s.maxSets ?? s.sets,
    minReps: s.minReps ?? reps,
    maxReps: s.maxReps ?? s.minReps ?? reps,
    toFailure: s.reps === "toFailure",
    targetSeconds: s.targetSeconds ?? (reps >= 5 ? reps : 30),
    restSeconds: s.restSeconds ?? null,
    targetRir: s.targetRir ?? null,
    notes: s.notes ?? "",
    doubleProgression: s.progressionRule === "doubleProgression",
    alternativeExerciseIds: s.alternativeExerciseIds ?? [],
  };
}
