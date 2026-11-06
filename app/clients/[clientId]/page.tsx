import CoachHeader from "@/components/CoachHeader";
import CoachNotesSection from "@/components/CoachNotesSection";
import CoachSharedMediaSection from "@/components/CoachSharedMediaSection";
import CoachMessagesPanel from "@/components/CoachMessagesPanel";
import CheckinDaySelect from "@/components/CheckinDaySelect";
import ProgrammingPanel from "@/components/library/ProgrammingPanel";
import WeeklySummaryPanel from "@/components/WeeklySummaryPanel";
import {
  MIN_MANAGED_BUILD,
  getAssignment,
  listCoachPrograms,
  listCoachRoutines,
} from "@/lib/coach-library-data";
import {
  ADHERENCE_LABELS,
  DEFAULT_WEEKDAY,
  STRATEGY_STATUS_LABELS,
  checkinLabel,
  checkinState,
} from "@/lib/coach-checkins.ts";
import EndCoachingButton from "@/components/EndCoachingButton";
import MeasurementsPanel, { type MeasurementSite } from "@/components/MeasurementsPanel";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import ExerciseProgressionChart from "@/components/charts/ExerciseProgressionChart";
import WeeklyCardioChart from "@/components/charts/WeeklyCardioChart";
import WeeklyVolumeChart from "@/components/charts/WeeklyVolumeChart";
import WeeklyWorkoutCountChart from "@/components/charts/WeeklyWorkoutCountChart";
import WeightTrendChart, { type TrendDay } from "@/components/charts/WeightTrendChart";
import {
  MEASUREMENT_SITES,
  getActiveProgram,
  getBodyFatLogs,
  getCheckinPhotoUrls,
  getCheckins,
  getGoals,
  getMessages,
  getActiveStrategy,
  getDailyIntake,
  getMeasurements,
  getSessions,
  getWeighIns,
  loggedDaysLast7,
  markCoachViewed,
  type DayIntake,
  type StrategyDoc,
} from "@/lib/coach-client-data.ts";
import { getCoachSharing } from "@/lib/coach-sharing.ts";
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
import { evaluateGoal, formatGoalValue, goalTitle, type GoalRow } from "@/lib/coach-goals.ts";
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
  trendStatus,
  trendWeightAt,
  type DayNum,
  type TrendStatus,
} from "@/lib/trend.ts";
import Link from "next/link";
import { notFound } from "next/navigation";

type ClientPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ reply?: string }>;
};

const CARD = "rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5";
const LIME = "text-[#9EFD06]";

