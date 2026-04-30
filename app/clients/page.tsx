import CoachHeader from "@/components/CoachHeader";
import {
  formatRelativeDate,
  formatWeight,
  formatWeightChange,
  getClientCardData,
  getCoachClients,
  getStatusColor,
  type ClientCardData,
} from "@/lib/coach-data";
import { requireCoach } from "@/lib/coach-session";
import Link from "next/link";

async function getAllClientCards(coachId: string): Promise<ClientCardData[]> {
  const clients = await getCoachClients(coachId);

  const cards = await Promise.all(
    clients.map((client) => getClientCardData(client.id, client)),
  );

  return cards;
}

export default async function ClientsPage() {
  const session = await requireCoach();
  const cards = await getAllClientCards(session.coachId);

  const totalClients = cards.length;
  const activeThisWeek = cards.filter((c) => c.workoutsLast7Days > 0).length;
  const totalWorkoutsThisWeek = cards.reduce(
    (sum, c) => sum + c.workoutsLast7Days,
    0,
  );

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <CoachHeader
          coachId={session.coachId}
          coachDisplayName={session.coachDisplayName}
        />

        <div className="flex items-end justify-between mb-2">
          <h1 className="text-3xl font-bold">Clients</h1>
        </div>
        <p className="text-zinc-400 mb-6">
          Connected clients for {session.coachDisplayName}
        </p>

        {/* Top-level stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">Total Clients</div>
            <div className="mt-2 text-3xl font-bold">{totalClients}</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">Active This Week</div>
            <div className="mt-2 text-3xl font-bold">{activeThisWeek}</div>
            <div className="mt-1 text-xs text-zinc-500">
              of {totalClients} clients
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">Total Workouts (7d)</div>
            <div className="mt-2 text-3xl font-bold">
              {totalWorkoutsThisWeek}
            </div>
          </div>
        </div>

        {/* Invite code reminder */}
        {session.inviteCode && cards.length === 0 && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2">
              No clients yet
            </div>
            <div className="text-lg">
              Share your invite code{" "}
              <span className="font-mono font-bold text-white">
                {session.inviteCode}
              </span>{" "}
              with athletes to connect them.
            </div>
          </div>
        )}

        {/* Client cards */}
        <div className="grid gap-4">
          {cards.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
              No clients found. Once an athlete enters your invite code in the
              Repflow app, they&apos;ll show up here.
            </div>
          ) : (
            cards.map((card) => {
              const { id, summary } = card;
              const statusClasses = getStatusColor(summary.status);
              const isStale =
                !card.lastWorkoutDate || card.workoutsLast7Days === 0;

              return (
                <Link
                  key={id}
                  href={`/clients/${id}`}
                  className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700 hover:bg-zinc-800/70"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold truncate">
                        {summary.displayName || "Unnamed Client"}
                      </div>
                      <div className="text-sm text-zinc-400 mt-1 truncate">
                        {summary.email || "No email"}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusClasses}`}
                      >
                        {summary.status || "unknown"}
                      </span>
                      {isStale && (
                        <span className="text-xs text-amber-400">
                          ⚠ No recent activity
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary stats */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <div className="text-xs text-zinc-400">
                        Current Weight
                      </div>
                      <div className="mt-1 text-xl font-bold">
                        {formatWeight(card.latestWeight)}
                      </div>
                      {card.weightChange != null && (
                        <div
                          className={`mt-1 text-xs ${
                            card.weightChange > 0
                              ? "text-amber-400"
                              : card.weightChange < 0
                                ? "text-emerald-400"
                                : "text-zinc-500"
                          }`}
                        >
                          {formatWeightChange(card.weightChange)} trend
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <div className="text-xs text-zinc-400">
                        Workouts (7d)
                      </div>
                      <div className="mt-1 text-xl font-bold">
                        {card.workoutsLast7Days}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {card.strengthLast7Days} strength •{" "}
                        {card.cardioLast7Days} cardio
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <div className="text-xs text-zinc-400">Last Workout</div>
                      <div className="mt-1 text-xl font-bold">
                        {formatRelativeDate(card.lastWorkoutDate)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Goal: {formatWeight(summary.goalWeight)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}