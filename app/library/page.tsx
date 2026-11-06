import Link from "next/link";
import CoachHeader from "@/components/CoachHeader";
import LibraryActions from "@/components/library/LibraryActions";
import { requireCoach } from "@/lib/coach-session";
import {
  assignedIds,
  listCoachPrograms,
  listCoachRoutines,
} from "@/lib/coach-library-data";
import { formatShortDate } from "@/lib/coach-data";

const dayShort = (d: string) => d[0].toUpperCase() + d.slice(1, 3);

/**
 * The coach's library: routines and programs they've built (drafts until
 * assigned, Phase 5b). Duplicate or delete; delete is blocked while a
 * program uses the routine or it's assigned to a client.
 */
export default async function LibraryPage() {
  const session = await requireCoach();
  const [routines, programs, assigned] = await Promise.all([
    listCoachRoutines(session.coachId),
    listCoachPrograms(session.coachId),
    assignedIds(session.coachId),
  ]);
  const routineName = new Map(routines.map((r) => [r.id, r.name]));
  const usedBy = (routineId: string) =>
    programs.find((p) => p.routineIds.includes(routineId))?.name;

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <CoachHeader coachId={session.coachId} coachDisplayName={session.coachDisplayName} />

        <h1 className="text-2xl sm:text-3xl font-bold">Library</h1>
        <p className="text-zinc-400 mt-1 mb-8">
          Routines and programs you build here use the Repflow exercise library and the
          app&apos;s routine format. Assigning them to clients comes next.
        </p>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wider text-zinc-500">
              Programs ({programs.length})
            </h2>
            <Link
              href="/library/programs/new"
              className="text-sm rounded-full bg-[#9EFD06] text-black font-semibold px-4 py-1.5"
            >
              New program
            </Link>
          </div>
          {programs.length === 0 ? (
            <Empty text="No programs yet. A program is a weekly schedule of your routines, 1–16 weeks long." />
          ) : (
            <ul className="rounded-2xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900">
              {programs.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <Link href={`/library/programs/${p.id}`} className="min-w-0 flex-1 group">
                    <div className="font-medium group-hover:text-[#9EFD06] truncate">{p.name}</div>
                    <div className="text-xs text-zinc-500 truncate">
                      {p.durationWeeks} weeks ·{" "}
                      {p.schedule
                        .filter((s) => s.routineIds.length > 0)
                        .map((s) =>
                          `${dayShort(s.weekday)} ${s.routineIds.map((r) => routineName.get(r) ?? "missing").join(" / ")}`,
                        )
                        .join(" · ")}
                    </div>
                    <div className="text-[11px] text-zinc-600 mt-0.5">
                      Updated {formatShortDate(p.updatedAt)} · version {p.version}
                    </div>
                  </Link>
                  <LibraryActions
                    kind="program"
                    id={p.id}
                    name={p.name}
                    blockedReason={assigned.has(p.id) ? "Assigned to a client" : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wider text-zinc-500">
              Routines ({routines.length})
            </h2>
            <Link
              href="/library/routines/new"
              className="text-sm rounded-full bg-[#9EFD06] text-black font-semibold px-4 py-1.5"
            >
              New routine
            </Link>
          </div>
          {routines.length === 0 ? (
            <Empty text="No routines yet. Start with one workout: exercises, sets, reps or holds, rest and RIR." />
          ) : (
            <ul className="rounded-2xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900">
              {routines.map((r) => {
                const program = usedBy(r.id);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <Link href={`/library/routines/${r.id}`} className="min-w-0 flex-1 group">
                      <div className="font-medium group-hover:text-[#9EFD06] truncate">{r.name}</div>
                      <div className="text-xs text-zinc-500">
                        {r.category} · {r.exercises.length} exercise{r.exercises.length === 1 ? "" : "s"} · about{" "}
                        {r.estimatedDurationMinutes} min
                      </div>
                      <div className="text-[11px] text-zinc-600 mt-0.5">
                        Updated {formatShortDate(r.updatedAt)} · version {r.version}
                      </div>
                    </Link>
                    <LibraryActions
                      kind="routine"
                      id={r.id}
                      name={r.name}
                      blockedReason={
                        assigned.has(r.id)
                          ? "Assigned to a client"
                          : program
                            ? `Used by ${program}`
                            : undefined
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-400">
      {text}
    </div>
  );
}
