import CoachHeader from "@/components/CoachHeader";
import CoachNotesSection from "@/components/CoachNotesSection";
import CoachSharedMediaSection from "@/components/CoachSharedMediaSection";
import EndCoachingButton from "@/components/EndCoachingButton";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import ExerciseProgressionChart from "@/components/charts/ExerciseProgressionChart";
import WeeklyCardioChart from "@/components/charts/WeeklyCardioChart";
import WeeklyVolumeChart from "@/components/charts/WeeklyVolumeChart";
import WeeklyWorkoutCountChart from "@/components/charts/WeeklyWorkoutCountChart";
import WeightTrendChart, { type TrendDay } from "@/components/charts/WeightTrendChart";
import {
  getActiveProgram,
  getSessions,
  getWeighIns,
  markCoachViewed,
} from "@/lib/coach-client-data.ts";
import {
  buildActivityHeatmap,
  buildE1rmSeries,
  buildExerciseOptions,
  buildWeeklyCardioSeries,
  buildWeeklyCountSeries,
  buildWeeklyVolumeSeries,
} from "@/lib/coach-charts";
import {
  formatDistanceMiles,
  formatDuration,
  formatShortDate,
  formatWeight,
  getBestDisplayName,
  getBestEmail,
  getClientSummary,
  getUserProfile,
  type ActivitySessionDoc,
} from "@/lib/coach-data";
import {
  bestLifts,
  formatHold,
  lastWorkoutDay,
  muscleBalance,
  prEvents,
  sessionDay,
  weeklyWorkoutStats,
  type SessionDoc,
} from "@/lib/coach-insights.ts";
import { getCoachNotes } from "@/lib/coach-notes-data";
import { relativeDay, weighInPoints } from "@/lib/coach-overview.ts";
import {
  isWeekdaySchedule,
  programAdherence,
  programWeek,
  type WeekAdherence,
} from "@/lib/coach-programs.ts";
import { requireCoach, verifyClientBelongsToCoach } from "@/lib/coach-session";
import {
  dailyTrend,
  dayKey,
  formatDay,
  formatDayShort,
  goalEstimate,
  todayDay,
  trendRate,
  trendWeightAt,
} from "@/lib/trend.ts";
import Link from "next/link";
import { notFound } from "next/navigation";

type ClientPageProps = {
  params: Promise<{ clientId: string }>;
};

