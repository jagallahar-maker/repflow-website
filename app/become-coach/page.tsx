import { adminDb } from "@/lib/firebase-admin";
import { requireSessionUser } from "@/lib/session";
import BecomeCoachClient from "./become-coach-client";
import Link from "next/link";

async function getExistingCoachForUser(uid: string) {
  const snap = await adminDb
    .collection("coaches")
    .where("ownerUid", "==", uid)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  return {
    coachId: doc.id,
    displayName: (data.displayName as string) ?? "",
    inviteCode: (data.inviteCode as string) ?? "",
  };
}

export default async function BecomeCoachPage() {
  const user = await requireSessionUser();
  const existingCoach = await getExistingCoachForUser(user.uid);

  if (existingCoach) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            ← Back to site
          </Link>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400 mb-3">
              Your Coach Account
            </p>
            <h1 className="text-3xl font-bold">{existingCoach.displayName}</h1>
            <p className="text-zinc-400 mt-2">
              Coach handle:{" "}
              <span className="text-white font-mono">
                @{existingCoach.coachId}
              </span>
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="text-sm text-zinc-400">Invite Code</div>
              <div className="mt-2 text-3xl font-bold font-mono tracking-wider">
                {existingCoach.inviteCode}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                Share this code with athletes so they can connect to you in the
                Repflow app.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/clients"
                className="bg-white text-black px-5 py-2.5 rounded-full font-semibold hover:opacity-90 transition"
              >
                Go to Clients
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          ← Back to site
        </Link>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400 mb-3">
            Become a Coach
          </p>
          <h1 className="text-3xl font-bold">Set up your coach profile</h1>
          <p className="text-zinc-400 mt-2">
            Pick a coach handle and display name. We&apos;ll generate an invite
            code you can share with your athletes.
          </p>

          <div className="mt-6">
            <BecomeCoachClient
              defaultDisplayName={user.name ?? ""}
              userEmail={user.email ?? ""}
            />
          </div>
        </div>
      </div>
    </main>
  );
}