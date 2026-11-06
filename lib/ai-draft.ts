import type { EditorExercise } from "@/lib/routine-format";

/**
 * aiBuildCoachDraft's plan (functions/src/ai/builder.ts Plan) and its
 * conversion to the builders' editor shape. Weights are never in it: the
 * client's app picks starting weights from their history.
 */
export type AiPlanExercise = {
  exerciseId: string;
  sets: number;
  reps: number;
  minSets: number;
  maxSets: number;
  minReps?: number;
  maxReps?: number;
  targetSeconds?: number;
  restSeconds: number;
  targetRir?: { min: number; max: number; finalSetOnly: boolean };
  progressionRule?: string;
  why: string;
};

export type AiPlanJson = {
  name: string;
  why: string;
  weeks: number;
  routines: {
    key: string;
    name: string;
    category: string;
    why: string;
    exercises: AiPlanExercise[];
  }[];
  schedule: { weekday: string; routineKeys: string[] }[];
};

/** A routine from the plan, ready for the routine builder. */
export type AiRoutineDraft = {
  name: string;
  category: string;
  notes: string;
  exercises: EditorExercise[];
  /** exerciseId → the AI's reason. */
  whys: Record<string, string>;
  why: string;
};

export function editorExerciseOfPlan(e: AiPlanExercise): EditorExercise {
  const minReps = e.minReps ?? e.reps;
  return {
    exerciseId: e.exerciseId,
    minSets: e.minSets,
    maxSets: e.maxSets,
    minReps,
    maxReps: e.maxReps ?? minReps,
    toFailure: false,
    targetSeconds: e.targetSeconds ?? 30,
    restSeconds: e.restSeconds,
    targetRir: e.targetRir ?? null,
    notes: "",
    doubleProgression: e.progressionRule === "doubleProgression",
    alternativeExerciseIds: [],
  };
}

export function routineDraftOf(r: AiPlanJson["routines"][number]): AiRoutineDraft {
  return {
    name: r.name,
    category: r.category,
    notes: "",
    exercises: r.exercises.map(editorExerciseOfPlan),
    whys: Object.fromEntries(r.exercises.filter((e) => e.why).map((e) => [e.exerciseId, e.why])),
    why: r.why,
  };
}
