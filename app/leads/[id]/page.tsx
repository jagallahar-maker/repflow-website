import Link from "next/link";
import { notFound } from "next/navigation";
import CoachHeader from "@/components/CoachHeader";
import LeadActions from "@/components/intake/LeadActions";
import LeadAnswers from "@/components/intake/LeadAnswers";
import { requireCoach } from "@/lib/coach-session";
import { getLead } from "@/lib/coach-leads-data";
import { listCoachPrograms } from "@/lib/coach-library-data";

/** /leads/{id}: one intake form, its answers and the coach's actions. */
export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCoach();
  const { id } = await params;
  const [lead, programs] = await Promise.all([
    getLead(session.coachId, id),
    listCoachPrograms(session.coachId),
  ]);
  if (!lead) notFound();
  const a = lead.answers;
  const firstName = a.name.split(/\s+/)[0] || a.name;
  const sent = lead.createdAt
    ? new Date(lead.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <CoachHeader coachId={session.coachId} coachDisplayName={session.coachDisplayName} />
        <Link href="/leads" className="text-sm text-zinc-400 hover:text-white">
          ← New clients
        </Link>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold">{a.name}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Sent {sent}
          {lead.source === "qr" ? " · from the QR code" : ""}
          {lead.submissions > 1 ? ` · updated ${lead.submissions - 1}×` : ""}
          {" · consent "}
          {lead.consent.ai ? "incl. AI" : "without AI"}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 order-2 lg:order-1">
            <LeadAnswers answers={a} clearanceRecommended={lead.clearanceRecommended} />
          </section>
          <div className="order-1 lg:order-2">
            <LeadActions
              id={lead.id}
              status={lead.status}
              firstName={firstName}
              email={a.email}
              aiConsent={lead.consent.ai}
              planProgramId={lead.planProgramId}
              invite={lead.invite}
              programs={programs.map((p) => ({ id: p.id, name: p.name }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
