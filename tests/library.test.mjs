// Coach library: the builder's editor shape round-trips through the
// shared validator (lib/routine-format.ts = functions/src/
// coachLibraryFormat.ts, which has the full limit tests). Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { EXERCISE_CATALOG } from "../lib/exercise-catalog.ts";
import {
  editorExerciseOf,
  newEditorExercise,
  validateRoutine,
} from "../lib/routine-format.ts";

const catalog = new Map(EXERCISE_CATALOG.map((e) => [e.id, { name: e.name, tracking: e.tracking }]));

test("catalog has the app's ids and how-to text", () => {
  assert.ok(EXERCISE_CATALOG.length > 200);
  const bench = EXERCISE_CATALOG.find((e) => e.id === "barbell_bench_press");
  assert.ok(bench.instructions.length > 0);
  assert.ok(bench.cues.length > 0);
});

test("a saved routine opens and saves unchanged", () => {
  const first = validateRoutine({
    name: "Upper A",
    category: "Upper",
    exercises: [
      { ...newEditorExercise("barbell_bench_press"), minSets: 3, maxSets: 4, minReps: 6, maxReps: 10,
        restSeconds: 180, targetRir: { min: 1, max: 2, finalSetOnly: false },
        alternativeExerciseIds: ["incline_barbell_bench_press"] },
      { ...newEditorExercise("plank"), targetSeconds: 45 },
      { ...newEditorExercise("barbell_curl"), toFailure: true },
    ],
  }, catalog);
  assert.deepEqual(first.errors, []);
  const again = validateRoutine({ ...first.routine,
    notes: first.routine.notes ?? "",
    exercises: first.routine.exercises.map(editorExerciseOf) }, catalog);
  assert.deepEqual(again.routine, first.routine);
});
