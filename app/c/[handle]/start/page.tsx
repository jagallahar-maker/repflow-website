import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import IntakeForm from "@/components/intake/IntakeForm";

/**
 * /c/{handle}/start: a coach's client intake form, for people not on
 * Repflow yet (no account). Only the coach's display name is shown; the
 * coach doc's email and invite code never reach the page. 404 unless the
 * coach is active and has the form turned on (intakeEnabled), the same
 * check submitIntake makes. ?src=qr marks a QR code visit.
 */

const HANDLE = /^[a-z][a-z0-9_]{2,19}$/;

/**
 * The coach's first name for the form's text (the title and the consent
 * boxes keep the full name): the first word, skipping a leading "Coach" or
 * "Dr." ("Coach Mike Lee" → "Mike"); a one-word name stays as is.
 */
function firstNameOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const rest = words.length > 1 && /^(coach|dr\.?)$/i.test(words[0]) ? words.slice(1) : words;
  return rest[0] || name;
}

async function coachFor(handle: string): Promise<{ handle: string; name: string; firstName: string } | null> {
  if (!HANDLE.test(handle)) return null;
  const snap = await adminDb.collection("coaches").doc(handle).get();
  if (!snap.exists || snap.get("isActive") !== true || snap.get("intakeEnabled") !== true) return null;
  const name = String(snap.get("displayName") || handle);
  return { handle, name, firstName: firstNameOf(name) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const coach = await coachFor((await params).handle);
  return {
    title: coach ? `Train with ${coach.name} · Repflow` : "Repflow",
    description: coach ? `Answer a few questions before your first session with ${coach.name}.` : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function IntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const coach = await coachFor((await params).handle);
  if (!coach) notFound();
  const source = (await searchParams).src === "qr" ? "qr" : "link";
  const initials = coach.name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {/* The Repflow mark is in the site header above. */}
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className="w-14 h-14 shrink-0 rounded-full bg-[#9EFD06]/15 border border-[#9EFD06]/40 text-[#9EFD06] flex items-center justify-center text-lg font-bold"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Train with {coach.name}</h1>
            <p className="mt-1 text-zinc-400 text-sm">
              A few questions before your first session, so {coach.firstName} can plan it. About 4 minutes.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <IntakeForm coach={coach} source={source} />
        </div>
      </div>
    </main>
  );
}