export default async function ClientDetailPage({ params, searchParams }: ClientPageProps) {
  const { clientId } = await params;
  const { reply } = await searchParams;
  const session = await requireCoach();

  if (!(await verifyClientBelongsToCoach(session.coachId, clientId))) {
    notFound();
  }

  const [summary, profile, sharing, coachNotes, assignment, libPrograms, libRoutines] =
    await Promise.all([
      getClientSummary(clientId, session.coachId),
      getUserProfile(clientId),
      getCoachSharing(clientId),
      getCoachNotes(session.coachId, clientId),
      getAssignment(session.coachId, clientId),
      listCoachPrograms(session.coachId),
      listCoachRoutines(session.coachId),
    ]);
  if (!summary) notFound();
  // The client's own calendar day (their saved time zone when present).
  const today = todayDay(profile?.timeZone);

  // Only what the client shares is read at all.
  const [logs, sessions, program, measurements, strategy, intake, bodyFat, goalDocs] = await Promise.all([
    sharing.body ? getWeighIns(clientId, 1500) : Promise.resolve([]),
    sharing.workouts ? getSessions(clientId, 300, "full") : Promise.resolve([]),
    sharing.workouts ? getActiveProgram(clientId) : Promise.resolve(null),
    sharing.body ? getMeasurements(clientId) : Promise.resolve([]),
    sharing.nutrition ? getActiveStrategy(clientId) : Promise.resolve(null),
    sharing.nutrition ? getDailyIntake(clientId, today, 28) : Promise.resolve(null),
    sharing.body ? getBodyFatLogs(clientId) : Promise.resolve([]),
    sharing.body ? getGoals(clientId) : Promise.resolve([]),
  ]);
  // Check-ins (check-ins switch) and the message thread (always: it's
  // the conversation itself, not shared data).
  const [checkins, messages] = await Promise.all([
    sharing.checkins ? getCheckins(clientId, 12) : Promise.resolve([]),
    getMessages(session.coachId, clientId),
  ]);
  const photoUrls = sharing.checkins
    ? await getCheckinPhotoUrls(clientId, checkins.slice(0, 4).flatMap((c) => c.photoIds))
    : {};
  const checkinWeekday =
    typeof summary.checkinWeekday === "number" ? summary.checkinWeekday : DEFAULT_WEEKDAY;
  const checkinNow = checkinState(
    checkinWeekday,
    today,
    checkins.length ? { day: checkins[0].day, replied: checkins[0].replied } : null,
  );
  const replyTo = reply ? checkins.find((c) => c.id === reply) ?? null : null;
  // Drives the dashboard's "new shared media since your last visit".
  await markCoachViewed(session.coachId, clientId, profile?.timeZone);

  const displayName = getBestDisplayName(summary, profile);
  const email = getBestEmail(summary, profile);

  // ── Weight ──────────────────────────────────────────────────────────
  const points = weighInPoints(logs);
  const trend = trendRate(points, today);
  const trendWeight = trendWeightAt(points, today);
  const goalWeight =
    sharing.body && typeof profile?.goalWeight === "number" ? profile.goalWeight : null;
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

  // ── Measurements (body) ─────────────────────────────────────────────
  const measurementSites: MeasurementSite[] = MEASUREMENT_SITES.map(({ key, name }) => {
    const entries = measurements.filter((m) => m.bodyPart === key);
    const pts = entries.map((m) => ({ day: m.day, weightLb: m.inches }));
    const latest = entries.length ? entries[entries.length - 1] : null;
    return {
      key,
      name,
      latest: latest?.inches ?? null,
      sinceStart: entries.length >= 2 ? latest!.inches - entries[0].inches : null,
      entries: entries.length,
      lastDay: latest ? formatDay(latest.day) : null,
      days: dailyTrend(pts, today).map(
        (d): TrendDay => [
          d.day,
          d.weighInLb == null ? null : Math.round(d.weighInLb * 100) / 100,
          d.weighIns,
          d.trend == null ? null : Math.round(d.trend * 100) / 100,
        ],
      ),
    };
  });

  // ── Body fat and goals (body) ───────────────────────────────────────
  const latestFat = bodyFat.length ? bodyFat[bodyFat.length - 1] : null;
  const leanMass =
    latestFat && currentWeight != null ? currentWeight * (1 - latestFat.percent / 100) : null;
  const goals = goalDocs.slice();
  // Same as the app: the weight goal exists whenever goalWeight is set.
  if (goalWeight != null && !goals.some((g) => g.type === "weight")) {
    const first = points.length ? points[points.length - 1] : null;
    goals.unshift({ id: "weight", type: "weight", startValue: first?.weightLb });
  }
  const goalRows: GoalRow[] = goals.map((g) =>
    evaluateGoal(g, {
      today,
      weights: points,
      goalWeight,
      bodyFat,
      measurements,
      sessions: sharing.workouts ? sessions : null,
    }),
  );
  const siteName = (key: string) => MEASUREMENT_SITES.find((s) => s.key === key)?.name ?? key;

  // ── Nutrition / Strategy ────────────────────────────────────────────
  const strategyStatus: TrendStatus | null =
    strategy && sharing.body && typeof strategy.goalRateLbPerWeek === "number"
      ? trendStatus(rate, strategy.goalRateLbPerWeek)
      : null;
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
            {sharing.body ? (
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
            ) : (
              <NotSharedStat label="Trend weight" />
            )}
            {sharing.body ? (
            <Stat
              label="Goal weight"
              value={goalWeight != null ? `${goalWeight.toFixed(1)} lb` : "Not set"}
              sub={goalText ?? undefined}
            />
            ) : (
              <NotSharedStat label="Goal weight" />
            )}
            {sharing.workouts ? (
            <>
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
            </>
            ) : (
              <>
                <NotSharedStat label="This week" />
                <NotSharedStat label="Last workout" />
              </>
            )}
          </div>
        </div>

        {/* ── Weight chart ───────────────────────────────────────────── */}
        {sharing.body ? (
        <section className={`mt-6 ${CARD}`}>
          <SectionTitle title="Body weight" note="7-day trend, same math as the app" />
          <WeightTrendChart days={chartDays} goal={goalWeight} today={today} />
        </section>
        ) : (
          <NotSharedSection title="Body weight" what="weigh-ins and goal weight" />
        )}

        {/* ── Measurements (body) ────────────────────────────────────── */}
        {sharing.body && (
          <section className={`mt-6 ${CARD}`}>
            <SectionTitle title="Measurements" note="inches · change since first entry" />
            <MeasurementsPanel sites={measurementSites} today={today} />
          </section>
        )}

        {/* ── Body fat & goals (body) ────────────────────────────────── */}
        {sharing.body && (latestFat || goalRows.length > 0) && (
          <section className={`mt-6 ${CARD}`}>
            <SectionTitle title="Body fat & goals" note="from the client's Body tab" />
            {latestFat && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat
                  label="Body fat"
                  value={`${latestFat.percent.toFixed(1)}%`}
                  sub={`${latestFat.method === "navy" ? "US Navy estimate" : "Entered"} · ${formatDay(latestFat.day)}`}
                />
                <Stat
                  label="Lean mass"
                  value={leanMass != null ? `${leanMass.toFixed(1)} lb` : "--"}
                  sub={currentWeight != null ? `at ${currentWeight.toFixed(1)} lb` : undefined}
                />
                <Stat
                  label="Since first"
                  value={
                    bodyFat.length >= 2
                      ? `${(latestFat.percent - bodyFat[0].percent) > 0 ? "+" : ""}${(latestFat.percent - bodyFat[0].percent).toFixed(1)} pts`
                      : "--"
                  }
                  sub={`${bodyFat.length} entr${bodyFat.length === 1 ? "y" : "ies"}`}
                />
              </div>
            )}
            {goalRows.length > 0 && (
              <ul className="space-y-3">
                {goalRows.map((row) => (
                  <li key={row.goal.id}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold truncate">{goalTitle(row.goal, siteName)}</span>
                      <span className={row.achieved ? LIME : "text-zinc-400"}>
                        {row.achieved
                          ? row.goal.type === "workoutsPerWeek" ? "Met this week" : "Achieved"
                          : `${Math.round(row.progress * 100)}%`}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-[#9EFD06]"
                        style={{ width: `${Math.round(row.progress * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {row.missing
                        ? `Target ${formatGoalValue(row.target, row.unit)} · ${row.missing}`
                        : row.goal.type === "workoutsPerWeek"
                          ? `${row.current ?? 0} of ${row.target} this week${row.weekAll !== row.weekLive ? ` (${row.weekLive} live, ${row.weekAll} incl. logged later)` : ""}`
                          : `${formatGoalValue(row.start, row.unit)} → ${formatGoalValue(row.current, row.unit)} → ${formatGoalValue(row.target, row.unit)}`}
                      {row.goal.targetDay != null ? ` · by ${formatDay(row.goal.targetDay)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── Nutrition & Strategy ───────────────────────────────────── */}
        {sharing.nutrition ? (
          <NutritionSection
            strategy={strategy}
            intake={intake ?? new Map()}
            today={today}
            status={strategyStatus}
            bodyShared={sharing.body}
          />
        ) : (
          <NotSharedSection title="Nutrition & Strategy" what="food log and Strategy targets" />
        )}

        {/* ── AI weekly summary (AI summaries switch on) ──────────────── */}
        {sharing.aiSummaries && (
          <section className={`mt-6 ${CARD}`}>
            <SectionTitle title="Weekly summary" note="AI draft for you" />
            <WeeklySummaryPanel
              clientId={clientId}
              clientName={displayName}
              shares={[
                ...(sharing.workouts ? ["workouts"] : []),
                ...(sharing.body ? ["body"] : []),
                ...(sharing.nutrition ? ["nutrition"] : []),
                ...(sharing.checkins ? ["check-ins"] : []),
              ]}
            />
          </section>
        )}

        {/* ── Programming: assign from the library (Phase 5b) ─────────── */}
        <section className={`mt-6 ${CARD}`}>
          <SectionTitle title="Programming" note="From your library" />
          <ProgrammingPanel
            clientId={clientId}
            clientName={displayName}
            blocked={
              !sharing.workouts
                ? `${displayName} has Workouts sharing off. They can turn it on in Settings → Coach.`
                : (profile?.appBuild ?? 0) < MIN_MANAGED_BUILD
                  ? `${displayName} needs to update Repflow to receive programs.`
                  : null
            }
            programs={libPrograms.map((p) => ({
              id: p.id,
              name: p.name,
              version: p.version,
              detail: `${p.durationWeeks} weeks, ${p.schedule.filter((d) => d.routineIds.length > 0).length} days a week`,
            }))}
            routines={libRoutines.map((r) => ({
              id: r.id,
              name: r.name,
              version: r.version,
              detail: `${r.exercises.length} exercises`,
            }))}
            assignedProgram={
              assignment.program
                ? { id: assignment.program.programId, version: assignment.program.version }
                : null
            }
            assignedRoutines={assignment.routines.map((r) => ({ id: r.routineId, version: r.version }))}
          />
        </section>

        {/* ── Program adherence ──────────────────────────────────────── */}
        {sharing.workouts && (
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
        )}

        {/* ── Check-ins (check-ins switch) ───────────────────────────── */}
        {sharing.checkins ? (
          <section className={`mt-6 ${CARD}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold">
                Check-ins{" "}
                <span
                  className={`ml-2 align-middle text-xs px-2 py-0.5 rounded-full border ${
                    checkinNow.kind === "overdue"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : checkinNow.kind === "received"
                        ? "border-[#9EFD06]/30 bg-[#9EFD06]/10 text-[#9EFD06]"
                        : "border-zinc-700 text-zinc-400"
                  }`}
                >
                  {checkinLabel(checkinNow)}
                </span>
              </h2>
              <CheckinDaySelect clientId={clientId} weekday={checkinWeekday} />
            </div>
            {checkins.length === 0 ? (
              <p className="text-sm text-zinc-500">No check-ins yet.</p>
            ) : (
              <ul className="space-y-4">
                {checkins.map((c) => (
                  <li key={c.id} className="rounded-xl border border-zinc-900 bg-black p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold">{formatDay(c.day)}</span>
                      <span className="text-xs text-zinc-500">
                        {c.replied ? "Replied · " : ""}
                        <Link href={`/clients/${clientId}?reply=${c.id}#messages`} className={LIME}>
                          Reply
                        </Link>
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <Stat
                        label="Weight"
                        value={c.weightLb != null ? `${c.weightLb.toFixed(1)} lb` : "--"}
                        sub={
                          c.trendWeightLb != null
                            ? `trend ${c.trendWeightLb.toFixed(1)}${c.trendLbPerWeek != null ? ` · ${c.trendLbPerWeek > 0 ? "+" : ""}${c.trendLbPerWeek.toFixed(2)} lb/wk` : ""}`
                            : undefined
                        }
                      />
                      <Stat label="Sleep · energy · stress" value={`${c.sleep} · ${c.energy} · ${c.stress}`} sub="1–5" />
                      <Stat
                        label="Training · nutrition"
                        value={`${(ADHERENCE_LABELS[c.trainingAdherence] ?? "--").split(" ")[0]} · ${(ADHERENCE_LABELS[c.nutritionAdherence] ?? "--").split(" ")[0]}`}
                        sub="sessions / days on plan"
                      />
                      {sharing.nutrition && c.strategyStatus ? (
                        <Stat
                          label="Strategy then"
                          value={STRATEGY_STATUS_LABELS[c.strategyStatus] ?? c.strategyStatus}
                          sub={
                            c.strategyGoalRate != null
                              ? `goal ${c.strategyGoalRate > 0 ? "+" : ""}${c.strategyGoalRate.toFixed(2)} lb/wk`
                              : undefined
                          }
                        />
                      ) : (
                        <Stat label="Strategy then" value="--" sub={sharing.nutrition ? "no program" : "nutrition not shared"} />
                      )}
                    </div>
                    {[
                      ["Wins", c.wins],
                      ["Struggles", c.struggles],
                      ["Questions", c.questions],
                    ].map(([k, v]) =>
                      v ? (
                        <p key={k} className="mt-2 text-sm text-zinc-300 whitespace-pre-wrap break-words">
                          <span className="text-zinc-500">{k}: </span>
                          {v}
                        </p>
                      ) : null,
                    )}
                    {c.photoIds.some((id) => photoUrls[id]) && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {c.photoIds
                          .filter((id) => photoUrls[id])
                          .map((id) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={id} src={photoUrls[id]} alt="Check-in photo" className="h-32 rounded-lg object-cover" />
                          ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <NotSharedSection title="Check-ins" what="weekly check-ins" />
        )}

        {/* ── Messages ───────────────────────────────────────────────── */}
        <section id="messages" className={`mt-6 ${CARD}`}>
          <SectionTitle title="Messages" note="text only · kept for safety" />
          <CoachMessagesPanel
            clientId={clientId}
            clientName={displayName}
            messages={messages}
            unread={summary.unreadByCoach ?? 0}
            replyTo={replyTo ? { checkinId: replyTo.id, label: formatDay(replyTo.day) } : null}
          />
        </section>

        <div className="mt-6">
          <CoachNotesSection clientId={clientId} notes={coachNotes} />
        </div>

        <div className="mt-6">
          <CoachSharedMediaSection
            clientId={clientId}
            trendByDay={trendByDay}
            photosShared={sharing.photos}
            videosShared={sharing.videos}
          />
        </div>

        {/* ── Workout history ────────────────────────────────────────── */}
        {sharing.workouts ? (
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
        ) : (
          <NotSharedSection title="Workouts" what="workouts, program, PRs and volume" />
        )}

        {sharing.workouts && (
        <>
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
            <ActivityHeatmap weeks={buildActivityHeatmap(chartSessions, 91, today)} />
          </section>
          <section className={CARD}>
            <SectionTitle title="Workouts per week" note="12 weeks" />
            <WeeklyWorkoutCountChart data={buildWeeklyCountSeries(chartSessions, 12, today)} />
          </section>
          <section className={CARD}>
            <SectionTitle title="Strength volume" note="lb per week, 12 weeks" />
            <WeeklyVolumeChart data={buildWeeklyVolumeSeries(chartSessions, 12, today)} />
          </section>
          <section className={CARD}>
            <SectionTitle title="Cardio distance" note="mi per week, 12 weeks" />
            <WeeklyCardioChart data={buildWeeklyCardioSeries(chartSessions, 12, today)} />
          </section>
        </div>
        </>
        )}

        <section className={`mt-6 ${CARD}`}>
          <SectionTitle title="Profile" />
          <div className="grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
            <div>Name: {displayName}</div>
            <div>Email: {email}</div>
            <div>Age: {profile?.age ?? "N/A"}</div>
            <div>Username: {profile?.username ? `@${profile.username}` : "N/A"}</div>
            {sharing.body && <div>Latest weigh-in: {formatWeight(latestWeight)}</div>}
            <div>Connected: {formatShortDate(summary.linkedAt)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────

function NotSharedSection({ title, what }: { title: string; what: string }) {
  return (
    <section className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-zinc-400">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Not shared by client. They can turn on {what} in the app under
        Account → Coach → What your coach can see.
      </p>
    </section>
  );
}

function NotSharedStat({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-black px-3 py-3 min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-zinc-600">{label}</div>
      <div className="mt-1 text-sm text-zinc-600">Not shared by client</div>
    </div>
  );
}

const STATUS_TEXT: Record<TrendStatus, string> = {
  notEnoughData: "Not enough weigh-ins yet",
  onTrack: "On track",
  ahead: "Ahead of plan",
  behind: "Behind plan",
  wrongDirection: "Wrong direction",
  drifting: "Drifting",
};

function NutritionSection({
  strategy,
  intake,
  today,
  status,
  bodyShared,
}: {
  strategy: StrategyDoc | null;
  intake: Map<DayNum, DayIntake>;
  today: DayNum;
  status: TrendStatus | null;
  bodyShared: boolean;
}) {
  const target = strategy?.currentCalorieTarget ?? null;
  const logged7 = loggedDaysLast7(intake, today);
  const last7 = Array.from({ length: 7 }, (_, i) => intake.get(today - 7 + i)).filter(
    (d): d is DayIntake => d != null && d.kcal > 0,
  );
  const avgKcal = last7.length ? last7.reduce((a, d) => a + d.kcal, 0) / last7.length : null;
  const avgProtein = last7.length ? last7.reduce((a, d) => a + d.protein, 0) / last7.length : null;
  const rate = strategy?.goalRateLbPerWeek;
  const days = Array.from({ length: 14 }, (_, i) => today - i);
  const maxKcal = Math.max(target ?? 0, ...days.map((d) => intake.get(d)?.kcal ?? 0), 1);
  const statusWarn = status === "wrongDirection" || status === "behind" || status === "drifting";

  return (
    <section className={`mt-6 ${CARD}`}>
      <SectionTitle title="Nutrition & Strategy" note="from the client's food log" />
      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Strategy"
          value={strategy ? (strategy.name ?? "Active program") : "None"}
          sub={
            strategy
              ? `${rate != null ? `goal ${rate > 0 ? "+" : ""}${rate.toFixed(2)} lb/wk` : ""}${
                  strategy.currentTdeeEstimate ? ` · TDEE ${Math.round(strategy.currentTdeeEstimate)}` : ""
                }`
              : "No active Diet → Strategy program"
          }
        />
        <Stat
          label="Daily target"
          value={target != null ? `${Math.round(target)} kcal` : "—"}
          sub={
            strategy
              ? `P ${Math.round(strategy.currentProteinTarget ?? 0)} · C ${Math.round(strategy.currentCarbsTarget ?? 0)} · F ${Math.round(strategy.currentFatTarget ?? 0)} g`
              : undefined
          }
        />
        <Stat
          label="Last 7 days"
          value={avgKcal != null ? `${Math.round(avgKcal)} kcal` : "—"}
          sub={`avg on ${logged7}/7 logged days${avgProtein != null ? ` · ${Math.round(avgProtein)} g protein` : ""}`}
          warn={logged7 < 4}
        />
        <Stat
          label="Status"
          value={status ? STATUS_TEXT[status] : "—"}
          sub={
            !strategy
              ? undefined
              : bodyShared
                ? "weight trend vs goal rate (same as the app)"
                : "Needs body sharing"
          }
          warn={statusWarn}
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <th className="py-1.5 font-medium">Day</th>
              <th className="py-1.5 font-medium text-right">kcal</th>
              <th className="py-1.5 font-medium pl-3 w-1/2">vs target</th>
              <th className="py-1.5 font-medium text-right">Protein</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {days.map((d) => {
              const t = intake.get(d);
              const kcal = t?.kcal ?? 0;
              return (
                <tr key={d} className={kcal > 0 ? "" : "text-zinc-600"}>
                  <td className="py-1.5 pr-2 whitespace-nowrap">
                    {d === today ? "Today" : formatDayShort(d)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {kcal > 0 ? Math.round(kcal) : "—"}
                  </td>
                  <td className="py-1.5 pl-3">
                    <div className="relative h-2 rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[#9EFD06]"
                        style={{ width: `${(kcal / maxKcal) * 100}%`, opacity: kcal > 0 ? 0.85 : 0 }}
                      />
                      {target != null && (
                        <div
                          className="absolute inset-y-0 w-0.5 bg-white/60"
                          style={{ left: `${(target / maxKcal) * 100}%` }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-zinc-400">
                    {kcal > 0 ? `${Math.round(t!.protein)} g` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-zinc-500">
          White line = daily calorie target. Today may be incomplete;
          supplements aren&apos;t counted as food.
        </p>
      </div>
    </section>
  );
}

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
