import type { EditorExercise } from "@/lib/routine-format";
import { EXERCISE_BY_ID } from "./ExercisePicker";

/** 90 → "1:30". */
export function mmss(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * One exercise's prescription in the app's wording, used by the routine
 * builder rows and the program builder's inline lists:
 * "3–4 × 6–10 reps · rest 3:00 · RIR 1–2 · progression", or
 * "3 × 30 s" for a hold, "3 × to failure".
 */
export function exerciseSummary(r: EditorExercise): string {
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
