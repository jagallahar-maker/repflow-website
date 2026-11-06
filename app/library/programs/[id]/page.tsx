import { notFound } from "next/navigation";
import CoachHeader from "@/components/CoachHeader";
import ProgramBuilder from "@/components/library/ProgramBuilder";
import { requireCoach } from "@/lib/coach-session";
import { getCoachProgram, listCoachRoutines } from "@/lib/coach-library-data";
import { WEEKDAYS } from "@/lib/routine-format";

/** /library/programs/new, or /library/programs/{id} to edit. */
export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCoach();
  const { id } = await params;
  const isNew = id === "new";
  const [program, routines] = await Promise.all([
    isNew ? null : getCoachProgram(session.coachId, id),
    listCoachRoutines(session.coachId),
  ]);
  if (!isNew && !program) notFound();

  const days = Object.fromEntries(
    WEEKDAYS.map((d) => [
      d,
      program?.schedule.find((s) => s.weekday === d)?.routineIds ?? [],
    ]),
  );

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <CoachHeader coachId={session.coachId} coachDisplayName={session.coachDisplayName} />
        <h1 className="text-2xl font-bold mb-4">{isNew ? "New program" : "Edit program"}</h1>
        <ProgramBuilder
          id={program?.id ?? null}
          initial={{
            name: program?.name ?? "",
            notes: program?.notes ?? "",
            durationWeeks: program?.durationWeeks ?? 8,
            days,
          }}
          routines={routines.map((r) => ({
            id: r.id,
            name: r.name,
            summary: `${r.category} · ${r.exercises.length} exercises · about ${r.estimatedDurationMinutes} min`,
          }))}
        />
      </div>
    </main>
  );
}
