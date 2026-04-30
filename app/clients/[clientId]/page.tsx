import CoachHeader from "@/components/CoachHeader";
import CoachNotesSection from "@/components/CoachNotesSection";
import CoachSharedMediaSection from "@/components/CoachSharedMediaSection";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import BodyweightChart from "@/components/charts/BodyweightChart";
import ExerciseProgressionChart from "@/components/charts/ExerciseProgressionChart";
import WeeklyCardioChart from "@/components/charts/WeeklyCardioChart";
import WeeklyVolumeChart from "@/components/charts/WeeklyVolumeChart";
import WeeklyWorkoutCountChart from "@/components/charts/WeeklyWorkoutCountChart";
import {
  formatCalories,
  formatDate,
  formatDistanceMiles,
  formatDuration,
  formatShortDate,
  formatWeight,
  formatWeightChange,
  getBestDisplayName,
  getBestEmail,
  getClientSummary,
  getCompletedExercisesCount,
  getLastWorkoutDate,
  getLatestWeight,
  getRecentActivitySessions,
  getRecentBodyweightLogs,
  getSessionSubtitle,
  getSessionTitle,
  getSevenDayCardioCount,
  getSevenDayStrengthCount,
  getSevenDayWorkoutCount,
  getUserProfile,
  getWeightChangeFromOldest,
} from "@/lib/coach-data";
import {
  buildActivityHeatmap,
  buildE1rmSeries,
  buildExerciseOptions,
  buildWeeklyCardioSeries,
  buildWeeklyCountSeries,
  buildWeeklyVolumeSeries,
  buildWeightSeries,
} from "@/lib/coach-charts";
import { getCoachNotes } from "@/lib/coach-notes-data";
import { requireCoach, verifyClientBelongsToCoach } from "@/lib/coach-session";
import Link from "next/link";
import { notFound } from "next/navigation";

type ClientPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { clientId } = await params;
  const session = await requireCoach();

  const ownsClient = await verifyClientBelongsToCoach(
    session.coachId,
    clientId,
  );
  if (!ownsClient) {
    notFound();
  }

  const [
    clientSummary,
    userProfile,
    bodyweightLogs,
    allRecentSessions,
    coachNotes,
  ] = await Promise.all([
    getClientSummary(clientId, session.coachId),
    getUserProfile(clientId),
    getRecentBodyweightLogs(clientId, 100),
    getRecentActivitySessions(clientId, 200),
    getCoachNotes(session.coachId, clientId),
  ]);

  if (!clientSummary) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <CoachHeader
            coachId={session.coachId}
            coachDisplayName={session.coachDisplayName}
          />
          <Link href="/clients" className="text-zinc-400 hover:text-white">
            ← Back to Clients
          </Link>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            Client not found in coach client list.
          </div>
        </div>
      </main>
    );
  }

  const displayName = getBestDisplayName(clientSummary, userProfile);
  const email = getBestEmail(clientSummary, userProfile);
  const recentSessions = allRecentSessions.slice(0, 10);

  const latestWeight =
    getLatestWeight(bodyweightLogs) ??
    userProfile?.currentWeight ??
    clientSummary?.currentWeight;

  const goalWeightForChart =
    userProfile?.goalWeight ?? clientSummary?.goalWeight ?? null;

  const weightChangeAcrossLogs = getWeightChangeFromOldest(bodyweightLogs);
  const workoutsLast7Days = getSevenDayWorkoutCount(allRecentSessions);
  const strengthLast7Days = getSevenDayStrengthCount(allRecentSessions);
  const cardioLast7Days = getSevenDayCardioCount(allRecentSessions);
  const lastWorkoutDate = getLastWorkoutDate(allRecentSessions);

  const weightSeries = buildWeightSeries(bodyweightLogs, 90);
  const weeklyVolumeSeries = buildWeeklyVolumeSeries(allRecentSessions, 12);
  const weeklyCardioSeries = buildWeeklyCardioSeries(allRecentSessions, 12);
  const weeklyCountSeries = buildWeeklyCountSeries(allRecentSessions, 12);
  const heatmapWeeks = buildActivityHeatmap(allRecentSessions, 91);

  const exerciseOptions = buildExerciseOptions(allRecentSessions, 10);
  const seriesByExerciseId: Record<string, ReturnType<typeof buildE1rmSeries>> =
    {};
  for (const opt of exerciseOptions) {
    seriesByExerciseId[opt.exerciseId] = buildE1rmSeries(
      allRecentSessions,
      opt.exerciseId,
      90,
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <CoachHeader
          coachId={session.coachId}
          coachDisplayName={session.coachDisplayName}
        />

        <Link href="/clients" className="text-zinc-400 hover:text-white">
          ← Back to Clients
        </Link>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-3xl font-bold">{displayName}</h1>
          <p className="text-zinc-400 mt-2">{email}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="text-sm text-zinc-400">Current Weight</div>
              <div className="mt-2 text-2xl font-bold">
                {formatWeight(latestWeight)}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="text-sm text-zinc-400">Goal Weight</div>
              <div className="mt-2 text-2xl font-bold">
                {formatWeight(goalWeightForChart)}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="text-sm text-zinc-400">Weight Change</div>
              <div className="mt-2 text-2xl font-bold">
                {formatWeightChange(weightChangeAcrossLogs)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Across last {bodyweightLogs.length} logs
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="text-sm text-zinc-400">Workouts Last 7 Days</div>
              <div className="mt-2 text-2xl font-bold">{workoutsLast7Days}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="text-sm text-zinc-400">Strength Last 7 Days</div>
              <div className="mt-2 text-2xl font-bold">{strengthLast7Days}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="text-sm text-zinc-400">Cardio Last 7 Days</div>
              <div className="mt-2 text-2xl font-bold">{cardioLast7Days}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-5">
            <div className="text-sm text-zinc-400">Last Workout</div>
            <div className="mt-2 text-lg font-semibold">
              {formatDate(lastWorkoutDate)}
            </div>
          </div>

          <div className="mt-8">
            <CoachNotesSection clientId={clientId} notes={coachNotes} />
          </div>

          <div className="mt-8">
            <CoachSharedMediaSection clientId={clientId} />
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Trends</h2>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5 mb-4">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-sm font-semibold text-zinc-300">
                  Activity (last 90 days)
                </h3>
                <span className="text-xs text-zinc-500">
                  daily completed sessions
                </span>
              </div>
              <ActivityHeatmap weeks={heatmapWeeks} />
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5 mb-4">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-sm font-semibold text-zinc-300">
                  Per-Exercise Progression (90 days)
                </h3>
                <span className="text-xs text-zinc-500">
                  estimated 1RM per session
                </span>
              </div>
              <ExerciseProgressionChart
                exercises={exerciseOptions}
                seriesByExerciseId={seriesByExerciseId}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-300">
                    Bodyweight (90 days)
                  </h3>
                  <span className="text-xs text-zinc-500">
                    {weightSeries.length} log
                    {weightSeries.length === 1 ? "" : "s"}
                  </span>
                </div>
                <BodyweightChart
                  data={weightSeries}
                  goalWeight={goalWeightForChart}
                />
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-300">
                    Weekly Strength Volume (12 weeks)
                  </h3>
                  <span className="text-xs text-zinc-500">lb / week</span>
                </div>
                <WeeklyVolumeChart data={weeklyVolumeSeries} />
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-300">
                    Weekly Cardio Distance (12 weeks)
                  </h3>
                  <span className="text-xs text-zinc-500">mi / week</span>
                </div>
                <WeeklyCardioChart data={weeklyCardioSeries} />
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-300">
                    Weekly Workout Count (12 weeks)
                  </h3>
                  <span className="text-xs text-zinc-500">
                    strength + cardio
                  </span>
                </div>
                <WeeklyWorkoutCountChart data={weeklyCountSeries} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <h2 className="text-xl font-semibold mb-4">Coach Summary</h2>
              <div className="grid gap-3 text-sm text-zinc-300">
                <div>Status: {clientSummary.status || "N/A"}</div>
                <div>
                  Current Weight: {formatWeight(clientSummary.currentWeight)}
                </div>
                <div>Goal Weight: {formatWeight(clientSummary.goalWeight)}</div>
                <div>
                  Workouts This Week: {clientSummary.workoutsThisWeek ?? 0}
                </div>
                <div>Coach ID: {clientSummary.coachId || "N/A"}</div>
                <div>Client ID: {clientId}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <h2 className="text-xl font-semibold mb-4">User Profile</h2>
              {userProfile ? (
                <div className="grid gap-3 text-sm text-zinc-300">
                  <div>Display Name: {userProfile.displayName || "N/A"}</div>
                  <div>First Name: {userProfile.firstName || "N/A"}</div>
                  <div>Last Name: {userProfile.lastName || "N/A"}</div>
                  <div>Email: {userProfile.email || "N/A"}</div>
                  <div>
                    Current Weight: {formatWeight(userProfile.currentWeight)}
                  </div>
                  <div>Goal Weight: {formatWeight(userProfile.goalWeight)}</div>
                  <div>Age: {userProfile.age ?? "N/A"}</div>
                  <div>Coach ID: {userProfile.coachId || "N/A"}</div>
                  <div>Coach Status: {userProfile.coachStatus || "N/A"}</div>
                  <div>
                    Coach Display Name: {userProfile.coachDisplayName || "N/A"}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-400">
                  No matching user document found in users/{clientId}.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <h2 className="text-xl font-semibold mb-4">Bodyweight History</h2>

              {bodyweightLogs.length === 0 ? (
                <div className="text-sm text-zinc-400">
                  No bodyweight logs found.
                </div>
              ) : (
                <div className="grid gap-3">
                  {bodyweightLogs.slice(0, 10).map((log, index) => (
                    <div
                      key={log.id || `${log.logDate}-${index}`}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-base font-semibold">
                          {formatWeight(log.weight)}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {formatShortDate(log.logDate)}
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1 text-sm text-zinc-300">
                        <div>
                          Logged: {formatDate(log.logDate || log.createdAt)}
                        </div>
                        <div>Created At: {formatDate(log.createdAt)}</div>
                        <div>Notes: {log.notes || "No notes"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-5">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

              {recentSessions.length === 0 ? (
                <div className="text-sm text-zinc-400">
                  No activity sessions found.
                </div>
              ) : (
                <div className="grid gap-4">
                  {recentSessions.map((session, index) => (
                    <div
                      key={session.id || `${session.startTime}-${index}`}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold">
                            {getSessionTitle(session)}
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            {getSessionSubtitle(session)}
                          </div>
                        </div>

                        <div className="text-xs text-zinc-400">
                          {session.completed ? "Completed" : "Not Completed"}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-zinc-300 md:grid-cols-2">
                        <div>Type: {session.activityType || "N/A"}</div>
                        <div>Category: {session.category || "N/A"}</div>
                        <div>
                          Start:{" "}
                          {formatDate(session.startTime || session.createdAt)}
                        </div>
                        <div>
                          Duration: {formatDuration(session.durationSeconds)}
                        </div>
                        <div>Calories: {formatCalories(session.calories)}</div>
                        <div>
                          Distance: {formatDistanceMiles(session.distanceMeters)}
                        </div>
                        <div>Source: {session.source || "N/A"}</div>
                        <div>Total Sets: {session.totalSets ?? "N/A"}</div>
                        <div>Total Volume: {session.totalVolume ?? "N/A"}</div>
                        <div>
                          Exercises: {getCompletedExercisesCount(session)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}