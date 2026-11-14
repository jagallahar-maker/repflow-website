import { notFound } from "next/navigation";
import CoachHeader from "@/components/CoachHeader";
import ProgramBuilder, { type BuilderLead } from "@/components/library/ProgramBuilder";
import { requireCoach } from "@/lib/coach-session";
import { getCoachProgram, listCoachRoutines, listDraftClients } from "@/lib/coach-library-data";
import { getLead } from "@/lib/coach-leads-data";
import {
  GOALS,
  HOME_EQUIPMENT,
  INJURY_AREAS,
  PLACES,
  leadBuildDefaults,
  type IntakeAnswers,
} from "@/lib/intake-format";
import { WEEKDAYS, editorExerciseOf } from "@/lib/routine-format";

const label = (list: { id: string; label: string }[], id: string) =>
  list.find((c) => c.id === id)?.label ?? id;

/** A new-client form's answers as the builder's banner lines. */
function leadSummary(a: IntakeAnswers): string[] {
  return [
    `Goals: ${a.goals.map((g) => label(GOALS, g)).join(", ")}${a.goalText ? ` · "${a.goalText}"` : ""}`,
    `${a.daysPerWeek} days a week · ${a.sessionMinutes >= 90 ? "90+" : a.sessionMinutes} min · ${a.experience}`,
    `Trains: ${label(PLACES, a.place)}${
      a.place === "home" && a.owned.length ? ` (${a.owned.map((o) => label(HOME_EQUIPMENT, o)).join(", ")})` : ""
    }`,
    `Protect: ${a.injuryAreas.length ? a.injuryAreas.map((i) => label(INJURY_AREAS, i)).join(", ") : "nothing"}${
      a.injuryDetails ? ` · "${a.injuryDetails}"` : ""
    }`,
  ];
}

/**
 * /library/programs/new, or /library/programs/{id} to edit.
 * /library/programs/new?lead={leadId}: "Build plan" from a new-client form.
 */
export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireCoach();
  const { id } = await params;
  const leadParam = (await searchParams).lead;
  const isNew = id === "new";
  const [program, routines, clients, leadDoc] = await Promise.all([
    isNew ? null : getCoachProgram(session.coachId, id),
    listCoachRoutines(session.coachId),
    listDraftClients(session.coachId),
    isNew && typeof leadParam === "string" ? getLead(session.coachId, leadParam) : null,
  ]);
  if (!isNew && !program) notFound();

  const days = Object.fromEntries(
    WEEKDAYS.map((d) => [
      d,
      program?.schedule.find((s) => s.weekday === d)?.routineIds ?? [],
    ]),
  );

  const firstName = leadDoc ? leadDoc.answers.name.split(/\s+/)[0] || leadDoc.answers.name : "";
  const lead: BuilderLead | null = leadDoc
    ? {
        id: leadDoc.id,
        firstName,
        defaults: leadBuildDefaults(leadDoc.answers),
        aiConsent: leadDoc.consent.ai,
        summary: leadSummary(leadDoc.answers),
      }
    : null;

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <CoachHeader coachId={session.coachId} coachDisplayName={session.coachDisplayName} />
        <h1 className="text-2xl font-bold mb-4">
          {lead ? `Plan for ${firstName}` : isNew ? "New program" : "Edit program"}
        </h1>
        <ProgramBuilder
          id={program?.id ?? null}
          initial={{
            name: program?.name ?? (lead ? `Plan for ${firstName}`.slice(0, 40) : ""),
            notes: program?.notes ?? "",
            durationWeeks: program?.durationWeeks ?? 8,
            days,
          }}
          clients={clients}
          lead={lead}
          routines={routines.map((r) => ({
            id: r.id,
            name: r.name,
            summary: `${r.category} · ${r.exercises.length} exercises · about ${r.estimatedDurationMinutes} min`,
            // Shown under each day (RoutineExerciseList).
            exercises: r.exercises.map(editorExerciseOf),
          }))}
        />
      </div>
    </main>
  );
}
