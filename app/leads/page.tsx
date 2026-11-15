import Link from "next/link";
import CoachHeader from "@/components/CoachHeader";
import IntakeShareCard from "@/components/intake/IntakeShareCard";
import { requireCoach } from "@/lib/coach-session";
import { intakeSettings, listLeads, type LeadView } from "@/lib/coach-leads-data";
import { GOALS } from "@/lib/intake-format";

/**
 * /leads (New clients): intake forms from people not on Repflow yet, the
 * form's on / off switch, link and QR. Archived forms are a separate tab.
 */

const STATUS: Record<LeadView["status"], { label: string; cls: string }> = {
  new: { label: "New", cls: "text-[#9EFD06] border-[#9EFD06]/50 bg-[#9EFD06]/10" },
  contacted: { label: "Contacted", cls: "text-zinc-300 border-zinc-700" },
  invited: { label: "Invited", cls: "text-sky-300 border-sky-500/50 bg-sky-500/10" },
  archived: { label: "Archived", cls: "text-zinc-500 border-zinc-800" },
};

function when(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireCoach();
  const archived = (await searchParams).show === "archived";
  const [all, { enabled, termsAgreed }] = await Promise.all([
    listLeads(session.coachId),
    intakeSettings(session.coachId),
  ]);
  const open = all.filter((l) => l.status !== "archived");
  const shown = archived ? all.filter((l) => l.status === "archived") : open;
  const newCount = open.filter((l) => l.status === "new").length;

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <CoachHeader coachId={session.coachId} coachDisplayName={session.coachDisplayName} />
        <h1 className="text-2xl sm:text-3xl font-bold">New clients</h1>
        <p className="text-zinc-400 mt-1 mb-6">
          {newCount} new form{newCount === 1 ? "" : "s"} · {open.length} open
        </p>

        <div className="mb-6">
          <IntakeShareCard handle={session.coachId} enabled={enabled} termsAgreed={termsAgreed} />
        </div>

        <div className="flex gap-2 mb-4">
          {(
            [
              ["", `Open (${open.length})`],
              ["archived", `Archived (${all.length - open.length})`],
            ] as const
          ).map(([key, text]) => (
            <Link
              key={key}
              href={key ? `/leads?show=${key}` : "/leads"}
              className={`text-sm px-3 py-1.5 rounded-full border ${
                (key === "archived") === archived
                  ? "border-[#9EFD06] text-[#9EFD06] bg-[#9EFD06]/10"
                  : "border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {text}
            </Link>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
            {archived
              ? "No archived forms."
              : enabled
                ? "No forms yet. Share your link or QR code with people you're about to coach."
                : "No forms yet. Turn on your intake form above to get a link to share."}
          </div>
        ) : (
          <ul className="space-y-2">
            {shown.map((l) => {
              const s = STATUS[l.status];
              const goals = l.answers.goals
                .map((g) => GOALS.find((x) => x.id === g)?.label ?? g)
                .join(", ");
              return (
                <li key={l.id}>
                  <Link
                    href={`/leads/${l.id}`}
                    className="block rounded-2xl border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-600 transition"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{l.answers.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                      {l.clearanceRecommended && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-red-500/50 bg-red-500/10 text-red-300">
                          Medical clearance recommended
                        </span>
                      )}
                      {l.answers.scope === "training_diet" && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">Diet</span>
                      )}
                      {l.consent.ai && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">AI allowed</span>
                      )}
                      <span className="ml-auto text-xs text-zinc-500">{when(l.createdAt)}</span>
                    </div>
                    <div className="mt-1 text-sm text-zinc-400 truncate">
                      {goals} · {l.answers.daysPerWeek} days a week · {l.answers.sessionMinutes >= 90 ? "90+" : l.answers.sessionMinutes} min
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
