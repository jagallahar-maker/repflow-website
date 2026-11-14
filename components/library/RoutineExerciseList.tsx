"use client";

import type { EditorExercise } from "@/lib/routine-format";
import { EXERCISE_BY_ID } from "./ExercisePicker";
import { exerciseSummary } from "./exercise-summary";

/**
 * A routine's exercises, read-only, as they'll run in the app: name,
 * sets × reps (or time), rest, RIR / to failure, and the AI's one-line
 * reason for AI drafts ([whys], by exercise id). Used under each day in
 * the program builder; editing stays in the routine builder.
 */
export default function RoutineExerciseList({
  exercises,
  whys,
}: {
  exercises: EditorExercise[];
  whys?: Record<string, string>;
}) {
  if (exercises.length === 0) {
    return <p className="mt-2 text-xs text-zinc-500">No exercises in this routine.</p>;
  }
  return (
    <ol className="mt-2 rounded-xl border border-zinc-900 bg-black/40 divide-y divide-zinc-900">
      {exercises.map((e, i) => {
        const ex = EXERCISE_BY_ID.get(e.exerciseId);
        const why = whys?.[e.exerciseId];
        return (
          <li key={`${e.exerciseId}-${i}`} className="flex gap-2 px-3 py-2">
            <span className="w-5 shrink-0 text-right text-xs text-zinc-600 pt-0.5">{i + 1}.</span>
            <div className="min-w-0">
              <div className={`text-sm ${ex ? "text-zinc-100" : "text-red-400"}`}>
                {ex?.name ?? "Missing exercise"}
              </div>
              <div className="text-xs text-zinc-500">{exerciseSummary(e)}</div>
              {why && <div className="text-xs text-zinc-400 mt-0.5">✨ {why}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
