import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-black tracking-tight">Repflow</h1>
        <p className="mt-4 text-zinc-400">
          The fitness app for serious lifters.
        </p>
        <div className="mt-8">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center bg-lime-400 text-black px-8 py-4 rounded-full font-bold hover:bg-lime-300 transition"
          >
            Coach sign in
          </Link>
        </div>
      </div>
    </main>
  );
}