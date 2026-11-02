import CoachHeader from "@/components/CoachHeader";
import InviteCodeCard from "@/components/InviteCodeCard";
import { formatShortDate, getCoachClients } from "@/lib/coach-data";
import {
  getClientOverview,
  relativeDay,
  type ClientOverview,
} from "@/lib/coach-overview.ts";
import {
  requireCoach,
  verifyClientBelongsToCoach,
} from "@/lib/coach-session";
import Link from "next/link";

type PastClient = {
  id: string;
  displayName: string;
  endedAt: string | { toDate?: () => Date } | null;
};

type Filter = "all" | "attention" | "ontrack";

/**
 * Active clients get a full overview row; everyone else on the roster
 * (they disconnected, the coach ended it, or they moved to another coach)
 * is listed by name only and their data is never read.
 */
async function getRoster(coachId: string) {
  const clients = await getCoachClients(coachId);
  const access = await Promise.all(
    clients.map((c) => verifyClientBelongsToCoach(coachId, c.id)),
  );
  const active = clients.filter((_, i) => access[i]);
  const past: PastClient[] = clients
    .filter((_, i) => !access[i])
    .map((c) => ({
      id: c.id,
      displayName: c.displayName || "Unnamed Client",
      endedAt: c.unlinkedAt ?? c.endedAt ?? c.updatedAt ?? null,
    }));
  const rows = await Promise.all(
    active.map((c) => getClientOverview(c.id, c)),
  );
  // Needs attention first (most urgent on top), then by most recent workout.
  rows.sort(
    (a, b) =>
      Number(b.needsAttention) - Number(a.needsAttention) ||
      b.score - a.score ||
      (b.lastWorkoutDay ?? -1) - (a.lastWorkoutDay ?? -1),
  );
  return { rows, past };
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireCoach();
  const { filter: rawFilter } = await searchParams;
  const filter: Filter =
    rawFilter === "attention" || rawFilter === "ontrack" ? rawFilter : "all";
  const { rows, past } = await getRoster(session.coachId);

  const attentionCount = rows.filter((r) => r.needsAttention).length;
  const visible = rows.filter((r) =>
    filter === "attention" ? r.needsAttention : filter === "ontrack" ? !r.needsAttention : true,
  );
  const workoutsThisWeek = rows.reduce((s, r) => s + r.workoutsThisWeek, 0);
  const trainedThisWeek = rows.filter((r) => r.workoutsThisWeek > 0).length;

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <CoachHeader
          coachId={session.coachId}
          coachDisplayName={session.coachDisplayName}
        />

        <h1 className="text-2xl sm:text-3xl font-bold">Clients</h1>
        <p className="text-zinc-400 mt-1 mb-6">
          {rows.length} active client{rows.length === 1 ? "" : "s"}
          {attentionCount > 0 && (
            <>
              {" · "}
              <span className="text-amber-400">
                {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
              </span>
            </>
          )}
        </p>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          <Stat label="Active clients" value={String(rows.length)} />
          <Stat label="Need attention" value={String(attentionCount)} accent={attentionCount > 0 ? "amber" : undefined} />
          <Stat label="Trained this week" value={`${trainedThisWeek}/${rows.length}`} />
          <Stat label="Workouts this week" value={String(workoutsThisWeek)} />
        </div>

        <div className="mb-6">
          <InviteCodeCard inviteCode={session.inviteCode} />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {(
            [
              ["all", `All (${rows.length})`],
              ["attention", `Needs attention (${attentionCount})`],
              ["ontrack", `On track (${rows.length - attentionCount})`],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={key === "all" ? "/clients" : `/clients?filter=${key}`}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                filter === key
                  ? "border-[#9EFD06] text-[#9EFD06] bg-[#9EFD06]/10"
                  : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="grid gap-3">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
              No active clients yet. Once an athlete (18+) enters your invite
              code in the Repflow app, they&apos;ll show up here.
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
              {filter === "attention"
                ? "Nobody needs attention right now."
                : "No clients match this filter."}
            </div>
          ) : (
            visible.map((r) => <ClientRow key={r.id} row={r} />)
          )}
        </div>

        {/* Past clients: name only, no link, no data */}
        {past.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
              Past clients
            </h2>
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 divide-y divide-zinc-900">
              {past.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3 text-sm"
                >
                  <span className="text-zinc-400 truncate">{p.displayName}</span>
                  <span className="text-zinc-600 shrink-0 ml-4">
                    Ended {formatShortDate(p.endedAt)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              You no longer have access to past clients&apos; data.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber";
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold ${accent === "amber" ? "text-amber-400" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function ClientRow({ row }: { row: ClientOverview }) {
  const t = row.target;
  const weekLabel =
    t.kind === "program"
      ? `${t.completed}/${t.planned} planned`
      : `${row.workoutsThisWeek} · avg ${t.avgPerWeek.toFixed(1)}/wk`;
  const weekSub =
    t.kind === "program"
      ? `${row.workoutsThisWeek} workout${row.workoutsThisWeek === 1 ? "" : "s"} · ${t.programName}`
      : t.programName
        ? `${t.programName} (rotating)`
        : "No program · vs last 4 weeks";
  const rate = row.rateLbPerWeek;

  return (
    <Link
      href={`/clients/${row.id}`}
      className={`block rounded-2xl border bg-zinc-950 p-4 sm:p-5 transition hover:bg-zinc-900 ${
        row.needsAttention ? "border-amber-500/30" : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base sm:text-lg font-semibold truncate">{row.name}</div>
          <div className="text-xs sm:text-sm text-zinc-500 truncate">{row.email}</div>
        </div>
        {!row.needsAttention && (
          <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border border-[#9EFD06]/30 text-[#9EFD06] bg-[#9EFD06]/10">
            On track
          </span>
        )}
      </div>

      {row.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {row.flags.map((f) => (
            <span
              key={f.key}
              className={`text-xs px-2 py-0.5 rounded-full border ${
                f.level === "warn"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-sky-500/30 bg-sky-500/10 text-sky-300"
              }`}
            >
              {f.label}
            </span>
          ))}
        </div>
      )}

      <div
        className={`mt-4 grid gap-2 grid-cols-2 text-sm ${
          row.sharing.nutrition ? "md:grid-cols-5" : "md:grid-cols-4"
        }`}
      >
        {row.sharing.workouts ? (
          <>
            <Cell label="Last workout" value={relativeDay(row.lastWorkoutDay, row.today)} />
            <Cell label="This week" value={weekLabel} sub={weekSub} />
          </>
        ) : (
          <>
            <NotSharedCell label="Last workout" />
            <NotSharedCell label="This week" />
          </>
        )}
        {row.sharing.body ? (
          <>
            <Cell
              label="Trend weight"
              value={row.trendWeight != null ? `${row.trendWeight.toFixed(1)} lb` : "—"}
              sub={
                rate != null
                  ? `${rate > 0 ? "+" : ""}${rate.toFixed(2)} lb/wk`
                  : "Not enough weigh-ins"
              }
            />
            <Cell
              label="Goal"
              value={row.goalWeight != null ? `${row.goalWeight.toFixed(1)} lb` : "Not set"}
              sub={row.goalText ?? undefined}
            />
          </>
        ) : (
          <>
            <NotSharedCell label="Trend weight" />
            <NotSharedCell label="Goal" />
          </>
        )}
        {row.sharing.nutrition && (
          <Cell
            label="Food logging"
            value={row.foodLoggedDays != null ? `${row.foodLoggedDays}/7 days` : "—"}
            sub="completed days"
          />
        )}
      </div>
    </Link>
  );
}

function NotSharedCell({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-black px-3 py-2.5 min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-zinc-600">{label}</div>
      <div className="mt-0.5 text-zinc-600 truncate">Not shared by client</div>
    </div>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black px-3 py-2.5 min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-0.5 font-semibold truncate">{value}</div>
      {sub && <div className="text-xs text-zinc-500 truncate">{sub}</div>}
    </div>
  );
}