const CARD = "rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5";
const LIME = "text-[#9EFD06]";

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { clientId } = await params;
  const session = await requireCoach();

  if (!(await verifyClientBelongsToCoach(session.coachId, clientId))) {
    notFound();
  }

  const [summary, profile, logs, sessions, program, coachNotes] = await Promise.all([
    getClientSummary(clientId, session.coachId),
    getUserProfile(clientId),
    getWeighIns(clientId, 1500),
    getSessions(clientId, 300, "full"),
    getActiveProgram(clientId),
    getCoachNotes(session.coachId, clientId),
  ]);
  if (!summary) notFound();
  // Drives the dashboard's "new shared media since your last visit".
  await markCoachViewed(session.coachId, clientId);

  const today = todayDay();
  const displayName = getBestDisplayName(summary, profile);
  const email = getBestEmail(summary, profile);

  // ── Weight ──────────────────────────────────────────────────────────
  const points = weighInPoints(logs);
  const trend = trendRate(points, today);
  const trendWeight = trendWeightAt(points, today);
  const goalWeight = typeof profile?.goalWeight === "number" ? profile.goalWeight : null;
  const latestWeight = points.length ? points[0].weightLb : null;
  const currentWeight = trendWeight ?? latestWeight;
  const goalText =
    currentWeight != null
      ? goalEstimate({ goalWeightLb: goalWeight, currentWeightLb: currentWeight, trend, today })
      : null;
  const daily = dailyTrend(points, today);
  const chartDays: TrendDay[] = daily.map((d) => [
    d.day,
    d.weighInLb == null ? null : Math.round(d.weighInLb * 10) / 10,
    d.weighIns,
    d.trend == null ? null : Math.round(d.trend * 100) / 100,
  ]);
  const trendByDay: Record<string, number> = {};
  for (const d of daily) {
    if (d.trend != null) trendByDay[dayKey(d.day)] = Math.round(d.trend * 10) / 10;
  }

  // ── Training ────────────────────────────────────────────────────────
  const lastDay = lastWorkoutDay(sessions);
  const week = weeklyWorkoutStats(sessions, today);
  const adherence = program ? programAdherence(program, today, 4) : null;
  const weekdayProgram = program ? isWeekdaySchedule(program) : false;
  const progWeek = program ? programWeek(program, today) : null;
  const prs = prEvents(sessions)
    .filter((e) => e.day >= today - 60)
    .reverse()
    .slice(0, 10);
  const lifts = bestLifts(sessions, 8);
  const balance = muscleBalance(sessions, today, 4);
  const history = sessions.slice(0, 30);

  const chartSessions = sessions as unknown as ActivitySessionDoc[];
  const exerciseOptions = buildExerciseOptions(chartSessions, 10);
  const seriesByExerciseId: Record<string, ReturnType<typeof buildE1rmSeries>> = {};
  for (const opt of exerciseOptions) {
    seriesByExerciseId[opt.exerciseId] = buildE1rmSeries(chartSessions, opt.exerciseId, 365);
  }

  const rate = trend?.lbPerWeek ?? null;
  const showProgramWeek = weekdayProgram && adherence != null;

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <CoachHeader coachId={session.coachId} coachDisplayName={session.coachDisplayName} />

        <Link href="/clients" className="text-sm text-zinc-400 hover:text-white">
          ← Back to Clients
        </Link>

        {/* ── Header summary ─────────────────────────────────────────── */}
        <div className={`mt-4 ${CARD}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{displayName}</h1>
              <p className="text-zinc-400 mt-1 text-sm truncate">{email}</p>
            </div>
            <EndCoachingButton clientId={clientId} clientName={displayName} />
          </div>

          <div className="mt-5 grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Trend weight"
              value={currentWeight != null ? `${currentWeight.toFixed(1)} lb` : "—"}
              sub={
                rate != null
                  ? `${rate > 0 ? "+" : ""}${rate.toFixed(2)} lb/wk (last 3 weeks)`
                  : trendWeight == null && latestWeight != null
                    ? "Latest weigh-in (no recent trend)"
                    : "Not enough weigh-ins for a rate"
              }
            />
            <Stat
              label="Goal weight"
              value={goalWeight != null ? `${goalWeight.toFixed(1)} lb` : "Not set"}
              sub={goalText ?? undefined}
            />
            <Stat
              label="This week"
              value={
                showProgramWeek
                  ? `${adherence.thisWeek.completed}/${adherence.thisWeek.planned} sessions`
                  : `${week.thisWeek} workout${week.thisWeek === 1 ? "" : "s"}`
              }
              sub={
                showProgramWeek
                  ? `${adherence.thisWeek.missed > 0 ? `${adherence.thisWeek.missed} missed · ` : ""}${week.thisWeek} total workouts`
                  : `avg ${week.avgPrev4.toFixed(1)}/wk over the last 4 weeks`
              }
              warn={showProgramWeek && adherence.thisWeek.missed > 0}
            />
            <Stat
              label="Last workout"
              value={relativeDay(lastDay, today)}
              sub={
                program
                  ? `${program.name ?? "Program"}${progWeek ? ` · week ${progWeek}` : ""}`
                  : "No active program"
              }
              warn={lastDay == null || today - lastDay >= 5}
            />
          </div>
        </div>

        {/* ── Weight chart ───────────────────────────────────────────── */}
        <section className={`mt-6 ${CARD}`}>
          <SectionTitle title="Body weight" note="7-day trend, same math as the app" />
          <WeightTrendChart days={chartDays} goal={goalWeight} today={today} />
        </section>

        {/* ── Program adherence ──────────────────────────────────────── */}
        <section className={`mt-6 ${CARD}`}>
          <SectionTitle
            title="Program adherence"
            note={program ? (program.name ?? "Active program") : undefined}
          />
          {!program || !adherence ? (
            <p className="text-sm text-zinc-500">
              No active program. Workouts this week: {week.thisWeek} (4-week
              average {week.avgPrev4.toFixed(1)}).
            </p>
          ) : (
            <AdherenceTable adherence={adherence} weekday={weekdayProgram} />
          )}
        </section>

        <div className="mt-6">
          <CoachNotesSection clientId={clientId} notes={coachNotes} />
        </div>

        <div className="mt-6">
          <CoachSharedMediaSection clientId={clientId} trendByDay={trendByDay} />
        </div>

        {/* ── Workout history ────────────────────────────────────────── */}
        <section className={`mt-6 ${CARD}`}>
          <SectionTitle
            title="Workout history"
            note={`Last ${history.length} sessions · tap to expand`}
          />
          {history.length === 0 ? (
            <p className="text-sm text-zinc-500">No sessions logged yet.</p>
          ) : (
            <div className="divide-y divide-zinc-900">
              {history.map((s, i) => (
                <SessionRow key={s.id ?? i} session={s} />
              ))}
            </div>
          )}
        </section>

        {/* ── PRs + best lifts ───────────────────────────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className={CARD}>
            <SectionTitle title="Recent PRs" note="last 60 days" />
            {prs.length === 0 ? (
              <p className="text-sm text-zinc-500">No new records in the last 60 days.</p>
            ) : (
              <ul className="divide-y divide-zinc-900 text-sm">
                {prs.map((p, i) => (
                  <li key={i} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.exerciseName}</div>
                      <div className="text-xs text-zinc-500">
                        {formatDay(p.day)} · was{" "}
                        {p.kind === "hold"
                          ? formatHold(p.previous.durationSeconds)
                          : `${p.previous.weightLb} × ${p.previous.reps}`}
                      </div>
                    </div>
                    <div className={`shrink-0 font-semibold ${LIME}`}>
                      {p.kind === "hold"
                        ? `${p.weightLb > 0 ? `+${p.weightLb} lb · ` : ""}${formatHold(p.durationSeconds)}`
                        : `${p.weightLb} lb × ${p.reps}`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={CARD}>
            <SectionTitle title="Best lifts" note="most-trained exercises" />
            {lifts.length === 0 ? (
              <p className="text-sm text-zinc-500">No strength sessions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
                      <th className="py-1.5 font-medium">Exercise</th>
                      <th className="py-1.5 font-medium">Heaviest</th>
                      <th className="py-1.5 font-medium">Best e1RM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {lifts.map((l) => (
                      <tr key={l.exerciseId}>
                        <td className="py-2 pr-2">
                          <div className="font-medium">{l.exerciseName}</div>
                          <div className="text-xs text-zinc-500">{l.sessions} sessions</div>
                        </td>
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {l.heaviest
                            ? `${l.heaviest.weightLb} × ${l.heaviest.reps}`
                            : l.longestHold
                              ? formatHold(l.longestHold.durationSeconds)
                              : "—"}
                          <div className="text-xs text-zinc-500">
                            {l.heaviest
                              ? formatDayShort(l.heaviest.day)
                              : l.longestHold
                                ? formatDayShort(l.longestHold.day)
                                : ""}
                          </div>
                        </td>
                        <td className="py-2 whitespace-nowrap">
                          {l.bestE1rm ? (
                            <>
                              <span className={LIME}>{Math.round(l.bestE1rm.value)} lb</span>
                              <div className="text-xs text-zinc-500">
                                {l.bestE1rm.weightLb} × {l.bestE1rm.reps}
                              </div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className={`mt-6 ${CARD}`}>
          <SectionTitle title="Strength progression" note="estimated 1RM per session (Epley)" />
          <ExerciseProgressionChart
            exercises={exerciseOptions}
            seriesByExerciseId={seriesByExerciseId}
            todayIso={dayKey(today)}
          />
        </section>

        {/* ── Volume & muscle balance ────────────────────────────────── */}
        <section className={`mt-6 ${CARD}`}>
          <SectionTitle
            title="Volume & muscle balance"
            note="completed sets per week, by primary muscle"
          />
          <MuscleBalanceTable balance={balance} />
        </section>

        {/* ── Activity charts ────────────────────────────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className={CARD}>
            <SectionTitle title="Activity" note="last 90 days" />
            <ActivityHeatmap weeks={buildActivityHeatmap(chartSessions, 91)} />
          </section>
          <section className={CARD}>
            <SectionTitle title="Workouts per week" note="12 weeks" />
            <WeeklyWorkoutCountChart data={buildWeeklyCountSeries(chartSessions, 12)} />
          </section>
          <section className={CARD}>
            <SectionTitle title="Strength volume" note="lb per week, 12 weeks" />
            <WeeklyVolumeChart data={buildWeeklyVolumeSeries(chartSessions, 12)} />
          </section>
          <section className={CARD}>
            <SectionTitle title="Cardio distance" note="mi per week, 12 weeks" />
            <WeeklyCardioChart data={buildWeeklyCardioSeries(chartSessions, 12)} />
          </section>
        </div>

        <section className={`mt-6 ${CARD}`}>
          <SectionTitle title="Profile" />
          <div className="grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
            <div>Name: {displayName}</div>
            <div>Email: {email}</div>
            <div>Age: {profile?.age ?? "N/A"}</div>
            <div>Username: {profile?.username ? `@${profile.username}` : "N/A"}</div>
            <div>Latest weigh-in: {formatWeight(latestWeight)}</div>
            <div>Connected: {formatShortDate(summary.linkedAt)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {note && <span className="text-xs text-zinc-500">{note}</span>}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-black px-3 py-3 min-w-0 ${
        warn ? "border-amber-500/30" : "border-zinc-900"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg sm:text-xl font-bold truncate ${warn ? "text-amber-300" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{sub}</div>}
    </div>
  );
}

function AdherenceTable({
  adherence,
  weekday,
}: {
  adherence: { thisWeek: WeekAdherence; previous: WeekAdherence[] };
  weekday: boolean;
}) {
  const rows = [
    { label: "This week", w: adherence.thisWeek },
    ...adherence.previous.map((w, i) => ({
      label: i === 0 ? "Last week" : `Week of ${formatDayShort(w.weekStart)}`,
      w,
    })),
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
            <th className="py-1.5 font-medium">Week</th>
            {weekday && <th className="py-1.5 font-medium">Planned</th>}
            <th className="py-1.5 font-medium">Done</th>
            <th className="py-1.5 font-medium">Skipped</th>
            {weekday && <th className="py-1.5 font-medium">Missed</th>}
            {weekday && <th className="py-1.5 font-medium">To do</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {rows.map(({ label, w }) => (
            <tr key={w.weekStart}>
              <td className="py-2 pr-2 whitespace-nowrap">{label}</td>
              {weekday && <td className="py-2">{w.planned ?? "—"}</td>}
              <td className={`py-2 ${w.completed > 0 ? LIME : ""}`}>{w.completed}</td>
              <td className="py-2 text-zinc-400">{w.skipped}</td>
              {weekday && (
                <td className={`py-2 ${w.missed > 0 ? "text-amber-300" : "text-zinc-400"}`}>
                  {w.missed}
                </td>
              )}
              {weekday && <td className="py-2 text-zinc-400">{w.remaining}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!weekday && (
        <p className="mt-2 text-xs text-zinc-500">
          This program rotates (no fixed weekdays), so sessions can&apos;t be
          missed; counts are program sessions completed or skipped that week.
        </p>
      )}
    </div>
  );
}

function timeOf(s: SessionDoc): string {
  const m = /T(\d{2}):(\d{2})/.exec(s.startTime ?? "");
  if (!m) return "";
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

function SessionRow({ session: s }: { session: SessionDoc }) {
  const day = sessionDay(s);
  const strength = s.category === "strength";
  const exercises = s.exercises ?? [];
  const title = s.workoutName || s.activityType || (strength ? "Strength workout" : "Activity");
  const meta = [
    day != null ? `${formatDay(day)} ${timeOf(s)}`.trim() : null,
    s.durationSeconds ? formatDuration(s.durationSeconds) : null,
    strength
      ? `${exercises.length} exercise${exercises.length === 1 ? "" : "s"}`
      : s.distanceMeters
        ? formatDistanceMiles(s.distanceMeters)
        : null,
  ].filter(Boolean);

  return (
    <details className="group py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1">
        <div className="min-w-0">
          <div className="font-medium truncate">
            {title}
            {s.isBackdated && (
              <span className="ml-2 align-middle text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400">
                Logged later
              </span>
            )}
            {!s.completed && (
              <span className="ml-2 align-middle text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-300">
                Not finished
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 truncate">{meta.join(" · ")}</div>
        </div>
        <span className="shrink-0 text-zinc-500 transition group-open:rotate-90">›</span>
      </summary>

      <div className="mt-2 mb-1 pl-1">
        {strength && exercises.length > 0 ? (
          <div className="grid gap-2">
            {exercises.map((ex, i) => {
              const sets = ex.sets ?? [];
              const done = sets.filter((x) => x.isCompleted);
              const notDone = sets.length - done.length;
              return (
                <div key={i} className="rounded-lg border border-zinc-900 bg-black px-3 py-2">
                  <div className="text-sm font-medium">
                    {ex.exerciseName ?? ex.exerciseId}
                    {ex.primaryMuscleGroup && (
                      <span className="ml-2 text-xs text-zinc-500 capitalize">
                        {ex.primaryMuscleGroup}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {done.map((set, j) => (
                      <span
                        key={j}
                        className="text-xs px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-200 tabular-nums"
                      >
                        {(set.durationSeconds ?? 0) > 0
                          ? `${(set.weightLb ?? 0) > 0 ? `+${set.weightLb} lb · ` : ""}${formatHold(set.durationSeconds!)}`
                          : `${set.weightLb ?? 0} × ${set.reps ?? 0}`}
                      </span>
                    ))}
                    {notDone > 0 && (
                      <span className="text-xs px-2 py-0.5 text-zinc-600">
                        +{notDone} not completed
                      </span>
                    )}
                    {sets.length === 0 && <span className="text-xs text-zinc-600">No sets</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-1 text-sm text-zinc-300 sm:grid-cols-3">
            <div>Duration: {formatDuration(s.durationSeconds)}</div>
            <div>Distance: {formatDistanceMiles(s.distanceMeters)}</div>
            <div>
              Calories: {s.calories != null ? `${Math.round(s.calories)} kcal` : "N/A"}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

function MuscleBalanceTable({ balance }: { balance: ReturnType<typeof muscleBalance> }) {
  const max = Math.max(1, ...balance.rows.map((r) => r.avg));
  if (!balance.rows.some((r) => r.avg > 0)) {
    return <p className="text-sm text-zinc-500">No strength sets in the last 4 weeks.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
            <th className="py-1.5 font-medium">Muscle</th>
            {balance.weekStarts.map((w, i) => (
              <th key={w} className="py-1.5 font-medium text-right px-1 whitespace-nowrap">
                {i === balance.weekStarts.length - 1 ? "This wk" : formatDayShort(w)}
              </th>
            ))}
            <th className="py-1.5 font-medium pl-3 w-1/3">Avg / week</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {balance.rows.map((r) => (
            <tr key={r.group}>
              <td className="py-2 pr-2 capitalize whitespace-nowrap">
                {r.group}
                {r.flag && (
                  <span
                    className={`ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                      r.flag === "low"
                        ? "border-amber-500/30 text-amber-300"
                        : "border-sky-500/30 text-sky-300"
                    }`}
                  >
                    {r.flag === "low" ? "Low" : "High"}
                  </span>
                )}
              </td>
              {r.weekly.map((n, i) => (
                <td key={i} className="py-2 text-right px-1 tabular-nums text-zinc-300">
                  {n}
                </td>
              ))}
              <td className="py-2 pl-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-zinc-900 overflow-hidden min-w-12">
                    <div
                      className="h-full rounded-full bg-[#9EFD06]"
                      style={{
                        width: `${(r.avg / max) * 100}%`,
                        opacity: r.flag === "low" ? 0.5 : 1,
                      }}
                    />
                  </div>
                  <span className="tabular-nums text-xs text-zinc-400 w-8 text-right">
                    {r.avg.toFixed(1)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-zinc-500">
        Low = under half of the typical muscle group; High = over twice it.
        Counts completed sets by each exercise&apos;s primary muscle only.
      </p>
    </div>
  );
}
