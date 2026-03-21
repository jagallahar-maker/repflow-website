export default function Home() {
  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/70 backdrop-blur border-b border-zinc-900">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="font-bold text-lg tracking-tight">Repflow</div>

          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white transition">
              Login
            </button>
            <button className="bg-white text-black px-4 py-2 rounded-full font-medium hover:opacity-90 transition">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="bg-black text-white min-h-screen pt-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]">
        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400 mb-6">
            Repflow Coaching
          </p>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-5xl leading-tight">
            Track harder. Compete smarter. Win more.
          </h1>

          <p className="mt-6 max-w-2xl text-zinc-400 text-lg md:text-xl leading-8">
            Repflow gives coaches and athletes one place to manage training,
            monitor performance, track progress, and stay locked in.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">
              Start Coaching
            </button>
            <button className="border border-zinc-700 px-6 py-3 rounded-full font-semibold hover:bg-zinc-900 transition">
              View Demo
            </button>
          </div>
        </section>

        {/* MOCK APP PREVIEW */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
              <div className="text-left mb-6">
                <p className="text-zinc-400 text-sm mb-2">Workout</p>
                <h2 className="text-2xl font-semibold">Push Day</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-zinc-800 pb-3">
                  <span>Bench Press</span>
                  <span className="text-zinc-400">4 x 8</span>
                </div>

                <div className="flex justify-between border-b border-zinc-800 pb-3">
                  <span>Incline DB Press</span>
                  <span className="text-zinc-400">3 x 10</span>
                </div>

                <div className="flex justify-between border-b border-zinc-800 pb-3">
                  <span>Lateral Raises</span>
                  <span className="text-zinc-400">3 x 15</span>
                </div>

                <div className="flex justify-between">
                  <span>Tricep Pushdown</span>
                  <span className="text-zinc-400">3 x 12</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="border border-zinc-800 rounded-3xl p-6 bg-zinc-950">
              <h2 className="text-2xl font-semibold mb-3">Programming</h2>
              <p className="text-zinc-400 leading-7">
                Build and deliver structured workouts with a system that feels
                fast, organized, and built for serious training.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-3xl p-6 bg-zinc-950">
              <h2 className="text-2xl font-semibold mb-3">Progress Tracking</h2>
              <p className="text-zinc-400 leading-7">
                Track lifts, metrics, photos, and performance trends in one
                place.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-3xl p-6 bg-zinc-950">
              <h2 className="text-2xl font-semibold mb-3">Competition</h2>
              <p className="text-zinc-400 leading-7">
                Leaderboards, streaks, and accountability that keep athletes
                locked in.
              </p>
            </div>
          </div>
        </section>

        {/* LEADERBOARD */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Stay competitive.
            </h2>
            <p className="text-zinc-400 text-lg">
              See where you stand. Push harder. Don’t get passed.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center hover:bg-zinc-800/50 transition rounded-lg px-3 py-2">
                <span className="font-semibold">🥇 Alex M</span>
                <span className="text-zinc-400">1,240 pts</span>
              </div>

              <div className="flex justify-between items-center bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-xl px-3 py-2 shadow-sm">
                <span className="font-semibold">🥈 You</span>
                <span className="text-white">1,180 pts • 60 behind</span>
              </div>

              <div className="flex justify-between items-center hover:bg-zinc-800/50 transition rounded-lg px-3 py-2">
                <span className="font-semibold">🥉 Jordan K</span>
                <span className="text-zinc-400">1,150 pts</span>
              </div>

              <div className="flex justify-between items-center text-zinc-500 hover:bg-zinc-800/50 transition rounded-lg px-3 py-2">
                <span>Chris D</span>
                <span>1,020 pts</span>
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD PREVIEW */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Coaching dashboard built for clarity.
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Manage athletes, monitor adherence, and spot progress fast with a
              layout that feels clean, sharp, and performance focused.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-zinc-400 text-sm">Team Overview</p>
                  <h3 className="text-2xl font-semibold">Coach Dashboard</h3>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-sm">Active Athletes</p>
                  <p className="text-2xl font-semibold">24</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-black rounded-2xl p-4 border border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-1">Completion</p>
                  <p className="text-2xl font-bold">91%</p>
                </div>
                <div className="bg-black rounded-2xl p-4 border border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-1">Avg. Streak</p>
                  <p className="text-2xl font-bold">12 days</p>
                </div>
                <div className="bg-black rounded-2xl p-4 border border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-1">PRs This Week</p>
                  <p className="text-2xl font-bold">18</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border border-zinc-800 rounded-2xl px-4 py-3">
                  <div>
                    <p className="font-semibold">Easton R.</p>
                    <p className="text-zinc-400 text-sm">
                      Upper Strength • checked in today
                    </p>
                  </div>
                  <span className="text-sm text-white">On track</span>
                </div>

                <div className="flex items-center justify-between border border-zinc-800 rounded-2xl px-4 py-3">
                  <div>
                    <p className="font-semibold">Carter J.</p>
                    <p className="text-zinc-400 text-sm">
                      Lower Power • 2 new PRs this week
                    </p>
                  </div>
                  <span className="text-sm text-white">Trending up</span>
                </div>

                <div className="flex items-center justify-between border border-zinc-800 rounded-2xl px-4 py-3">
                  <div>
                    <p className="font-semibold">Morgan T.</p>
                    <p className="text-zinc-400 text-sm">
                      Conditioning • missed last session
                    </p>
                  </div>
                  <span className="text-sm text-zinc-400">Needs review</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <p className="text-zinc-400 text-sm mb-2">Weekly Activity</p>
              <h3 className="text-2xl font-semibold mb-6">Performance Pulse</h3>

              <div className="flex items-end justify-between gap-3 h-56 mb-6">
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-white/90 rounded-t-xl w-full h-24"></div>
                  <span className="text-xs text-zinc-500">M</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-white/90 rounded-t-xl w-full h-32"></div>
                  <span className="text-xs text-zinc-500">T</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-white/90 rounded-t-xl w-full h-20"></div>
                  <span className="text-xs text-zinc-500">W</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-white/90 rounded-t-xl w-full h-40"></div>
                  <span className="text-xs text-zinc-500">T</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-white/90 rounded-t-xl w-full h-48"></div>
                  <span className="text-xs text-zinc-500">F</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-white/90 rounded-t-xl w-full h-28"></div>
                  <span className="text-xs text-zinc-500">S</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="bg-white/90 rounded-t-xl w-full h-16"></div>
                  <span className="text-xs text-zinc-500">S</span>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-400 text-sm mb-1">Coach Note</p>
                <p className="text-sm leading-6 text-zinc-300">
                  Athletes are most engaged when streaks, rankings, and workout
                  completion live in the same flow.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}