import { notFound } from "next/navigation";
import CoachHeader from "@/components/CoachHeader";
import RoutineBuilder from "@/components/library/RoutineBuilder";
import { requireCoach } from "@/lib/coach-session";
import { getCoachRoutine, listDraftClients } from "@/lib/coach-library-data";
import { editorExerciseOf } from "@/lib/routine-format";

/** /library/routines/new, or /library/routines/{id} to edit. */
export default async function RoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCoach();
  const { id } = await params;
  const isNew = id === "new";
  const [routine, clients] = await Promise.all([
    isNew ? null : getCoachRoutine(session.coachId, id),
    listDraftClients(session.coachId),
  ]);
  if (!isNew && !routine) notFound();

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <CoachHeader coachId={session.coachId} coachDisplayName={session.coachDisplayName} />
        <h1 className="text-2xl font-bold mb-4">{isNew ? "New routine" : "Edit routine"}</h1>
        <RoutineBuilder
          id={routine?.id ?? null}
          clients={clients}
          initial={{
            name: routine?.name ?? "",
            category: routine?.category ?? "Custom",
            notes: routine?.notes ?? "",
            exercises: (routine?.exercises ?? []).map(editorExerciseOf),
          }}
        />
      </div>
    </main>
  );
}
