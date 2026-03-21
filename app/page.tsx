export default function Home() {
  return (
    <main className="bg-black text-white min-h-screen pt-24">
      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-400 mb-6">
          Repflow Coaching
        </p>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-5xl leading-tight">
          Track harder. Compete smarter. Build better athletes.
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
              Build and deliver structured workouts with a system that feels fast,
              organized, and built for serious training.
            </p>
          </div>

          <div className="border border-zinc-800 rounded-3xl p-6 bg-zinc-950">
            <h2 className="text-2xl font-semibold mb-3">Progress Tracking</h2>
            <p className="text-zinc-400 leading-7">
              Track lifts, metrics, photos, and performance trends in one place.
            </p>
          </div>

          <div className="border border-zinc-800 rounded-3xl p-6 bg-zinc-950">
            <h2 className="text-2xl font-semibold mb-3">Competition</h2>
            <p className="text-zinc-400 leading-7">
              Leaderboards, streaks, and accountability that keep athletes locked in.
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

      {/* 1st */}
      <div className="flex justify-between items-center hover:bg-zinc-800/50 transition rounded-lg px-3 py-2">
        <span className="font-semibold">🥇 Alex M</span>
        <span className="text-zinc-400">1,240 pts</span>
      </div>

      {/* YOU */}
      <div className="flex justify-between items-center bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-xl px-3 py-2 shadow-sm">
  <span className="font-semibold">🥈 You</span>
  <span className="text-white">1,180 pts • 60 behind</span>
</div>

      {/* 3rd */}
      <div className="flex justify-between items-center hover:bg-zinc-800/50 transition rounded-lg px-3 py-2">
        <span className="font-semibold">🥉 Jordan K</span>
        <span className="text-zinc-400">1,150 pts</span>
      </div>

      {/* others */}
      <div className="flex justify-between items-center text-zinc-500 hover:bg-zinc-800/50 transition rounded-lg px-3 py-2">
        <span>Chris D</span>
        <span>1,020 pts</span>
      </div>

    </div>
  </div>
</section>
    </main>
  );
}